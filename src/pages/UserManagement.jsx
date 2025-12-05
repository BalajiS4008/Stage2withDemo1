import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2, Users, Shield, User, Eye, EyeOff, AlertCircle, RefreshCw, Copy, Check, X } from 'lucide-react';
import Pagination from '../components/Pagination';
import usePagination from '../hooks/usePagination';
import { validateAction, adminOverride } from '../utils/subscriptionManager';

const UserManagement = () => {
  const { data, addUser, updateUser, deleteUser } = useData();
  const { user: currentUser, isAdmin } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(true); // Changed to true by default
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'user'
  });
  const [errors, setErrors] = useState({});
  const [passwordGenerated, setPasswordGenerated] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [userLimitReached, setUserLimitReached] = useState(false);
  const [userLimitInfo, setUserLimitInfo] = useState(null);

  // Check user limit on component mount and when users change
  useEffect(() => {
    const checkLimit = async () => {
      const subscriptionTier = currentUser?.subscriptionTier || 'starter';
      const validation = await validateAction('add_user', subscriptionTier, currentUser?.id, isAdmin());
      setUserLimitReached(!validation.allowed && !adminOverride(isAdmin()));
      setUserLimitInfo(validation);
    };
    checkLimit();
  }, [data.users, currentUser, isAdmin]);

  // Generate secure random password
  const generatePassword = () => {
    // Character sets (excluding ambiguous characters)
    const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Excluded I, O
    const lowercase = 'abcdefghijkmnopqrstuvwxyz'; // Excluded l, o
    const numbers = '23456789'; // Excluded 0, 1
    const special = '@#$%&*!';

    const allChars = uppercase + lowercase + numbers + special;

    let password = '';

    // Ensure at least one character from each set
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    // Fill remaining characters (total 12 characters)
    for (let i = password.length; i < 12; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    password = password.split('').sort(() => Math.random() - 0.5).join('');

    return password;
  };

  // Copy password to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(formData.password);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      alert('Failed to copy password. Please copy manually.');
    }
  };

  // Handle generate new password
  const handleGeneratePassword = () => {
    const newPassword = generatePassword();
    setFormData({ ...formData, password: newPassword });
    setPasswordGenerated(true);
    setShowPassword(true);
  };

  // Auto-generate password when opening Add User modal
  useEffect(() => {
    if (showModal && !editingUser) {
      const newPassword = generatePassword();
      setFormData(prev => ({ ...prev, password: newPassword }));
      setPasswordGenerated(true);
      setShowPassword(true);
    }
  }, [showModal, editingUser]);

  // Redirect if not admin
  if (!isAdmin()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-12 text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center shadow-xl">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-3">Access Denied</h2>
          <p className="text-gray-600 text-lg">You don't have permission to access this page</p>
        </div>
      </div>
    );
  }

  const validateForm = () => {
    const newErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    } else {
      // Check for duplicate username (only when creating new user or changing username)
      const isDuplicate = data.users.some(
        u => u.username.toLowerCase() === formData.username.toLowerCase() && 
        (!editingUser || u.id !== editingUser.id)
      );
      if (isDuplicate) {
        newErrors.username = 'Username already exists';
      }
    }

    // Password validation (only required for new users)
    if (!editingUser && !formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (editingUser) {
      // Update existing user
      const updates = {
        username: formData.username,
        name: formData.name,
        role: formData.role
      };

      // Only update password if provided
      if (formData.password) {
        updates.password = formData.password;
      }

      updateUser(editingUser.id, updates);
    } else {
      // Create new user - Check subscription limits first
      const subscriptionTier = currentUser?.subscriptionTier || 'starter';

      // Admin override - skip limit check
      if (!adminOverride(isAdmin())) {
        const validation = await validateAction('add_user', subscriptionTier, currentUser?.id, isAdmin());

        if (!validation.allowed) {
          setErrors({ submit: validation.message });
          return;
        }
      }

      addUser(formData);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      name: '',
      role: 'user'
    });
    setErrors({});
    setEditingUser(null);
    setShowModal(false);
    setShowPassword(true);
    setPasswordGenerated(false);
    setCopySuccess(false);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: user.password, // Show current password for admin to share with user
      name: user.name,
      role: user.role
    });
    setErrors({});
    setPasswordGenerated(false);
    setShowPassword(true); // Show password by default when editing
    setShowModal(true);
  };

  const handleDelete = (userId) => {
    const userToDelete = data.users.find(u => u.id === userId);
    
    // Prevent deleting own account
    if (userToDelete.username === currentUser.username) {
      alert('You cannot delete your own account');
      return;
    }

    if (window.confirm(`Are you sure you want to delete user "${userToDelete.username}"? This action cannot be undone.`)) {
      deleteUser(userId);
    }
  };

  const getRoleBadge = (role) => {
    if (role === 'admin') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-danger-100 text-danger-700">
          <Shield className="w-3.5 h-3.5" />
          Administrator
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-success-100 text-success-700">
        <User className="w-3.5 h-3.5" />
        User
      </span>
    );
  };

  // Pagination hook
  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedData: paginatedUsers,
    handlePageChange,
    handlePageSizeChange
  } = usePagination(data.users || [], 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-1">Manage user accounts and permissions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Users */}
        <div className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{data.users.length}</p>
            </div>
          </div>
        </div>

        {/* Administrators */}
        <div className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-danger-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-danger-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Administrators</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.users.filter(u => u.role === 'admin').length}
              </p>
            </div>
          </div>
        </div>

        {/* Regular Users */}
        <div className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-success-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Regular Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.users.filter(u => u.role === 'user').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-600" />
            All Users
          </h3>
          <button
            onClick={() => setShowModal(true)}
            disabled={userLimitReached}
            className={`btn ${userLimitReached ? 'btn-secondary opacity-50 cursor-not-allowed' : 'btn-primary'} flex items-center gap-2`}
            title={userLimitReached ? userLimitInfo?.message : 'Add new user'}
          >
            <Plus className="w-5 h-5" />
            Add New User
          </button>
        </div>

        {userLimitReached && (
          <div className="mb-4 bg-danger-50 border border-danger-200 rounded-lg p-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-danger-600 flex-shrink-0" />
            <p className="text-sm text-danger-800">{userLimitInfo?.message}</p>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Username</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Role</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-semibold text-sm">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user.username}</div>
                        {user.username === currentUser.username && (
                          <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded font-medium">You</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-700">{user.name}</td>
                  <td className="py-3 px-4">{getRoleBadge(user.role)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Edit user"
                        aria-label={`Edit user ${user.username}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        disabled={user.username === currentUser.username}
                        className={`p-2 rounded-lg transition-colors ${
                          user.username === currentUser.username
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-danger-600 hover:bg-danger-50'
                        }`}
                        title={user.username === currentUser.username ? 'Cannot delete own account' : 'Delete user'}
                        aria-label={`Delete user ${user.username}`}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 border-t border-gray-200 pt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        )}
      </div>

      {/* Add/Edit User Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          onClick={resetForm}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Section - Fixed */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h2>
              <button
                type="button"
                onClick={resetForm}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Content - Scrollable */}
            <div className="overflow-y-auto flex-1 px-8 py-6 scrollbar-thin scrollbar-thumb-indigo-400 scrollbar-track-gray-100 hover:scrollbar-thumb-indigo-500">
              <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username */}
              <div className="group">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  Username
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className={`w-full px-4 py-3.5 pr-12 bg-white border-2 rounded-xl text-gray-800 placeholder-gray-400 transition-all duration-300 focus:outline-none ${
                      errors.username
                        ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/20'
                        : 'border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 group-hover:border-gray-300'
                    }`}
                    placeholder="Enter username"
                    aria-invalid={errors.username ? 'true' : 'false'}
                    aria-describedby={errors.username ? 'username-error' : undefined}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
                {errors.username && (
                  <p id="username-error" className="text-sm text-red-600 mt-2 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    {errors.username}
                  </p>
                )}
              </div>

              {/* Name */}
              <div className="group">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-4 py-3.5 pr-12 bg-white border-2 rounded-xl text-gray-800 placeholder-gray-400 transition-all duration-300 focus:outline-none ${
                      errors.name
                        ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/20'
                        : 'border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 group-hover:border-gray-300'
                    }`}
                    placeholder="Enter full name"
                    aria-invalid={errors.name ? 'true' : 'false'}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                    </svg>
                  </div>
                </div>
                {errors.name && (
                  <p id="name-error" className="text-sm text-red-600 mt-2 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="group">
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    Password
                    {!editingUser && <span className="text-red-500">*</span>}
                  </label>
                  {passwordGenerated && !editingUser && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Auto-generated
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      setPasswordGenerated(false);
                    }}
                    className={`w-full px-4 py-3.5 pr-12 bg-gradient-to-r from-slate-50 to-gray-50 border-2 rounded-xl font-mono text-sm transition-all duration-300 focus:outline-none ${
                      errors.password
                        ? 'border-red-500 text-red-800 focus:border-red-500 focus:ring-4 focus:ring-red-500/20'
                        : 'border-gray-200 text-gray-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20'
                    }`}
                    placeholder={editingUser ? 'Current password' : 'Auto-generated password'}
                    aria-invalid={errors.password ? 'true' : 'false'}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Password Action Buttons */}
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="group/btn flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white rounded-xl font-semibold text-sm transition-all duration-300 shadow-lg shadow-slate-900/20 hover:shadow-xl hover:shadow-slate-900/30 hover:-translate-y-0.5"
                    aria-label="Generate new password"
                  >
                    <RefreshCw className="w-4 h-4 group-hover/btn:rotate-180 transition-transform duration-500" />
                    Generate New
                  </button>
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    disabled={!formData.password}
                    className={`group/btn flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 ${
                      copySuccess
                        ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-emerald-500/30 hover:shadow-emerald-500/40'
                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-indigo-500/30 hover:shadow-indigo-500/40'
                    } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0`}
                    aria-label="Copy password to clipboard"
                  >
                    {copySuccess ? (
                      <>
                        <Check className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                        Copy Password
                      </>
                    )}
                  </button>
                </div>

                {errors.password && (
                  <p id="password-error" className="text-sm text-red-600 mt-2 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    {errors.password}
                  </p>
                )}

                {!editingUser && (
                  <div className="mt-4 flex items-start gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-sm text-blue-800 leading-relaxed">
                      <span className="font-semibold">Important:</span> Copy this password and share it with the new user. This password cannot be retrieved later.
                    </p>
                  </div>
                )}

                {editingUser && (
                  <p className="text-xs text-gray-500 mt-3 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    This is the current password. You can copy it to share with the user or generate a new one.
                  </p>
                )}
              </div>

              {/* Role */}
              <div className="group">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  Role
                </label>
                <div className="relative">
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-gray-800 transition-all duration-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 focus:outline-none group-hover:border-gray-300 appearance-none cursor-pointer pr-12 user-role-select-indicator"
                  >
                    <option value="user">User</option>
                    <option value="admin">Administrator</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
                <p className="mt-2 text-xs text-gray-500 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Administrators have full access to all features including user management
                </p>
              </div>
              </form>
            </div>

            {/* Footer Actions - Fixed */}
            <div className="px-8 py-6 bg-gradient-to-r from-gray-50 to-slate-50 border-t border-gray-200 flex-shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-6 py-3.5 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  className="flex-1 px-6 py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-xl shadow-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

