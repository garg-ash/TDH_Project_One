'use client';

import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, Edit, ArrowLeft, Crown, Shield, User } from 'lucide-react';
import Link from 'next/link';

interface User {
  id: number;
  email: string;
  role: 'super_admin' | 'admin' | 'user';
  name: string;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'user'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage('Failed to fetch users');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('http://localhost:5001/api/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('User created successfully!');
        setFormData({ email: '', password: '', name: '', role: 'user' });
        setShowCreateForm(false);
        fetchUsers();
      } else {
        setMessage(data.error || 'Failed to create user');
      }
    } catch (error) {
      setMessage('Error creating user. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const canCreateRole = (role: string) => {
    // For now, allow creating any role - this can be restricted based on current user's role
    return true;
  };

  const getRoleOptions = () => {
    return [
      { value: 'user', label: 'User', icon: User },
      { value: 'admin', label: 'Admin', icon: Shield },
      { value: 'super_admin', label: 'Super Admin', icon: Crown }
    ].filter(option => canCreateRole(option.value));
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="w-4 h-4" />;
      case 'admin':
        return <Shield className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      {/* Header */}
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Super Admins</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.role === 'super_admin').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Admins</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.role === 'admin').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.role === 'user').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Header Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-3">User Management System</h2>
              <p className="text-gray-600 text-lg">Create and manage system users based on role hierarchy</p>
              <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <Crown className="w-4 h-4 text-purple-500" />
                  <span>Super Admin can create Admin users</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-red-500" />
                  <span>Admin can create regular Users</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-semibold rounded-xl shadow-lg text-white bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Create User
            </button>
          </div>
        </div>

        {/* Create User Form */}
        {showCreateForm && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Create New User</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    placeholder="Enter full name"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    placeholder="Enter email address"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    placeholder="Enter password"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="role" className="block text-sm font-semibold text-gray-700">
                    Role
                  </label>
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  >
                    {getRoleOptions().map(option => {
                      const IconComponent = option.icon;
                      return (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
              
              {message && (
                <div className={`p-4 rounded-xl text-sm border-2 ${
                  message.includes('successfully') 
                    ? 'bg-green-50/80 text-green-800 border-green-200 backdrop-blur-sm' 
                    : 'bg-red-50/80 text-red-800 border-red-200 backdrop-blur-sm'
                }`}>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-3 ${
                      message.includes('successfully') ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
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

        {/* Users Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-gray-100">
            <h3 className="text-xl font-bold text-gray-800">Existing Users</h3>
            <p className="text-gray-600 mt-1">Manage system users and their roles</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200/50">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    User Details
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/60 divide-y divide-gray-200/50">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/80 transition-colors duration-200">
                    <td className="px-8 py-6">
                      <div className="flex items-center">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${
                          user.role === 'super_admin' 
                            ? 'bg-gradient-to-br from-purple-500 to-purple-600' 
                            : user.role === 'admin'
                            ? 'bg-gradient-to-br from-red-500 to-red-600'
                            : 'bg-gradient-to-br from-green-500 to-green-600'
                        }`}>
                          {getRoleIcon(user.role)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        user.role === 'super_admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : user.role === 'admin'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {getRoleIcon(user.role)}
                        <span className="ml-1">{user.role.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-3">
                        <button className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-all duration-200">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-all duration-200">
                          <Trash2 className="w-4 h-4" />
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
                        <p className="text-sm text-gray-400 mt-1">Create your first user to get started</p>
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
  );
}
