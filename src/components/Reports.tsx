import React, { useState, useEffect } from 'react';
import { Download, Calendar, BarChart3, FileText, Filter } from 'lucide-react';
import { authService } from '../utils/auth';
import { db } from '../utils/database';
import { AttendanceAnalytics } from '../utils/analytics';
import { ExportService } from '../utils/export';

export const Reports: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reportType, setReportType] = useState<'attendance' | 'patterns' | 'daily'>('attendance');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any[]>([]);

  const user = authService.getCurrentUser();
  const classes = db.getClasses().filter(c => 
    user?.role === 'admin' || user?.assignedClasses.includes(c.id)
  );

  useEffect(() => {
    if (classes.length > 0 && !selectedClass) {
      setSelectedClass(classes[0].id);
    }
    
    // Set default start date to 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
  }, [classes, selectedClass]);

  useEffect(() => {
    if (selectedClass && startDate && endDate) {
      generateReport();
    }
  }, [selectedClass, startDate, endDate, reportType]);

  const generateReport = () => {
    setLoading(true);
    
    try {
      switch (reportType) {
        case 'attendance':
          generateAttendanceReport();
          break;
        case 'patterns':
          generatePatternsReport();
          break;
        case 'daily':
          generateDailyReport();
          break;
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAttendanceReport = () => {
    const students = db.getStudents().filter(s => s.classId === selectedClass);
    const allRecords = db.getAttendanceRecords().filter(r => 
      r.classId === selectedClass && 
      r.date >= startDate && 
      r.date <= endDate
    );

    const data = students.map(student => {
      const studentRecords = allRecords.filter(r => r.studentId === student.id);
      const pattern = AttendanceAnalytics.calculateAttendancePattern(student.id);
      
      return {
        rollNumber: student.rollNumber,
        name: student.name,
        totalDays: pattern.totalDays,
        presentDays: pattern.presentDays,
        absentDays: pattern.absentDays,
        lateDays: pattern.lateDays,
        attendancePercentage: pattern.attendancePercentage,
        pattern: pattern.pattern,
        trend: pattern.trend
      };
    });

    setReportData(data);
  };

  const generatePatternsReport = () => {
    const students = db.getStudents().filter(s => s.classId === selectedClass);
    
    const data = students.map(student => {
      const pattern = AttendanceAnalytics.calculateAttendancePattern(student.id);
      const recentHistory = AttendanceAnalytics.getAttendanceHistory(student.id, 10);
      
      return {
        rollNumber: student.rollNumber,
        name: student.name,
        pattern: pattern.pattern,
        trend: pattern.trend,
        attendancePercentage: pattern.attendancePercentage,
        recentAbsences: recentHistory.filter(r => r.status === 'absent').length,
        consecutiveAbsences: calculateConsecutiveAbsences(recentHistory),
        riskLevel: getRiskLevel(pattern)
      };
    });

    setReportData(data);
  };

  const generateDailyReport = () => {
    const uniqueDates = [...new Set(
      db.getAttendanceRecords()
        .filter(r => r.classId === selectedClass && r.date >= startDate && r.date <= endDate)
        .map(r => r.date)
    )].sort();

    const data = uniqueDates.map(date => {
      const dayRecords = db.getAttendanceByDate(date, selectedClass);
      const totalStudents = db.getStudents().filter(s => s.classId === selectedClass).length;
      
      const present = dayRecords.filter(r => r.status === 'present').length;
      const absent = dayRecords.filter(r => r.status === 'absent').length;
      const late = dayRecords.filter(r => r.status === 'late').length;
      const percentage = totalStudents > 0 ? Math.round((present / totalStudents) * 100) : 0;
      
      return {
        date,
        totalStudents,
        present,
        absent,
        late,
        attendancePercentage: percentage
      };
    });

    setReportData(data);
  };

  const calculateConsecutiveAbsences = (records: any[]) => {
    const sortedRecords = records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    let consecutive = 0;
    
    for (const record of sortedRecords) {
      if (record.status === 'absent') {
        consecutive++;
      } else {
        break;
      }
    }
    
    return consecutive;
  };

  const getRiskLevel = (pattern: any) => {
    if (pattern.attendancePercentage < 60) return 'High';
    if (pattern.attendancePercentage < 75) return 'Medium';
    return 'Low';
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    if (!selectedClass) return;
    
    if (format === 'csv') {
      switch (reportType) {
        case 'attendance':
          ExportService.exportAttendanceReport(selectedClass, startDate, endDate);
          break;
        case 'daily':
          ExportService.exportDailyAttendance(startDate, selectedClass);
          break;
        default:
          ExportService.exportToCSV(reportData, `${reportType}_report_${selectedClass}.csv`);
      }
    } else {
      ExportService.generatePDFReport(selectedClass, startDate, endDate);
    }
  };

  const selectedClassInfo = classes.find(c => c.id === selectedClass);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Generate detailed attendance reports and insights</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label htmlFor="class-select" className="block text-sm font-medium text-gray-700 mb-2">
              Select Class
            </label>
            <select
              id="class-select"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.grade} {cls.section} - {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="report-type" className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <select
              id="report-type"
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="attendance">Attendance Summary</option>
              <option value="patterns">Pattern Analysis</option>
              <option value="daily">Daily Reports</option>
            </select>
          </div>

          <div>
            <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-end space-x-2">
            <button
              onClick={() => handleExport('csv')}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>CSV</span>
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="w-6 h-6 mr-2 text-blue-600" />
            {reportType === 'attendance' && 'Attendance Summary Report'}
            {reportType === 'patterns' && 'Pattern Analysis Report'}
            {reportType === 'daily' && 'Daily Attendance Report'}
            {selectedClassInfo && (
              <span className="ml-2 text-sm font-normal text-gray-600">
                - {selectedClassInfo.grade} {selectedClassInfo.section} ({selectedClassInfo.name})
              </span>
            )}
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : reportData.length > 0 ? (
          <div className="overflow-x-auto">
            {reportType === 'attendance' && <AttendanceReportTable data={reportData} />}
            {reportType === 'patterns' && <PatternsReportTable data={reportData} />}
            {reportType === 'daily' && <DailyReportTable data={reportData} />}
          </div>
        ) : (
          <div className="text-center py-12">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No data available for the selected criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Report Table Components
const AttendanceReportTable: React.FC<{ data: any[] }> = ({ data }) => (
  <table className="w-full">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Days</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Present</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Absent</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Late</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pattern</th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
      {data.map((row, index) => (
        <tr key={index} className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="text-sm font-medium text-gray-900">{row.name}</div>
            <div className="text-sm text-gray-500">Roll: {row.rollNumber}</div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.totalDays}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">{row.presentDays}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">{row.absentDays}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 font-medium">{row.lateDays}</td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              row.attendancePercentage >= 90 ? 'bg-green-100 text-green-800' :
              row.attendancePercentage >= 75 ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {row.attendancePercentage}%
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
              {row.pattern}
            </span>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

const PatternsReportTable: React.FC<{ data: any[] }> = ({ data }) => (
  <table className="w-full">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance %</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pattern</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recent Absences</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
      {data.map((row, index) => (
        <tr key={index} className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="text-sm font-medium text-gray-900">{row.name}</div>
            <div className="text-sm text-gray-500">Roll: {row.rollNumber}</div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.attendancePercentage}%</td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
              {row.pattern}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${
              row.trend === 'improving' ? 'bg-green-100 text-green-800' :
              row.trend === 'declining' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {row.trend}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.recentAbsences}/10</td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              row.riskLevel === 'High' ? 'bg-red-100 text-red-800' :
              row.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {row.riskLevel}
            </span>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

const DailyReportTable: React.FC<{ data: any[] }> = ({ data }) => (
  <table className="w-full">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Students</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Present</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Absent</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Late</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance %</th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
      {data.map((row, index) => (
        <tr key={index} className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
            {new Date(row.date).toLocaleDateString()}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.totalStudents}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">{row.present}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">{row.absent}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 font-medium">{row.late}</td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              row.attendancePercentage >= 90 ? 'bg-green-100 text-green-800' :
              row.attendancePercentage >= 75 ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {row.attendancePercentage}%
            </span>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);