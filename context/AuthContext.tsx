import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string, fullName: string, email: string, targetExam: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for active session or create default
    const storedUser = localStorage.getItem('yds_active_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    } else {
      // Auto-create default user if none exists (Remove Login Screen behavior)
      const defaultUser: User = { 
          username: 'student', 
          password: '',
          fullName: 'Misafir Öğrenci',
          email: '',
          targetExam: 'YDS',
          level: undefined, 
          progress: 1,
          isPremium: true,
          subscriptionDate: new Date().toISOString()
      };
      setUser(defaultUser);
      setIsAuthenticated(true);
      localStorage.setItem('yds_active_user', JSON.stringify(defaultUser));
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    // Login functionality kept for API compatibility but effectively unused in UI
    return true;
  };

  const register = async (username: string, password: string, fullName: string, email: string, targetExam: string): Promise<boolean> => {
    // Register functionality kept for API compatibility but effectively unused in UI
    return true;
  };

  const logout = () => {
    // Reset to default user instead of fully logging out
    const defaultUser: User = { 
        username: 'student', 
        password: '',
        fullName: 'Misafir Öğrenci',
        email: '',
        targetExam: 'YDS',
        level: undefined, 
        progress: 1,
        isPremium: true,
        subscriptionDate: new Date().toISOString()
    };
    localStorage.setItem('yds_active_user', JSON.stringify(defaultUser));
    setUser(defaultUser);
    setIsAuthenticated(true);
    // Optional: Trigger a reload to clear other states
    window.location.reload(); 
  };
  
  const updateUser = (updatedUser: User) => {
      setUser(updatedUser);
      localStorage.setItem('yds_active_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};