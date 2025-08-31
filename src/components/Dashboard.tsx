import React, { useState, useEffect } from 'react';
import { Users, UserCheck, UserX, Clock, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { authService } from '../utils/auth';
import { db } from '../utils/database';
import { AttendanceAnalytics } from '../utils/analytics';
import { DashboardStats } from '../types';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const user = authService.getCurrentUser();
  const classes = db.getClasses().filter(c => 
    user?.role === 'admin' || user?.assignedClasses.includes(c.id)
  );

  useEffect(() => {
    if (classes.length > 0 && !selectedClass) {
      setSelectedClass(classes[0].id);
    }
  }, [classes, selectedClass]);

  useEffect(() => {
    if (selectedClass) {
      const classStats = AttendanceAnalytics.calculateClassStats(selectedClass);
      setStats(classStats);
      setLoading(false);
    }
  }, [selectedClass]);

  const today = new Date().toISOString().split('T')[0];
  const todayRecords = selectedClass ? db.getAttendanceByDate(today, selectedClass) : [];
  const recentTrends = selectedClass ? AttendanceAnalytics.getClassAttendanceTrends(selectedClass, 7) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.name}</p>
        </div>
        
        {classes.length > 1 && (
          <div className="flex items-center space-x-2">
            <label htmlFor="class-select" className="text-sm font-medium text-gray-700">
              Select Class:
            </label>
            <select
              id="class-select"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.grade} {cls.section} - {cls.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalStudents}</p>
              </div>
              <Users className="w-12 h-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Present Today</p>
                <p className="text-3xl font-bold text-gray-900">{stats.presentToday}</p>
              </div>
              <UserCheck className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Absent Today</p>
                <p className="text-3xl font-bold text-gray-900">{stats.absentToday}</p>
              </div>
              <UserX className="w-12 h-12 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Late Today</p>
                <p className="text-3xl font-bold text-gray-900">{stats.lateToday}</p>
              </div>
              <Clock className="w-12 h-12 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Attendance</p>
                <p className="text-3xl font-bold text-gray-900">{stats.averageAttendance}%</p>
              </div>
              <TrendingUp className="w-12 h-12 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity and Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Today's Attendance */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Calendar className="w-6 h-6 mr-2 text-blue-600" />
            Today's Attendance
          </h2>
          
          {todayRecords.length > 0 ? (
            <div className="space-y-3">
              {todayRecords.slice(0, 5).map(record => {
                const student = db.getStudents().find(s => s.id === record.studentId);
                return (
                  <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        record.status === 'present' ? 'bg-green-500' :
                        record.status === 'late' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                      <span className="font-medium">{student?.name}</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      record.status === 'present' ? 'bg-green-100 text-green-800' :
                      record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {record.status}
                    </span>
                  </div>
                );
              })}
              {todayRecords.length > 5 && (
                <p className="text-sm text-gray-500 text-center">
                  +{todayRecords.length - 5} more records
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No attendance marked for today</p>
            </div>
          )}
        </div>

        {/* Weekly Trends */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-6 h-6 mr-2 text-blue-600" />
            Weekly Trends
          </h2>
          
          {recentTrends.length > 0 ? (
            <div className="space-y-3">
              {recentTrends.map(trend => (
                <div key={trend.date} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{new Date(trend.date).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-600">
                      {trend.present} present, {trend.absent} absent
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      trend.percentage >= 90 ? 'bg-green-100 text-green-800' :
                      trend.percentage >= 75 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {trend.percentage}%
                    </span>
                    {trend.percentage >= 90 ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No trend data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};