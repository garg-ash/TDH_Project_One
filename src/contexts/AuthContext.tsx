'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiService } from '../services/api';

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'super_admin' | 'admin' | 'user';
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  createdBy?: number;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (roles: string | string[]) => boolean;
  hasPermission: (permission: string) => boolean;
  canAccess: (resource: string, action: string) => boolean;
  getAccessibleResources: () => Record<string, string[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('userInfo');

      if (storedToken && storedUser) {
        try {
          // Verify token is still valid by fetching user profile
          const response = await apiService.getProfile();
          setUser(response.data.user);
          setToken(storedToken);
        } catch (error) {
          // Token is invalid, clear storage
          localStorage.removeItem('authToken');
          localStorage.removeItem('userInfo');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.login({ email, password });
      
      setUser(response.data.user);
      setToken(response.data.token);
      
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('userInfo', JSON.stringify(response.data.user));
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
  };

  const hasRole = (roles: string | string[]): boolean => {
    if (!user) return false;
    
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    return allowedRoles.includes(user.role);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    if (user.role === 'super_admin') return true;
    if (user.role === 'admin') {
      return user.permissions.includes(permission) || user.permissions.includes('*');
    }
    return user.permissions.includes(permission);
  };

  const canAccess = (resource: string, action: string): boolean => {
    const permission = `${resource}:${action}`;
    return hasPermission(permission);
  };

  const getAccessibleResources = (): Record<string, string[]> => {
    if (!user) return {};

    const resources = {
      users: ['read', 'create', 'update', 'delete'],
      voters: ['read', 'create', 'update', 'delete'],
      surnames: ['read', 'create', 'update', 'delete'],
      reports: ['read', 'generate'],
      settings: ['read', 'update'],
      master_filters: ['read', 'update']
    };

    if (user.role === 'super_admin') {
      return resources;
    }

    const accessible: Record<string, string[]> = {};
    for (const [resource, actions] of Object.entries(resources)) {
      accessible[resource] = actions.filter(action => 
        canAccess(resource, action)
      );
    }

    return accessible;
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    logout,
    hasRole,
    hasPermission,
    canAccess,
    getAccessibleResources
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
