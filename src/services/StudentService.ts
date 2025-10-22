import { Student, Guardian } from '../lib/firestore.types';
import { IDatabase } from './database/IDatabase';
import { firestoreDb } from './database/FirestoreAdapter';

export interface CreateStudentData {
  admission_id: string;
  first_name: string;
  last_name: string;
  gender: string;
  date_of_birth: string;
  blood_group?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  class_id?: string;
  section?: string;
  roll_number?: string;
  admission_date: string;
  status: string;
  photo_file_id?: string;
}

export interface UpdateStudentData extends Partial<CreateStudentData> {}

export interface StudentFilters {
  status?: string;
  class_id?: string;
  section?: string;
  search?: string;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
  lastDoc?: any;
}

export class StudentService {
  constructor(private db: IDatabase = firestoreDb) {}

  async getStudent(id: string): Promise<Student | null> {
    return this.db.get<Student>('students', id);
  }

  async listStudents(
    filters: StudentFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<Student[]> {
    const where = [];

    if (filters.status) {
      where.push({
        field: 'status',
        operator: '==' as const,
        value: filters.status,
      });
    }

    if (filters.class_id) {
      where.push({
        field: 'class_id',
        operator: '==' as const,
        value: filters.class_id,
      });
    }

    if (filters.section) {
      where.push({
        field: 'section',
        operator: '==' as const,
        value: filters.section,
      });
    }

    const students = await this.db.query<Student>('students', {
      where,
      orderBy: [{ field: 'first_name', direction: 'asc' }],
      limit: pagination.limit || 50,
      startAfter: pagination.lastDoc,
    });

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return students.filter(
        (s) =>
          s.first_name.toLowerCase().includes(searchLower) ||
          s.last_name.toLowerCase().includes(searchLower) ||
          s.admission_id.toLowerCase().includes(searchLower) ||
          s.phone?.toLowerCase().includes(searchLower) ||
          s.email?.toLowerCase().includes(searchLower)
      );
    }

    return students;
  }

  async createStudent(data: CreateStudentData): Promise<string> {
    const exists = await this.checkAdmissionIdExists(data.admission_id);
    if (exists) {
      throw new Error('Admission ID already exists');
    }

    return this.db.create<Student>('students', data as Omit<Student, 'id'>);
  }

  async updateStudent(id: string, data: UpdateStudentData): Promise<void> {
    const student = await this.getStudent(id);
    if (!student) {
      throw new Error('Student not found');
    }

    if (data.admission_id && data.admission_id !== student.admission_id) {
      const exists = await this.checkAdmissionIdExists(data.admission_id);
      if (exists) {
        throw new Error('Admission ID already exists');
      }
    }

    await this.db.update('students', id, data);
  }

  async deleteStudent(id: string): Promise<void> {
    await this.db.delete('students', id);
  }

  async archiveStudent(id: string): Promise<void> {
    await this.updateStudent(id, { status: 'inactive' });
  }

  async promoteStudent(id: string, newClassId: string, newSection: string): Promise<void> {
    await this.updateStudent(id, {
      class_id: newClassId,
      section: newSection,
    });
  }

  async bulkCreate(students: CreateStudentData[]): Promise<string[]> {
    const ids: string[] = [];

    const operations = students.map((student) => ({
      type: 'create' as const,
      collection: 'students',
      data: student,
    }));

    for (let i = 0; i < operations.length; i += 500) {
      const batch = operations.slice(i, i + 500);
      await this.db.batch(batch);
    }

    return ids;
  }

  async findDuplicates(): Promise<{ [key: string]: Student[] }> {
    const allStudents = await this.db.query<Student>('students', {
      where: [{ field: 'status', operator: '==', value: 'active' }],
    });

    const duplicates: { [key: string]: Student[] } = {};

    const phoneMap: { [key: string]: Student[] } = {};
    const emailMap: { [key: string]: Student[] } = {};
    const nameMap: { [key: string]: Student[] } = {};

    allStudents.forEach((student) => {
      if (student.phone) {
        if (!phoneMap[student.phone]) phoneMap[student.phone] = [];
        phoneMap[student.phone].push(student);
      }

      if (student.email) {
        if (!emailMap[student.email]) emailMap[student.email] = [];
        emailMap[student.email].push(student);
      }

      const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
      if (!nameMap[fullName]) nameMap[fullName] = [];
      nameMap[fullName].push(student);
    });

    Object.entries(phoneMap).forEach(([phone, students]) => {
      if (students.length > 1) {
        duplicates[`phone:${phone}`] = students;
      }
    });

    Object.entries(emailMap).forEach(([email, students]) => {
      if (students.length > 1) {
        duplicates[`email:${email}`] = students;
      }
    });

    Object.entries(nameMap).forEach(([name, students]) => {
      if (students.length > 1) {
        duplicates[`name:${name}`] = students;
      }
    });

    return duplicates;
  }

  async mergeStudents(primaryId: string, duplicateIds: string[]): Promise<void> {
    const primary = await this.getStudent(primaryId);
    if (!primary) {
      throw new Error('Primary student not found');
    }

    await this.db.transaction(async (txn) => {
      for (const dupId of duplicateIds) {
        const dup = await txn.get<Student>('students', dupId);
        if (dup) {
          const merged = {
            phone: primary.phone || dup.phone,
            email: primary.email || dup.email,
            address: primary.address || dup.address,
            blood_group: primary.blood_group || dup.blood_group,
          };
          txn.update('students', primaryId, merged);

          txn.update('students', dupId, { status: 'merged' });
        }
      }
    });
  }

  async addGuardian(studentId: string, guardianData: Omit<Guardian, 'id' | 'student_id' | 'created_at'>): Promise<string> {
    return this.db.create<Guardian>('guardians', {
      ...guardianData,
      student_id: studentId,
    } as Omit<Guardian, 'id'>);
  }

  async getStudentGuardians(studentId: string): Promise<Guardian[]> {
    return this.db.query<Guardian>('guardians', {
      where: [{ field: 'student_id', operator: '==', value: studentId }],
      orderBy: [{ field: 'is_primary', direction: 'desc' }],
    });
  }

  async deleteGuardian(guardianId: string): Promise<void> {
    await this.db.delete('guardians', guardianId);
  }

  private async checkAdmissionIdExists(admissionId: string): Promise<boolean> {
    const results = await this.db.query<Student>('students', {
      where: [{ field: 'admission_id', operator: '==', value: admissionId }],
      limit: 1,
    });
    return results.length > 0;
  }

  watchStudent(id: string, callback: (student: Student | null) => void): () => void {
    return this.db.onSnapshot<Student>('students', id, callback);
  }

  watchStudents(
    filters: StudentFilters,
    callback: (students: Student[]) => void
  ): () => void {
    const where = [];

    if (filters.status) {
      where.push({
        field: 'status',
        operator: '==' as const,
        value: filters.status,
      });
    }

    if (filters.class_id) {
      where.push({
        field: 'class_id',
        operator: '==' as const,
        value: filters.class_id,
      });
    }

    return this.db.onQuerySnapshot<Student>(
      'students',
      {
        where,
        orderBy: [{ field: 'first_name', direction: 'asc' }],
        limit: 50,
      },
      callback
    );
  }
}

export const studentService = new StudentService();
