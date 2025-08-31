import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, BookOpen, Download, Upload, Settings } from 'lucide-react';
import { db } from '../utils/database';
import { User, Class, Student } from '../types';

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'classes' | 'backup'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingClass, setEditingClass] = useState<Class | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setUsers(db.getUsers());
    setClasses(db.getClasses());
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      db.deleteUser(userId);
      loadData();
    }
  };

  const handleDeleteClass = (classId: string) => {
    if (window.confirm('Are you sure you want to delete this class? This will also remove all associated students.')) {
      // Remove students in this class
      const students = db.getStudents().filter(s => s.classId === classId);
      students.forEach(student => db.deleteStudent(student.id));
      
      // Remove the class
      db.deleteClass(classId);
      loadData();
    }
  };

  const handleExportData = () => {
    const data = db.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (db.importData(content)) {
          alert('Data imported successfully!');
          loadData();
        } else {
          alert('Failed to import data. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  const tabs = [
    { id: 'users', label: 'Users', icon: Users },
    { id: 'classes', label: 'Classes', icon: BookOpen },
    { id: 'backup', label: 'Backup & Restore', icon: Settings },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-600 mt-1">Manage users, classes, and system settings</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'users' && (
            <UsersTab
              users={users}
              onEdit={setEditingUser}
              onDelete={handleDeleteUser}
              onAdd={() => setShowUserModal(true)}
            />
          )}
          
          {activeTab === 'classes' && (
            <ClassesTab
              classes={classes}
              users={users}
              onEdit={setEditingClass}
              onDelete={handleDeleteClass}
              onAdd={() => setShowClassModal(true)}
            />
          )}
          
          {activeTab === 'backup' && (
            <BackupTab
              onExport={handleExportData}
              onImport={handleImportData}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      {(showUserModal || editingUser) && (
        <UserModal
          user={editingUser}
          classes={classes}
          onClose={() => {
            setShowUserModal(false);
            setEditingUser(null);
          }}
          onSave={() => {
            loadData();
            setShowUserModal(false);
            setEditingUser(null);
          }}
        />
      )}

      {(showClassModal || editingClass) && (
        <ClassModal
          classData={editingClass}
          users={users}
          onClose={() => {
            setShowClassModal(false);
            setEditingClass(null);
          }}
          onSave={() => {
            loadData();
            setShowClassModal(false);
            setEditingClass(null);
          }}
        />
      )}
    </div>
  );
};

// Users Tab Component
interface UsersTabProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
  onAdd: () => void;
}

const UsersTab: React.FC<UsersTabProps> = ({ users, onEdit, onDelete, onAdd }) => (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-bold text-gray-900">User Management</h2>
      <button
        onClick={onAdd}
        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>Add User</span>
      </button>
    </div>

    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Classes</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map(user => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                <div className="text-sm text-gray-500">@{user.username}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {user.role}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {user.assignedClasses.length} classes
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  <button
                    onClick={() => onEdit(user)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(user.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Classes Tab Component
interface ClassesTabProps {
  classes: Class[];
  users: User[];
  onEdit: (classData: Class) => void;
  onDelete: (classId: string) => void;
  onAdd: () => void;
}

const ClassesTab: React.FC<ClassesTabProps> = ({ classes, users, onEdit, onDelete, onAdd }) => (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-bold text-gray-900">Class Management</h2>
      <button
        onClick={onAdd}
        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>Add Class</span>
      </button>
    </div>

    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {classes.map(classData => {
            const teacher = users.find(u => u.id === classData.teacherId);
            const studentCount = db.getStudents().filter(s => s.classId === classData.id).length;
            
            return (
              <tr key={classData.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {classData.grade} {classData.section} - {classData.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {teacher?.name || 'Unassigned'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {studentCount} students
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEdit(classData)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(classData.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

// Backup Tab Component
interface BackupTabProps {
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const BackupTab: React.FC<BackupTabProps> = ({ onExport, onImport }) => (
  <div className="space-y-6">
    <h2 className="text-xl font-bold text-gray-900">Backup & Restore</h2>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-2">Export Data</h3>
        <p className="text-blue-700 mb-4">Download a complete backup of all system data including users, classes, students, and attendance records.</p>
        <button
          onClick={onExport}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export Backup</span>
        </button>
      </div>

      <div className="bg-green-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-green-900 mb-2">Import Data</h3>
        <p className="text-green-700 mb-4">Restore system data from a previously exported backup file. This will replace all current data.</p>
        <label className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
          <Upload className="w-4 h-4" />
          <span>Import Backup</span>
          <input
            type="file"
            accept=".json"
            onChange={onImport}
            className="hidden"
          />
        </label>
      </div>
    </div>

    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <Settings className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">Important Notes</h3>
          <div className="mt-2 text-sm text-yellow-700">
            <ul className="list-disc list-inside space-y-1">
              <li>Always create a backup before importing new data</li>
              <li>Importing will completely replace all existing data</li>
              <li>Backup files contain sensitive information - store them securely</li>
              <li>Regular backups are recommended to prevent data loss</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// User Modal Component
interface UserModalProps {
  user: User | null;
  classes: Class[];
  onClose: () => void;
  onSave: () => void;
}

const UserModal: React.FC<UserModalProps> = ({ user, classes, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    username: user?.username || '',
    password: user?.password || '',
    role: user?.role || 'teacher',
    assignedClasses: user?.assignedClasses || []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (user) {
      db.updateUser(user.id, formData);
    } else {
      const newUser: User = {
        id: `user_${Date.now()}`,
        ...formData
      };
      db.addUser(newUser);
    }
    
    onSave();
  };

  const handleClassToggle = (classId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedClasses: prev.assignedClasses.includes(classId)
        ? prev.assignedClasses.filter(id => id !== classId)
        : [...prev.assignedClasses, classId]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {user ? 'Edit User' : 'Add New User'}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'admin' | 'teacher' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          {formData.role === 'teacher' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Classes</label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {classes.map(cls => (
                  <label key={cls.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.assignedClasses.includes(cls.id)}
                      onChange={() => handleClassToggle(cls.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {cls.grade} {cls.section} - {cls.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
          
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
              {user ? 'Update' : 'Add'} User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Class Modal Component
interface ClassModalProps {
  classData: Class | null;
  users: User[];
  onClose: () => void;
  onSave: () => void;
}

const ClassModal: React.FC<ClassModalProps> = ({ classData, users, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: classData?.name || '',
    section: classData?.section || '',
    grade: classData?.grade || '',
    teacherId: classData?.teacherId || ''
  });

  const teachers = users.filter(u => u.role === 'teacher');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (classData) {
      db.updateClass(classData.id, formData);
    } else {
      const newClass: Class = {
        id: `class_${Date.now()}`,
        ...formData
      };
      db.addClass(newClass);
      
      // Update teacher's assigned classes
      if (formData.teacherId) {
        const teacher = users.find(u => u.id === formData.teacherId);
        if (teacher) {
          db.updateUser(teacher.id, {
            assignedClasses: [...teacher.assignedClasses, newClass.id]
          });
        }
      }
    }
    
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {classData ? 'Edit Class' : 'Add New Class'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Mathematics, Physics"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
              <input
                type="text"
                value={formData.grade}
                onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 10, 11, 12"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
              <input
                type="text"
                value={formData.section}
                onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., A, B, C"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign Teacher</label>
            <select
              value={formData.teacherId}
              onChange={(e) => setFormData(prev => ({ ...prev, teacherId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select Teacher</option>
              {teachers.map(teacher => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>
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
              {classData ? 'Update' : 'Add'} Class
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};