terraform {
  required_providers {
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 6.0"
    }
  }
}

provider "google-beta" {
  project                     = var.project_id
  user_project_override       = true
  billing_project             = var.project_id
}

resource "google_firebase_project" "default" {
  provider = google-beta
  project  = var.project_id
}

resource "google_firestore_database" "default" {
  provider    = google-beta
  project     = var.project_id
  name        = "(default)"
  location_id = var.region
  type        = "FIRESTORE_NATIVE"

  depends_on = [google_firebase_project.default]
}

resource "google_firebaserules_ruleset" "firestore" {
  provider = google-beta
  project  = var.project_id

  source {
    files {
      name    = "firestore.rules"
      content = file("${path.module}/../firestore.rules")
    }
  }

  depends_on = [google_firestore_database.default]
}

resource "google_firebaserules_release" "firestore" {
  provider     = google-beta
  project      = var.project_id
  name         = "cloud.firestore"
  ruleset_name = "projects/${var.project_id}/rulesets/${google_firebaserules_ruleset.firestore.name}"

  lifecycle {
    replace_triggered_by = [google_firebaserules_ruleset.firestore]
  }
}

# --- Google Auth sign-in provider ---
#
# MANUAL STEP (one-time): Create an OAuth 2.0 Web Client in GCP Console:
#   1. Go to APIs & Credentials → OAuth consent screen → configure
#   2. Credentials → Create OAuth 2.0 Client ID (Web application)
#   3. Authorized JS origins: https://skill.plepic.com, https://skill-plepic-com.firebaseapp.com
#   4. Authorized redirect URI: https://skill-plepic-com.firebaseapp.com/__/auth/handler
#
# Why manual: google_iap_client (deprecated Jan 2025) creates locked OAuth clients
# that don't support redirect URIs. No Terraform resource exists for standard
# OAuth2 clients. This is the approach recommended by the Firebase Terraform codelab.
# The client secret is stored in GCP Secret Manager (oauth-client-secret).

data "google_secret_manager_secret_version" "oauth_client_secret" {
  provider = google-beta
  project  = var.project_id
  secret   = "oauth-client-secret"
}

resource "google_identity_platform_default_supported_idp_config" "google" {
  provider      = google-beta
  project       = var.project_id
  enabled       = true
  idp_id        = "google.com"
  client_id     = var.oauth_client_id
  client_secret = data.google_secret_manager_secret_version.oauth_client_secret.secret_data
}

resource "google_identity_platform_config" "default" {
  provider = google-beta
  project  = var.project_id

  authorized_domains = [
    "skill.plepic.com",
    "skill-plepic-com.firebaseapp.com",
    "skill-plepic-com.web.app",
    "localhost",
  ]

  depends_on = [google_firebase_project.default]
}

# --- Preview Environments ---

# Enable required APIs

resource "google_project_service" "run" {
  provider = google-beta
  project  = var.project_id
  service  = "run.googleapis.com"

  disable_on_destroy = false
}

resource "google_project_service" "artifactregistry" {
  provider = google-beta
  project  = var.project_id
  service  = "artifactregistry.googleapis.com"

  disable_on_destroy = false
}

resource "google_project_service" "iamcredentials" {
  provider = google-beta
  project  = var.project_id
  service  = "iamcredentials.googleapis.com"

  disable_on_destroy = false
}

# Artifact Registry for preview container images

resource "google_artifact_registry_repository" "previews" {
  provider      = google-beta
  project       = var.project_id
  location      = var.cloud_run_region
  repository_id = "previews"
  description   = "Docker images for PR preview environments"
  format        = "DOCKER"

  cleanup_policy_dry_run = false

  cleanup_policies {
    id     = "delete-stale-untagged"
    action = "DELETE"
    condition {
      tag_state  = "UNTAGGED"
      older_than = "7d"
    }
  }

  depends_on = [google_project_service.artifactregistry]
}

# Workload Identity Federation for GitHub Actions

resource "google_iam_workload_identity_pool" "github" {
  provider                  = google-beta
  project                   = var.project_id
  workload_identity_pool_id = "github-actions"
  display_name              = "GitHub Actions"
  description               = "OIDC identity pool for GitHub Actions CI/CD"

  depends_on = [google_project_service.iamcredentials]
}

resource "google_iam_workload_identity_pool_provider" "github" {
  provider                           = google-beta
  project                            = var.project_id
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-oidc"
  display_name                       = "GitHub OIDC"

  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.repository" = "assertion.repository"
  }

  attribute_condition = "assertion.repository == \"${var.github_repo}\""

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

# Service accounts

resource "google_service_account" "preview_ci" {
  provider     = google-beta
  project      = var.project_id
  account_id   = "preview-ci"
  display_name = "Preview CI"
  description  = "Used by GitHub Actions to deploy/delete preview environments"
}

resource "google_service_account" "preview_runner" {
  provider     = google-beta
  project      = var.project_id
  account_id   = "preview-runner"
  display_name = "Preview Runner"
  description  = "Runtime identity for preview Cloud Run services"
}

# IAM: CI service account permissions
# roles/run.admin is project-level (no resource-level alternative) and includes
# setIamPolicy. Acceptable here: single-project app with no production Cloud Run
# services. roles/run.developer is insufficient — cleanup workflow must delete services.

resource "google_project_iam_member" "preview_ci_run_admin" {
  provider = google-beta
  project  = var.project_id
  role     = "roles/run.admin"
  member   = "serviceAccount:${google_service_account.preview_ci.email}"
}

resource "google_artifact_registry_repository_iam_member" "preview_ci_ar_writer" {
  provider   = google-beta
  project    = var.project_id
  location   = google_artifact_registry_repository.previews.location
  repository = google_artifact_registry_repository.previews.repository_id
  role       = "roles/artifactregistry.writer"
  member     = "serviceAccount:${google_service_account.preview_ci.email}"
}

resource "google_service_account_iam_member" "preview_ci_act_as_runner" {
  provider           = google-beta
  service_account_id = google_service_account.preview_runner.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.preview_ci.email}"
}

# IAM: Allow GitHub Actions to impersonate the CI service account via WIF

resource "google_service_account_iam_member" "preview_ci_wif_binding" {
  provider           = google-beta
  service_account_id = google_service_account.preview_ci.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/${var.github_repo}"
}
