'use client';

import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, Edit, ArrowLeft, User } from 'lucide-react';
import Link from 'next/link';
import { AdminOnly } from '../../components/ProtectedRoute';
import { apiService } from '../../services/api';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../contexts/AuthContext';

interface ManagedUser {
  id: number;
  username: string;
  email: string;
  role: 'super_admin' | 'admin' | 'user';
}

export default function UserManagementPage() {
  const { hasRole } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    mobile: '',
    role: 'user' as 'user' | 'admin' | 'super_admin',
  });
  const [editUserId, setEditUserId] = useState<number | null>(null);
  const [editData, setEditData] = useState<{ email: string; mobile?: string; role: 'user'|'admin'|'super_admin' }>({ email: '', mobile: '', role: 'user' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await apiService.getUsers();
      setUsers((res.data || []) as unknown as ManagedUser[]);
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage('Failed to fetch users');
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const payload = { ...formData, permissions: [] as string[] };
      const res = await apiService.createUser(payload);
      if (res.success) {
        setMessage('User created successfully!');
        setFormData({ username: '', email: '', password: '', mobile: '', role: 'user' });
        setShowCreateForm(false);
        fetchUsers();
      } else {
        setMessage(res.message || 'Failed to create user');
      }
    } catch (error: any) {
      setMessage(error?.message || 'Error creating user. Please ensure you are logged in as admin.');
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (u: any) => {
    setEditUserId(u.id);
    setEditData({ email: u.email || '', mobile: (u as any).mobile || '', role: u.role });
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editUserId == null) return;
    try {
      setLoading(true);
      const res = await apiService.updateUser(editUserId, {
        email: editData.email,
        role: editData.role,
        // mobile_no is mapped as mobile on API; backend maps to mobile_no
        mobile: editData.mobile,
      } as any);
      if (res.success) {
        setMessage('User updated successfully');
        setEditUserId(null);
        await fetchUsers();
      } else {
        setMessage(res.message || 'Failed to update user');
      }
    } catch (error: any) {
      console.error('Update user error:', error);
      setMessage(error?.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

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

        <div className="max-w-7xl mx-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-3">User Management System</h2>
                <p className="text-gray-600 text-lg">Create and manage system users</p>
              </div>
              <button
                onClick={() => {
                  setFormData({ username: '', email: '', mobile: '', password: '', role: 'user' });
                  setMessage('');
                  setShowCreateForm(true);
                }}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-semibold rounded-xl shadow-lg text-white bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 transform hover:scale-105 active:scale-95"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Create User
              </button>
            </div>
          </div>

          {showCreateForm && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800">Create New User</h3>
                <button onClick={() => setShowCreateForm(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-6" autoComplete="off">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="username" className="block text-sm font-semibold text-gray-700">Username</label>
                    <input
                      type="text"
                      id="username"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      autoComplete="off"
                      className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                      placeholder="Enter username"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      autoComplete="off"
                      className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                      placeholder="Enter email address"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="mobile" className="block text-sm font-semibold text-gray-700">Mobile Number</label>
                    <input
                      type="tel"
                      id="mobile"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      autoComplete="off"
                      className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                      placeholder="Enter mobile number"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700">Password</label>
                    <input
                      type="password"
                      id="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      autoComplete="new-password"
                      className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                      placeholder="Enter password"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as 'user' | 'admin' | 'super_admin' })}
                      className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      {hasRole(['super_admin']) && <option value="super_admin">Super Admin</option>}
                    </select>
                    <p className="text-xs text-gray-500">Choose the appropriate role for the new account.</p>
                  </div>
                </div>

                {message && (
                  <div className={`p-4 rounded-xl text-sm border-2 ${message.includes('successfully') ? 'bg-green-50/80 text-green-800 border-green-200 backdrop-blur-sm' : 'bg-red-50/80 text-red-800 border-red-200 backdrop-blur-sm'}`}>
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-3 ${message.includes('successfully') ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      {message}
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-4 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center px-8 py-3 border border-transparent text-base font-semibold rounded-xl shadow-lg text-white bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Creating User...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5 mr-2" />
                        Create User
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="inline-flex items-center px-6 py-3 border-2 border-gray-300 text-base font-semibold rounded-xl text-gray-700 bg-white/60 hover:bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-gray-100">
              <h3 className="text-xl font-bold text-gray-800">Existing Users</h3>
              <p className="text-gray-600 mt-1">Manage system users</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200/50">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User Details</th>
                    <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                    <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white/60 divide-y divide-gray-200/50">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/80 transition-colors duration-200">
                      <td className="px-8 py-6">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                            <User className="w-6 h-6 text-white" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">{user.username}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-sm text-gray-700 font-medium">{user.role}</span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center space-x-3">
                          <button className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-all duration-200" title="Edit" onClick={() => openEdit(user)}>
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-all duration-200"
                            title="Delete"
                            disabled={loading}
                          >
                            {loading ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-8 py-12 text-center">
                        <div className="text-gray-500">
                          <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-lg font-medium text-gray-400">No users found</p>
                          <p className="text-sm text-gray-400 mt-1">Create your first admin to get started</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {editUserId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Edit User</h3>
              <button onClick={() => setEditUserId(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleUpdateUser} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  className="mt-1 block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Mobile</label>
                <input
                  type="tel"
                  value={editData.mobile || ''}
                  onChange={(e) => setEditData({ ...editData, mobile: e.target.value })}
                  className="mt-1 block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select
                  value={editData.role}
                  onChange={(e) => setEditData({ ...editData, role: e.target.value as 'user'|'admin'|'super_admin' })}
                  className="mt-1 block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  {hasRole(['super_admin']) && <option value="super_admin">Super Admin</option>}
                </select>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditUserId(null)} className="px-5 py-2 rounded-xl border-2 border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={loading} className="px-6 py-2 rounded-xl bg-gray-700 text-white hover:bg-gray-800 disabled:opacity-50">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminOnly>
  );
}
