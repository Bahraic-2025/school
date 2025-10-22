# School Analytics Backend

Database-agnostic analytics API for the School Management System.

## Features

- RESTful API for heavy analytics queries
- Pre-aggregation support for dashboard KPIs
- Database-agnostic design (supports Firebase, Supabase, etc.)
- JWT authentication with Firebase ID tokens
- Scheduled aggregation jobs
- Caching layer for performance

## Architecture

```
Frontend (React)
    ↓ HTTP/REST
Analytics API (Node.js + Express)
    ↓ Adapter Pattern
IAnalyticsDatabase Interface
    ↓
├─→ FirestoreAdapter
└─→ SupabaseAdapter (future)
```

## Setup

### Prerequisites

- Node.js 18+ (LTS)
- npm or yarn
- Firebase project OR Supabase project

### Installation

```bash
cd services/analytics
npm install
```

### Environment Variables

Create a `.env` file:

```env
PORT=3001
NODE_ENV=development

# For Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# For Supabase (alternative)
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_KEY=your-service-key

# Database type
DATABASE_TYPE=firebase
```

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

## API Endpoints

All endpoints require `Authorization: Bearer <firebase-id-token>` header.

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-22T12:00:00.000Z"
}
```

### GET /api/analytics/dashboard

Get dashboard KPIs and aggregated data.

**Query Parameters:**
- `start` (optional): Start date (YYYY-MM-DD)
- `end` (optional): End date (YYYY-MM-DD)

**Response:**
```json
{
  "kpis": {
    "total_students": 1250,
    "active_students": 1180,
    "total_teachers": 45,
    "fees_collected": 2500000,
    "fees_pending": 350000
  },
  "attendance": {
    "today_rate": 94.5,
    "trend": [
      { "date": "2025-10-15", "rate": 92.3 },
      { "date": "2025-10-16", "rate": 93.1 }
    ]
  },
  "enrollment": {
    "monthly": [
      { "month": "2025-09", "new": 45, "withdrawn": 3 }
    ]
  }
}
```

### GET /api/analytics/class/:classId/attendance

Get attendance time series for a specific class.

**Query Parameters:**
- `start` (required): Start date (YYYY-MM-DD)
- `end` (required): End date (YYYY-MM-DD)

**Response:**
```json
{
  "class_id": "class_5a",
  "period": { "start": "2025-10-01", "end": "2025-10-22" },
  "attendance": [
    {
      "date": "2025-10-01",
      "total_students": 45,
      "present": 42,
      "absent": 2,
      "late": 1,
      "attendance_rate": 93.3
    }
  ]
}
```

### GET /api/analytics/fees/aging

Get fee aging buckets (outstanding fees by age).

**Query Parameters:**
- `asOf` (optional): Date for aging calculation (YYYY-MM-DD)

**Response:**
```json
{
  "as_of_date": "2025-10-22",
  "aging_buckets": [
    { "label": "Current", "amount": 150000, "count": 45 },
    { "label": "1-30 days", "amount": 80000, "count": 25 },
    { "label": "31-60 days", "amount": 50000, "count": 15 },
    { "label": "61-90 days", "amount": 30000, "count": 8 },
    { "label": "90+ days", "amount": 40000, "count": 12 }
  ]
}
```

### POST /api/analytics/recompute

Trigger recomputation of specific aggregates (admin only).

**Body:**
```json
{
  "target": "attendance_daily",
  "range": {
    "start": "2025-10-01",
    "end": "2025-10-22"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Recomputation of attendance_daily scheduled",
  "range": { "start": "2025-10-01", "end": "2025-10-22" }
}
```

## Aggregation Jobs

### Daily Attendance Aggregation

Runs daily at 11:59 PM to compute:
- Total attendance rate
- Per-class attendance
- Absent students list

Saved to: `analytics/daily_attendance_{YYYY-MM-DD}`

### Monthly Fee Summary

Runs on 1st of each month to compute:
- Total fees collected
- Outstanding fees
- Aging analysis

Saved to: `analytics/monthly_fees_{YYYY-MM}`

### Monthly Enrollment Trends

Runs on 1st of each month to compute:
- New admissions
- Withdrawals/transfers
- Grade-wise distribution

Saved to: `analytics/enrollment_{YYYY-MM}`

## Scheduled Tasks

### Using cron (Linux/Mac)

```bash
# Daily at 11:59 PM
59 23 * * * curl -X POST http://localhost:3001/api/analytics/recompute \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"target":"attendance_daily","range":{"start":"2025-10-22","end":"2025-10-22"}}'
```

### Using Cloud Scheduler (GCP)

```bash
gcloud scheduler jobs create http daily-attendance-aggregate \
  --schedule="59 23 * * *" \
  --uri="https://your-api.run.app/api/analytics/recompute" \
  --http-method=POST \
  --headers="Authorization=Bearer TOKEN" \
  --message-body='{"target":"attendance_daily","range":{"start":"today","end":"today"}}'
```

### Using GitHub Actions

See `.github/workflows/analytics-jobs.yml` for example.

## Deployment

### Cloud Run (Recommended)

```bash
gcloud run deploy analytics-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_TYPE=firebase
```

### Cloud Functions

```bash
gcloud functions deploy analyticsApi \
  --runtime nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --entry-point app
```

### Docker

```bash
docker build -t analytics-api .
docker run -p 3001:3001 --env-file .env analytics-api
```

## Testing

```bash
npm test
```

### Manual Testing

```bash
# Get Firebase ID token
TOKEN=$(curl -X POST "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password","returnSecureToken":true}' \
  | jq -r '.idToken')

# Test dashboard endpoint
curl http://localhost:3001/api/analytics/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

## Database Adapters

### Creating a New Adapter

1. Implement `IAnalyticsDatabase` interface:

```typescript
export class MyDatabaseAdapter implements IAnalyticsDatabase {
  async query<T>(collection: string, filters: QueryFilter[]): Promise<T[]> {
    // Your implementation
  }

  async aggregate(collection: string, options: AggregationOptions): Promise<AnalyticsData[]> {
    // Your implementation
  }

  async writeAnalyticsDoc(collection: string, id: string, data: any): Promise<void> {
    // Your implementation
  }

  async readAnalyticsDoc<T>(collection: string, id: string): Promise<T | null> {
    // Your implementation
  }
}
```

2. Register in `src/database/factory.ts`:

```typescript
import { MyDatabaseAdapter } from './MyDatabaseAdapter';

export function createDatabase(type: string): IAnalyticsDatabase {
  switch (type) {
    case 'firebase':
      return new FirestoreAdapter();
    case 'mydatabase':
      return new MyDatabaseAdapter();
    default:
      throw new Error(`Unknown database type: ${type}`);
  }
}
```

## Performance Optimization

### Pre-aggregation Strategy

Instead of scanning 10,000+ documents on every dashboard load:

**Without pre-aggregation:**
- Dashboard load: 10,000 reads
- Cost: ~$0.36 per 1000 loads

**With pre-aggregation:**
- Dashboard load: 3 reads (from `analytics/` collection)
- Daily job: 10,000 reads (once per day)
- Cost: ~$0.001 per 1000 loads

**Savings: 99.7%**

### Caching

The API includes in-memory caching for frequently accessed aggregates:

```typescript
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
```

## Monitoring

### Logging

All requests and errors are logged to console. For production, integrate with:

- Cloud Logging (GCP)
- CloudWatch (AWS)
- Sentry for error tracking

### Metrics

Track:
- Request rate
- Response time (p50, p95, p99)
- Error rate
- Database query time
- Cache hit rate

## Security

- All endpoints require Firebase ID token authentication
- Tokens verified using Firebase Admin SDK
- Rate limiting (100 requests/minute per IP)
- Helmet.js for security headers
- Input validation with Zod

## Troubleshooting

### "Unauthorized" errors

Ensure the Firebase ID token is fresh (expires after 1 hour).

### Slow queries

Check:
1. Database indexes are deployed
2. Pre-aggregated docs exist
3. Query date ranges are reasonable (<90 days)

### Memory issues

Increase Node.js heap size:

```bash
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

## Contributing

1. Follow TypeScript + ESLint conventions
2. Add tests for new aggregation logic
3. Update this README with new endpoints
4. Run `npm run lint` before committing

## License

MIT
