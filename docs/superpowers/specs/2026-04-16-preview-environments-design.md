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

No new `.env` file needed — `VITE_EMULATOR_HOST` is injected at build time in the GitHub Actions workflow only.

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
- Copy `nginx.conf`, `firebase.json` (emulator config), seed script
- Entrypoint: `startup.sh`

### Files

```
preview/
  Dockerfile
  nginx.conf        # path-based routing (see Architecture diagram)
  firebase.json      # emulator-only config: auth:9099, firestore:9199
  startup.sh         # entrypoint: start emulators, wait, seed, start nginx
  seed.sh            # create demo users + seed data via emulator REST API
```

### nginx.conf

```nginx
server {
    listen 8080;

    # Auth emulator
    location /identitytoolkit.googleapis.com/ { proxy_pass http://127.0.0.1:9099; }
    location /securetoken.googleapis.com/     { proxy_pass http://127.0.0.1:9099; }
    location /emulator/                       { proxy_pass http://127.0.0.1:9099; }

    # Firestore emulator
    location /v1/projects/                    { proxy_pass http://127.0.0.1:9199; }
    location /google.firestore.v1.Firestore/  { proxy_pass http://127.0.0.1:9199; }

    # SPA (fallback to index.html for client-side routing)
    location / {
        root /app/web;
        try_files $uri $uri/ /index.html;
    }
}
```

### startup.sh

1. Start Firebase emulators in background (`firebase emulators:start --only auth,firestore`)
2. Poll health endpoints until emulators are ready
3. Run `seed.sh` to create demo users and seed data
4. Start nginx in foreground (keeps container alive)

## Demo Users & Data Seeding

Created by `preview/seed.sh` on every container startup via the Auth emulator REST API (same pattern as `e2e/helpers/emulator.ts`).

| Account | Email                   | Password         | Pre-seeded data                                           |
| ------- | ----------------------- | ---------------- | --------------------------------------------------------- |
| Alice   | `demo-alice@plepic.com` | `demo-alice-123` | Safety zone set, several skills claimed across all 3 axes |
| Bob     | `demo-bob@plepic.com`   | `demo-bob-123`   | None (fresh user experience)                              |

**Alice** lets reviewers see a populated profile immediately. **Bob** lets reviewers test the fresh user flow.

Credentials are:

- Printed in the PR comment posted by the deploy workflow
- Hardcoded in `preview/seed.sh` (not secrets — disposable demo accounts in an ephemeral emulator)
- Documented so AI agents can authenticate programmatically via the Auth emulator REST API

**Data is fully ephemeral** — lost on scale-to-zero, re-seeded on next cold start.

## GitHub Actions Workflows

### preview-deploy.yml

**Trigger:** `pull_request: [opened, synchronize, reopened]` on `main`

**Concurrency:** `preview-${{ github.event.pull_request.number }}`, cancel-in-progress: true

**Steps:**

1. Authenticate to GCP via Workload Identity Federation
2. Build Docker image with `VITE_EMULATOR_HOST` set to the expected Cloud Run URL
3. Push image to Artifact Registry (`europe-docker.pkg.dev/skill-plepic-com/previews/pr-{number}`)
4. Deploy to Cloud Run as `preview-pr-{number}` in `europe-west1`
5. Post/update PR comment with preview URL, demo credentials, and cold start warning

**Chicken-and-egg note:** The Cloud Run URL contains a hash that isn't known before the first deploy. On first deploy, the workflow deploys once to get the URL, then rebuilds with the correct `VITE_EMULATOR_HOST` and redeploys. Subsequent pushes to the same PR reuse the known service URL.

### preview-cleanup.yml

**Trigger:** `pull_request: [closed]` on `main`

**Steps:**

1. Authenticate to GCP
2. Delete Cloud Run service `preview-pr-{number}`
3. Delete Artifact Registry image
4. Update PR comment to "Preview environment removed"

## Cloud Run Configuration

| Setting         | Value                 | Rationale                                                                  |
| --------------- | --------------------- | -------------------------------------------------------------------------- |
| CPU             | 1 vCPU                | Minimum for "CPU always allocated"; needed for Java Firestore emulator     |
| Memory          | 1Gi                   | JVM + Node.js + nginx headroom                                             |
| Min instances   | 0                     | Scale to zero when idle                                                    |
| Max instances   | 1                     | Single preview, no need to scale out                                       |
| CPU allocation  | Always allocated      | Emulators are background processes that must keep running between requests |
| Request timeout | 300s                  | Default                                                                    |
| Startup probe   | 60s                   | Allow time for JVM + emulator init + seeding                               |
| Authentication  | Allow unauthenticated | Preview env with only demo data in ephemeral emulators                     |
| Region          | europe-west1          | Close to Firestore's `eur3` region                                         |

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

### Artifact Registry

- Repository: `europe-docker.pkg.dev/skill-plepic-com/previews`
- Format: Docker
- Region: `europe-west1`

### Workload Identity Federation

- Identity pool for GitHub Actions OIDC → GCP authentication
- No long-lived service account keys stored in GitHub
- Standard pattern for GitHub-to-GCP CI/CD

### IAM roles for CI service account

- `roles/run.admin` — deploy/delete Cloud Run services
- `roles/artifactregistry.writer` — push/delete images
- `roles/iam.serviceAccountUser` — act as Cloud Run runtime service account

### GitHub repository secrets

- `GCP_PROJECT_ID` — `skill-plepic-com`
- `GCP_WORKLOAD_IDENTITY_PROVIDER` — full provider resource name
- `GCP_SERVICE_ACCOUNT` — CI service account email

## Implementation Order

1. **Terraform:** Artifact Registry repo + Workload Identity Federation + IAM
2. **Container:** `preview/` directory with Dockerfile, nginx.conf, startup.sh, seed.sh, firebase.json
3. **SPA:** `VITE_EMULATOR_HOST` support in `src/firebase.ts`
4. **Workflows:** `preview-deploy.yml` and `preview-cleanup.yml`
5. **Test:** open a PR and verify the full cycle
