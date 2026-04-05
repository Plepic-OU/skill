variable "project_id" {
  description = "GCP project ID"
  type        = string
  default     = "skill-plepic-com"
}

variable "region" {
  description = "Firestore location"
  type        = string
  default     = "eur3"
}

variable "support_email" {
  description = "Support email for OAuth consent screen"
  type        = string
  default     = "joosep@plepic.com"
}

variable "oauth_client_id" {
  description = "OAuth 2.0 client ID for Google sign-in (created manually in GCP Console)"
  type        = string
  default     = "152087843840-ahc6uahoirq1vgibrk7esm5jerdcq8ro.apps.googleusercontent.com"
}
