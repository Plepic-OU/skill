terraform {
  required_providers {
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 6.0"
    }
  }
}

provider "google-beta" {
  project = var.project_id
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

resource "google_project_service" "iap" {
  provider = google-beta
  project  = var.project_id
  service  = "iap.googleapis.com"
}

resource "google_iap_brand" "default" {
  provider          = google-beta
  project           = var.project_id
  support_email     = var.support_email
  application_title = "Plepic Skill Tree"

  depends_on = [google_project_service.iap]
}

resource "google_iap_client" "default" {
  provider     = google-beta
  display_name = "Web client (created by Terraform)"
  brand        = google_iap_brand.default.name
}

resource "google_identity_platform_default_supported_idp_config" "google" {
  provider      = google-beta
  project       = var.project_id
  enabled       = true
  idp_id        = "google.com"
  client_id     = google_iap_client.default.client_id
  client_secret = google_iap_client.default.secret
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
