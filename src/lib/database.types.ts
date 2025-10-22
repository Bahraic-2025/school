export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: string
          status: string
          last_login: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          role?: string
          status?: string
          last_login?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: string
          status?: string
          last_login?: string | null
          created_at?: string
        }
      }
      students: {
        Row: {
          id: string
          admission_id: string
          first_name: string
          last_name: string
          gender: string
          date_of_birth: string
          blood_group: string | null
          address: string | null
          city: string | null
          state: string | null
          pincode: string | null
          phone: string | null
          email: string | null
          class_id: string | null
          section: string | null
          roll_number: string | null
          admission_date: string
          status: string
          photo_file_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          admission_id: string
          first_name: string
          last_name: string
          gender: string
          date_of_birth: string
          blood_group?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          pincode?: string | null
          phone?: string | null
          email?: string | null
          class_id?: string | null
          section?: string | null
          roll_number?: string | null
          admission_date?: string
          status?: string
          photo_file_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          admission_id?: string
          first_name?: string
          last_name?: string
          gender?: string
          date_of_birth?: string
          blood_group?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          pincode?: string | null
          phone?: string | null
          email?: string | null
          class_id?: string | null
          section?: string | null
          roll_number?: string | null
          admission_date?: string
          status?: string
          photo_file_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      guardians: {
        Row: {
          id: string
          student_id: string
          name: string
          relation: string
          phone: string
          email: string | null
          occupation: string | null
          is_primary: boolean
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          name: string
          relation: string
          phone: string
          email?: string | null
          occupation?: string | null
          is_primary?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          name?: string
          relation?: string
          phone?: string
          email?: string | null
          occupation?: string | null
          is_primary?: boolean
          created_at?: string
        }
      }
      teachers: {
        Row: {
          id: string
          staff_id: string
          first_name: string
          last_name: string
          email: string
          phone: string
          gender: string
          date_of_birth: string | null
          role: string
          qualification: string | null
          subjects: Json
          joining_date: string
          status: string
          photo_file_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          staff_id: string
          first_name: string
          last_name: string
          email: string
          phone: string
          gender: string
          date_of_birth?: string | null
          role?: string
          qualification?: string | null
          subjects?: Json
          joining_date?: string
          status?: string
          photo_file_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          staff_id?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string
          gender?: string
          date_of_birth?: string | null
          role?: string
          qualification?: string | null
          subjects?: Json
          joining_date?: string
          status?: string
          photo_file_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      classes: {
        Row: {
          id: string
          name: string
          section: string
          academic_year: string
          capacity: number
          class_teacher_id: string | null
          subjects: Json
          fee_plan_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          section: string
          academic_year: string
          capacity?: number
          class_teacher_id?: string | null
          subjects?: Json
          fee_plan_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          section?: string
          academic_year?: string
          capacity?: number
          class_teacher_id?: string | null
          subjects?: Json
          fee_plan_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      attendance: {
        Row: {
          id: string
          student_id: string
          class_id: string
          date: string
          status: string
          reason: string | null
          marked_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          class_id: string
          date: string
          status: string
          reason?: string | null
          marked_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          class_id?: string
          date?: string
          status?: string
          reason?: string | null
          marked_by?: string | null
          created_at?: string
        }
      }
      fee_structures: {
        Row: {
          id: string
          name: string
          description: string | null
          items: Json
          total_amount: number
          frequency: string
          applicable_classes: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          items?: Json
          total_amount?: number
          frequency?: string
          applicable_classes?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          items?: Json
          total_amount?: number
          frequency?: string
          applicable_classes?: Json
          created_at?: string
          updated_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          invoice_number: string
          student_id: string
          class_id: string | null
          academic_year: string
          items: Json
          subtotal: number
          discount: number
          total_amount: number
          paid_amount: number
          balance: number
          status: string
          due_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          invoice_number: string
          student_id: string
          class_id?: string | null
          academic_year: string
          items?: Json
          subtotal?: number
          discount?: number
          total_amount?: number
          paid_amount?: number
          balance?: number
          status?: string
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          invoice_number?: string
          student_id?: string
          class_id?: string | null
          academic_year?: string
          items?: Json
          subtotal?: number
          discount?: number
          total_amount?: number
          paid_amount?: number
          balance?: number
          status?: string
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          invoice_id: string
          student_id: string
          amount: number
          payment_date: string
          payment_mode: string
          reference_number: string | null
          notes: string | null
          received_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          student_id: string
          amount: number
          payment_date?: string
          payment_mode: string
          reference_number?: string | null
          notes?: string | null
          received_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string
          student_id?: string
          amount?: number
          payment_date?: string
          payment_mode?: string
          reference_number?: string | null
          notes?: string | null
          received_by?: string | null
          created_at?: string
        }
      }
      exams: {
        Row: {
          id: string
          name: string
          term: string
          academic_year: string
          start_date: string
          end_date: string
          classes: Json
          subjects: Json
          max_marks: Json
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          term: string
          academic_year: string
          start_date: string
          end_date: string
          classes?: Json
          subjects?: Json
          max_marks?: Json
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          term?: string
          academic_year?: string
          start_date?: string
          end_date?: string
          classes?: Json
          subjects?: Json
          max_marks?: Json
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      marks: {
        Row: {
          id: string
          exam_id: string
          student_id: string
          class_id: string
          subject_marks: Json
          total_marks: number
          percentage: number
          grade: string | null
          rank: number | null
          remarks: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          exam_id: string
          student_id: string
          class_id: string
          subject_marks?: Json
          total_marks?: number
          percentage?: number
          grade?: string | null
          rank?: number | null
          remarks?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          exam_id?: string
          student_id?: string
          class_id?: string
          subject_marks?: Json
          total_marks?: number
          percentage?: number
          grade?: string | null
          rank?: number | null
          remarks?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      files_metadata: {
        Row: {
          id: string
          owner_type: string
          owner_id: string
          file_name: string
          file_type: string
          file_size: number
          storage_type: string
          description: string | null
          uploaded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          owner_type: string
          owner_id: string
          file_name: string
          file_type: string
          file_size: number
          storage_type?: string
          description?: string | null
          uploaded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          owner_type?: string
          owner_id?: string
          file_name?: string
          file_type?: string
          file_size?: number
          storage_type?: string
          description?: string | null
          uploaded_by?: string | null
          created_at?: string
        }
      }
      announcements: {
        Row: {
          id: string
          title: string
          body: string
          audience: string
          target_classes: Json
          priority: string
          published_at: string
          expires_at: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          body: string
          audience?: string
          target_classes?: Json
          priority?: string
          published_at?: string
          expires_at?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          body?: string
          audience?: string
          target_classes?: Json
          priority?: string
          published_at?: string
          expires_at?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          entity_type: string
          entity_id: string | null
          details: Json
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          entity_type: string
          entity_id?: string | null
          details?: Json
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          entity_type?: string
          entity_id?: string | null
          details?: Json
          ip_address?: string | null
          created_at?: string
        }
      }
      settings: {
        Row: {
          id: string
          key: string
          value: Json
          category: string
          description: string | null
          updated_by: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: Json
          category: string
          description?: string | null
          updated_by?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: Json
          category?: string
          description?: string | null
          updated_by?: string | null
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
