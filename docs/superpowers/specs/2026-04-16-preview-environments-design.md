# Preview Environments Design

Each pull request gets its own isolated preview environment with a unique URL, backed by Firebase emulators running on Cloud Run. Zero production impact, ephemeral data, scale-to-zero cost model.

## Architecture

Each PR deploys a single Cloud Run service (`preview-pr-{number}`) running three processes in one container:

```
Browser (HTTPS)
    │
    ▼
Cloud Run (TLS termination)
    │
    ▼ HTTP :8080
┌─────────────────────────────────┐
│           nginx                 │
│  ┌─────────────────────────┐    │
│  │ /identitytoolkit.*      │───▶ Auth Emulator (:9099)
│  │ /securetoken.*          │    │
│  │ /emulator/*             │    │
│  ├─────────────────────────┤    │
│  │ /v1/projects/*          │───▶ Firestore Emulator (:9199)
│  │ /google.firestore.*     │    │
│  ├─────────────────────────┤    │
│  │ /* (everything else)    │───▶ SPA static files
│  └─────────────────────────┘    │
└─────────────────────────────────┘
```

- **Single URL per PR:** `https://preview-pr-{number}-{hash}.a.run.app`
- **Single origin:** SPA and emulators share the same origin — no CORS issues
- **Cloud Run handles TLS:** container only deals with HTTP internally
- **Full isolation:** each PR has its own emulator instance with independent data

### Why not Firebase Hosting?

Firebase Hosting preview channels were considered but rejected. They would require a separate service for the emulators anyway (Cloud Run), resulting in two resources per PR. Since Cloud Run can serve both the SPA (via nginx) and the emulators, a single all-in-one container is simpler to deploy, manage, and clean up.

### Why not a shared emulator?

A shared emulator across all PRs would be cheaper (one Cloud Run service total) but PRs would share Firestore data. Since different PRs may modify data schemas or seed conflicting state, per-PR isolation is worth the negligible extra cost (all idle instances scale to zero).

## SPA Changes

Minimal change to `src/firebase.ts`. A new build-time env var `VITE_EMULATOR_HOST` enables three modes:

| Mode       | Condition                         | Behavior                                           |
| ---------- | --------------------------------- | -------------------------------------------------- |
| Production | No `VITE_EMULATOR_HOST`, not DEV  | Connects to real Firebase                          |
| Local dev  | DEV mode, no `VITE_EMULATOR_HOST` | Connects to localhost emulators (current behavior) |
| Preview    | `VITE_EMULATOR_HOST` set          | Connects to remote emulator via same-origin proxy  |

### Firestore SSL workaround

The Firebase SDK's `connectFirestoreEmulator` forces `ssl: false`, which browsers block on HTTPS pages (mixed content policy). The fix: use `initializeFirestore` with the Cloud Run host and `ssl: true`. The SDK makes HTTPS requests, Cloud Run terminates TLS, nginx proxies to the emulator over HTTP. The emulator is wire-compatible with the production Firestore API.

```ts
const emulatorHost = import.meta.env.VITE_EMULATOR_HOST

// Firestore: conditional initialization
export const db = emulatorHost
  ? initializeFirestore(app, { host: emulatorHost, ssl: true })
  : getFirestore(app)

// Auth: conditional emulator connection
if (emulatorHost) {
  connectAuthEmulator(auth, `https://${emulatorHost}`, { disableWarnings: true })
} else if (shouldConnectEmulators()) {
  // existing local dev logic unchanged
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}
```

`VITE_EMULATOR_HOST` is the Cloud Run service hostname (e.g., `preview-pr-42-abc123.a.run.app`). Port is omitted — `ssl: true` defaults to 443.

No new `.env` file needed — `VITE_EMULATOR_HOST` is injected at build time in the GitHub Actions workflow only.

**Important:** The existing E2E test bridge (`window.__e2e_auth`, `window.__e2e_signInWithEmailAndPassword`) and the `EMULATORS_CONNECTED_KEY` guard must be preserved. The preview branch should only add the `emulatorHost` conditional — not restructure the existing local dev / E2E code path.

## Container Design

A multi-stage Dockerfile in a new `preview/` directory at the repo root.

### Dockerfile stages

**Stage 1 — Build the SPA:**

- Base: `node:22-slim`
- Install pnpm, dependencies
- Inject `VITE_EMULATOR_HOST` as build arg
- Run `pnpm build` → produces `web/`

**Stage 2 — Runtime:**

- Base: `node:22-slim` (needed for Firebase CLI + Auth emulator)
- Install: nginx, OpenJDK 21 headless (Firestore emulator), Firebase CLI
- Copy built SPA from stage 1 → `/app/web`
- Copy `nginx.conf`, `firebase.json` (emulator config), `firestore.rules`, `firestore.indexes.json`, seed script
- Entrypoint: `startup.sh`

### Files

```
preview/
  Dockerfile
  nginx.conf         # path-based routing (see Architecture diagram)
  firebase.json      # emulator-only config: auth:9099, firestore:9199, UI disabled
  startup.sh         # entrypoint: start emulators, wait, seed, start nginx
  seed.sh            # create demo users + seed data via emulator REST API
```

**`preview/firebase.json` key differences from root `firebase.json`:**

- Firestore emulator on port **9199** (not root's 8080 — port 8080 is used by nginx)
- Emulator UI **disabled** (saves container resources)
- Project ID matches `skill-plepic-com` (must match the SPA's `VITE_FIREBASE_PROJECT_ID`)
- Includes `firestore.rules` path so security rules are loaded into the emulator
- `singleProjectMode: false` not needed since project IDs match

### nginx.conf

```nginx
server {
    listen 8080;

    # Auth emulator
    location /identitytoolkit.googleapis.com/ { proxy_pass http://127.0.0.1:9099; }
    location /securetoken.googleapis.com/     { proxy_pass http://127.0.0.1:9099; }
    location /emulator/                       { proxy_pass http://127.0.0.1:9099; }

    # Firestore emulator (proxy_buffering off for streaming/onSnapshot)
    location /v1/projects/ {
        proxy_pass http://127.0.0.1:9199;
        proxy_http_version 1.1;
        proxy_buffering off;
    }
    location /google.firestore.v1.Firestore/ {
        proxy_pass http://127.0.0.1:9199;
        proxy_http_version 1.1;
        proxy_buffering off;
    }

    # Health check (created by startup.sh after all services are ready)
    location /healthz {
        access_log off;
        return 200 'ok';
        add_header Content-Type text/plain;
    }

    # SPA (fallback to index.html for client-side routing)
    location / {
        root /app/web;
        try_files $uri $uri/ /index.html;
    }
}
```

### startup.sh

1. Start Firebase emulators in background (`firebase emulators:start --only auth,firestore`)
2. Poll emulator health endpoints until ready (Auth: `GET http://127.0.0.1:9099/`, Firestore: `GET http://127.0.0.1:9199/`). Timeout after 60s with non-zero exit (matches Cloud Run startup probe).
3. Run `seed.sh` to create demo users and seed data
4. Start nginx in foreground (keeps container alive)

nginx serves `/healthz` returning 200 — this is the Cloud Run startup probe endpoint. Since nginx starts last (after emulators + seeding), a 200 on `/healthz` confirms the container is fully ready.

## Demo Users & Data Seeding

Created by `preview/seed.sh` on every container startup via the Auth emulator REST API (same pattern as `e2e/helpers/emulator.ts`).

| Account | Email                   | Password         | Fixed UID             | Pre-seeded data                                           |
| ------- | ----------------------- | ---------------- | --------------------- | --------------------------------------------------------- |
| Alice   | `demo-alice@plepic.com` | `demo-alice-123` | `demo-alice-uid-0001` | Safety zone set, several skills claimed across all 3 axes |
| Bob     | `demo-bob@plepic.com`   | `demo-bob-123`   | `demo-bob-uid-0002`   | None (fresh user experience)                              |

**Alice** lets reviewers see a populated profile immediately. **Bob** lets reviewers test the fresh user flow.

**Fixed UIDs are required.** The Auth emulator REST API accepts a `localId` field in the signUp body. Without it, each cold start generates random UIDs, breaking bookmarked profile URLs (e.g., `/profile/demo-alice-uid-0001`). The seed script must specify deterministic UIDs.

Credentials are:

- Printed in the PR comment posted by the deploy workflow
- Hardcoded in `preview/seed.sh` (not secrets — disposable demo accounts in an ephemeral emulator)
- Documented so AI agents can authenticate programmatically via the Auth emulator REST API

**Data is fully ephemeral** — lost on scale-to-zero, re-seeded on next cold start.

## GitHub Actions Workflows

### preview-deploy.yml

**Trigger:** `pull_request: [opened, synchronize, reopened]` on `main`

**Permissions:** `contents: read`, `id-token: write` (required for Workload Identity Federation), `pull-requests: write` (for PR comments)

**Concurrency:** `preview-${{ github.event.pull_request.number }}`, cancel-in-progress: true

**Steps:**

1. Verify PR is still open (guard against race with cleanup workflow)
2. Authenticate to GCP via Workload Identity Federation
3. Check if Cloud Run service `preview-pr-{number}` already exists (`gcloud run services describe`)
4. If service exists: get its URL, build Docker image with `VITE_EMULATOR_HOST` set to that URL, push to Artifact Registry, deploy
5. If service is new: deploy a placeholder image first (`--no-traffic`), get the assigned URL from `gcloud run services describe --format 'value(status.url)'`, rebuild with correct `VITE_EMULATOR_HOST`, deploy the real image
6. Post/update PR comment using `actions/github-script` with `GITHUB_TOKEN` — find existing bot comment by marker, update it or create new. Include preview URL, demo credentials, and cold start warning

**URL stability note:** The Cloud Run URL hash is derived from the project and service name — it is stable once assigned. Only the first-ever deploy for a PR needs the two-step dance. All subsequent pushes reuse the known URL.

### preview-cleanup.yml

**Trigger:** `pull_request: [closed]` on `main`

**Steps:**

1. Authenticate to GCP
2. Delete Cloud Run service `preview-pr-{number}`
3. Untag the Artifact Registry image (`gcloud artifacts docker tags delete` for the `pr-{number}` tag). This makes the image untagged, so the 7-day retention policy garbage-collects it. Untag is a lightweight operation that won't fail if the image is already gone.
4. Update PR comment to "Preview environment removed"

## Cloud Run Configuration

| Setting         | Value                  | Rationale                                                                                                                                                                                                                                                     |
| --------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CPU             | 1 vCPU                 | Minimum for "CPU always allocated"; needed for Java Firestore emulator                                                                                                                                                                                        |
| Memory          | 1Gi                    | JVM + Node.js + nginx headroom                                                                                                                                                                                                                                |
| Min instances   | 0                      | Scale to zero when idle                                                                                                                                                                                                                                       |
| Max instances   | 1                      | Single preview, no need to scale out                                                                                                                                                                                                                          |
| CPU allocation  | Always allocated       | Emulators run as background processes; without this, CPU is throttled between requests and emulators die. Note: this does NOT prevent scale-to-zero — instances are still terminated after ~15 min idle. It only keeps CPU active while an instance is alive. |
| Request timeout | 300s                   | Default                                                                                                                                                                                                                                                       |
| Startup probe   | HTTP GET /healthz, 60s | nginx serves /healthz after emulators are ready; Cloud Run kills the container if probe fails within 60s                                                                                                                                                      |
| Authentication  | Allow unauthenticated  | Preview env with only demo data in ephemeral emulators                                                                                                                                                                                                        |
| Region          | europe-west1           | Close to Firestore's `eur3` region                                                                                                                                                                                                                            |

**Cost:** Essentially free under Cloud Run free tier for typical review usage. Only charges when an instance is active. Scales to zero after ~15 min of inactivity.

### Cold start behavior

First request after idle triggers a ~10-15s cold start:

- Container pull + init: 1-3s
- Auth emulator (Node.js): 2-3s
- Firestore emulator (Java/JVM): 5-10s
- Demo data seeding: 1-2s

**This is expected behavior.** AI agents and automated tests interacting with preview environments should account for this initial latency and not treat it as an error. Subsequent requests within an active session are instant.

## Lifecycle & Cleanup

**Deploy triggers:**

- PR opened → first preview deploy
- PR push (synchronize) → rebuild and redeploy (same Cloud Run service name)
- PR reopened → redeploy

**Cleanup triggers:**

- PR closed/merged → `preview-cleanup.yml` deletes Cloud Run service + Artifact Registry image, updates PR comment

**No time-based expiry needed.** Cloud Run services don't expire. Idle services sit at zero instances costing nothing. Cleanup is explicit on PR close. If a cleanup workflow fails, the service remains at zero instances (negligible cost) and can be cleaned up manually.

**PR comment lifecycle:**

1. Deploy completes → bot posts: preview URL + demo credentials + cold start warning
2. New push → bot updates same comment with "Redeployed at {timestamp}"
3. PR closed → bot updates comment to "Preview environment removed"

## GCP Setup Prerequisites

One-time resources to create in the existing `skill-plepic-com` project, managed via Terraform in `infra/main.tf`:

### GCP APIs to enable

- `run.googleapis.com` (Cloud Run)
- `artifactregistry.googleapis.com` (Artifact Registry)
- `iamcredentials.googleapis.com` (Workload Identity Federation token exchange)

### Artifact Registry

- Repository: `europe-docker.pkg.dev/skill-plepic-com/previews`
- Format: Docker
- Region: `europe-west1`
- **Cleanup policy (Terraform-managed):** auto-delete untagged images older than 7 days. Each PR push tags the new image as `pr-{number}`, making the previous revision untagged. The policy garbage-collects stale layers without manual intervention. This also covers images orphaned by failed cleanup workflows.

### Workload Identity Federation

- Identity pool for GitHub Actions OIDC → GCP authentication
- No long-lived service account keys stored in GitHub
- Standard pattern for GitHub-to-GCP CI/CD

### Service accounts

- **CI service account** (e.g., `preview-ci@skill-plepic-com.iam.gserviceaccount.com`) — used by GitHub Actions via Workload Identity Federation
- **Cloud Run runtime service account** (e.g., `preview-runner@skill-plepic-com.iam.gserviceaccount.com`) — minimal permissions, used as the identity for preview Cloud Run services

### IAM roles for CI service account

- `roles/run.admin` — deploy/delete Cloud Run services
- `roles/artifactregistry.writer` — push/delete images
- `roles/iam.serviceAccountUser` — act as the preview-runner service account

### GitHub repository secrets

- `GCP_PROJECT_ID` — `skill-plepic-com`
- `GCP_WORKLOAD_IDENTITY_PROVIDER` — full provider resource name
- `GCP_SERVICE_ACCOUNT` — CI service account email

## Implementation Order

1. ~~**Terraform:** Artifact Registry repo + Workload Identity Federation + IAM~~ ✅
2. **Container:** `preview/` directory with Dockerfile, nginx.conf, startup.sh, seed.sh, firebase.json
3. **SPA:** `VITE_EMULATOR_HOST` support in `src/firebase.ts`
4. **Workflows:** `preview-deploy.yml` and `preview-cleanup.yml`
5. **Test:** open a PR and verify the full cycle

## Implementation Notes

### Chunk 1: Terraform (2026-04-16)

- AR writer IAM binding scoped to repository level (`google_artifact_registry_repository_iam_member`) instead of project level for tighter security
- `roles/run.admin` kept at project level — `roles/run.developer` cannot delete services (required for cleanup workflow)
- WIF pool has explicit `depends_on` for `iamcredentials` API to prevent race condition on fresh environments
- Spec references `europe-docker.pkg.dev` but the correct Artifact Registry hostname for `europe-west1` region is `europe-west1-docker.pkg.dev`
