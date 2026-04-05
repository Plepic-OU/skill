# Chunk 6: Terraform & Deploy

## Overview

Infrastructure as code for the Firebase backend and a CI pipeline that builds and deploys the SPA to GitHub Pages. Connects the app to the production Firebase project `skill-plepic-com`.

## Scope

- Terraform config to provision Firebase resources on an existing GCP project
- GitHub Actions workflow updated to build before deploying
- Production Firebase config committed as `.env.production`
- Firestore rules and indexes deployed manually via Firebase CLI
- One-time bootstrap instructions

## Out of Scope

- GitHub OAuth provider (Google Auth only for now)
- Custom domain SSL (GitHub Pages handles this)
- Separate dev/staging Firebase project
- Automated Firestore rules deployment in CI

---

## 1. Terraform Infrastructure

### Directory Structure

```
infra/
├── main.tf          # Provider, Firebase, Firestore
├── backend.tf       # GCS remote state
├── variables.tf     # Input variables
└── outputs.tf       # Project ID, Firestore location (for reference)
```

### What Terraform Manages

| Resource           | Details                                                            |
| ------------------ | ------------------------------------------------------------------ |
| Firebase project   | Enable Firebase API on `skill-plepic-com`                          |
| Firestore database | Native mode, `eur3` (Europe multi-region), `(default)` database ID |

**Note:** Google Auth sign-in provider cannot be provisioned via Terraform — it must be configured in the Firebase Console (see Bootstrap Step 3).

### What Terraform Does NOT Manage

- **Auth providers** — configured manually in Firebase Console (no Terraform resource exists for Firebase Auth sign-in providers without Identity Platform upgrade).
- **Firestore security rules and indexes** — deployed via Firebase CLI (`firebase deploy --only firestore`). Keeping rules in the repo and deploying manually avoids Terraform/CLI drift.
- **GitHub Pages deployment** — handled by GitHub Actions.
- **DNS** — already configured and pointing to GitHub Pages.

### Remote State

- **Backend:** GCS bucket `gs://skill-plepic-com-tfstate`
- **State file:** `terraform.tfstate`
- **Bucket location:** EU
- **Versioning:** Enabled on the bucket (allows state recovery)

### Provider

```hcl
provider "google-beta" {
  project = var.project_id
}
```

Uses `google-beta` provider since Firebase resources require it. Each Firebase resource must include `provider = google-beta` explicitly.

**Authentication:** Application Default Credentials. Run `gcloud auth application-default login` before `terraform init`.

### Variables

| Variable     | Default            | Description        |
| ------------ | ------------------ | ------------------ |
| `project_id` | `skill-plepic-com` | GCP project ID     |
| `region`     | `eur3`             | Firestore location |

---

## 2. CI Pipeline

### Updated GitHub Actions Workflow

**File:** `.github/workflows/pages.yml`

Add build steps before the existing artifact upload:

1. Checkout code
2. Setup Node.js (use version from `.nvmrc` or `package.json` `engines` field)
3. Setup Java 11+ (required for Firebase emulators)
4. Install pnpm via `pnpm/action-setup` (version from `package.json` `packageManager` field)
5. `pnpm install --frozen-lockfile` (with `HUSKY=0` to skip git hook installation in CI)
6. `pnpm lint` — ESLint
7. `pnpm typecheck` — TypeScript
8. `pnpm test:run` — Unit tests
9. `pnpm test:e2e:emulator` — E2E tests (starts Firebase emulators, runs Playwright)
10. `pnpm build` (Vite build → `web/`, postbuild copies `index.html` → `404.html`)
11. Upload `web/` artifact (existing step)
12. Deploy to GitHub Pages (existing step)

**Note:** `web/` is a build output directory, not tracked in git. CI generates it fresh on every deploy.

### Tests in CI

The full quality suite runs in CI as a deploy gate, mirroring what pre-commit hooks enforce locally. This prevents bypasses via `--no-verify`, GitHub UI edits, or direct pushes.

Before the build step, the workflow runs:

1. `pnpm lint` — ESLint
2. `pnpm typecheck` — TypeScript
3. `pnpm test:run` — Unit tests (Vitest)
4. `pnpm test:e2e:emulator` — E2E tests (Playwright + Firebase emulators). Requires Java 11+ on the runner for Firebase emulators.

If any step fails, the workflow stops and does not deploy.

---

## 3. Production Firebase Config

### `.env.production` (committed to repo)

```
VITE_FIREBASE_API_KEY=<from GCP console after bootstrap>
VITE_FIREBASE_AUTH_DOMAIN=skill-plepic-com.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=skill-plepic-com
```

Only these three `VITE_*` variables are used — `src/firebase.ts` does not reference `storageBucket`, `messagingSenderId`, or `appId`. This is intentional.

### How Environment Switching Works

- **`pnpm build`** (production): Vite loads `.env.production` automatically when `NODE_ENV=production`
- **`pnpm dev`** (local): Vite loads `.env.local` (gitignored) with fake emulator values
- **`src/firebase.ts`**: Already reads `import.meta.env.VITE_*` — no code changes needed
- **Emulator detection**: Existing logic connects to emulators when `import.meta.env.DEV` is true (Vite dev server only) — unchanged

### Why the API Key Is Safe to Commit

Firebase client API keys are identifiers, not credentials. They're embedded in the JavaScript bundle served to every browser. Security is enforced by Firestore security rules and Firebase Auth, not by hiding the API key. An API key HTTP referrer restriction (`skill.plepic.com/*`) can be set in the GCP console to reduce casual misuse, but the real security boundary is the Firestore rules.

---

## 4. Firebase Rules Deployment

### Update `.firebaserc`

```json
{
  "projects": {
    "default": "skill-plepic-com"
  }
}
```

Single project — emulators handle local development.

### Deploy Command

```bash
firebase deploy --only firestore
```

This deploys both `firestore.rules` and `firestore.indexes.json` (as configured in `firebase.json`). Manual, not automated. Rules changes are infrequent and should be reviewed before deploying to production.

---

## 5. Bootstrap (One-Time Setup)

### Step 0: Authenticate

```bash
gcloud auth login
gcloud auth application-default login
```

### Step 1: Create GCS Bucket for Terraform State

```bash
gcloud storage buckets create gs://skill-plepic-com-tfstate \
  --project=skill-plepic-com \
  --location=eu \
  --uniform-bucket-level-access
gcloud storage buckets update gs://skill-plepic-com-tfstate --versioning
```

### Step 2: Initialize and Apply Terraform

```bash
cd infra
terraform init
terraform apply
```

### Step 3: Enable Google Auth Provider

In the Firebase Console (`console.firebase.google.com`), navigate to the `skill-plepic-com` project:

1. Go to **Authentication → Sign-in method**
2. Enable **Google** as a sign-in provider
3. Go to **Authentication → Settings → Authorized domains**
4. Add `skill.plepic.com` as an authorized domain (required for OAuth redirect from the custom domain)

### Step 4: Get Firebase API Key

After `terraform apply`, get the API key from the GCP console (APIs & Services → Credentials). Update `.env.production` with the real value. Optionally set an HTTP referrer restriction to `skill.plepic.com/*` in the key's settings.

### Step 5: Deploy Firestore Rules

```bash
firebase deploy --only firestore
```

### Step 6: Verify

Push a commit to `main` and confirm the GitHub Actions workflow builds and deploys successfully. Visit `skill.plepic.com` and verify the app loads and connects to production Firebase.

---

## Implementation Chunks

This spec is small enough to implement in one pass:

1. Create `infra/` directory with Terraform files
2. Add `.env.production` with placeholder values
3. Update `.firebaserc` to point to `skill-plepic-com`
4. Update `.github/workflows/pages.yml` with build steps
5. Document bootstrap steps in the spec (this file)

After implementation, the bootstrap steps (Section 5) are run manually to bring up the infrastructure.

---

## Implementation Notes

**Status: Complete** (2026-04-05)

All items implemented as specified:

1. `infra/` — Terraform files with google-beta provider ~> 6.0, GCS remote state, Firebase project + Firestore resources
2. `.env.production` — placeholder API key, real auth domain and project ID
3. `.firebaserc` — updated to `skill-plepic-com`
4. `.github/workflows/pages.yml` — full CI pipeline: pnpm install, lint, typecheck, unit tests, E2E tests (with Java + Playwright setup), build, then deploy
5. `package.json` — added `packageManager` and `engines` fields for CI action compatibility
6. `.gitignore` — added Terraform ignores (`.terraform/`, `*.tfstate*`); lock file NOT ignored (should be committed for provider pinning)

**Deviations from spec:**

- Added `packageManager: "pnpm@10.18.3"` and `engines.node: ">=22"` to `package.json` — required by `pnpm/action-setup` and `actions/setup-node` to auto-detect versions
- Added `pnpm exec playwright install --with-deps chromium` step in CI — Playwright browsers aren't cached and must be installed before E2E tests
- Used Java 21 (temurin) instead of 11 — 21 is the current LTS, Firebase emulators work with any 11+
- Firestore rules deployed via Terraform (`google_firebaserules_ruleset` + `google_firebaserules_release`) instead of Firebase CLI — keeps all infra in one tool, avoids separate Firebase CLI auth
- Google Auth sign-in provider configured via Terraform (`google_iap_brand` + `google_iap_client` + `google_identity_platform_default_supported_idp_config`) instead of manual Firebase Console setup
- Added `.env.development` and `.env.test` for CI compatibility — Vite dev server and Vitest need fake Firebase API keys when no `.env.local` is present
- Playwright timeouts tightened to 15s test / 5s action for faster CI failure detection
- Terraform requires `GOOGLE_OAUTH_ACCESS_TOKEN` and `GOOGLE_CLOUD_QUOTA_PROJECT` env vars due to RAPT policy on the Google Workspace account

**Deployment verified:** CI pipeline green, app live at skill.plepic.com (2026-04-05)
