output "project_id" {
  description = "Firebase project ID"
  value       = var.project_id
}

output "firestore_location" {
  description = "Firestore database location"
  value       = google_firestore_database.default.location_id
}
