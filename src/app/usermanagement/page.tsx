'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Users, UserPlus, Trash2, Edit, ArrowLeft, User, Save, X, Plus, Copy, Check } from 'lucide-react';
import Link from 'next/link';
import { AdminOnly } from '../../components/ProtectedRoute';
import { apiService } from '../../services/api';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../contexts/AuthContext';
import ExcelDataTable from '../../components/ExcelDataTable';

interface ManagedUser {
  id: number;
  username: string;
  email: string;
  mobile?: string;
  role: 'super_admin' | 'admin' | 'user';
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  createdBy?: number;
}

interface EditableUser {
  id: number | 'new';
  username: string;
  email: string;
  mobile: string;
  password: string;
  role: 'super_admin' | 'admin' | 'user';
  isEditing: boolean;
  isNew: boolean;
}

export default function UserManagementPage() {
  const { hasRole } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [editableUsers, setEditableUsers] = useState<EditableUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState<number | 'new' | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    // Convert managed users to editable format
    const editable = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      mobile: user.mobile || '',
      password: '',
      role: user.role,
      isEditing: false,
      isNew: false
    }));
    setEditableUsers(editable);
  }, [users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await apiService.getUsers();
      if (res.success && res.data) {
        setUsers(res.data as unknown as ManagedUser[]);
      } else {
        console.warn('API returned success: false:', res);
        setMessage('No user data received');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage('Failed to fetch users. Please check if backend is running.');
      // Set empty array to prevent crashes
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const addNewUserRow = () => {
    const newUser: EditableUser = {
      id: 'new',
      username: '',
      email: '',
      mobile: '',
      password: '',
      role: 'user',
      isEditing: false,
      isNew: true
    };
    setEditableUsers(prev => [newUser, ...prev]);
  };

  const updateEditableUser = (id: number | 'new', field: keyof EditableUser, value: any) => {
    setEditableUsers(prev => 
      prev.map(user => 
        user.id === id ? { ...user, [field]: value } : user
      )
    );
  };

  const startEditing = (id: number | 'new') => {
    setEditingId(id);
    setEditableUsers(prev => 
      prev.map(user => 
        user.id === id ? { ...user, isEditing: true } : user
      )
    );
  };

  const cancelEditing = (id: number | 'new') => {
    if (id === 'new') {
      setEditableUsers(prev => prev.filter(user => user.id !== 'new'));
    } else {
      const originalUser = users.find(u => u.id === id);
      if (originalUser) {
        setEditableUsers(prev => 
          prev.map(user => 
            user.id === id ? {
              ...user,
              username: originalUser.username,
              email: originalUser.email,
              mobile: originalUser.mobile || '',
              password: '',
              role: originalUser.role,
              isEditing: false
            } : user
          )
        );
      }
    }
    setEditingId(null);
  };

  const saveUser = async (user: EditableUser) => {
    if (!user.username || !user.email) {
      setMessage('Username and email are required');
      return;
    }

    if (user.isNew && !user.password) {
      setMessage('Password is required for new users');
      return;
    }

    setLoading(true);
    try {
      if (user.isNew) {
        const payload = {
          username: user.username,
          email: user.email,
          password: user.password,
          mobile: user.mobile,
          role: user.role,
          permissions: []
        };
        const res = await apiService.createUser(payload);
        if (res.success) {
          setMessage('User created successfully!');
          await fetchUsers();
          setEditingId(null);
        } else {
          setMessage(res.message || 'Failed to create user');
        }
      } else {
        const userPayload: any = {
          username: user.username,
          email: user.email,
          mobile: user.mobile,
          role: user.role
        };
        
        const userRes = await apiService.updateUser(user.id as number, userPayload);
        if (!userRes.success) {
          setMessage(userRes.message || 'Failed to update user details');
          return;
        }

        if (user.password) {
          const passwordRes = await apiService.updateUserPassword(user.id as number, user.password);
          if (!passwordRes.success) {
            setMessage(passwordRes.message || 'User updated but password update failed');
            return;
          }
        }

        setMessage('User updated successfully!');
        await fetchUsers();
        setEditingId(null);
      }
    } catch (error: any) {
      setMessage(error?.message || 'Error saving user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    const confirm = window.confirm('Are you sure you want to delete this user?');
    if (!confirm) return;
    
    try {
      setLoading(true);
      const res = await apiService.deleteUser(id);
      if (res.success) {
        setMessage('User deleted successfully');
        await fetchUsers();
      } else {
        setMessage(res.message || 'Failed to delete user');
      }
    } catch (error: any) {
      console.error('Delete user error:', error);
      setMessage(error?.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  // Handle row updates from ExcelDataTable
  const handleUpdateRow = async (rowIndex: number, columnId: string, value: any) => {
    const user = editableUsers[rowIndex];
    if (!user) return;

    if (columnId === 'select') return; // Skip row header updates

    // Update the local state immediately for UI responsiveness
    updateEditableUser(user.id, columnId as keyof EditableUser, value);

    // If this is an existing user (not new), save the change to database immediately
    if (user.id !== 'new' && !user.isEditing) {
      try {
        setLoading(true);
        
        // Prepare the update payload
        const updatePayload: any = {};
        updatePayload[columnId] = value;
        
        // Update user details
        const userRes = await apiService.updateUser(user.id as number, updatePayload);
        if (userRes.success) {
          // Refresh the users list to get updated data
          await fetchUsers();
          setMessage('User updated successfully!');
        } else {
          setMessage(userRes.message || 'Failed to update user');
          // Revert the change if update failed
          const originalUser = users.find(u => u.id === user.id);
          if (originalUser) {
            updateEditableUser(user.id, columnId as keyof EditableUser, originalUser[columnId as keyof ManagedUser] || '');
          }
        }
      } catch (error: any) {
        console.error('Error updating user:', error);
        setMessage(error?.message || 'Error updating user');
        // Revert the change if update failed
        const originalUser = users.find(u => u.id === user.id);
        if (originalUser) {
          updateEditableUser(user.id, columnId as keyof EditableUser, originalUser[columnId as keyof ManagedUser] || '');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  // Check if a field has unsaved changes
  const hasUnsavedChanges = (userId: number | 'new', field: keyof EditableUser) => {
    if (userId === 'new') return false;
    
    const editableUser = editableUsers.find(u => u.id === userId);
    const originalUser = users.find(u => u.id === userId);
    
    if (!editableUser || !originalUser) return false;
    
    const editableValue = editableUser[field];
    const originalValue = originalUser[field as keyof ManagedUser];
    
    return editableValue !== originalValue;
  };

  // Check if a user has any unsaved changes
  const hasAnyUnsavedChanges = (userId: number | 'new') => {
    if (userId === 'new') return false;
    
    return ['username', 'email', 'mobile', 'role'].some(field => 
      hasUnsavedChanges(userId, field as keyof EditableUser)
    );
  };

  // Save all unsaved changes for a specific user
  const saveAllChanges = async (userId: number | 'new') => {
    if (userId === 'new') return;
    
    const editableUser = editableUsers.find(u => u.id === userId);
    if (!editableUser) return;
    
    try {
      setLoading(true);
      
      // Prepare the update payload with all changed fields
      const updatePayload: any = {};
      let hasChanges = false;
      
      ['username', 'email', 'mobile', 'role'].forEach(field => {
        if (hasUnsavedChanges(userId, field as keyof EditableUser)) {
          updatePayload[field] = editableUser[field as keyof EditableUser];
          hasChanges = true;
        }
      });
      
      if (!hasChanges) return;
      
      // Update user details
      const userRes = await apiService.updateUser(userId as number, updatePayload);
      if (userRes.success) {
        // Refresh the users list to get updated data
        await fetchUsers();
        setMessage('All changes saved successfully!');
      } else {
        setMessage(userRes.message || 'Failed to save changes');
      }
    } catch (error: any) {
      console.error('Error saving changes:', error);
      setMessage(error?.message || 'Error saving changes');
    } finally {
      setLoading(false);
    }
  };

  // Transform data for ExcelDataTable - make it reactive to editableUsers changes
  const tableData = useMemo(() => {
    return editableUsers.map((user, index) => ({
      select: index + 1,
      username: user.username,
      email: user.email,
      mobile: user.mobile || '-',
      password: user.isEditing ? user.password : '••••••••',
      role: user.role,
      actions: null // This will be handled by the cell renderer
    }));
  }, [editableUsers]);

  // Define columns for ExcelDataTable
  const columns = [
    {
      id: 'select',
      header: 'Sr. No.',
      size: 80,
      isRowHeader: true
    },
    {
      id: 'username',
      header: 'Username',
      size: 150
    },
    {
      id: 'email',
      header: 'Email',
      size: 200
    },
    {
      id: 'mobile',
      header: 'Mobile',
      size: 120
    },
    {
      id: 'password',
      header: 'Password',
      size: 120
    },
    {
      id: 'role',
      header: 'Role',
      size: 100
    },
    {
      id: 'actions',
      header: 'Actions',
      size: 120,
      cell: (props: any) => {
        const { rowIndex } = props;
        const user = editableUsers[rowIndex];
        if (!user) return null;

        const hasChanges = hasAnyUnsavedChanges(user.id);

        return (
          <div className="flex items-center justify-center space-x-2">
            {user.isEditing ? (
              <>
                <button
                  onClick={() => saveUser(user)}
                  disabled={loading}
                  className="text-green-600 hover:text-green-800 p-2 rounded hover:bg-green-100 transition-all duration-200"
                  title="Save"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => cancelEditing(user.id)}
                  className="text-gray-600 hover:text-gray-800 p-2 rounded hover:bg-gray-100 transition-all duration-200"
                  title="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => startEditing(user.id)}
                  className="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-100 transition-all duration-200"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                {hasChanges && (
                  <button
                    onClick={() => saveAllChanges(user.id)}
                    disabled={loading}
                    className="text-green-600 hover:text-green-800 p-2 rounded hover:bg-green-100 transition-all duration-200"
                    title="Save Changes"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                  </button>
                )}
                {!user.isNew && (
                  <button
                    onClick={() => handleDeleteUser(user.id as number)}
                    className="text-red-600 hover:text-red-800 p-2 rounded hover:bg-red-100 transition-all duration-200"
                    title="Delete"
                    disabled={loading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <AdminOnly>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
        <Navbar />
        <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center space-x-4">
                <Link
                  href="/"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white/60 hover:bg-white hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-all duration-200 backdrop-blur-sm"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Link>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl flex items-center justify-center shadow-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-4">
          {/* Compact Header with Stats and Actions */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-md">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-xl font-bold text-gray-900">{users.length}</p>
                  </div>
                </div>
                <div className="h-8 w-px bg-gray-300"></div>
              </div>
              <button
                onClick={addNewUserRow}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg shadow-md text-white bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New User
              </button>
            </div>
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-sm border-2 mb-4 ${message.includes('successfully') ? 'bg-green-50/80 text-green-800 border-green-200 backdrop-blur-sm' : 'bg-red-50/80 text-red-800 border-red-200 backdrop-blur-sm'}`}>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-3 ${message.includes('successfully') ? 'bg-green-500' : 'bg-red-500'}`}></div>
                {message}
              </div>
            </div>
          )}
          
          {/* Show loading state */}
          {loading && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-8 mb-4">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <div className="text-gray-600">Loading users...</div>
              </div>
            </div>
          )}
          
          {/* Show error state when no users */}
          {!loading && users.length === 0 && !message.includes('Failed') && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-8 mb-4">
              <div className="text-center">
                <div className="text-gray-500 text-lg mb-2">No users found</div>
                <div className="text-gray-400">Start by adding a new user</div>
              </div>
            </div>
          )}

          {/* Maximized Table Container */}
          {!loading && users.length > 0 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 overflow-hidden">
              <ExcelDataTable
                data={tableData}
                columns={columns}
                loading={loading}
                onUpdateRow={handleUpdateRow}
                enableExcelFeatures={true}
                showRefreshButton={false}
                tableHeight="h-[calc(100vh-280px)]"
                rowHeight={48}
                enableColumnResize={true}
                enableRowResize={false}
              />
            </div>
          )}
        </div>
      </div>
    </AdminOnly>
  );
}
