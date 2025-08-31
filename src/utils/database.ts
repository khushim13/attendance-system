import { User, Student, Class, AttendanceRecord } from '../types';

class LocalDatabase {
  private dbName = 'smartAttendanceDB';

  // Initialize database with default data
  async init() {
    if (!this.getUsers().length) {
      await this.seedDefaultData();
    }
  }

  // User management
  getUsers(): User[] {
    const users = localStorage.getItem(`${this.dbName}_users`);
    return users ? JSON.parse(users) : [];
  }

  saveUsers(users: User[]): void {
    localStorage.setItem(`${this.dbName}_users`, JSON.stringify(users));
  }

  addUser(user: User): void {
    const users = this.getUsers();
    users.push(user);
    this.saveUsers(users);
  }

  updateUser(userId: string, updates: Partial<User>): void {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates };
      this.saveUsers(users);
    }
  }

  deleteUser(userId: string): void {
    const users = this.getUsers().filter(u => u.id !== userId);
    this.saveUsers(users);
  }

  // Student management
  getStudents(): Student[] {
    const students = localStorage.getItem(`${this.dbName}_students`);
    return students ? JSON.parse(students) : [];
  }

  saveStudents(students: Student[]): void {
    localStorage.setItem(`${this.dbName}_students`, JSON.stringify(students));
  }

  addStudent(student: Student): void {
    const students = this.getStudents();
    students.push(student);
    this.saveStudents(students);
  }

  updateStudent(studentId: string, updates: Partial<Student>): void {
    const students = this.getStudents();
    const index = students.findIndex(s => s.id === studentId);
    if (index !== -1) {
      students[index] = { ...students[index], ...updates };
      this.saveStudents(students);
    }
  }

  deleteStudent(studentId: string): void {
    const students = this.getStudents().filter(s => s.id !== studentId);
    this.saveStudents(students);
  }

  // Class management
  getClasses(): Class[] {
    const classes = localStorage.getItem(`${this.dbName}_classes`);
    return classes ? JSON.parse(classes) : [];
  }

  saveClasses(classes: Class[]): void {
    localStorage.setItem(`${this.dbName}_classes`, JSON.stringify(classes));
  }

  addClass(classData: Class): void {
    const classes = this.getClasses();
    classes.push(classData);
    this.saveClasses(classes);
  }

  updateClass(classId: string, updates: Partial<Class>): void {
    const classes = this.getClasses();
    const index = classes.findIndex(c => c.id === classId);
    if (index !== -1) {
      classes[index] = { ...classes[index], ...updates };
      this.saveClasses(classes);
    }
  }

  deleteClass(classId: string): void {
    const classes = this.getClasses().filter(c => c.id !== classId);
    this.saveClasses(classes);
  }

  // Attendance management
  getAttendanceRecords(): AttendanceRecord[] {
    const records = localStorage.getItem(`${this.dbName}_attendance`);
    return records ? JSON.parse(records) : [];
  }

  saveAttendanceRecords(records: AttendanceRecord[]): void {
    localStorage.setItem(`${this.dbName}_attendance`, JSON.stringify(records));
  }

  addAttendanceRecord(record: AttendanceRecord): void {
    const records = this.getAttendanceRecords();
    // Remove existing record for same student, class, and date
    const filteredRecords = records.filter(r => 
      !(r.studentId === record.studentId && r.classId === record.classId && r.date === record.date)
    );
    filteredRecords.push(record);
    this.saveAttendanceRecords(filteredRecords);
  }

  getAttendanceByDate(date: string, classId?: string): AttendanceRecord[] {
    const records = this.getAttendanceRecords();
    return records.filter(r => {
      if (classId) {
        return r.date === date && r.classId === classId;
      }
      return r.date === date;
    });
  }

  getAttendanceByStudent(studentId: string): AttendanceRecord[] {
    const records = this.getAttendanceRecords();
    return records.filter(r => r.studentId === studentId);
  }

  // Backup and restore
  exportData(): string {
    const data = {
      users: this.getUsers(),
      students: this.getStudents(),
      classes: this.getClasses(),
      attendance: this.getAttendanceRecords(),
      exportDate: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      if (data.users) this.saveUsers(data.users);
      if (data.students) this.saveStudents(data.students);
      if (data.classes) this.saveClasses(data.classes);
      if (data.attendance) this.saveAttendanceRecords(data.attendance);
      return true;
    } catch (error) {
      console.error('Import failed:', error);
      return false;
    }
  }

  clearAllData(): void {
    localStorage.removeItem(`${this.dbName}_users`);
    localStorage.removeItem(`${this.dbName}_students`);
    localStorage.removeItem(`${this.dbName}_classes`);
    localStorage.removeItem(`${this.dbName}_attendance`);
  }

  // Seed default data
  private async seedDefaultData(): Promise<void> {
    // Default admin user
    const adminUser: User = {
      id: 'admin-1',
      username: 'admin',
      password: 'admin123', // In production, this should be hashed
      role: 'admin',
      name: 'System Administrator',
      assignedClasses: []
    };

    // Default teacher
    const teacherUser: User = {
      id: 'teacher-1',
      username: 'teacher1',
      password: 'teacher123',
      role: 'teacher',
      name: 'John Smith',
      assignedClasses: ['class-1', 'class-2']
    };

    // Default classes
    const defaultClasses: Class[] = [
      {
        id: 'class-1',
        name: 'Mathematics',
        section: 'A',
        grade: '10',
        teacherId: 'teacher-1'
      },
      {
        id: 'class-2',
        name: 'Physics',
        section: 'B',
        grade: '10',
        teacherId: 'teacher-1'
      }
    ];

    // Default students
    const defaultStudents: Student[] = [
      {
        id: 'student-1',
        name: 'Alice Johnson',
        rollNumber: '001',
        classId: 'class-1',
        email: 'alice@school.edu'
      },
      {
        id: 'student-2',
        name: 'Bob Wilson',
        rollNumber: '002',
        classId: 'class-1',
        email: 'bob@school.edu'
      },
      {
        id: 'student-3',
        name: 'Carol Davis',
        rollNumber: '003',
        classId: 'class-1',
        email: 'carol@school.edu'
      },
      {
        id: 'student-4',
        name: 'David Brown',
        rollNumber: '001',
        classId: 'class-2',
        email: 'david@school.edu'
      },
      {
        id: 'student-5',
        name: 'Eva Martinez',
        rollNumber: '002',
        classId: 'class-2',
        email: 'eva@school.edu'
      }
    ];

    this.saveUsers([adminUser, teacherUser]);
    this.saveClasses(defaultClasses);
    this.saveStudents(defaultStudents);
  }
}

export const db = new LocalDatabase();