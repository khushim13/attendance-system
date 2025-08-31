import { User } from '../types';
import { db } from './database';

class AuthService {
  private currentUser: User | null = null;
  private readonly TOKEN_KEY = 'smartAttendance_token';

  async login(username: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    const users = db.getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
      this.currentUser = user;
      // Create a simple token (in production, use proper JWT)
      const token = btoa(JSON.stringify({ userId: user.id, timestamp: Date.now() }));
      localStorage.setItem(this.TOKEN_KEY, token);
      return { success: true, user };
    }
    
    return { success: false, error: 'Invalid username or password' };
  }

  logout(): void {
    this.currentUser = null;
    localStorage.removeItem(this.TOKEN_KEY);
  }

  getCurrentUser(): User | null {
    if (this.currentUser) {
      return this.currentUser;
    }

    // Try to restore from token
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (token) {
      try {
        const decoded = JSON.parse(atob(token));
        const users = db.getUsers();
        const user = users.find(u => u.id === decoded.userId);
        if (user) {
          this.currentUser = user;
          return user;
        }
      } catch (error) {
        console.error('Invalid token:', error);
        this.logout();
      }
    }

    return null;
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }

  isTeacher(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'teacher';
  }

  canAccessClass(classId: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.assignedClasses.includes(classId);
  }
}

export const authService = new AuthService();