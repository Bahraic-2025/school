import { IAnalyticsDatabase } from '../database/IAnalyticsDatabase';
import { startOfDay, endOfDay, format, subDays, eachDayOfInterval } from 'date-fns';

export interface AttendanceAggregate {
  date: string;
  total_students: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendance_rate: number;
}

export class AttendanceAggregator {
  constructor(private db: IAnalyticsDatabase) {}

  async aggregateDailyAttendance(date: string): Promise<AttendanceAggregate> {
    const attendance = await this.db.query('attendance', [
      { field: 'date', operator: '==', value: date },
    ]);

    const stats = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
    };

    attendance.forEach((record: any) => {
      const status = record.status.toUpperCase();
      if (status === 'P' || status === 'PRESENT') stats.present++;
      else if (status === 'A' || status === 'ABSENT') stats.absent++;
      else if (status === 'L' || status === 'LATE') stats.late++;
      else if (status === 'E' || status === 'EXCUSED') stats.excused++;
    });

    const total = stats.present + stats.absent + stats.late + stats.excused;
    const attendanceRate = total > 0 ? (stats.present / total) * 100 : 0;

    return {
      date,
      total_students: total,
      present: stats.present,
      absent: stats.absent,
      late: stats.late,
      excused: stats.excused,
      attendance_rate: Math.round(attendanceRate * 100) / 100,
    };
  }

  async aggregateClassAttendance(
    classId: string,
    startDate: string,
    endDate: string
  ): Promise<AttendanceAggregate[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = eachDayOfInterval({ start, end });

    const results: AttendanceAggregate[] = [];

    for (const day of days) {
      const dateStr = format(day, 'yyyy-MM-dd');
      const attendance = await this.db.query('attendance', [
        { field: 'class_id', operator: '==', value: classId },
        { field: 'date', operator: '==', value: dateStr },
      ]);

      const stats = {
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
      };

      attendance.forEach((record: any) => {
        const status = record.status.toUpperCase();
        if (status === 'P' || status === 'PRESENT') stats.present++;
        else if (status === 'A' || status === 'ABSENT') stats.absent++;
        else if (status === 'L' || status === 'LATE') stats.late++;
        else if (status === 'E' || status === 'EXCUSED') stats.excused++;
      });

      const total = stats.present + stats.absent + stats.late + stats.excused;
      const attendanceRate = total > 0 ? (stats.present / total) * 100 : 0;

      results.push({
        date: dateStr,
        total_students: total,
        present: stats.present,
        absent: stats.absent,
        late: stats.late,
        excused: stats.excused,
        attendance_rate: Math.round(attendanceRate * 100) / 100,
      });
    }

    return results;
  }

  async savePrecomputedAttendance(
    date: string,
    aggregate: AttendanceAggregate
  ): Promise<void> {
    await this.db.writeAnalyticsDoc('analytics', `daily_attendance_${date}`, aggregate);
  }

  async getPrecomputedAttendance(date: string): Promise<AttendanceAggregate | null> {
    return this.db.readAnalyticsDoc<AttendanceAggregate>(
      'analytics',
      `daily_attendance_${date}`
    );
  }

  async aggregateLast30Days(): Promise<AttendanceAggregate[]> {
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 30);

    const results: AttendanceAggregate[] = [];
    const days = eachDayOfInterval({ start: thirtyDaysAgo, end: today });

    for (const day of days) {
      const dateStr = format(day, 'yyyy-MM-dd');

      let aggregate = await this.getPrecomputedAttendance(dateStr);

      if (!aggregate) {
        aggregate = await this.aggregateDailyAttendance(dateStr);
        await this.savePrecomputedAttendance(dateStr, aggregate);
      }

      results.push(aggregate);
    }

    return results;
  }
}
