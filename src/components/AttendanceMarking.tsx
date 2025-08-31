import React, { useState, useEffect } from 'react';
import { Save, Undo, Calendar, Users, CheckCircle, XCircle, Clock } from 'lucide-react';
import { authService } from '../utils/auth';
import { db } from '../utils/database';
import { Student, AttendanceRecord } from '../types';

export const AttendanceMarking: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
  const [existingRecords, setExistingRecords] = useState<AttendanceRecord[]>([]);
  const [undoStack, setUndoStack] = useState<Array<Record<string, 'present' | 'absent' | 'late'>>>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
      const classStudents = db.getStudents().filter(s => s.classId === selectedClass);
      setStudents(classStudents);
      
      // Load existing attendance for the selected date
      const existing = db.getAttendanceByDate(selectedDate, selectedClass);
      setExistingRecords(existing);
      
      // Initialize attendance state
      const attendanceState: Record<string, 'present' | 'absent' | 'late'> = {};
      classStudents.forEach(student => {
        const existingRecord = existing.find(r => r.studentId === student.id);
        attendanceState[student.id] = existingRecord?.status || 'present';
      });
      setAttendance(attendanceState);
    }
  }, [selectedClass, selectedDate]);

  const handleAttendanceChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
    // Save current state to undo stack
    setUndoStack(prev => [...prev, { ...attendance }]);
    
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleUndo = () => {
    if (undoStack.length > 0) {
      const previousState = undoStack[undoStack.length - 1];
      setAttendance(previousState);
      setUndoStack(prev => prev.slice(0, -1));
    }
  };

  const handleSave = async () => {
    if (!selectedClass || !user) return;
    
    setSaving(true);
    setMessage(null);
    
    try {
      // Save attendance records
      Object.entries(attendance).forEach(([studentId, status]) => {
        const record: AttendanceRecord = {
          id: `${studentId}_${selectedClass}_${selectedDate}`,
          studentId,
          classId: selectedClass,
          date: selectedDate,
          status,
          markedBy: user.name,
          timestamp: Date.now()
        };
        
        db.addAttendanceRecord(record);
      });
      
      setMessage({ type: 'success', text: 'Attendance saved successfully!' });
      setUndoStack([]); // Clear undo stack after successful save
      
      // Refresh existing records
      const updated = db.getAttendanceByDate(selectedDate, selectedClass);
      setExistingRecords(updated);
      
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save attendance. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const markAllPresent = () => {
    setUndoStack(prev => [...prev, { ...attendance }]);
    const newAttendance: Record<string, 'present' | 'absent' | 'late'> = {};
    students.forEach(student => {
      newAttendance[student.id] = 'present';
    });
    setAttendance(newAttendance);
  };

  const markAllAbsent = () => {
    setUndoStack(prev => [...prev, { ...attendance }]);
    const newAttendance: Record<string, 'present' | 'absent' | 'late'> = {};
    students.forEach(student => {
      newAttendance[student.id] = 'absent';
    });
    setAttendance(newAttendance);
  };

  const getStatusCounts = () => {
    const counts = { present: 0, absent: 0, late: 0 };
    Object.values(attendance).forEach(status => {
      counts[status]++;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();
  const selectedClassInfo = classes.find(c => c.id === selectedClass);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mark Attendance</h1>
          <p className="text-gray-600 mt-1">Record student attendance for your classes</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
            <label htmlFor="date-select" className="block text-sm font-medium text-gray-700 mb-2">
              Select Date
            </label>
            <input
              id="date-select"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-end space-x-2">
            <button
              onClick={markAllPresent}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              All Present
            </button>
            <button
              onClick={markAllAbsent}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              All Absent
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">{statusCounts.present}</p>
            <p className="text-sm text-green-700">Present</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-600">{statusCounts.absent}</p>
            <p className="text-sm text-red-700">Absent</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 text-center">
            <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-yellow-600">{statusCounts.late}</p>
            <p className="text-sm text-yellow-700">Late</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Undo className="w-4 h-4" />
            <span>Undo</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Attendance'}</span>
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`mt-4 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 
            'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}
      </div>

      {/* Student List */}
      {selectedClassInfo && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Users className="w-6 h-6 mr-2 text-blue-600" />
            {selectedClassInfo.grade} {selectedClassInfo.section} - {selectedClassInfo.name}
          </h2>

          <div className="space-y-3">
            {students.map(student => (
              <div key={student.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="font-medium text-blue-600">{student.rollNumber}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{student.name}</p>
                    <p className="text-sm text-gray-600">Roll: {student.rollNumber}</p>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleAttendanceChange(student.id, 'present')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      attendance[student.id] === 'present'
                        ? 'bg-green-600 text-white'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    Present
                  </button>
                  <button
                    onClick={() => handleAttendanceChange(student.id, 'late')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      attendance[student.id] === 'late'
                        ? 'bg-yellow-600 text-white'
                        : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                    }`}
                  >
                    Late
                  </button>
                  <button
                    onClick={() => handleAttendanceChange(student.id, 'absent')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      attendance[student.id] === 'absent'
                        ? 'bg-red-600 text-white'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    Absent
                  </button>
                </div>
              </div>
            ))}
          </div>

          {students.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No students found in this class</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};