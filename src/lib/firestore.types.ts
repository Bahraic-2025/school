import { Timestamp } from 'firebase/firestore';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  last_login: Timestamp | null;
  created_at: Timestamp;
}

export interface Student {
  id: string;
  admission_id: string;
  first_name: string;
  last_name: string;
  gender: string;
  date_of_birth: string;
  blood_group: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  phone: string | null;
  email: string | null;
  class_id: string | null;
  section: string | null;
  roll_number: string | null;
  admission_date: string;
  status: string;
  photo_file_id: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Guardian {
  id: string;
  student_id: string;
  name: string;
  relation: string;
  phone: string;
  email: string | null;
  occupation: string | null;
  is_primary: boolean;
  created_at: Timestamp;
}

export interface Teacher {
  id: string;
  staff_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  gender: string;
  date_of_birth: string | null;
  role: string;
  qualification: string | null;
  subjects: string[];
  joining_date: string;
  status: string;
  photo_file_id: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Class {
  id: string;
  name: string;
  section: string;
  academic_year: string;
  capacity: number;
  class_teacher_id: string | null;
  subjects: string[];
  fee_plan_id: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Attendance {
  id: string;
  student_id: string;
  class_id: string;
  date: string;
  status: string;
  reason: string | null;
  marked_by: string | null;
  created_at: Timestamp;
}

export interface FeeStructure {
  id: string;
  name: string;
  description: string | null;
  items: Array<{ name: string; amount: number }>;
  total_amount: number;
  frequency: string;
  applicable_classes: string[];
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  student_id: string;
  class_id: string | null;
  academic_year: string;
  items: Array<{ name: string; amount: number }>;
  subtotal: number;
  discount: number;
  total_amount: number;
  paid_amount: number;
  balance: number;
  status: string;
  due_date: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Payment {
  id: string;
  invoice_id: string;
  student_id: string;
  amount: number;
  payment_date: string;
  payment_mode: string;
  reference_number: string | null;
  notes: string | null;
  received_by: string | null;
  created_at: Timestamp;
}

export interface Exam {
  id: string;
  name: string;
  term: string;
  academic_year: string;
  start_date: string;
  end_date: string;
  classes: string[];
  subjects: string[];
  max_marks: Record<string, number>;
  status: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Marks {
  id: string;
  exam_id: string;
  student_id: string;
  class_id: string;
  subject_marks: Record<string, number>;
  total_marks: number;
  percentage: number;
  grade: string | null;
  rank: number | null;
  remarks: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface FileMetadata {
  id: string;
  owner_type: string;
  owner_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_type: string;
  description: string | null;
  uploaded_by: string | null;
  created_at: Timestamp;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: string;
  target_classes: string[];
  priority: string;
  published_at: string;
  expires_at: string | null;
  created_by: string | null;
  created_at: Timestamp;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, any>;
  ip_address: string | null;
  created_at: Timestamp;
}

export interface Settings {
  id: string;
  key: string;
  value: any;
  category: string;
  description: string | null;
  updated_by: string | null;
  updated_at: Timestamp;
}
