import { Teacher } from '../lib/firestore.types';
import { IDatabase } from './database/IDatabase';
import { firestoreDb } from './database/FirestoreAdapter';

export interface CreateTeacherData {
  staff_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  gender: string;
  date_of_birth?: string;
  role: string;
  qualification?: string;
  subjects: string[];
  joining_date: string;
  status: string;
  photo_file_id?: string;
}

export interface UpdateTeacherData extends Partial<CreateTeacherData> {}

export interface TeacherFilters {
  status?: string;
  role?: string;
  subject?: string;
  search?: string;
}

export interface TeacherAssignment {
  teacher_id: string;
  class_id: string;
  subject: string;
  is_class_teacher: boolean;
}

export class TeacherService {
  constructor(private db: IDatabase = firestoreDb) {}

  async getTeacher(id: string): Promise<Teacher | null> {
    return this.db.get<Teacher>('teachers', id);
  }

  async listTeachers(filters: TeacherFilters = {}): Promise<Teacher[]> {
    const where = [];

    if (filters.status) {
      where.push({
        field: 'status',
        operator: '==' as const,
        value: filters.status,
      });
    }

    if (filters.role) {
      where.push({
        field: 'role',
        operator: '==' as const,
        value: filters.role,
      });
    }

    const teachers = await this.db.query<Teacher>('teachers', {
      where,
      orderBy: [{ field: 'first_name', direction: 'asc' }],
    });

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return teachers.filter(
        (t) =>
          t.first_name.toLowerCase().includes(searchLower) ||
          t.last_name.toLowerCase().includes(searchLower) ||
          t.staff_id.toLowerCase().includes(searchLower) ||
          t.email.toLowerCase().includes(searchLower)
      );
    }

    if (filters.subject) {
      return teachers.filter((t) => t.subjects.includes(filters.subject!));
    }

    return teachers;
  }

  async createTeacher(data: CreateTeacherData): Promise<string> {
    const exists = await this.checkStaffIdExists(data.staff_id);
    if (exists) {
      throw new Error('Staff ID already exists');
    }

    const emailExists = await this.checkEmailExists(data.email);
    if (emailExists) {
      throw new Error('Email already exists');
    }

    return this.db.create<Teacher>('teachers', data as Omit<Teacher, 'id'>);
  }

  async updateTeacher(id: string, data: UpdateTeacherData): Promise<void> {
    const teacher = await this.getTeacher(id);
    if (!teacher) {
      throw new Error('Teacher not found');
    }

    if (data.staff_id && data.staff_id !== teacher.staff_id) {
      const exists = await this.checkStaffIdExists(data.staff_id);
      if (exists) {
        throw new Error('Staff ID already exists');
      }
    }

    if (data.email && data.email !== teacher.email) {
      const exists = await this.checkEmailExists(data.email);
      if (exists) {
        throw new Error('Email already exists');
      }
    }

    await this.db.update('teachers', id, data);
  }

  async deleteTeacher(id: string): Promise<void> {
    await this.db.delete('teachers', id);
  }

  async archiveTeacher(id: string): Promise<void> {
    await this.updateTeacher(id, { status: 'inactive' });
  }

  async assignSubject(teacherId: string, subject: string): Promise<void> {
    const teacher = await this.getTeacher(teacherId);
    if (!teacher) {
      throw new Error('Teacher not found');
    }

    if (!teacher.subjects.includes(subject)) {
      const subjects = [...teacher.subjects, subject];
      await this.updateTeacher(teacherId, { subjects });
    }
  }

  async removeSubject(teacherId: string, subject: string): Promise<void> {
    const teacher = await this.getTeacher(teacherId);
    if (!teacher) {
      throw new Error('Teacher not found');
    }

    const subjects = teacher.subjects.filter((s) => s !== subject);
    await this.updateTeacher(teacherId, { subjects });
  }

  async assignClassTeacher(teacherId: string, classId: string): Promise<void> {
    const existingTeacher = await this.db.query('classes', {
      where: [{ field: 'class_teacher_id', operator: '==', value: teacherId }],
      limit: 1,
    });

    await this.db.update('classes', classId, {
      class_teacher_id: teacherId,
    });
  }

  async getTeacherClasses(teacherId: string): Promise<any[]> {
    return this.db.query('classes', {
      where: [{ field: 'class_teacher_id', operator: '==', value: teacherId }],
    });
  }

  async bulkCreate(teachers: CreateTeacherData[]): Promise<void> {
    const operations = teachers.map((teacher) => ({
      type: 'create' as const,
      collection: 'teachers',
      data: teacher,
    }));

    for (let i = 0; i < operations.length; i += 500) {
      const batch = operations.slice(i, i + 500);
      await this.db.batch(batch);
    }
  }

  async markLeave(
    teacherId: string,
    startDate: string,
    endDate: string,
    reason: string
  ): Promise<string> {
    return this.db.create('teacher_leaves', {
      teacher_id: teacherId,
      start_date: startDate,
      end_date: endDate,
      reason,
      status: 'pending',
    });
  }

  async getTeacherLeaves(teacherId: string): Promise<any[]> {
    return this.db.query('teacher_leaves', {
      where: [{ field: 'teacher_id', operator: '==', value: teacherId }],
      orderBy: [{ field: 'start_date', direction: 'desc' }],
    });
  }

  private async checkStaffIdExists(staffId: string): Promise<boolean> {
    const results = await this.db.query<Teacher>('teachers', {
      where: [{ field: 'staff_id', operator: '==', value: staffId }],
      limit: 1,
    });
    return results.length > 0;
  }

  private async checkEmailExists(email: string): Promise<boolean> {
    const results = await this.db.query<Teacher>('teachers', {
      where: [{ field: 'email', operator: '==', value: email }],
      limit: 1,
    });
    return results.length > 0;
  }

  watchTeacher(id: string, callback: (teacher: Teacher | null) => void): () => void {
    return this.db.onSnapshot<Teacher>('teachers', id, callback);
  }

  watchTeachers(
    filters: TeacherFilters,
    callback: (teachers: Teacher[]) => void
  ): () => void {
    const where = [];

    if (filters.status) {
      where.push({
        field: 'status',
        operator: '==' as const,
        value: filters.status,
      });
    }

    return this.db.onQuerySnapshot<Teacher>(
      'teachers',
      {
        where,
        orderBy: [{ field: 'first_name', direction: 'asc' }],
      },
      callback
    );
  }
}

export const teacherService = new TeacherService();
