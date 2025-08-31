import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Users, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { authService } from '../utils/auth';
import { db } from '../utils/database';
import { AttendanceAnalytics } from '../utils/analytics';
import { Student, AttendancePattern } from '../types';

export const Students: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [patterns, setPatterns] = useState<Record<string, AttendancePattern>>({});
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
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
    loadStudents();
  }, [selectedClass]);

  const loadStudents = () => {
    setLoading(true);
    const allStudents = db.getStudents();
    const filteredStudents = selectedClass 
      ? allStudents.filter(s => s.classId === selectedClass)
      : allStudents;
    
    setStudents(filteredStudents);
    
    // Calculate patterns for each student
    const studentPatterns: Record<string, AttendancePattern> = {};
    filteredStudents.forEach(student => {
      studentPatterns[student.id] = AttendanceAnalytics.calculateAttendancePattern(student.id);
    });
    setPatterns(studentPatterns);
    setLoading(false);
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteStudent = (studentId: string) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      db.deleteStudent(studentId);
      loadStudents();
    }
  };

  const getPatternIcon = (pattern: AttendancePattern) => {
    switch (pattern.pattern) {
      case 'excellent':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'low':
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      case 'irregular':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      default:
        return <TrendingUp className="w-5 h-5 text-blue-600" />;
    }
  };

  const getPatternColor = (pattern: AttendancePattern) => {
    switch (pattern.pattern) {
      case 'excellent':
        return 'text-green-600 bg-green-50';
      case 'low':
        return 'text-red-600 bg-red-50';
      case 'irregular':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-600 mt-1">Manage students and view attendance patterns</p>
        </div>
        
        {user?.role === 'admin' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="class-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Class
            </label>
            <select
              id="class-filter"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Classes</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.grade} {cls.section} - {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search Students
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or roll number..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Users className="w-6 h-6 mr-2 text-blue-600" />
            Student List ({filteredStudents.length})
          </h2>
        </div>

        {filteredStudents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pattern
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trend
                  </th>
                  {user?.role === 'admin' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map(student => {
                  const pattern = patterns[student.id];
                  const studentClass = classes.find(c => c.id === student.classId);
                  
                  return (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="font-medium text-blue-600">{student.rollNumber}</span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                            <div className="text-sm text-gray-500">Roll: {student.rollNumber}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {studentClass ? `${studentClass.grade} ${studentClass.section}` : 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {studentClass?.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {pattern?.attendancePercentage || 0}%
                        </div>
                        <div className="text-sm text-gray-500">
                          {pattern?.presentDays || 0}/{pattern?.totalDays || 0} days
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPatternColor(pattern)}`}>
                          {getPatternIcon(pattern)}
                          <span className="ml-1 capitalize">{pattern?.pattern || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          pattern?.trend === 'improving' ? 'text-green-800 bg-green-100' :
                          pattern?.trend === 'declining' ? 'text-red-800 bg-red-100' :
                          'text-gray-800 bg-gray-100'
                        }`}>
                          {pattern?.trend === 'improving' && <TrendingUp className="w-3 h-3 mr-1" />}
                          {pattern?.trend === 'declining' && <TrendingDown className="w-3 h-3 mr-1" />}
                          {pattern?.trend || 'Stable'}
                        </span>
                      </td>
                      {user?.role === 'admin' && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setEditingStudent(student)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(student.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No students found</p>
          </div>
        )}
      </div>

      {/* Add/Edit Student Modal */}
      {(showAddModal || editingStudent) && (
        <StudentModal
          student={editingStudent}
          classes={classes}
          onClose={() => {
            setShowAddModal(false);
            setEditingStudent(null);
          }}
          onSave={() => {
            loadStudents();
            setShowAddModal(false);
            setEditingStudent(null);
          }}
        />
      )}
    </div>
  );
};

// Student Modal Component
interface StudentModalProps {
  student: Student | null;
  classes: any[];
  onClose: () => void;
  onSave: () => void;
}

const StudentModal: React.FC<StudentModalProps> = ({ student, classes, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: student?.name || '',
    rollNumber: student?.rollNumber || '',
    classId: student?.classId || '',
    email: student?.email || '',
    phone: student?.phone || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (student) {
      // Update existing student
      db.updateStudent(student.id, formData);
    } else {
      // Add new student
      const newStudent: Student = {
        id: `student_${Date.now()}`,
        ...formData
      };
      db.addStudent(newStudent);
    }
    
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {student ? 'Edit Student' : 'Add New Student'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
            <input
              type="text"
              value={formData.rollNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, rollNumber: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select
              value={formData.classId}
              onChange={(e) => setFormData(prev => ({ ...prev, classId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select Class</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.grade} {cls.section} - {cls.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {student ? 'Update' : 'Add'} Student
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};