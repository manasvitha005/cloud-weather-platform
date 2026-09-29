# 🌦️ NimbusCloud — Cloud-Based Weather Monitoring, Historical Analytics & Alert System

A production-grade, enterprise-ready **Cloud Computing Platform** designed for real-time global weather ingestion, high-resolution time-series storage, automated anomaly alert dispatching, and historical meteorological analytics. Built with **Next.js 14**, **TypeScript**, **PostgreSQL on Google Cloud SQL**, **Google Cloud Run**, and **Google Cloud Scheduler**.

---

## 🏗️ 1. Architecture & Cloud Computing Concepts

NimbusCloud was engineered from the ground up as a **real Cloud Computing system**, demonstrating core distributed architecture patterns:

```text
                                  ┌────────────────────────┐
                                  │      Client Tier       │
                                  │  Browser / Mobile Web  │
                                  └───────────┬────────────┘
                                              │ HTTPS
                                              ▼
                                 ┌─────────────────────────┐
                                 │    Google Cloud Run     │
                                 │   Next.js 14 Web / BFF  │
                                 │  (Serverless Container) │
                                 └────────────┬────────────┘
                                              │
              ┌───────────────────────────────┼───────────────────────────────┐
              │                               │                               │
              ▼                               ▼                               ▼
     ┌─────────────────┐             ┌─────────────────┐             ┌─────────────────┐
     │ External API    │             │ Google Cloud SQL│             │ Alert Engine    │
     │ Open-Meteo      │             │ PostgreSQL 16   │             │ Anomaly Rules   │
     │ Forecast / Geo  │             │ Time-Series DB  │             │ Event Trigger   │
     └─────────────────┘             └────────┬────────┘             └─────────────────┘
                                              │
                                              ▼
                                     ┌─────────────────┐
                                     │ Historical Data │
                                     │ Weather Records │
                                     └─────────────────┘

                            AUTOMATED CLOUD INGESTION PIPELINE

     ┌──────────────────────┐
     │ Google Cloud         │
     │ Scheduler (Cron)     │ Every 15-30 mins
     └──────────┬───────────┘
                │ HTTPS POST (Secured via Secret Token)
                ▼
     ┌──────────────────────┐
     │ Ingestion Endpoint   │
     │ /api/jobs/collection │
     └──────────┬───────────┘
                │
                ▼
     ┌──────────────────────┐
     │ Active Fleet Query   │ Loads all enabled monitored locations
     └──────────┬───────────┘
                │
                ▼
     ┌──────────────────────┐
     │ Open-Meteo API Fetch │ Concurrent meteorological queries
     └──────────┬───────────┘
                │
                ▼
     ┌──────────────────────┐
     │ Zod Validation &     │ Cleanses payloads & normalizes WMO codes
     │ Normalization        │
     └──────────┬───────────┘
                │
                ▼
     ┌──────────────────────┐
     │ Idempotent DB Store  │ ON CONFLICT (locationId, recordedAt) DO NOTHING
     └──────────┬───────────┘
                │
                ▼
     ┌──────────────────────┐
     │ Alert Rule Engine    │ Evaluates thresholds (Temp, Rain, Wind, Humid)
     └──────────┬───────────┘
                │
                ▼
     ┌──────────────────────┐
     │ Collection Run Log   │ Records start/end time, duration, status, and telemetry
     └──────────────────────┘
```

### Core Cloud Computing Concepts Demonstrated:
1. **Serverless Cloud Hosting**: Next.js application packaged as a container running on **Google Cloud Run** with horizontal auto-scaling and sub-second scale-to-zero capability.
2. **Managed Cloud Database**: Persistent relational time-series storage using **Google Cloud SQL for PostgreSQL 16** with automatic backups, connection pooling, and multi-zone failover support.
3. **Automated Scheduled Execution**: Periodic cron orchestration triggered by **Google Cloud Scheduler** hitting protected ingestion endpoints every 30 minutes.
4. **Idempotent Ingestion Pipeline**: Composite unique database constraints on `(locationId, recordedAt)` preventing duplicate observation records upon repeated cron triggers.
5. **Event-Driven Anomaly Detection**: Real-time evaluation of newly collected weather metrics against configurable threshold rules (High Heat, Gale Winds, Flooding Rainfall, High Humidity).
6. **Observability & Telemetry**: Full system health dashboard measuring database query latency, third-party API latency, 24-hour job success rates, and expandable run logs.
7. **Multi-Region Scalability**: Stateless service tier capable of scaling from 8 cities to thousands of locations without architectural restructuring.
8. **Secure Secret Management**: Database URLs and Cron authentication secrets decoupled from source code and managed via **Google Secret Manager**.

---

## 🛠️ 2. Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | Next.js 14 (App Router) | High-performance React framework with server-side rendering & API routes |
| **Language** | TypeScript | Strict type safety across database schemas, API contracts, and UI components |
| **Styling** | Tailwind CSS | Modern atmospheric UI, dark/light modes, and custom glassmorphism |
| **ORM** | Prisma ORM | Type-safe database queries, migrations, and relationship management |
| **Database** | PostgreSQL / SQLite | Google Cloud SQL (Production) and SQLite (Local Development) |
| **Charting** | Recharts | Responsive, interactive historical time-series charts with custom tooltips |
| **Validation** | Zod | Runtime schema validation for weather API payloads and user inputs |
| **Icons** | Lucide React | Clean, scalable meteorological and cloud status icon system |
| **Testing** | Vitest & Testing Library | Unit and integration test suite |
| **Cloud Target** | Google Cloud Platform | Cloud Run, Cloud SQL, Cloud Scheduler, Secret Manager, Cloud Build |

---

## 📊 3. Database Schema

The relational schema is configured in `prisma/schema.prisma` (SQLite) and `prisma/schema.postgres.prisma` (Cloud SQL PostgreSQL):

```prisma
model Location {
  id             String          @id @default(cuid())
  name           String
  country        String
  latitude       Float
  longitude      Float
  timezone       String          @default("UTC")
  elevation      Float?
  isActive       Boolean         @default(true)
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
  
  weatherRecords WeatherRecord[]
  weatherAlerts  WeatherAlert[]

  @@unique([latitude, longitude])
  @@index([isActive])
  @@index([name])
}

model WeatherRecord {
  id                   String   @id @default(cuid())
  locationId           String
  recordedAt           DateTime
  temperature          Float
  feelsLikeTemperature Float
  humidity             Float
  windSpeed            Float
  windDirection        Float?
  precipitation        Float    @default(0.0)
  pressure             Float?
  weatherCode          Int
  conditionText        String?
  uvIndex              Float?
  visibility           Float?
  createdAt            DateTime @default(now())

  location Location @relation(fields: [locationId], references: [id], onDelete: Cascade)

  @@unique([locationId, recordedAt])
  @@index([locationId, recordedAt])
  @@index([recordedAt])
}

model AlertRule {
  id          String   @id @default(cuid())
  metric      String   // TEMPERATURE_HIGH, PRECIPITATION_HIGH, WIND_HIGH, HUMIDITY_HIGH
  operator    String   @default("GREATER_THAN")
  threshold   Float
  severity    String   @default("WARNING") // INFO, WARNING, CRITICAL
  isEnabled   Boolean  @default(true)
  title       String
  description String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model WeatherAlert {
  id          String    @id @default(cuid())
  locationId  String
  type        String
  severity    String    // INFO, WARNING, CRITICAL
  title       String
  message     String
  threshold   Float
  actualValue Float
  triggeredAt DateTime  @default(now())
  resolvedAt  DateTime?
  status      String    @default("ACTIVE") // ACTIVE, RESOLVED, ACKNOWLEDGED
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  location Location @relation(fields: [locationId], references: [id], onDelete: Cascade)

  @@index([locationId, status])
  @@index([triggeredAt])
}

model CollectionRun {
  id                 String    @id @default(cuid())
  startedAt          DateTime  @default(now())
  completedAt        DateTime?
  status             String    @default("RUNNING") // SUCCESS, PARTIAL_FAILURE, FAILED
  triggerType        String    @default("SCHEDULED") // SCHEDULED, MANUAL, SYSTEM
  locationsProcessed Int       @default(0)
  recordsCreated     Int       @default(0)
  alertsTriggered    Int       @default(0)
  durationMs         Int?
  errorMessage       String?
  logs               String?
  createdAt          DateTime  @default(now())

  @@index([startedAt])
  @@index([status])
}
```

---

## 💻 4. Local Development Setup

### Prerequisites
- **Node.js**: v18+ (tested on Node v20 & v24)
- **npm**: v9+

### 1. Clone & Install Dependencies
```bash
cd cloud-weather-platform
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default local configuration:
```env
DATABASE_URL="file:./dev.db"
CRON_SECRET="cloud_weather_super_secret_key_2026"
NODE_ENV="development"
PORT=3000
```

### 3. Initialize Database & Seed Data
```bash
# Push schema tables to database
npx prisma db push

# Seed default monitored cities and alert rules
npm run prisma:seed

# Optional: Backfill genuine past 7-day hourly observations from Open-Meteo
npx tsx scripts/backfill-history.ts
```

### 4. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🧪 5. Testing Suite

The project includes unit and integration tests for weather normalization, alert evaluation, and analytics aggregation:

```bash
# Run test suite
npm test

# Run tests in watch mode
npm run test:watch
```

---

## 🚀 6. Google Cloud Platform (GCP) Deployment

### Architecture on GCP:
* **Frontend & Backend BFF**: Google Cloud Run (Containerized Next.js standalone server)
* **Relational Database**: Google Cloud SQL (PostgreSQL 16)
* **Automated Cron Ingestion**: Google Cloud Scheduler (invoking `/api/jobs/weather-collection`)
* **Secret Storage**: Google Secret Manager

### Automated Deployment Script
Use the included automated deployment script:

```bash
# Linux / macOS
chmod +x scripts/deploy-gcp.sh
./scripts/deploy-gcp.sh

# Windows PowerShell
.\scripts\deploy-gcp.ps1
```

### Manual Step-by-Step Deployment:

#### 1. Set Project & Enable APIs
```bash
gcloud config set project YOUR_PROJECT_ID

gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  cloudscheduler.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com
```

#### 2. Provision Cloud SQL PostgreSQL 16
```bash
gcloud sql instances create weather-postgres-db \
  --database-version=POSTGRES_16 \
  --tier=db-custom-1-3840 \
  --region=us-central1

gcloud sql databases create weather_monitoring --instance=weather-postgres-db
gcloud sql users create weather_app --instance=weather-postgres-db --password="YourSecurePassword"
```

#### 3. Build & Deploy to Google Cloud Run
```bash
gcloud run deploy cloud-weather-platform \
  --source=. \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --memory=1Gi \
  --cpu=1 \
  --add-cloudsql-instances=YOUR_PROJECT_ID:us-central1:weather-postgres-db \
  --set-env-vars=NODE_ENV=production,CRON_SECRET="your-cron-secret-token"
```

#### 4. Configure Google Cloud Scheduler
Schedule the automated weather ingestion job every 30 minutes:
```bash
gcloud scheduler jobs create http weather-collection-job \
  --schedule="*/30 * * * *" \
  --uri="https://YOUR_CLOUD_RUN_URL/api/jobs/weather-collection" \
  --http-method=POST \
  --headers="x-cron-secret=your-cron-secret-token,Content-Type=application/json" \
  --message-body='{"triggerType":"SCHEDULED"}' \
  --time-zone="UTC" \
  --location=us-central1
```

---

## 📡 7. API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/weather` | Returns location, live current observation, hourly, and 7-day forecast |
| `GET` | `/api/geocoding?q=query` | Searches global locations via Open-Meteo Geocoding API |
| `GET` | `/api/locations` | Lists all monitored locations with status and latest observations |
| `POST` | `/api/locations` | Adds a new monitored location and performs immediate weather sync |
| `PATCH` | `/api/locations/:id` | Toggles location active/inactive monitoring state |
| `DELETE` | `/api/locations/:id` | Deletes a monitored location and its historical data |
| `GET` | `/api/analytics?locationId=:id&range=24h\|7d\|30d` | Returns aggregated metrics (avg/min/max) and time-series points |
| `GET` | `/api/alerts?status=ACTIVE\|RESOLVED\|ALL` | Returns weather alerts and severity counts |
| `POST` | `/api/alerts/:id/resolve` | Manually acknowledges/resolves an active alert |
| `GET` | `/api/alerts/rules` | Lists configurable alert rules |
| `PUT` | `/api/alerts/rules` | Updates threshold and severity parameters for an alert rule |
| `GET` | `/api/monitoring` | Returns real-time Cloud System Health telemetry and run logs |
| `POST` | `/api/jobs/weather-collection` | Secured Cloud Scheduler ingestion endpoint |

---

## 📄 License
This project is open source and available under the [MIT License](LICENSE).
