'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Users, Database, Save, RefreshCw, Check, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import Navbar from '../../components/Navbar';
import { AdminOnly } from '../../components/ProtectedRoute';

interface User {
  id: number;
  username: string;
  email: string;
  role: 'super_admin' | 'admin' | 'user';
  permissions: string[];
}

interface TablePermission {
  id: number;
  userId: number;
  tableName: string;
  canEdit: boolean;
  canView: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TableConfig {
  name: string;
  displayName: string;
  description: string;
}

const AVAILABLE_TABLES: TableConfig[] = [
  {
    name: 'voters',
    displayName: 'Voters Table',
    description: 'Main voter data table with personal information'
  },
  {
    name: 'surnames',
    displayName: 'Surnames Table', 
    description: 'Surname processing and management table'
  },
  {
    name: 'division_data',
    displayName: 'Division Data Table',
    description: 'Administrative division and area mapping data'
  },
  {
    name: 'village_mapping',
    displayName: 'Village Mapping Table',
    description: 'Village and area mapping information'
  },
  {
    name: 'import_sessions',
    displayName: 'Import Sessions Table',
    description: 'Data import session tracking and management'
  }
];

export default function SettingsPage() {
  const { user, hasRole } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [tablePermissions, setTablePermissions] = useState<TablePermission[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState<number | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchTablePermissions();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiService.getUsers();
      if (response.success && response.data) {
        setUsers(response.data as User[]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchTablePermissions = async () => {
    try {
      setLoading(true);
      const response = await apiService.getTablePermissions();
      if (response.success && response.data) {
        setTablePermissions(response.data as TablePermission[]);
      } else {
        // If no permissions found, create default ones
        await createDefaultPermissions();
      }
    } catch (error) {
      console.error('Error fetching table permissions:', error);
      // Create default permissions as fallback
      await createDefaultPermissions();
    } finally {
      setLoading(false);
    }
  };

  const createDefaultPermissions = async () => {
    try {
      // Setup table permissions table and create default permissions
      await apiService.setupTablePermissions();
      // Fetch the newly created permissions
      const response = await apiService.getTablePermissions();
      if (response.success && response.data) {
        setTablePermissions(response.data as TablePermission[]);
      }
    } catch (error) {
      console.error('Error creating default permissions:', error);
      setMessage('Failed to create default permissions');
    }
  };

  const updateTablePermission = (userId: number, tableName: string, canEdit: boolean) => {
    setTablePermissions(prev => 
      prev.map(permission => 
        permission.userId === userId && permission.tableName === tableName
          ? { ...permission, canEdit, updatedAt: new Date().toISOString() }
          : permission
      )
    );
  };

  const saveTablePermissions = async () => {
    try {
      setSaving(true);
      setMessage('');
      
      // Convert tablePermissions to the format expected by the API
      const permissionsToSave = tablePermissions.map(permission => ({
        user_id: permission.userId,
        table_name: permission.tableName,
        can_view: permission.canView,
        can_edit: permission.canEdit
      }));
      
      const response = await apiService.bulkUpdateTablePermissions(permissionsToSave);
      
      if (response.success) {
        setMessage('Table permissions saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Failed to save table permissions');
      }
      
    } catch (error) {
      console.error('Error saving table permissions:', error);
      setMessage('Failed to save table permissions');
    } finally {
      setSaving(false);
    }
  };

  const getUserPermissions = (userId: number) => {
    return tablePermissions.filter(p => p.userId === userId);
  };

  const getTablePermission = (userId: number, tableName: string) => {
    return tablePermissions.find(p => p.userId === userId && p.tableName === tableName);
  };

  const resetToDefaults = async () => {
    if (confirm('Reset all permissions to default values? This cannot be undone.')) {
      try {
        setLoading(true);
        await createDefaultPermissions();
        setMessage('Permissions reset to defaults');
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        console.error('Error resetting permissions:', error);
        setMessage('Failed to reset permissions');
      } finally {
        setLoading(false);
      }
    }
  };

  if (!hasRole(['super_admin', 'admin'])) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access settings.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Settings className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Table Permissions Settings</h1>
                <p className="text-gray-600">Manage which users can edit which tables</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={resetToDefaults}
                disabled={saving}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reset to Defaults</span>
              </button>
              
              <button
                onClick={saveTablePermissions}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
          {message && (
            <div className={`mt-4 p-3 rounded-lg ${
              message.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {message}
            </div>
          )}
        </div>

        {/* User Selection */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Select User to Configure</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map(userItem => (
              <button
                key={userItem.id}
                onClick={() => setSelectedUser(userItem.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedUser === userItem.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-left">
                  <div className="font-semibold text-gray-800">{userItem.username}</div>
                  <div className="text-sm text-gray-600">{userItem.email}</div>
                  <div className={`text-xs px-2 py-1 rounded-full mt-2 inline-block ${
                    userItem.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                    userItem.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {userItem.role.replace('_', ' ').toUpperCase()}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Table Permissions */}
        {selectedUser && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center space-x-2">
              <Database className="w-5 h-5" />
              <span>Table Permissions for {users.find(u => u.id === selectedUser)?.username}</span>
            </h2>
            
            <div className="space-y-4">
              {AVAILABLE_TABLES.map(table => {
                const permission = getTablePermission(selectedUser, table.name);
                const canEdit = permission?.canEdit || false;
                const canView = permission?.canView || false;
                
                return (
                  <div key={table.name} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{table.displayName}</h3>
                        <p className="text-sm text-gray-600 mt-1">{table.description}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${canView ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className="text-sm text-gray-600">View: {canView ? 'Allowed' : 'Denied'}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${canEdit ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className="text-sm text-gray-600">Edit: {canEdit ? 'Allowed' : 'Denied'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={canView}
                            disabled={true} // View is always allowed for now
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Can View</span>
                        </label>
                        
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={canEdit}
                            onChange={(e) => updateTablePermission(selectedUser, table.name, e.target.checked)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Can Edit</span>
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">How to Use</h3>
          <ul className="text-blue-700 space-y-2">
            <li>• Select a user from the list above to configure their table permissions</li>
            <li>• Toggle the "Can Edit" checkbox to allow or deny editing access to specific tables</li>
            <li>• View permissions are currently always enabled for authenticated users</li>
            <li>• Click "Save Changes" to apply the new permissions</li>
            <li>• Use "Reset to Defaults" to restore original permission settings</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
