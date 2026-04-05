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
