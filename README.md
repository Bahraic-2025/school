# School Admin Dashboard

A comprehensive, production-ready school administration system built with React, TypeScript, Supabase, and IndexedDB.

## Features

### Core Modules

1. **Dashboard** - Real-time analytics with KPI cards, attendance trends, class distribution, and activity feed
2. **Admissions Management** - Handle student applications, review process, and enrollment workflow
3. **Student Management** - Complete student records with profiles, guardians, attendance, fees, and exams
4. **Teachers & Staff Management** - Manage teaching and non-teaching staff with roles and assignments
5. **Classes & Sections** - Academic structure management with capacity tracking
6. **Attendance Management** - Daily attendance marking with calendar view and reporting
7. **Fees & Finance** - Invoice generation, payment tracking, and financial reporting
8. **Exams & Results** - Exam scheduling, marks entry, and report card generation
9. **Announcements** - School-wide notifications and communication
10. **Settings** - School profile, academic year, and system configuration

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Email/Password)
- **Local Storage**: IndexedDB (for documents and files)
- **Charts**: Recharts
- **Routing**: React Router v6
- **Forms**: Zod validation
- **Notifications**: React Toastify
- **PDF Generation**: jsPDF
- **Excel Export**: XLSX
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (already configured)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Environment variables are pre-configured in `.env`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. The database schema is already created with all tables and Row Level Security policies.

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

## Database Schema

### Tables

- **users** - Admin user accounts with authentication
- **students** - Student records with personal and academic information
- **guardians** - Parent/guardian information linked to students
- **teachers** - Teaching and non-teaching staff records
- **classes** - Academic classes and sections
- **attendance** - Daily attendance records
- **fee_structures** - Fee plan templates
- **invoices** - Student fee invoices
- **payments** - Payment records
- **exams** - Exam definitions
- **marks** - Student exam results
- **files_metadata** - Metadata for files stored in IndexedDB
- **announcements** - School announcements
- **activity_logs** - Audit trail for all actions
- **settings** - System configuration

### Security

All tables have Row Level Security (RLS) enabled with authenticated-user-only access policies.

## File Storage

Files (student photos, documents, certificates, etc.) are stored locally in **IndexedDB** with the following stores:

- `student_documents` - Student-related files
- `staff_documents` - Staff-related files
- `temp_uploads` - Temporary uploads before assignment

Metadata is synced to Supabase's `files_metadata` table for tracking and search.

## Authentication

The system uses **Supabase Auth** with email/password authentication:

1. Admin logs in with email and password
2. Session is persisted and auto-refreshed
3. Protected routes require authentication
4. Sign out clears session and redirects to login

### First-Time Setup

To create the first admin user, use Supabase Dashboard:

1. Go to Authentication > Users
2. Click "Add User"
3. Enter email and password
4. The user will be able to log in

Alternatively, you can use Supabase SQL Editor:

```sql
-- This will be handled by Supabase Auth signup
```

## Design Principles

- **Clean & Professional**: Soft colors (blues, greens, grays), no purple/indigo
- **Responsive**: Works on desktop, tablet, and mobile
- **User-Friendly**: Clear navigation, intuitive workflows
- **Performance**: Optimized queries, lazy loading, pagination
- **Accessibility**: Semantic HTML, proper labels, keyboard navigation
- **Data Safety**: RLS policies, validation, audit logs

## Key Features by Module

### Dashboard
- Total students, teachers, fees collected/pending
- Attendance trend chart (7 days)
- Class distribution bar chart
- Gender distribution pie chart
- Recent activity feed

### Admissions
- Application submission form
- Status workflow: New → Under Review → Accepted → Enrolled/Rejected
- Convert application to student with auto-generated ID
- Deduplication checks
- Document upload support

### Students
- Comprehensive student profiles
- Guardian management
- Academic history tracking
- Fee balance and payment history
- Attendance percentage
- Exam results and report cards

### Teachers
- Staff records with role assignment
- Subject and class assignments
- Qualification tracking
- Document management

### Classes
- Class and section management
- Capacity tracking
- Class teacher assignment
- Subject configuration

### Attendance
- Date and class selection
- Quick mark all present/absent
- Individual status marking
- Edit previous attendance
- Monthly reports
- Attendance percentage calculation

### Fees
- Fee structure templates
- Invoice generation (single/batch)
- Payment recording with multiple modes
- Receipt generation (PDF)
- Outstanding balance tracking
- Payment history

### Exams
- Exam creation with date ranges
- Subject and class assignment
- Marks entry grid
- Grade calculation
- Report card generation
- Performance analytics

### Announcements
- Create announcements with priority
- Target specific audience (all/class/teachers)
- Real-time notification badges
- Announcement history

### Settings
- School profile (name, address, contact)
- Academic year configuration
- Fee settings (late fee rules)
- Attendance thresholds
- Grade scale configuration

## Future Enhancements

- Advanced reporting with PDF export
- SMS/Email notifications
- Bulk operations (CSV import/export)
- Timetable management
- Library management
- Transport management
- Hostel management
- Payroll integration
- Multi-language support
- Dark mode
- Advanced analytics dashboard
- Parent portal (separate login)
- Teacher portal (limited access)

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── Layout.tsx       # Main layout with sidebar
│   └── ProtectedRoute.tsx
├── contexts/            # React contexts
│   └── AuthContext.tsx  # Authentication state
├── lib/                 # Utilities and services
│   ├── supabase.ts      # Supabase client
│   ├── database.types.ts # TypeScript types
│   └── indexeddb.ts     # IndexedDB service
├── pages/               # Page components
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── Admissions.tsx
│   ├── Students.tsx
│   ├── Teachers.tsx
│   ├── Classes.tsx
│   ├── Attendance.tsx
│   ├── Fees.tsx
│   ├── Exams.tsx
│   ├── Announcements.tsx
│   └── Settings.tsx
├── App.tsx              # Main app with routing
└── main.tsx             # Entry point
```

## Contributing

This is a production-ready system. For modifications:

1. Follow existing code patterns
2. Maintain TypeScript types
3. Test database queries
4. Update documentation
5. Ensure RLS policies are secure

## License

Proprietary - School Administration System

## Support

For issues or questions, contact your system administrator.
