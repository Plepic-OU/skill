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
