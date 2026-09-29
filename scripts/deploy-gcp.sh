#!/bin/bash
# ==============================================================================
# Google Cloud Platform (GCP) Deployment Script for NimbusCloud Weather Platform
# ==============================================================================
# Services Configured:
# 1. Google Cloud SQL (Managed PostgreSQL 16)
# 2. Google Cloud Run (Serverless Next.js Container)
# 3. Google Cloud Scheduler (Automated Cron Job for Ingestion Pipeline)
# 4. Google Secret Manager (Encrypted Credentials)
# ==============================================================================

set -e

# Configuration Variables
PROJECT_ID="your-gcp-project-id"
REGION="us-central1"
SERVICE_NAME="cloud-weather-platform"
DB_INSTANCE_NAME="weather-postgres-db"
DB_NAME="weather_monitoring"
DB_USER="weather_app"
DB_PASSWORD="YourSecureDbPassword2026!"
CRON_SECRET="nimbus_cloud_secret_$(openssl rand -hex 16)"

echo "🚀 Starting GCP Deployment for ${SERVICE_NAME}..."

# 1. Set Active Project
echo "1. Configuring GCP project..."
gcloud config set project ${PROJECT_ID}

# 2. Enable Required Google Cloud APIs
echo "2. Enabling Google Cloud APIs (Cloud Run, Cloud SQL, Cloud Scheduler, Secret Manager)..."
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  cloudscheduler.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com

# 3. Provision Cloud SQL PostgreSQL Instance
echo "3. Creating Cloud SQL PostgreSQL 16 instance (db-f1-micro / db-custom)..."
gcloud sql instances create ${DB_INSTANCE_NAME} \
  --database-version=POSTGRES_16 \
  --tier=db-custom-1-3840 \
  --region=${REGION} \
  --storage-type=SSD \
  --storage-size=10GB \
  --storage-auto-increase \
  --availability-type=ZONAL || echo "Database instance may already exist."

# Create Database & User
echo "Creating database and user credentials..."
gcloud sql databases create ${DB_NAME} --instance=${DB_INSTANCE_NAME} || true
gcloud sql users create ${DB_USER} --instance=${DB_INSTANCE_NAME} --password=${DB_PASSWORD} || true

# Format Cloud SQL Connection String
CONNECTION_NAME=$(gcloud sql instances describe ${DB_INSTANCE_NAME} --format="value(connectionName)")
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@/${DB_NAME}?host=/cloudsql/${CONNECTION_NAME}"

# 4. Store Secrets in Google Secret Manager
echo "4. Storing Database URL and Cron Secrets in Secret Manager..."
echo -n "${DATABASE_URL}" | gcloud secrets create WEATHER_DATABASE_URL --data-file=- || \
  echo -n "${DATABASE_URL}" | gcloud secrets versions add WEATHER_DATABASE_URL --data-file=-

echo -n "${CRON_SECRET}" | gcloud secrets create WEATHER_CRON_SECRET --data-file=- || \
  echo -n "${CRON_SECRET}" | gcloud secrets versions add WEATHER_CRON_SECRET --data-file=-

# 5. Build and Deploy Container to Cloud Run
echo "5. Building and deploying container to Google Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --source=. \
  --region=${REGION} \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --memory=1Gi \
  --cpu=1 \
  --add-cloudsql-instances=${CONNECTION_NAME} \
  --set-secrets=DATABASE_URL=WEATHER_DATABASE_URL:latest,CRON_SECRET=WEATHER_CRON_SECRET:latest

# Retrieve Deployed Service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --platform=managed --region=${REGION} --format="value(status.url)")
echo "✅ Cloud Run deployed successfully at: ${SERVICE_URL}"

# 6. Configure Google Cloud Scheduler for Automated Weather Collection
echo "6. Creating Google Cloud Scheduler Job (Every 30 minutes)..."
gcloud scheduler jobs create http weather-collection-job \
  --schedule="*/30 * * * *" \
  --uri="${SERVICE_URL}/api/jobs/weather-collection" \
  --http-method=POST \
  --headers="x-cron-secret=${CRON_SECRET},Content-Type=application/json" \
  --message-body='{"triggerType":"SCHEDULED"}' \
  --time-zone="UTC" \
  --location=${REGION} \
  --attempt-deadline=60s || \
gcloud scheduler jobs update http weather-collection-job \
  --schedule="*/30 * * * *" \
  --uri="${SERVICE_URL}/api/jobs/weather-collection" \
  --http-method=POST \
  --headers="x-cron-secret=${CRON_SECRET},Content-Type=application/json" \
  --message-body='{"triggerType":"SCHEDULED"}' \
  --time-zone="UTC" \
  --location=${REGION} \
  --attempt-deadline=60s

echo "=========================================================================="
echo "🎉 DEPLOYMENT COMPLETE!"
echo "App URL: ${SERVICE_URL}"
echo "Cloud Scheduler Job: Running every 30 minutes"
echo "Database: Cloud SQL PostgreSQL (${CONNECTION_NAME})"
echo "=========================================================================="
