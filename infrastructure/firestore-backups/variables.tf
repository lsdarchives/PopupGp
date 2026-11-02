variable "source_project_id" {
  description = "Firebase/Google Cloud project containing the production Firestore database."
  type        = string
}

variable "backup_project_id" {
  description = "Dedicated Google Cloud project for isolated backup objects."
  type        = string
}

variable "backup_bucket_name" {
  description = "Globally unique Cloud Storage bucket name in the dedicated backup project."
  type        = string
}

variable "backup_bucket_location" {
  description = "Cloud Storage location near the Firestore nam5 multi-region."
  type        = string
  default     = "US"
}

variable "source_storage_bucket_name" {
  description = "Existing production Firebase Storage bucket name, without the gs:// prefix."
  type        = string
}
