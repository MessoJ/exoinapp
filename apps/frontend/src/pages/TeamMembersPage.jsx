import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersApi } from '../lib/api';
import { 
  Users, Plus, Mail, Shield, Edit, Trash2, UserCheck, UserX,
  X, Save, Loader2, Eye, EyeOff, Search, Filter, AlertCircle,
  Key, MoreVertical, Check, ChevronDown
} from 'lucide-react';

// Role badges with descriptions
const ROLES = {
  ADMIN: { 
    label: 'Administrator', 
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    description: 'Full access to all features including user management and company settings'
  },
  MANAGER: { 
    label: 'Manager', 
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    description: 'Can manage documents, clients, and view team members'
  },
  STAFF: { 
    label: 'Staff', 
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    description: 'Basic access to create and manage own documents'
  }
};

// Permission Matrix
const PERMISSIONS = {
  ADMIN: ['users.create', 'users.edit', 'users.delete', 'company.edit', 'documents.all', 'clients.all', 'mail.all', 'settings.all'],
  MANAGER: ['documents.all', 'clients.all', 'mail.all', 'users.view'],
  STAFF: ['documents.own', 'clients.view', 'mail.own']
};

const TeamMembersPage = () => {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    jobTitle: '',
    role: 'STAFF',
    password: '',
    phone: '',
    isActive: true
  });

  const isAdmin = currentUser?.role === 'ADMIN';
  const canManageUsers = isAdmin;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await usersApi.getAll();
      setUsers(response.data || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setError('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      jobTitle: '',
      role: 'STAFF',
      password: '',
      phone: '',
      isActive: true
    });
    setEditingUser(null);
    setError('');
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      jobTitle: user.jobTitle || '',
      role: user.role,
      password: '',
      phone: user.phone || '',
      isActive: user.status === 'ACTIVE'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canManageUsers) {
      setError('You do not have permission to manage users');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        jobTitle: formData.jobTitle,
        userRole: formData.role,
        phone: formData.phone,
        status: formData.isActive ? 'ACTIVE' : 'INACTIVE',
        ...(formData.password && { password: formData.password })
      };

      if (editingUser) {
        await usersApi.update(editingUser.id, userData);
        setSuccess('Team member updated successfully');
      } else {
        if (!formData.password) {
          setError('Password is required for new users');
          setSaving(false);
          return;
        }
        await usersApi.create(userData);
        setSuccess('Team member added successfully');
      }

      await fetchUsers();
      setShowModal(false);
      resetForm();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!canManageUsers) return;

    try {
      await usersApi.delete(userId);
      setUsers(users.filter(u => u.id !== userId));
      setShowDeleteConfirm(null);
      setSuccess('Team member removed successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleToggleStatus = async (user) => {
    if (!canManageUsers) return;

    try {
      const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await usersApi.updateStatus(user.id, newStatus);
      await fetchUsers();
    } catch (err) {
      setError('Failed to update user status');
    }
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-slate-500">Loading team members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Team Members</h1>
          <p className="text-slate-500">Manage your team and their access permissions</p>
        </div>
        {canManageUsers && (
          <button 
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors shadow-lg shadow-orange-600/25"
          >
            <Plus size={20} />
            Add Team Member
          </button>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto p-1 hover:bg-red-100 rounded">
            <X size={16} />
          </button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
          <Check size={20} />
          <span>{success}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{users.length}</p>
              <p className="text-sm text-slate-500">Total Members</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <UserCheck size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{users.filter(u => u.status === 'ACTIVE').length}</p>
              <p className="text-sm text-slate-500">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Shield size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{users.filter(u => u.role === 'ADMIN').length}</p>
              <p className="text-sm text-slate-500">Administrators</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <UserX size={20} className="text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{users.filter(u => u.status !== 'ACTIVE').length}</p>
              <p className="text-sm text-slate-500">Inactive</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div className="relative">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="appearance-none px-4 py-2.5 pr-10 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Administrators</option>
            <option value="MANAGER">Managers</option>
            <option value="STAFF">Staff</option>
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Member</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Email</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Role</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Job Title</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Status</th>
                {canManageUsers && (
                  <th className="text-right px-6 py-4 text-sm font-semibold text-slate-600">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-medium text-sm">
                        {getInitials(user.firstName, user.lastName)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{user.firstName} {user.lastName}</p>
                        <p className="text-sm text-slate-500">
                          Joined {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {user.id === currentUser?.id && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">You</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail size={14} className="text-slate-400" />
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${ROLES[user.role]?.color || ROLES.STAFF.color}`}>
                      {ROLES[user.role]?.label || user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {user.jobTitle || '-'}
                  </td>
                  <td className="px-6 py-4">
                    {user.status === 'ACTIVE' ? (
                      <span className="flex items-center gap-1.5 text-green-600 text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-slate-400 text-sm">
                        <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
                        Inactive
                      </span>
                    )}
                  </td>
                  {canManageUsers && (
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => openEditModal(user)}
                          className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(user)}
                          className={`p-2 rounded-lg ${user.status === 'ACTIVE' ? 'hover:bg-amber-50 text-amber-500' : 'hover:bg-green-50 text-green-500'}`}
                          title={user.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        >
                          {user.status === 'ACTIVE' ? <UserX size={16} /> : <UserCheck size={16} />}
                        </button>
                        {user.id !== currentUser?.id && (
                          <button 
                            onClick={() => setShowDeleteConfirm(user)}
                            className="p-2 hover:bg-red-50 rounded-lg text-slate-500 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">
              {searchQuery || roleFilter !== 'ALL' ? 'No matching team members found' : 'No team members yet'}
            </p>
            {canManageUsers && !searchQuery && roleFilter === 'ALL' && (
              <button 
                onClick={() => { resetForm(); setShowModal(true); }}
                className="mt-4 text-orange-600 hover:text-orange-700 font-medium"
              >
                Add your first team member
              </button>
            )}
          </div>
        )}
      </div>

      {/* Role Permissions Info */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Shield size={20} className="text-slate-600" />
          Role-Based Access Control (RBAC)
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          {Object.entries(ROLES).map(([key, role]) => (
            <div key={key} className="bg-white rounded-lg border border-slate-200 p-4">
              <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full border mb-2 ${role.color}`}>
                {role.label}
              </span>
              <p className="text-sm text-slate-600">{role.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Add/Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingUser ? 'Edit Team Member' : 'Add Team Member'}
              </h2>
              <button 
                onClick={() => { setShowModal(false); resetForm(); }}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                  disabled={!!editingUser}
                />
                {editingUser && (
                  <p className="text-xs text-slate-500 mt-1">Email cannot be changed after creation</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Job Title</label>
                  <input
                    type="text"
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={handleInputChange}
                    placeholder="e.g., Marketing Manager"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+254 700 000000"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role *</label>
                <select 
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="STAFF">Staff</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Administrator</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  {ROLES[formData.role]?.description}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {editingUser ? 'New Password (leave blank to keep current)' : 'Password *'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 pr-10 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required={!editingUser}
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="isActive"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-orange-600 border-slate-300 rounded focus:ring-orange-500"
                />
                <label htmlFor="isActive" className="text-sm text-slate-700">
                  Account is active (user can log in)
                </label>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium disabled:opacity-50"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {editingUser ? 'Update Member' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={28} className="text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete Team Member?</h3>
              <p className="text-slate-500 mb-6">
                Are you sure you want to delete <strong>{showDeleteConfirm.firstName} {showDeleteConfirm.lastName}</strong>? 
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm.id)}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamMembersPage;
