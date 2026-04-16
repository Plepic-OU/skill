output "project_id" {
  description = "Firebase project ID"
  value       = var.project_id
}

output "firestore_location" {
  description = "Firestore database location"
  value       = google_firestore_database.default.location_id
}

output "artifact_registry_repository" {
  description = "Artifact Registry repository URL"
  value       = "${var.cloud_run_region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.previews.repository_id}"
}

output "workload_identity_provider" {
  description = "Workload Identity Provider resource name (for GitHub Actions)"
  value       = google_iam_workload_identity_pool_provider.github.name
}

output "preview_ci_service_account" {
  description = "Preview CI service account email"
  value       = google_service_account.preview_ci.email
}

output "preview_runner_service_account" {
  description = "Preview Cloud Run runtime service account email"
  value       = google_service_account.preview_runner.email
}
