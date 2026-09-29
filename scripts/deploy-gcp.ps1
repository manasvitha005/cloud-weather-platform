# ==============================================================================
# Google Cloud Platform (GCP) PowerShell Deployment Script for NimbusCloud
# ==============================================================================

param (
    [string]$ProjectId = "your-gcp-project-id",
    [string]$Region = "us-central1",
    [string]$ServiceName = "cloud-weather-platform",
    [string]$DbInstance = "weather-postgres-db",
    [string]$DbName = "weather_monitoring",
    [string]$DbUser = "weather_app",
    [string]$DbPassword = "YourSecureDbPassword2026!"
)

Write-Host "🚀 Starting GCP Deployment for $ServiceName..." -ForegroundColor Cyan

# Set Project
gcloud config set project $ProjectId

# Enable Services
Write-Host "Enabling Google Cloud APIs..." -ForegroundColor Yellow
gcloud services enable run.googleapis.com sqladmin.googleapis.com cloudscheduler.googleapis.com secretmanager.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com

# Deploy to Cloud Run
Write-Host "Deploying container to Google Cloud Run..." -ForegroundColor Yellow
gcloud run deploy $ServiceName `
  --source=. `
  --region=$Region `
  --platform=managed `
  --allow-unauthenticated `
  --port=8080 `
  --memory=1Gi `
  --cpu=1

$ServiceUrl = gcloud run services describe $ServiceName --platform=managed --region=$Region --format="value(status.url)"
Write-Host "✅ Cloud Run deployed at: $ServiceUrl" -ForegroundColor Green
