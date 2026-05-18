# Enable required GCP APIs
resource "google_project_service" "run_api" {
  service = "run.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "artifact_registry_api" {
  service = "artifactregistry.googleapis.com"
  disable_on_destroy = false
}

# Artifact Registry Repository for Docker Images
resource "google_artifact_registry_repository" "backend_repo" {
  location      = var.region
  repository_id = "babelforge-backend-repo"
  description   = "Docker repository for babelForge backend API"
  format        = "DOCKER"
  depends_on    = [google_project_service.artifact_registry_api]
}

# Cloud Run Service (Backend)
resource "google_cloud_run_v2_service" "backend_service" {
  name     = var.backend_service_name
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    containers {
      image = "us-docker.pkg.dev/cloudrun/container/hello" # Placeholder image, replaced by CI/CD
      ports {
        container_port = 8080
      }
      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }
    }
  }

  depends_on = [google_project_service.run_api]
}

# Make Cloud Run Service Public
resource "google_cloud_run_service_iam_member" "public_invoker" {
  location = google_cloud_run_v2_service.backend_service.location
  project  = google_cloud_run_v2_service.backend_service.project
  service  = google_cloud_run_v2_service.backend_service.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Cloud Storage Bucket (Frontend)
resource "google_storage_bucket" "frontend_bucket" {
  name          = var.frontend_bucket_name
  location      = "US" # Multi-region for better availability
  force_destroy = true

  uniform_bucket_level_access = true

  website {
    main_page_suffix = "index.html"
    not_found_page   = "404.html"
  }

  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD", "OPTIONS"]
    response_header = ["*"]
    max_age_seconds = 3600
  }
}

# Make Frontend Bucket Public
resource "google_storage_bucket_iam_member" "public_viewer" {
  bucket = google_storage_bucket.frontend_bucket.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}