# Developer Guide

Comprehensive guide for developers working on the School Management System.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (React)                     │
│  ┌────────────┐  ┌────────────┐  ┌─────────────────────┐   │
│  │   Pages    │  │ Components │  │   Services Layer    │   │
│  │            │  │            │  │                     │   │
│  │ Students   │  │ Modals     │  │ StudentService      │   │
│  │ Teachers   │  │ Forms      │  │ TeacherService      │   │
│  │ Dashboard  │  │ Tables     │  │ AnalyticsService    │   │
│  └────────────┘  └────────────┘  └─────────────────────┘   │
│                                           ↓                  │
│                          ┌───────────────────────────┐      │
│                          │  Database Abstraction     │      │
│                          │    (IDatabase)            │      │
│                          └───────────────────────────┘      │
└────────────────────────────────────┬────────────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    ↓                ↓                ↓
          ┌─────────────────┐  ┌──────────┐  ┌──────────────┐
          │ FirestoreAdapter│  │IndexedDB │  │Analytics API │
          │                 │  │          │  │              │
          │  (Firebase)     │  │ (Local)  │  │(Cloud Run)   │
          └─────────────────┘  └──────────┘  └──────────────┘
```

---

## Project Structure

```
/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── students/        # Student-specific components
│   │   │   ├── StudentModal.tsx
│   │   │   ├── StudentProfile.tsx
│   │   │   └── BulkImport.tsx
│   │   ├── teachers/        # Teacher-specific components
│   │   └── Layout.tsx
│   ├── contexts/            # React contexts
│   │   └── AuthContext.tsx
│   ├── lib/                 # Core utilities
│   │   ├── firebase.ts
│   │   ├── firestore.types.ts
│   │   └── indexeddb.ts
│   ├── pages/               # Page components
│   │   ├── Dashboard.tsx
│   │   ├── Students.tsx
│   │   └── Teachers.tsx
│   ├── services/            # Business logic layer
│   │   ├── database/        # Database abstraction
│   │   │   ├── IDatabase.ts
│   │   │   └── FirestoreAdapter.ts
│   │   ├── StudentService.ts
│   │   └── TeacherService.ts
│   └── main.tsx
├── services/                # Backend services
│   └── analytics/           # Analytics API
│       ├── src/
│       │   ├── aggregations/
│       │   ├── database/
│       │   └── index.ts
│       └── package.json
├── docs/                    # Documentation
├── firestore.rules          # Security rules
├── firestore.indexes.json   # Composite indexes
└── package.json
```

---

## Database Abstraction Layer

### Why We Use It

The abstraction layer allows us to:
1. Swap databases without changing frontend code
2. Write testable service layers (mock the DB)
3. Migrate from Firebase → Supabase seamlessly
4. Support multiple databases simultaneously

### IDatabase Interface

```typescript
export interface IDatabase {
  // Read single document
  get<T>(collection: string, id: string): Promise<T | null>;

  // Query multiple documents
  query<T>(collection: string, options: QueryOptions): Promise<T[]>;

  // Create document
  create<T>(collection: string, data: Omit<T, 'id'>, id?: string): Promise<string>;

  // Update document
  update(collection: string, id: string, data: Partial<any>): Promise<void>;

  // Delete document
  delete(collection: string, id: string): Promise<void>;

  // Batch operations
  batch(operations: BatchOperation[]): Promise<void>;

  // Transactions
  transaction<T>(callback: (txn: ITransaction) => Promise<T>): Promise<T>;

  // Real-time listeners
  onSnapshot<T>(collection: string, id: string, callback: (data: T | null) => void): () => void;
  onQuerySnapshot<T>(collection: string, options: QueryOptions, callback: (data: T[]) => void): () => void;
}
```

### Creating a Service

All business logic goes in services, NOT in components.

**Example: StudentService.ts**

```typescript
import { IDatabase } from './database/IDatabase';
import { firestoreDb } from './database/FirestoreAdapter';

export class StudentService {
  constructor(private db: IDatabase = firestoreDb) {}

  async getStudent(id: string): Promise<Student | null> {
    return this.db.get<Student>('students', id);
  }

  async createStudent(data: CreateStudentData): Promise<string> {
    // Validation
    const exists = await this.checkAdmissionIdExists(data.admission_id);
    if (exists) throw new Error('Admission ID already exists');

    // Business logic
    return this.db.create<Student>('students', data);
  }
}
```

**Using in Components:**

```typescript
import { studentService } from '../services/StudentService';

function StudentsPage() {
  const loadStudents = async () => {
    const students = await studentService.listStudents({ status: 'active' });
    setStudents(students);
  };
}
```

---

## Adding a New Feature

### Example: Add "Student Transfer" Feature

#### Step 1: Update Service Layer

**src/services/StudentService.ts**

```typescript
export class StudentService {
  async transferStudent(
    studentId: string,
    newClassId: string,
    newSchool?: string,
    transferDate?: string
  ): Promise<void> {
    const student = await this.getStudent(studentId);
    if (!student) throw new Error('Student not found');

    if (newSchool) {
      // Transfer to another school
      await this.db.update('students', studentId, {
        status: 'transferred',
        transfer_date: transferDate || new Date().toISOString().split('T')[0],
        transfer_school: newSchool,
      });
    } else {
      // Internal class transfer
      await this.db.update('students', studentId, {
        class_id: newClassId,
        transfer_date: transferDate,
      });
    }

    // Log activity
    await this.db.create('activityLogs', {
      user_id: null,
      action: 'student_transfer',
      entity_type: 'student',
      entity_id: studentId,
      details: { new_class_id: newClassId, new_school: newSchool },
    });
  }
}
```

#### Step 2: Create UI Component

**src/components/students/TransferModal.tsx**

```typescript
import { useState } from 'react';
import { studentService } from '../../services/StudentService';

interface TransferModalProps {
  studentId: string;
  onSuccess: () => void;
}

export default function TransferModal({ studentId, onSuccess }: TransferModalProps) {
  const [newClassId, setNewClassId] = useState('');
  const [transferToExternal, setTransferToExternal] = useState(false);

  const handleSubmit = async () => {
    await studentService.transferStudent(
      studentId,
      transferToExternal ? '' : newClassId,
      transferToExternal ? 'New School Name' : undefined
    );
    onSuccess();
  };

  return (
    <div>
      {/* Modal UI */}
    </div>
  );
}
```

#### Step 3: Update Firestore Rules

**firestore.rules**

```javascript
match /students/{studentId} {
  allow update: if isAdmin() && (
    // Allow only specific fields for transfer
    request.resource.data.diff(resource.data).affectedKeys().hasOnly([
      'status', 'class_id', 'transfer_date', 'transfer_school', 'updated_at'
    ])
  );
}
```

#### Step 4: Add Tests

**src/services/StudentService.test.ts**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { StudentService } from './StudentService';

describe('StudentService.transferStudent', () => {
  it('should transfer student to new class', async () => {
    const mockDb = {
      get: vi.fn().mockResolvedValue({ id: '1', class_id: 'class_5a' }),
      update: vi.fn(),
      create: vi.fn(),
    };

    const service = new StudentService(mockDb as any);
    await service.transferStudent('1', 'class_6a');

    expect(mockDb.update).toHaveBeenCalledWith('students', '1', expect.objectContaining({
      class_id: 'class_6a',
    }));
  });
});
```

---

## Firestore Security Rules

### Rule Structure

```javascript
match /collection/{docId} {
  // Helper functions
  function isAdmin() { /* ... */ }

  // Rules
  allow read: if condition;
  allow create: if condition && validation;
  allow update: if condition && validation;
  allow delete: if condition;
}
```

### Testing Rules

**Install testing library:**

```bash
npm install --save-dev @firebase/rules-unit-testing
```

**Create test:**

```typescript
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';

describe('Student Collection Rules', () => {
  let testEnv;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'test',
      firestore: {
        rules: fs.readFileSync('firestore.rules', 'utf8'),
      },
    });
  });

  it('should allow admin to create student', async () => {
    const admin = testEnv.authenticatedContext('admin-uid', {
      role: 'admin',
    });

    await assertSucceeds(
      admin.firestore().collection('students').add({
        admission_id: 'STU001',
        first_name: 'John',
        // ... other fields
      })
    );
  });

  it('should deny teacher from creating student', async () => {
    const teacher = testEnv.authenticatedContext('teacher-uid', {
      role: 'teacher',
    });

    await assertFails(
      teacher.firestore().collection('students').add({})
    );
  });
});
```

---

## Composite Indexes

### When You Need an Index

Firestore requires a composite index when you:
1. Use multiple `where()` clauses
2. Combine `where()` + `orderBy()` on different fields
3. Use `in` or `array-contains-any` with other filters

### Adding a New Index

**Example: Query students by class and blood group**

```typescript
const students = await db.query('students', {
  where: [
    { field: 'class_id', operator: '==', value: 'class_5a' },
    { field: 'blood_group', operator: '==', value: 'O+' },
  ],
  orderBy: [{ field: 'first_name', direction: 'asc' }],
});
```

**Required index in firestore.indexes.json:**

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

**Deploy:**

```bash
firebase deploy --only firestore:indexes
```

---

## Real-Time Updates

### Using Snapshot Listeners

For components that need live updates:

```typescript
useEffect(() => {
  const unsubscribe = studentService.watchStudents(
    { status: 'active' },
    (students) => {
      setStudents(students);
    }
  );

  return () => unsubscribe(); // Cleanup
}, []);
```

**Best Practices:**

1. **Limit listeners**: Max 100 concurrent per client
2. **Unsubscribe on unmount**: Prevent memory leaks
3. **Use for critical data only**: Not for large lists
4. **Prefer polling for analytics**: Use HTTP API instead

---

## File Attachments

### How It Works

1. User uploads file in browser
2. File saved to IndexedDB (local storage)
3. Metadata saved to Firestore `fileMeta` collection
4. FileID links metadata → blob

### Adding File Upload

```typescript
import { saveFile, getFile } from '../lib/indexeddb';

// Upload
const handleUpload = async (file: File, studentId: string) => {
  // Save blob to IndexedDB
  const fileId = await saveFile(file, 'student', studentId, 'student_documents');

  // Save metadata to Firestore
  await firestoreDb.create('fileMeta', {
    owner_type: 'student',
    owner_id: studentId,
    file_name: file.name,
    file_type: file.type,
    file_size: file.size,
    storage_type: 'indexeddb',
    description: 'Student photo',
    uploaded_by: currentUserId,
  }, fileId);
};

// Download
const handleDownload = async (fileId: string) => {
  const fileRecord = await getFile(fileId, 'student_documents');
  if (fileRecord) {
    const url = URL.createObjectURL(fileRecord.blob);
    window.open(url);
  }
};
```

---

## Analytics Backend Integration

### Calling Analytics API

```typescript
const getAnalytics = async () => {
  const token = await auth.currentUser?.getIdToken();

  const response = await fetch(
    `${import.meta.env.VITE_ANALYTICS_API_URL}/api/analytics/dashboard?start=2025-10-01&end=2025-10-22`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();
  return data;
};
```

### Adding New Aggregation

**1. Create aggregator:**

```typescript
// services/analytics/src/aggregations/feeAggregator.ts
export class FeeAggregator {
  async aggregateMonthlyFees(year: string, month: string) {
    const invoices = await this.db.query('invoices', [
      { field: 'academic_year', operator: '==', value: year },
      // ... date filters
    ]);

    const collected = invoices.reduce((sum, inv) => sum + inv.paid_amount, 0);
    const pending = invoices.reduce((sum, inv) => sum + inv.balance, 0);

    return { collected, pending };
  }
}
```

**2. Add endpoint:**

```typescript
// services/analytics/src/index.ts
app.get('/api/analytics/fees/monthly', verifyAuth, async (req, res) => {
  const { year, month } = req.query;
  const aggregator = new FeeAggregator(db);
  const data = await aggregator.aggregateMonthlyFees(year, month);
  res.json(data);
});
```

---

## Testing

### Unit Tests (Services)

```bash
npm test
```

**Example:**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { StudentService } from './StudentService';

describe('StudentService', () => {
  let service: StudentService;

  beforeEach(() => {
    const mockDb = createMockDatabase();
    service = new StudentService(mockDb);
  });

  it('should create student with unique admission ID', async () => {
    const data = { admission_id: 'STU001', /* ... */ };
    const id = await service.createStudent(data);
    expect(id).toBeTruthy();
  });
});
```

### Component Tests

```bash
npm test -- StudentModal.test.tsx
```

**Example:**

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import StudentModal from './StudentModal';

describe('StudentModal', () => {
  it('should render form fields', () => {
    render(<StudentModal isOpen onClose={() => {}} onSuccess={() => {}} />);
    expect(screen.getByLabelText('First Name')).toBeInTheDocument();
  });

  it('should submit form data', async () => {
    const onSuccess = vi.fn();
    render(<StudentModal isOpen onClose={() => {}} onSuccess={onSuccess} />);

    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'John' } });
    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });
});
```

---

## Code Style & Conventions

### Naming Conventions

- **Components**: PascalCase (`StudentModal.tsx`)
- **Services**: PascalCase (`StudentService.ts`)
- **Functions**: camelCase (`loadStudents()`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)

### File Organization

- Keep files < 300 lines
- One component per file
- Co-locate related files (e.g., `students/` folder)

### Import Order

```typescript
// 1. External libraries
import { useState } from 'react';
import { toast } from 'react-toastify';

// 2. Internal services
import { studentService } from '../services/StudentService';

// 3. Components
import StudentModal from '../components/students/StudentModal';

// 4. Types
import { Student } from '../lib/firestore.types';
```

---

## Performance Optimization

### Avoid These Antipatterns

**❌ Bad: Load all students on page load**

```typescript
const students = await getDocs(collection(db, 'students')); // 10,000 reads!
```

**✅ Good: Use pagination**

```typescript
const students = await studentService.listStudents({ status: 'active' }, { limit: 50 });
```

**❌ Bad: Multiple queries in loop**

```typescript
for (const student of students) {
  const guardian = await getDoc(doc(db, 'guardians', student.guardian_id)); // N queries!
}
```

**✅ Good: Batch query**

```typescript
const guardianIds = students.map(s => s.guardian_id);
const guardians = await db.query('guardians', {
  where: [{ field: '__name__', operator: 'in', value: guardianIds }],
});
```

### Use Pre-Aggregated Data

**❌ Bad: Scan all attendance records**

```typescript
const attendance = await getDocs(collection(db, 'attendance')); // Thousands of docs
const rate = attendance.filter(a => a.status === 'present').length / attendance.length;
```

**✅ Good: Read pre-computed doc**

```typescript
const stats = await db.get('analytics', 'daily_attendance_2025-10-22');
const rate = stats.attendance_rate; // 1 read
```

---

## Troubleshooting

### Common Issues

#### "Missing index" error

**Solution:** Add index to `firestore.indexes.json` and deploy.

#### "Permission denied" error

**Solution:** Check `firestore.rules` and ensure user has correct role.

#### Slow page load

**Solution:** Use React DevTools Profiler to find slow components. Likely cause: too many Firestore reads.

#### Memory leak (listeners not cleaning up)

**Solution:** Always return cleanup function from `useEffect`:

```typescript
useEffect(() => {
  const unsubscribe = db.onSnapshot(/* ... */);
  return () => unsubscribe(); // ✅ Cleanup
}, []);
```

---

## Contributing

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/student-transfer

# Make changes
# ...

# Run tests
npm test

# Build
npm run build

# Commit
git add .
git commit -m "feat: add student transfer functionality"

# Push
git push origin feature/student-transfer

# Create PR
```

### PR Checklist

- [ ] Tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] No console errors/warnings
- [ ] Code follows style guide
- [ ] Added tests for new features
- [ ] Updated documentation
- [ ] Firestore rules updated (if needed)
- [ ] Indexes added (if needed)

---

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/rules-structure)
- [React TypeScript](https://react-typescript-cheatsheet.netlify.app/)
- [Vite Guide](https://vitejs.dev/guide/)
