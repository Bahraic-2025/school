# Deployment Guide

Complete guide for deploying the School Management System with Firebase and the Analytics Backend.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Firebase Setup](#firebase-setup)
3. [Deploy Security Rules](#deploy-security-rules)
4. [Deploy Indexes](#deploy-indexes)
5. [Analytics Backend Deployment](#analytics-backend-deployment)
6. [Frontend Deployment](#frontend-deployment)
7. [Post-Deployment](#post-deployment)

---

## Prerequisites

### Required Tools

```bash
# Node.js 18+ LTS
node --version  # v18.0.0 or higher

# Firebase CLI
npm install -g firebase-tools
firebase --version

# Git
git --version
```

### Required Accounts

- Firebase project (create at console.firebase.google.com)
- Google Cloud Platform account (for Cloud Run deployment)
- GitHub account (for CI/CD)

---

## Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Project name: `school-management-prod`
4. Enable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Firestore

1. In Firebase Console → Build → Firestore Database
2. Click "Create database"
3. Start in **production mode** (we'll deploy rules next)
4. Choose location: `us-central1` (or closest region)
5. Click "Enable"

### 3. Enable Authentication

1. In Firebase Console → Build → Authentication
2. Click "Get started"
3. Enable "Email/Password" provider
4. Click "Save"

### 4. Create Admin User

```bash
# Using Firebase Console
Go to Authentication → Users → Add user
Email: admin@yourschool.com
Password: [generate strong password]
```

**Create user document in Firestore:**

```bash
# In Firestore console, create document in `users` collection:
Document ID: [copy UID from Authentication]
Fields:
  email: admin@yourschool.com
  name: Admin User
  role: admin
  status: active
  created_at: [timestamp - now]
  last_login: null
```

### 5. Get Firebase Config

1. In Firebase Console → Project Settings → General
2. Scroll to "Your apps" → Web app
3. Click "Add app" → Register app
4. Copy the config object

---

## Deploy Security Rules

### 1. Initialize Firebase CLI

```bash
cd /path/to/project
firebase login
firebase init firestore
```

Select:
- Use existing project
- Firestore rules: `firestore.rules`
- Firestore indexes: `firestore.indexes.json`

### 2. Deploy Rules

```bash
# Test rules first (optional)
firebase emulators:start --only firestore

# Deploy to production
firebase deploy --only firestore:rules
```

**Verify deployment:**

```bash
firebase firestore:rules:get
```

### 3. Test Rules

Create `firestore.rules.test.ts`:

```typescript
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';

describe('Firestore Security Rules', () => {
  it('should deny unauthenticated access to students', async () => {
    const env = await initializeTestEnvironment({
      projectId: 'test',
      firestore: { rules: fs.readFileSync('firestore.rules', 'utf8') }
    });

    const unauthedDb = env.unauthenticatedContext().firestore();
    await assertFails(unauthedDb.collection('students').doc('test').get());
  });
});
```

Run tests:

```bash
npm test -- firestore.rules.test.ts
```

---

## Deploy Indexes

### 1. Review Required Indexes

Check `firestore.indexes.json` contains all 24 indexes from the analysis report.

### 2. Deploy Indexes

```bash
firebase deploy --only firestore:indexes
```

**This takes 5-15 minutes.** Monitor progress:

```bash
firebase firestore:indexes
```

### 3. Verify Indexes

In Firebase Console → Firestore → Indexes tab, verify all indexes show "Enabled" status.

---

## Analytics Backend Deployment

### Option A: Cloud Run (Recommended)

#### 1. Setup GCP

```bash
# Install gcloud CLI
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Login
gcloud auth login

# Set project
gcloud config set project YOUR_PROJECT_ID
```

#### 2. Enable APIs

```bash
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

#### 3. Create Service Account

```bash
gcloud iam service-accounts create analytics-api \
    --display-name="Analytics API Service Account"

# Grant Firestore access
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:analytics-api@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/datastore.user"

# Download key
gcloud iam service-accounts keys create key.json \
    --iam-account=analytics-api@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

#### 4. Deploy to Cloud Run

```bash
cd services/analytics

# Build and deploy
gcloud run deploy analytics-api \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --timeout 60s \
  --set-env-vars DATABASE_TYPE=firebase,FIREBASE_PROJECT_ID=YOUR_PROJECT_ID \
  --service-account analytics-api@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

**Get deployed URL:**

```bash
gcloud run services describe analytics-api --region us-central1 --format 'value(status.url)'
```

#### 5. Test Deployment

```bash
# Health check
curl https://analytics-api-XXXXX.run.app/health

# Get Firebase ID token
TOKEN=$(curl -X POST "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yourschool.com","password":"YOUR_PASSWORD","returnSecureToken":true}' \
  | jq -r '.idToken')

# Test analytics endpoint
curl https://analytics-api-XXXXX.run.app/api/analytics/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

### Option B: Cloud Functions

```bash
cd services/analytics

# Deploy
firebase deploy --only functions:analyticsApi
```

### Option C: Self-Hosted (VPS/Docker)

```bash
cd services/analytics

# Build
npm run build

# Create .env file
cat > .env << EOF
PORT=3001
DATABASE_TYPE=firebase
FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
FIREBASE_PRIVATE_KEY="$(cat key.json | jq -r .private_key)"
FIREBASE_CLIENT_EMAIL=$(cat key.json | jq -r .client_email)
EOF

# Run
npm start
```

---

## Frontend Deployment

### Option A: Firebase Hosting (Recommended)

#### 1. Build Frontend

```bash
cd /path/to/project

# Update .env.production
cat > .env.production << EOF
VITE_FIREBASE_API_KEY=YOUR_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_APP_ID
VITE_FIREBASE_MEASUREMENT_ID=YOUR_MEASUREMENT_ID
VITE_USE_FIREBASE_EMULATOR=false
VITE_ANALYTICS_API_URL=https://analytics-api-XXXXX.run.app
EOF

# Build
npm run build
```

#### 2. Initialize Firebase Hosting

```bash
firebase init hosting
```

Select:
- Public directory: `dist`
- Single-page app: Yes
- GitHub Actions: Yes (optional)

#### 3. Deploy

```bash
firebase deploy --only hosting
```

**Your app is live at:** `https://YOUR_PROJECT.web.app`

### Option B: Vercel

```bash
npm install -g vercel
vercel login
vercel --prod
```

### Option C: Netlify

```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod --dir=dist
```

---

## Post-Deployment

### 1. Seed Initial Data

Create `scripts/seed-data.ts`:

```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

const app = initializeApp({ /* config */ });
const db = getFirestore(app);

async function seedClasses() {
  const classes = [
    { name: 'Grade 1', section: 'A', capacity: 40 },
    { name: 'Grade 2', section: 'A', capacity: 40 },
    // ... more classes
  ];

  for (const cls of classes) {
    await addDoc(collection(db, 'classes'), {
      ...cls,
      academic_year: '2025-2026',
      class_teacher_id: null,
      subjects: ['Math', 'English', 'Science'],
      created_at: new Date(),
      updated_at: new Date(),
    });
  }
}

seedClasses();
```

Run:

```bash
tsx scripts/seed-data.ts
```

### 2. Setup Scheduled Jobs

#### Using Cloud Scheduler:

```bash
# Daily attendance aggregation
gcloud scheduler jobs create http daily-attendance \
  --schedule="59 23 * * *" \
  --time-zone="America/New_York" \
  --uri="https://analytics-api-XXXXX.run.app/api/analytics/recompute" \
  --http-method=POST \
  --headers="Authorization=Bearer SERVICE_ACCOUNT_TOKEN" \
  --message-body='{"target":"attendance_daily","range":{"start":"today","end":"today"}}'

# Monthly fee summary
gcloud scheduler jobs create http monthly-fees \
  --schedule="0 0 1 * *" \
  --time-zone="America/New_York" \
  --uri="https://analytics-api-XXXXX.run.app/api/analytics/recompute" \
  --http-method=POST \
  --headers="Authorization=Bearer SERVICE_ACCOUNT_TOKEN" \
  --message-body='{"target":"fees_monthly","range":{"start":"last-month","end":"last-month"}}'
```

### 3. Configure Backups

```bash
# Export Firestore data daily
gcloud firestore export gs://YOUR_BUCKET/firestore-backups/$(date +%Y-%m-%d) \
  --project YOUR_PROJECT_ID
```

Add to cron or Cloud Scheduler.

### 4. Setup Monitoring

#### Enable Cloud Monitoring:

```bash
gcloud services enable monitoring.googleapis.com
```

#### Create Alerts:

1. Go to Cloud Console → Monitoring → Alerting
2. Create policy:
   - **High error rate**: API error rate > 5%
   - **High latency**: API p95 latency > 2s
   - **Low availability**: Uptime check fails

### 5. Security Hardening

#### Enable App Check (optional):

```bash
firebase init appcheck
firebase deploy --only appcheck
```

#### Setup CORS:

Update `services/analytics/src/index.ts`:

```typescript
app.use(cors({
  origin: ['https://YOUR_PROJECT.web.app', 'https://yourschool.com'],
  credentials: true,
}));
```

---

## CI/CD with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-rules:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: w9jds/firebase-action@master
        with:
          args: deploy --only firestore:rules,firestore:indexes
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - uses: w9jds/firebase-action@master
        with:
          args: deploy --only hosting
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: google-github-actions/setup-gcloud@v1
      - run: |
          cd services/analytics
          gcloud run deploy analytics-api --source . --region us-central1
```

Get Firebase token:

```bash
firebase login:ci
```

Add token to GitHub Secrets as `FIREBASE_TOKEN`.

---

## Troubleshooting

### Issue: "Missing or insufficient permissions"

**Solution:** Check Firestore rules are deployed and user has `admin` role in `users` collection.

### Issue: "Index not found"

**Solution:** Run `firebase deploy --only firestore:indexes` and wait 10-15 minutes.

### Issue: Analytics API returns 500 error

**Solution:** Check Cloud Run logs:

```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=analytics-api" --limit 50
```

### Issue: Frontend not connecting to API

**Solution:** Verify `VITE_ANALYTICS_API_URL` in `.env.production` matches deployed Cloud Run URL.

---

## Rollback Procedures

### Rollback Firestore Rules

```bash
# Get previous rules version
firebase firestore:rules:list

# Rollback to specific version
firebase firestore:rules:release RULESET_ID
```

### Rollback Frontend

```bash
# List previous deployments
firebase hosting:releases:list

# Rollback
firebase hosting:rollback
```

### Rollback Backend

```bash
# List revisions
gcloud run revisions list --service analytics-api --region us-central1

# Rollback
gcloud run services update-traffic analytics-api \
  --to-revisions REVISION_NAME=100 \
  --region us-central1
```

---

## Cost Estimation

### Firebase (300 students, 20 teachers, 50 staff users)

| Service | Monthly Usage | Cost |
|---------|---------------|------|
| Firestore reads | 500K | $0.18 |
| Firestore writes | 50K | $0.45 |
| Authentication | 5K MAU | Free |
| Hosting | 10GB transfer | Free |
| **Total** | | **$0.63/mo** |

### Cloud Run (Analytics API)

| Resource | Monthly | Cost |
|----------|---------|------|
| Requests | 100K | $0.40 |
| CPU time | 10 hours | $0.24 |
| Memory | 512MB | $0.03 |
| **Total** | | **$0.67/mo** |

**Combined Total: ~$1.30/month** (for small school)

At scale (5,000 students): ~$15-25/month

---

## Production Checklist

- [ ] Firebase project created and configured
- [ ] Firestore rules deployed and tested
- [ ] All 24 composite indexes deployed
- [ ] Admin user created with correct role
- [ ] Initial data seeded (classes, fee structures)
- [ ] Analytics backend deployed to Cloud Run
- [ ] Frontend deployed to Firebase Hosting
- [ ] Custom domain configured (optional)
- [ ] Scheduled jobs created (daily/monthly aggregations)
- [ ] Backups configured (daily Firestore exports)
- [ ] Monitoring and alerts enabled
- [ ] Error tracking enabled (Sentry)
- [ ] Documentation shared with team
- [ ] Load testing completed
- [ ] Security audit passed

---

## Next Steps

1. Configure custom domain: `docs.firebase.com/hosting/custom-domain`
2. Setup SSL certificate (auto with Firebase Hosting)
3. Train staff on admin panel
4. Import historical data from previous system
5. Schedule go-live date and user onboarding
