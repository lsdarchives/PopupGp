terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 6.0, < 8.0"
    }
  }
}

provider "google" {
  alias   = "source"
  project = var.source_project_id
}

provider "google" {
  alias   = "backup"
  project = var.backup_project_id
}

data "google_project" "source" {
  provider   = google.source
  project_id = var.source_project_id
}

resource "google_firestore_backup_schedule" "daily" {
  provider  = google.source
  project   = var.source_project_id
  database  = "(default)"
  retention = "2592000s"

  daily_recurrence {}
}

resource "google_storage_bucket" "backups" {
  provider                    = google.backup
  project                     = var.backup_project_id
  name                        = var.backup_bucket_name
  location                    = var.backup_bucket_location
  storage_class               = "STANDARD"
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  force_destroy               = false

  lifecycle_rule {
    action {
      type = "Delete"
    }

    condition {
      age = 30
    }
  }
}

resource "google_service_account" "backup_runner" {
  provider     = google.source
  project      = var.source_project_id
  account_id   = "popupgp-backup-runner"
  display_name = "PopUpGp scheduled backup runner"
}

resource "google_project_iam_member" "firestore_exporter" {
  provider = google.source
  project  = var.source_project_id
  role     = "roles/datastore.importExportAdmin"
  member   = "serviceAccount:${google_service_account.backup_runner.email}"
}

resource "google_project_iam_member" "auth_metadata_reader" {
  provider = google.source
  project  = var.source_project_id
  role     = "roles/firebaseauth.viewer"
  member   = "serviceAccount:${google_service_account.backup_runner.email}"
}

resource "google_storage_bucket_iam_member" "backup_writer" {
  provider = google.backup
  bucket   = google_storage_bucket.backups.name
  role     = "roles/storage.objectCreator"
  member   = "serviceAccount:${google_service_account.backup_runner.email}"
}

resource "google_storage_bucket_iam_member" "firestore_exporter" {
  provider = google.backup
  bucket   = google_storage_bucket.backups.name
  role     = "roles/storage.admin"
  member   = "serviceAccount:service-${data.google_project.source.number}@gcp-sa-firestore.iam.gserviceaccount.com"
}

resource "google_storage_bucket_iam_member" "source_storage_reader" {
  provider = google.source
  bucket   = var.source_storage_bucket_name
  role     = "roles/storage.objectViewer"
  member   = "serviceAccount:${google_service_account.backup_runner.email}"
}

output "backup_bucket_name" {
  description = "Private bucket for scheduled Firestore exports, Auth metadata, and Storage copies."
  value       = google_storage_bucket.backups.name
}

output "backup_runner_service_account" {
  description = "Service account to configure on the scheduled backup functions."
  value       = google_service_account.backup_runner.email
}
