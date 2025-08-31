export interface User {
  id: string;
  username: string;
  password: string;
  role: 'teacher' | 'admin';
  name: string;
  assignedClasses: string[];
}

export interface Student {
  id: string;
  name: string;
  rollNumber: string;
  classId: string;
  email?: string;
  phone?: string;
}

export interface Class {
  id: string;
  name: string;
  section: string;
  grade: string;
  teacherId: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  markedBy: string;
  timestamp: number;
}

export interface AttendancePattern {
  studentId: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  attendancePercentage: number;
  pattern: 'consistent' | 'irregular' | 'low' | 'excellent';
  trend: 'improving' | 'declining' | 'stable';
}

export interface DashboardStats {
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  averageAttendance: number;
}