import { AttendanceRecord, Student, AttendancePattern, DashboardStats } from '../types';
import { db } from './database';

export class AttendanceAnalytics {
  static calculateAttendancePattern(studentId: string): AttendancePattern {
    const records = db.getAttendanceByStudent(studentId);
    const totalDays = records.length;
    
    if (totalDays === 0) {
      return {
        studentId,
        totalDays: 0,
        presentDays: 0,
        absentDays: 0,
        lateDays: 0,
        attendancePercentage: 0,
        pattern: 'irregular',
        trend: 'stable'
      };
    }

    const presentDays = records.filter(r => r.status === 'present').length;
    const absentDays = records.filter(r => r.status === 'absent').length;
    const lateDays = records.filter(r => r.status === 'late').length;
    const attendancePercentage = Math.round((presentDays / totalDays) * 100);

    // Determine pattern
    let pattern: AttendancePattern['pattern'] = 'consistent';
    if (attendancePercentage >= 95) pattern = 'excellent';
    else if (attendancePercentage < 75) pattern = 'low';
    else if (this.isIrregular(records)) pattern = 'irregular';

    // Determine trend (last 10 days vs previous 10 days)
    const trend = this.calculateTrend(records);

    return {
      studentId,
      totalDays,
      presentDays,
      absentDays,
      lateDays,
      attendancePercentage,
      pattern,
      trend
    };
  }

  static calculateClassStats(classId: string, date?: string): DashboardStats {
    const students = db.getStudents().filter(s => s.classId === classId);
    const targetDate = date || new Date().toISOString().split('T')[0];
    const todayRecords = db.getAttendanceByDate(targetDate, classId);

    const totalStudents = students.length;
    const presentToday = todayRecords.filter(r => r.status === 'present').length;
    const absentToday = todayRecords.filter(r => r.status === 'absent').length;
    const lateToday = todayRecords.filter(r => r.status === 'late').length;

    // Calculate average attendance for the class
    const allRecords = db.getAttendanceRecords().filter(r => r.classId === classId);
    const uniqueDates = [...new Set(allRecords.map(r => r.date))];
    
    let totalAttendancePercentage = 0;
    if (uniqueDates.length > 0) {
      uniqueDates.forEach(date => {
        const dayRecords = allRecords.filter(r => r.date === date);
        const dayPresent = dayRecords.filter(r => r.status === 'present').length;
        const dayPercentage = totalStudents > 0 ? (dayPresent / totalStudents) * 100 : 0;
        totalAttendancePercentage += dayPercentage;
      });
      totalAttendancePercentage = Math.round(totalAttendancePercentage / uniqueDates.length);
    }

    return {
      totalStudents,
      presentToday,
      absentToday,
      lateToday,
      averageAttendance: totalAttendancePercentage
    };
  }

  static getAttendanceHistory(studentId: string, days: number = 30): AttendanceRecord[] {
    const records = db.getAttendanceByStudent(studentId);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return records
      .filter(r => new Date(r.date) >= cutoffDate)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  static getClassAttendanceTrends(classId: string, days: number = 30): Array<{
    date: string;
    present: number;
    absent: number;
    late: number;
    percentage: number;
  }> {
    const students = db.getStudents().filter(s => s.classId === classId);
    const totalStudents = students.length;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const allRecords = db.getAttendanceRecords().filter(r => 
      r.classId === classId && new Date(r.date) >= cutoffDate
    );
    
    const dateGroups = allRecords.reduce((acc, record) => {
      if (!acc[record.date]) {
        acc[record.date] = [];
      }
      acc[record.date].push(record);
      return acc;
    }, {} as Record<string, AttendanceRecord[]>);

    return Object.entries(dateGroups)
      .map(([date, records]) => {
        const present = records.filter(r => r.status === 'present').length;
        const absent = records.filter(r => r.status === 'absent').length;
        const late = records.filter(r => r.status === 'late').length;
        const percentage = totalStudents > 0 ? Math.round((present / totalStudents) * 100) : 0;
        
        return { date, present, absent, late, percentage };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  private static isIrregular(records: AttendanceRecord[]): boolean {
    if (records.length < 5) return false;
    
    // Sort by date
    const sortedRecords = records.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Check for patterns of consecutive absences
    let consecutiveAbsences = 0;
    let maxConsecutiveAbsences = 0;
    
    sortedRecords.forEach(record => {
      if (record.status === 'absent') {
        consecutiveAbsences++;
        maxConsecutiveAbsences = Math.max(maxConsecutiveAbsences, consecutiveAbsences);
      } else {
        consecutiveAbsences = 0;
      }
    });
    
    return maxConsecutiveAbsences >= 3;
  }

  private static calculateTrend(records: AttendanceRecord[]): AttendancePattern['trend'] {
    if (records.length < 10) return 'stable';
    
    const sortedRecords = records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const recent10 = sortedRecords.slice(0, 10);
    const previous10 = sortedRecords.slice(10, 20);
    
    if (previous10.length < 5) return 'stable';
    
    const recentPercentage = (recent10.filter(r => r.status === 'present').length / recent10.length) * 100;
    const previousPercentage = (previous10.filter(r => r.status === 'present').length / previous10.length) * 100;
    
    const difference = recentPercentage - previousPercentage;
    
    if (difference > 10) return 'improving';
    if (difference < -10) return 'declining';
    return 'stable';
  }
}