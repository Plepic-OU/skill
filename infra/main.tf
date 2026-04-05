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
