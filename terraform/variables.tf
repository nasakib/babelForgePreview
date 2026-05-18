variable "project_id" {
  description = "The GCP Project ID"
  type        = string
}

variable "region" {
  description = "The GCP Region"
  type        = string
  default     = "us-central1"
}

variable "frontend_bucket_name" {
  description = "Name of the GCS bucket for the Next.js static export"
  type        = string
  default     = "babelforge-frontend-prod"
}

variable "backend_service_name" {
  description = "Name of the Cloud Run service for the FastAPI backend"
  type        = string
  default     = "babelforge-backend"
}