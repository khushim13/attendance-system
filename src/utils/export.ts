import { AttendanceRecord, Student, Class } from '../types';
import { db } from './database';
import { AttendanceAnalytics } from './analytics';

export class ExportService {
  static exportToCSV(data: any[], filename: string): void {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');
    
    this.downloadFile(csvContent, filename, 'text/csv');
  }

  static exportAttendanceReport(classId: string, startDate: string, endDate: string): void {
    const students = db.getStudents().filter(s => s.classId === classId);
    const classInfo = db.getClasses().find(c => c.id === classId);
    const allRecords = db.getAttendanceRecords().filter(r => 
      r.classId === classId && 
      r.date >= startDate && 
      r.date <= endDate
    );

    const reportData = students.map(student => {
      const studentRecords = allRecords.filter(r => r.studentId === student.id);
      const pattern = AttendanceAnalytics.calculateAttendancePattern(student.id);
      
      return {
        'Roll Number': student.rollNumber,
        'Student Name': student.name,
        'Total Days': pattern.totalDays,
        'Present Days': pattern.presentDays,
        'Absent Days': pattern.absentDays,
        'Late Days': pattern.lateDays,
        'Attendance %': pattern.attendancePercentage,
        'Pattern': pattern.pattern,
        'Trend': pattern.trend
      };
    });

    const filename = `attendance_report_${classInfo?.name}_${startDate}_to_${endDate}.csv`;
    this.exportToCSV(reportData, filename);
  }

  static exportStudentList(classId?: string): void {
    const students = classId 
      ? db.getStudents().filter(s => s.classId === classId)
      : db.getStudents();
    
    const classes = db.getClasses();
    
    const studentData = students.map(student => {
      const studentClass = classes.find(c => c.id === student.classId);
      return {
        'Roll Number': student.rollNumber,
        'Name': student.name,
        'Class': studentClass ? `${studentClass.grade} ${studentClass.section} - ${studentClass.name}` : 'Unknown',
        'Email': student.email || '',
        'Phone': student.phone || ''
      };
    });

    const filename = classId ? `students_${classId}.csv` : 'all_students.csv';
    this.exportToCSV(studentData, filename);
  }

  static exportDailyAttendance(date: string, classId?: string): void {
    const records = db.getAttendanceByDate(date, classId);
    const students = db.getStudents();
    const classes = db.getClasses();
    
    const attendanceData = records.map(record => {
      const student = students.find(s => s.id === record.studentId);
      const classInfo = classes.find(c => c.id === record.classId);
      
      return {
        'Date': record.date,
        'Class': classInfo ? `${classInfo.grade} ${classInfo.section} - ${classInfo.name}` : 'Unknown',
        'Roll Number': student?.rollNumber || 'Unknown',
        'Student Name': student?.name || 'Unknown',
        'Status': record.status,
        'Marked By': record.markedBy,
        'Timestamp': new Date(record.timestamp).toLocaleString()
      };
    });

    const filename = `daily_attendance_${date}${classId ? `_${classId}` : ''}.csv`;
    this.exportToCSV(attendanceData, filename);
  }

  static generatePDFReport(classId: string, startDate: string, endDate: string): void {
    // For a real implementation, you would use a library like jsPDF
    // For now, we'll create a formatted text report
    const students = db.getStudents().filter(s => s.classId === classId);
    const classInfo = db.getClasses().find(c => c.id === classId);
    const stats = AttendanceAnalytics.calculateClassStats(classId);
    
    let report = `ATTENDANCE REPORT\n`;
    report += `================\n\n`;
    report += `Class: ${classInfo?.grade} ${classInfo?.section} - ${classInfo?.name}\n`;
    report += `Period: ${startDate} to ${endDate}\n`;
    report += `Generated: ${new Date().toLocaleString()}\n\n`;
    
    report += `CLASS STATISTICS\n`;
    report += `---------------\n`;
    report += `Total Students: ${stats.totalStudents}\n`;
    report += `Average Attendance: ${stats.averageAttendance}%\n\n`;
    
    report += `STUDENT DETAILS\n`;
    report += `--------------\n`;
    
    students.forEach(student => {
      const pattern = AttendanceAnalytics.calculateAttendancePattern(student.id);
      report += `${student.rollNumber} - ${student.name}\n`;
      report += `  Attendance: ${pattern.attendancePercentage}% (${pattern.presentDays}/${pattern.totalDays} days)\n`;
      report += `  Pattern: ${pattern.pattern} | Trend: ${pattern.trend}\n\n`;
    });
    
    this.downloadFile(report, `attendance_report_${classId}_${startDate}_to_${endDate}.txt`, 'text/plain');
  }

  private static downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}