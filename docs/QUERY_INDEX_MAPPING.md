# Query to Index Mapping

Complete reference of all Firestore queries in the application and their required composite indexes.

## How to Use This Document

1. Find your query in the "Query" column
2. Check if the corresponding index exists in `firestore.indexes.json`
3. If missing, add the index from the "Index Definition" column
4. Deploy: `firebase deploy --only firestore:indexes`

---

## Students Collection

### Query 1: List Active Students by Name
**Location:** `src/services/StudentService.ts:45`
**Query:**
```typescript
where('status', '==', 'active')
orderBy('first_name', 'asc')
```
**Index Required:**
```json
{
  "collectionGroup": "students",
  "fields": [
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "first_name", "order": "ASCENDING" }
  ]
}
```
**Status:** ✅ Defined in firestore.indexes.json

---

### Query 2: Students by Class and Admission Date
**Location:** Analytics queries
**Query:**
```typescript
where('class_id', '==', classId)
orderBy('admission_date', 'desc')
```
**Index Required:**
```json
{
  "collectionGroup": "students",
  "fields": [
    { "fieldPath": "class_id", "order": "ASCENDING" },
    { "fieldPath": "admission_date", "order": "DESCENDING" }
  ]
}
```
**Status:** ✅ Defined

---

### Query 3: Active Students by Admission Date
**Location:** Dashboard statistics
**Query:**
```typescript
where('status', '==', 'active')
orderBy('admission_date', 'desc')
```
**Index Required:**
```json
{
  "collectionGroup": "students",
  "fields": [
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "admission_date", "order": "DESCENDING" }
  ]
}
```
**Status:** ✅ Defined

---

### Query 4: Students by Class and Roll Number
**Location:** Class roster reports
**Query:**
```typescript
where('class_id', '==', classId)
orderBy('roll_number', 'asc')
```
**Index Required:**
```json
{
  "collectionGroup": "students",
  "fields": [
    { "fieldPath": "class_id", "order": "ASCENDING" },
    { "fieldPath": "roll_number", "order": "ASCENDING" }
  ]
}
```
**Status:** ✅ Defined

---

## Teachers Collection

### Query 5: Active Teachers by Name
**Location:** `src/pages/Teachers.tsx:16`
**Query:**
```typescript
where('status', '==', 'active')
orderBy('first_name', 'asc')
```
**Index Required:**
```json
{
  "collectionGroup": "teachers",
  "fields": [
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "first_name", "order": "ASCENDING" }
  ]
}
```
**Status:** ✅ Defined

---

### Query 6: Teachers by Joining Date
**Location:** Staff reports
**Query:**
```typescript
where('status', '==', 'active')
orderBy('joining_date', 'desc')
```
**Index Required:**
```json
{
  "collectionGroup": "teachers",
  "fields": [
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "joining_date", "order": "DESCENDING" }
  ]
}
```
**Status:** ✅ Defined

---

## Guardians Collection

### Query 7: Student's Guardians (Primary First)
**Location:** `src/services/StudentService.ts:260`
**Query:**
```typescript
where('student_id', '==', studentId)
orderBy('is_primary', 'desc')
```
**Index Required:**
```json
{
  "collectionGroup": "guardians",
  "fields": [
    { "fieldPath": "student_id", "order": "ASCENDING" },
    { "fieldPath": "is_primary", "order": "DESCENDING" }
  ]
}
```
**Status:** ✅ Defined

---

## Attendance Collection

### Query 8: Class Attendance by Date
**Location:** Attendance reports, analytics
**Query:**
```typescript
where('class_id', '==', classId)
orderBy('date', 'desc')
```
**Index Required:**
```json
{
  "collectionGroup": "attendance",
  "fields": [
    { "fieldPath": "class_id", "order": "ASCENDING" },
    { "fieldPath": "date", "order": "DESCENDING" }
  ]
}
```
**Status:** ✅ Defined

---

### Query 9: Student Attendance History
**Location:** Student profile
**Query:**
```typescript
where('student_id', '==', studentId)
orderBy('date', 'desc')
```
**Index Required:**
```json
{
  "collectionGroup": "attendance",
  "fields": [
    { "fieldPath": "student_id", "order": "ASCENDING" },
    { "fieldPath": "date", "order": "DESCENDING" }
  ]
}
```
**Status:** ✅ Defined

---

### Query 10: Class Attendance with Status Filter
**Location:** Absent students report
**Query:**
```typescript
where('class_id', '==', classId)
where('date', '==', date)
where('status', '==', 'absent')
```
**Index Required:**
```json
{
  "collectionGroup": "attendance",
  "fields": [
    { "fieldPath": "class_id", "order": "ASCENDING" },
    { "fieldPath": "date", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" }
  ]
}
```
**Status:** ✅ Defined

---

## Invoices Collection

### Query 11: Student's Invoices by Status
**Location:** Fee management
**Query:**
```typescript
where('student_id', '==', studentId)
where('status', '==', 'pending')
```
**Index Required:**
```json
{
  "collectionGroup": "invoices",
  "fields": [
    { "fieldPath": "student_id", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" }
  ]
}
```
**Status:** ✅ Defined

---

### Query 12: Overdue Invoices
**Location:** Fee reminders, analytics
**Query:**
```typescript
where('status', 'in', ['pending', 'overdue'])
orderBy('due_date', 'asc')
```
**Index Required:**
```json
{
  "collectionGroup": "invoices",
  "fields": [
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "due_date", "order": "ASCENDING" }
  ]
}
```
**Status:** ✅ Defined

---

### Query 13: Recent Invoices
**Location:** Dashboard
**Query:**
```typescript
where('status', '==', 'pending')
orderBy('created_at', 'desc')
limit(10)
```
**Index Required:**
```json
{
  "collectionGroup": "invoices",
  "fields": [
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "created_at", "order": "DESCENDING" }
  ]
}
```
**Status:** ✅ Defined

---

### Query 14: Invoices by Academic Year and Status
**Location:** Year-end reports
**Query:**
```typescript
where('academic_year', '==', '2025-2026')
where('status', '==', 'paid')
```
**Index Required:**
```json
{
  "collectionGroup": "invoices",
  "fields": [
    { "fieldPath": "academic_year", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" }
  ]
}
```
**Status:** ✅ Defined

---

## Payments Collection

### Query 15: Invoice Payments
**Location:** Invoice details
**Query:**
```typescript
where('invoice_id', '==', invoiceId)
orderBy('payment_date', 'desc')
```
**Index Required:**
```json
{
  "collectionGroup": "payments",
  "fields": [
    { "fieldPath": "invoice_id", "order": "ASCENDING" },
    { "fieldPath": "payment_date", "order": "DESCENDING" }
  ]
}
```
**Status:** ✅ Defined

---

### Query 16: Student Payment History
**Location:** Student profile
**Query:**
```typescript
where('student_id', '==', studentId)
orderBy('payment_date', 'desc')
```
**Index Required:**
```json
{
  "collectionGroup": "payments",
  "fields": [
    { "fieldPath": "student_id", "order": "ASCENDING" },
    { "fieldPath": "payment_date", "order": "DESCENDING" }
  ]
}
```
**Status:** ✅ Defined

---

## Exams Collection

### Query 17: Exams by Academic Year
**Location:** Exam management
**Query:**
```typescript
where('academic_year', '==', '2025-2026')
orderBy('start_date', 'desc')
```
**Index Required:**
```json
{
  "collectionGroup": "exams",
  "fields": [
    { "fieldPath": "academic_year", "order": "ASCENDING" },
    { "fieldPath": "start_date", "order": "DESCENDING" }
  ]
}
```
**Status:** ✅ Defined

---

## Marks Collection

### Query 18: Exam Results by Class
**Location:** Result sheets
**Query:**
```typescript
where('exam_id', '==', examId)
where('class_id', '==', classId)
```
**Index Required:**
```json
{
  "collectionGroup": "marks",
  "fields": [
    { "fieldPath": "exam_id", "order": "ASCENDING" },
    { "fieldPath": "class_id", "order": "ASCENDING" }
  ]
}
```
**Status:** ✅ Defined

---

### Query 19: Student Exam History
**Location:** Student profile
**Query:**
```typescript
where('student_id', '==', studentId)
where('exam_id', '==', examId)
```
**Index Required:**
```json
{
  "collectionGroup": "marks",
  "fields": [
    { "fieldPath": "student_id", "order": "ASCENDING" },
    { "fieldPath": "exam_id", "order": "ASCENDING" }
  ]
}
```
**Status:** ✅ Defined

---

### Query 20: Class Toppers
**Location:** Result analysis
**Query:**
```typescript
where('exam_id', '==', examId)
orderBy('percentage', 'desc')
limit(10)
```
**Index Required:**
```json
{
  "collectionGroup": "marks",
  "fields": [
    { "fieldPath": "exam_id", "order": "ASCENDING" },
    { "fieldPath": "percentage", "order": "DESCENDING" }
  ]
}
```
**Status:** ✅ Defined

---

## Activity Logs Collection

### Query 21: User Activity History
**Location:** Admin audit dashboard
**Query:**
```typescript
where('user_id', '==', userId)
orderBy('created_at', 'desc')
limit(100)
```
**Index Required:**
```json
{
  "collectionGroup": "activityLogs",
  "fields": [
    { "fieldPath": "user_id", "order": "ASCENDING" },
    { "fieldPath": "created_at", "order": "DESCENDING" }
  ]
}
```
**Status:** ✅ Defined

---

### Query 22: Activity Logs by Entity Type
**Location:** Entity-specific audit trail
**Query:**
```typescript
where('entity_type', '==', 'student')
orderBy('created_at', 'desc')
```
**Index Required:**
```json
{
  "collectionGroup": "activityLogs",
  "fields": [
    { "fieldPath": "entity_type", "order": "ASCENDING" },
    { "fieldPath": "created_at", "order": "DESCENDING" }
  ]
}
```
**Status:** ✅ Defined

---

## Announcements Collection

### Query 23: Recent Announcements for Audience
**Location:** Dashboard, announcements page
**Query:**
```typescript
where('audience', '==', 'students')
orderBy('published_at', 'desc')
limit(10)
```
**Index Required:**
```json
{
  "collectionGroup": "announcements",
  "fields": [
    { "fieldPath": "audience", "order": "ASCENDING" },
    { "fieldPath": "published_at", "order": "DESCENDING" }
  ]
}
```
**Status:** ✅ Defined

---

## File Metadata Collection

### Query 24: Files by Owner
**Location:** Student/teacher profiles
**Query:**
```typescript
where('owner_type', '==', 'student')
where('owner_id', '==', studentId)
orderBy('created_at', 'desc')
```
**Index Required:**
```json
{
  "collectionGroup": "fileMeta",
  "fields": [
    { "fieldPath": "owner_type", "order": "ASCENDING" },
    { "fieldPath": "owner_id", "order": "ASCENDING" },
    { "fieldPath": "created_at", "order": "DESCENDING" }
  ]
}
```
**Status:** ✅ Defined

---

## Summary

**Total Queries Documented:** 24
**Total Indexes Required:** 24
**Indexes Defined:** 24 ✅
**Missing Indexes:** 0

---

## Deployment Instructions

### 1. Verify All Indexes Exist

```bash
cat firestore.indexes.json | jq '.indexes | length'
# Should output: 24
```

### 2. Deploy Indexes

```bash
firebase deploy --only firestore:indexes
```

**Note:** This takes 10-15 minutes. Monitor progress:

```bash
firebase firestore:indexes
```

### 3. Verify Deployment

In Firebase Console → Firestore → Indexes tab:
- All indexes should show "Enabled" status
- No indexes should be in "Building" state

### 4. Test Queries

Run each query in your app and check for "Missing index" errors:

```bash
# Enable Firestore debug logging
localStorage.debug = 'firestore:*'
```

If you see errors like:
```
The query requires an index. You can create it here: https://console.firebase.google.com/...
```

Then that index failed to deploy. Re-run step 2.

---

## Adding New Indexes

### Step 1: Identify the Query

```typescript
// Example new query
const result = await db.query('students', {
  where: [
    { field: 'class_id', operator: '==', value: 'class_5a' },
    { field: 'blood_group', operator: '==', value: 'O+' },
  ],
  orderBy: [{ field: 'first_name', direction: 'asc' }],
});
```

### Step 2: Create Index Definition

```json
{
  "collectionGroup": "students",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "class_id", "order": "ASCENDING" },
    { "fieldPath": "blood_group", "order": "ASCENDING" },
    { "fieldPath": "first_name", "order": "ASCENDING" }
  ]
}
```

### Step 3: Add to firestore.indexes.json

Open `firestore.indexes.json` and add the new index to the `indexes` array.

### Step 4: Deploy

```bash
firebase deploy --only firestore:indexes
```

### Step 5: Document Here

Add the new query to this document with:
- Query number
- Location in codebase
- Query code
- Index definition
- Status

---

## Troubleshooting

### Issue: Index build stuck at "Building"

**Solution:** Index building can take up to 2 hours for large collections. Check status:

```bash
firebase firestore:indexes
```

If stuck > 2 hours, delete and recreate:

```bash
firebase firestore:indexes:delete INDEX_ID
firebase deploy --only firestore:indexes
```

### Issue: "Index not found" error in production

**Solution:** Indexes are project-specific. Ensure you deployed to the correct Firebase project:

```bash
firebase projects:list
firebase use YOUR_PROJECT_ID
firebase deploy --only firestore:indexes
```

### Issue: Query slow despite index

**Solution:** Check execution plan in Firebase Console:
1. Go to Firestore → Data → Run query manually
2. Click "Explain" tab to see if index is used
3. If "Full collection scan" appears, index may be malformed

**Fix:** Verify field names match exactly (case-sensitive).

---

## Performance Tips

1. **Single-field indexes are automatic**: Don't create indexes for queries with only one `where()` clause on a single field.

2. **Order matters**: `[status ASC, name ASC]` ≠ `[name ASC, status ASC]`. Create the exact index your query needs.

3. **IN queries**: `where('status', 'in', ['active', 'pending'])` doesn't require an index unless combined with `orderBy()`.

4. **Limit usage**: Adding `limit()` doesn't require a new index, it just limits results.

5. **Pagination**: Use `startAfter()` for pagination, not `offset()` (offset scans all skipped docs).

---

## Index Maintenance

### Monthly Review

Check for unused indexes:

```bash
# Export Firestore usage stats
gcloud logging read "resource.type=firestore_database" \
  --format="json" > firestore-logs.json

# Analyze which indexes are actually used
# (Manual review or script)
```

### Delete Unused Indexes

```bash
firebase firestore:indexes:delete INDEX_ID
```

**Cost savings:** Each index costs storage + write overhead. Removing 10 unused indexes can save ~$5-10/month at scale.

---

## Quick Reference Table

| Query Location | Collections | Filters | Order By | Index # |
|----------------|-------------|---------|----------|---------|
| StudentService.ts:45 | students | status=active | first_name↑ | 1 |
| Analytics | students | class_id=X | admission_date↓ | 2 |
| Dashboard | students | status=active | admission_date↓ | 3 |
| Class roster | students | class_id=X | roll_number↑ | 4 |
| Teachers.tsx:16 | teachers | status=active | first_name↑ | 5 |
| Staff reports | teachers | status=active | joining_date↓ | 6 |
| StudentService.ts:260 | guardians | student_id=X | is_primary↓ | 7 |
| Attendance reports | attendance | class_id=X | date↓ | 8 |
| Student profile | attendance | student_id=X | date↓ | 9 |
| Absent students | attendance | class_id=X, date=Y | status | 10 |
| Fee management | invoices | student_id=X | status | 11 |
| Fee reminders | invoices | status IN [...] | due_date↑ | 12 |
| Dashboard | invoices | status=pending | created_at↓ | 13 |
| Year-end | invoices | year=X | status | 14 |
| Invoice details | payments | invoice_id=X | payment_date↓ | 15 |
| Student profile | payments | student_id=X | payment_date↓ | 16 |
| Exam management | exams | year=X | start_date↓ | 17 |
| Result sheets | marks | exam=X | class_id | 18 |
| Student profile | marks | student_id=X | exam_id | 19 |
| Result analysis | marks | exam_id=X | percentage↓ | 20 |
| Audit dashboard | activityLogs | user_id=X | created_at↓ | 21 |
| Audit trail | activityLogs | entity_type=X | created_at↓ | 22 |
| Announcements | announcements | audience=X | published_at↓ | 23 |
| Profiles | fileMeta | owner_type=X, owner_id=Y | created_at↓ | 24 |

---

**Last Updated:** 2025-10-22
**Maintained By:** Development Team
**Firebase Project:** See `.firebaserc`
