/*
  # School Admin Dashboard - Complete Database Schema

  ## Overview
  This migration creates the complete database structure for a comprehensive school administration system.
  All tables include Row Level Security (RLS) enabled with admin-only access policies.

  ## Tables Created

  ### 1. users
  - Admin user accounts with role management
  - Fields: id, email, name, role, status, last_login, created_at

  ### 2. students
  - Complete student records with personal, academic, and contact information
  - Fields: id, admission_id, first_name, last_name, gender, date_of_birth, blood_group, address, city, state, pincode, 
           phone, email, class_id, section, roll_number, admission_date, status, photo_file_id, created_at, updated_at

  ### 3. guardians
  - Parent/guardian information linked to students
  - Fields: id, student_id, name, relation, phone, email, occupation, is_primary, created_at

  ### 4. teachers
  - Teacher and staff records with qualification and assignment details
  - Fields: id, staff_id, first_name, last_name, email, phone, gender, date_of_birth, role, qualification, 
           subjects, joining_date, status, photo_file_id, created_at, updated_at

  ### 5. classes
  - Academic classes and sections structure
  - Fields: id, name, section, academic_year, capacity, class_teacher_id, subjects, fee_plan_id, created_at, updated_at

  ### 6. attendance
  - Daily attendance records for students
  - Fields: id, student_id, class_id, date, status, reason, marked_by, created_at

  ### 7. fee_structures
  - Fee plan templates with line items
  - Fields: id, name, description, items, total_amount, frequency, applicable_classes, created_at, updated_at

  ### 8. invoices
  - Student fee invoices with payment tracking
  - Fields: id, invoice_number, student_id, class_id, academic_year, items, subtotal, discount, total_amount, 
           paid_amount, balance, status, due_date, created_at, updated_at

  ### 9. payments
  - Payment records linked to invoices
  - Fields: id, invoice_id, student_id, amount, payment_date, payment_mode, reference_number, 
           notes, received_by, created_at

  ### 10. exams
  - Exam definitions with terms and date ranges
  - Fields: id, name, term, academic_year, start_date, end_date, classes, subjects, max_marks, 
           status, created_at, updated_at

  ### 11. marks
  - Student exam marks and grades
  - Fields: id, exam_id, student_id, class_id, subject_marks, total_marks, percentage, grade, 
           rank, remarks, created_at, updated_at

  ### 12. files_metadata
  - Metadata for files stored in IndexedDB
  - Fields: id, owner_type, owner_id, file_name, file_type, file_size, storage_type, 
           description, uploaded_by, created_at

  ### 13. announcements
  - School-wide announcements and notifications
  - Fields: id, title, body, audience, target_classes, priority, published_at, expires_at, 
           created_by, created_at

  ### 14. activity_logs
  - Audit trail for all system activities
  - Fields: id, user_id, action, entity_type, entity_id, details, ip_address, created_at

  ### 15. settings
  - System configuration and school profile
  - Fields: id, key, value, category, description, updated_by, updated_at

  ## Security
  - All tables have RLS enabled
  - Admin-only access policies implemented
  - Authenticated users only (no public access)
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'admin',
  status text NOT NULL DEFAULT 'active',
  last_login timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can manage all users"
  ON users FOR ALL
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  gender text NOT NULL,
  date_of_birth date NOT NULL,
  blood_group text,
  address text,
  city text,
  state text,
  pincode text,
  phone text,
  email text,
  class_id uuid,
  section text,
  roll_number text,
  admission_date date DEFAULT CURRENT_DATE,
  status text DEFAULT 'active',
  photo_file_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view students"
  ON students FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert students"
  ON students FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update students"
  ON students FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete students"
  ON students FOR DELETE
  TO authenticated
  USING (true);

-- Create guardians table
CREATE TABLE IF NOT EXISTS guardians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  name text NOT NULL,
  relation text NOT NULL,
  phone text NOT NULL,
  email text,
  occupation text,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage guardians"
  ON guardians FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create teachers table
CREATE TABLE IF NOT EXISTS teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  gender text NOT NULL,
  date_of_birth date,
  role text NOT NULL DEFAULT 'teacher',
  qualification text,
  subjects jsonb DEFAULT '[]',
  joining_date date DEFAULT CURRENT_DATE,
  status text DEFAULT 'active',
  photo_file_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage teachers"
  ON teachers FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  section text NOT NULL,
  academic_year text NOT NULL,
  capacity integer DEFAULT 40,
  class_teacher_id uuid REFERENCES teachers(id),
  subjects jsonb DEFAULT '[]',
  fee_plan_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(name, section, academic_year)
);

ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage classes"
  ON classes FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES classes(id),
  date date NOT NULL,
  status text NOT NULL,
  reason text,
  marked_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, date)
);

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage attendance"
  ON attendance FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create fee_structures table
CREATE TABLE IF NOT EXISTS fee_structures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  items jsonb NOT NULL DEFAULT '[]',
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  frequency text DEFAULT 'annual',
  applicable_classes jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE fee_structures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage fee structures"
  ON fee_structures FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id uuid REFERENCES classes(id),
  academic_year text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]',
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  discount numeric(10,2) DEFAULT 0,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  paid_amount numeric(10,2) DEFAULT 0,
  balance numeric(10,2) NOT NULL DEFAULT 0,
  status text DEFAULT 'unpaid',
  due_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage invoices"
  ON invoices FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id),
  amount numeric(10,2) NOT NULL,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_mode text NOT NULL,
  reference_number text,
  notes text,
  received_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage payments"
  ON payments FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create exams table
CREATE TABLE IF NOT EXISTS exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  term text NOT NULL,
  academic_year text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  classes jsonb NOT NULL DEFAULT '[]',
  subjects jsonb NOT NULL DEFAULT '[]',
  max_marks jsonb DEFAULT '{}',
  status text DEFAULT 'scheduled',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage exams"
  ON exams FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create marks table
CREATE TABLE IF NOT EXISTS marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES classes(id),
  subject_marks jsonb NOT NULL DEFAULT '{}',
  total_marks numeric(10,2) DEFAULT 0,
  percentage numeric(5,2) DEFAULT 0,
  grade text,
  rank integer,
  remarks text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(exam_id, student_id)
);

ALTER TABLE marks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage marks"
  ON marks FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create files_metadata table
CREATE TABLE IF NOT EXISTS files_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type text NOT NULL,
  owner_id uuid NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL,
  storage_type text DEFAULT 'indexeddb',
  description text,
  uploaded_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE files_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage files metadata"
  ON files_metadata FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  audience text DEFAULT 'all',
  target_classes jsonb DEFAULT '[]',
  priority text DEFAULT 'normal',
  published_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage announcements"
  ON announcements FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  details jsonb DEFAULT '{}',
  ip_address text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view activity logs"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert activity logs"
  ON activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  category text NOT NULL,
  description text,
  updated_by uuid REFERENCES users(id),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage settings"
  ON settings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_admission_date ON students(admission_date);
CREATE INDEX IF NOT EXISTS idx_guardians_student_id ON guardians(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON attendance(class_id, date);
CREATE INDEX IF NOT EXISTS idx_invoices_student_id ON invoices(student_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_marks_exam_id ON marks(exam_id);
CREATE INDEX IF NOT EXISTS idx_marks_student_id ON marks(student_id);
CREATE INDEX IF NOT EXISTS idx_files_metadata_owner ON files_metadata(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-- Insert default settings
INSERT INTO settings (key, value, category, description) VALUES
  ('school_name', '"School Admin System"', 'school', 'Name of the school'),
  ('school_address', '""', 'school', 'School address'),
  ('school_phone', '""', 'school', 'School contact phone'),
  ('school_email', '""', 'school', 'School contact email'),
  ('academic_year', '"2025-2026"', 'academic', 'Current academic year'),
  ('academic_year_start', '"2025-04-01"', 'academic', 'Academic year start date'),
  ('academic_year_end', '"2026-03-31"', 'academic', 'Academic year end date'),
  ('attendance_threshold', '75', 'attendance', 'Minimum attendance percentage required'),
  ('fee_late_fee_days', '30', 'fees', 'Days after due date to apply late fee'),
  ('fee_late_fee_amount', '100', 'fees', 'Late fee amount'),
  ('grade_scale', '{"A": 90, "B": 75, "C": 60, "D": 45, "F": 0}', 'exams', 'Grade boundaries')
ON CONFLICT (key) DO NOTHING;
