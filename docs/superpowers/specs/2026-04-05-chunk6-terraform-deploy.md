# Chunk 6: Terraform & Deploy

## Overview

Infrastructure as code for the Firebase backend and a CI pipeline that builds and deploys the SPA to GitHub Pages. Connects the app to the production Firebase project `skill-plepic-com`.

## Scope

- Terraform config to provision Firebase resources on an existing GCP project
- GitHub Actions workflow updated to build before deploying
- Production Firebase config committed as `.env.production`
- Firestore rules deployed manually via Firebase CLI
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
├── main.tf          # Provider, Firebase, Firestore, Auth
├── backend.tf       # GCS remote state
├── variables.tf     # Input variables
└── outputs.tf       # API key, auth domain, project ID
```

### What Terraform Manages

| Resource             | Details                                   |
| -------------------- | ----------------------------------------- |
| Firebase project     | Enable Firebase API on `skill-plepic-com` |
| Firestore database   | Native mode, `eur3` (Europe multi-region) |
| Google Auth provider | Enable Google sign-in                     |
| API key restrictions | HTTP referrer: `skill.plepic.com/*`       |

### What Terraform Does NOT Manage

- **Firestore security rules and indexes** — deployed via Firebase CLI (`firebase deploy --only firestore`). Keeping rules in the repo and deploying manually avoids Terraform/CLI drift.
- **GitHub Pages deployment** — handled by GitHub Actions.
- **DNS** — already configured and pointing to GitHub Pages.

### Remote State

- **Backend:** GCS bucket `gs://skill-plepic-com-tfstate`
- **State file:** `terraform.tfstate`
- **Bucket location:** EU

### Provider

```hcl
provider "google-beta" {
  project = var.project_id
}
```

Uses `google-beta` provider since Firebase resources require it.

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
2. Setup Node.js (match version from project)
3. Install pnpm
4. `pnpm install --frozen-lockfile`
5. `pnpm build` (runs typecheck + Vite build → `web/`, postbuild copies `index.html` → `404.html`)
6. Upload `web/` artifact (existing)
7. Deploy to GitHub Pages (existing)

### No Tests in CI

Pre-commit hooks (Husky + lint-staged) already enforce ESLint, Prettier, typecheck, unit tests, and E2E tests before code reaches `main`. Running them again in CI would be redundant.

---

## 3. Production Firebase Config

### `.env.production` (committed)

```
VITE_FIREBASE_API_KEY=<from terraform output or GCP console>
VITE_FIREBASE_AUTH_DOMAIN=skill-plepic-com.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=skill-plepic-com
```

### How Environment Switching Works

- **`pnpm build`** (production): Vite loads `.env.production` automatically when `NODE_ENV=production`
- **`pnpm dev`** (local): Vite loads `.env.local` (gitignored) with fake emulator values
- **`src/firebase.ts`**: Already reads `import.meta.env.VITE_*` — no code changes needed
- **Emulator detection**: Existing logic connects to emulators only in dev mode — unchanged

### Why the API Key Is Safe to Commit

Firebase client API keys are identifiers, not credentials. They're embedded in the JavaScript bundle served to every browser. Security is enforced by Firestore security rules and Firebase Auth, not by hiding the API key. The API key restriction (HTTP referrer to `skill.plepic.com/*`) prevents abuse from other domains.

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

Manual, not automated. Rules changes are infrequent and should be reviewed before deploying to production.

---

## 5. Bootstrap (One-Time Setup)

Run these steps once to set up the production infrastructure:

### Step 1: Create GCS Bucket for Terraform State

```bash
gcloud storage buckets create gs://skill-plepic-com-tfstate \
  --project=skill-plepic-com \
  --location=eu
```

### Step 2: Initialize and Apply Terraform

```bash
cd infra
terraform init
terraform apply
```

### Step 3: Get Firebase API Key

After `terraform apply`, the API key is available from Terraform outputs or the GCP console. Update `.env.production` with the real value.

### Step 4: Deploy Firestore Rules

```bash
firebase deploy --only firestore
```

### Step 5: Verify

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
