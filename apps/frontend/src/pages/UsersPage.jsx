import React, { useState, useEffect, useMemo, Fragment } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usersApi, emailHostingApi, rbacApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { usePermission, Can } from '../context/PermissionContext';
import { Dialog, Transition, Menu } from '@headlessui/react';
import { 
  Users, Plus, Mail, Shield, ShieldCheck, ShieldAlert, Key,
  Edit, Trash2, UserCheck, UserX, Link as LinkIcon, RefreshCw,
  CheckCircle, XCircle, AlertTriangle, Eye, EyeOff, Copy,
  Search, Filter, Grid, List, ChevronDown, ExternalLink,
  Inbox, Settings, Building2, Calendar, MailPlus, Check,
  Sliders, Lock, ArrowRight, UserPlus, FileText, Receipt,
  Truck, ClipboardCheck, Sparkles, X, ChevronRight, History,
  Info, AlertCircle, Phone, Briefcase
} from 'lucide-react';

// Role styling definitions following Apple Human Interface Guidelines
export const ROLES_METADATA = {
  ADMIN: {
    id: 'ADMIN',
    label: 'Administrator',
    description: 'Unrestricted superuser access to all workspace systems, banking, domains & permissions',
    badge: 'bg-purple-50 text-purple-700 border-purple-200/80',
    dot: 'bg-purple-500',
    gradient: 'from-purple-500 to-indigo-600',
    icon: ShieldAlert
  },
  MANAGER: {
    id: 'MANAGER',
    label: 'Operations Lead',
    description: 'Full management of documents, invoices, service cards, clients, and team members',
    badge: 'bg-blue-50 text-blue-700 border-blue-200/80',
    dot: 'bg-blue-500',
    gradient: 'from-blue-500 to-cyan-600',
    icon: ShieldCheck
  },
  STAFF: {
    id: 'STAFF',
    label: 'Field Technician',
    description: 'Operational technician access for Service Job Cards, Goods Delivery Notes & Work Email',
    badge: 'bg-slate-50 text-slate-700 border-slate-200/80',
    dot: 'bg-slate-400',
    gradient: 'from-slate-500 to-slate-700',
    icon: Users
  },
  FINANCE: {
    id: 'FINANCE',
    label: 'Finance & Billing',
    description: 'Commercial invoice generation (16% VAT), price quotes, delivery notes & billing records',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dot: 'bg-emerald-500',
    gradient: 'from-emerald-500 to-teal-600',
    icon: Receipt
  },
  AUDITOR: {
    id: 'AUDITOR',
    label: 'Compliance Auditor',
    description: 'Read-only access across documents, financial statements, and administrative security logs',
    badge: 'bg-amber-50 text-amber-700 border-amber-200/80',
    dot: 'bg-amber-500',
    gradient: 'from-amber-500 to-orange-600',
    icon: Shield
  }
};

const UsersPage = () => {
  const { user: currentUser } = useAuth();
  const { hasPermission, isAdmin } = usePermission();

  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'team';
  const [activeTab, setActiveTab] = useState(initialTab); // 'team' | 'matrix' | 'mailboxes' | 'audit'

  // Loading & State
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [domains, setDomains] = useState([]);
  const [unlinkedMailboxes, setUnlinkedMailboxes] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // RBAC Matrix State
  const [permissionsCatalog, setPermissionsCatalog] = useState([]);
  const [roleMatrix, setRoleMatrix] = useState({});
  const [categories, setCategories] = useState([]);
  const [savingMatrix, setSavingMatrix] = useState(false);
  const [selectedRoleSim, setSelectedRoleSim] = useState('STAFF');

  // Slide-over User Permissions Drawer
  const [selectedUserForRbac, setSelectedUserForRbac] = useState(null);
  const [userRbacLoading, setUserRbacLoading] = useState(false);
  const [userRbacData, setUserRbacData] = useState(null);
  const [userCustomPerms, setUserCustomPerms] = useState([]);
  const [savingUserPerms, setSavingUserPerms] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'STAFF',
    jobTitle: '',
    phone: '',
    password: '',
    isActive: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterMailbox, setFilterMailbox] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Feedback
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Initial load
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError('');

      const [usersRes, statsRes, domainsRes, permRes, matrixRes] = await Promise.all([
        usersApi.getAll().catch(() => ({ data: [] })),
        usersApi.getStats().catch(() => ({ data: null })),
        emailHostingApi.getDomains().catch(() => ({ data: { domains: [] } })),
        rbacApi.getPermissions().catch(() => ({ data: { permissions: [], categories: [] } })),
        rbacApi.getMatrix().catch(() => ({ data: { matrix: {} } }))
      ]);

      setUsers(usersRes.data || []);
      setStats(statsRes.data);
      setDomains(domainsRes.data.domains || []);
      setPermissionsCatalog(permRes.data.permissions || []);
      setCategories(permRes.data.categories || []);
      setRoleMatrix(matrixRes.data.matrix || {});
    } catch (err) {
      console.error('Failed to load initial RBAC & User data:', err);
      setError('Failed to load team data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await usersApi.getAuditLogs({ limit: 50 });
      setAuditLogs(res.data.logs || []);
    } catch (err) {
      console.warn('Failed to fetch audit logs:', err);
    }
  };

  const fetchUnlinkedMailboxes = async () => {
    try {
      const res = await usersApi.getUnlinkedMailboxes();
      setUnlinkedMailboxes(res.data.mailboxes || []);
    } catch (err) {
      console.warn('Failed to fetch unlinked mailboxes:', err);
    }
  };

  // Open user permissions drawer
  const openUserPermissionsDrawer = async (user) => {
    setSelectedUserForRbac(user);
    setUserRbacLoading(true);
    try {
      const res = await rbacApi.getUserPermissions(user.id);
      setUserRbacData(res.data);
      setUserCustomPerms(res.data.customPermissions || []);
    } catch (err) {
      console.error('Failed to load user permissions:', err);
      setError('Failed to fetch individual permissions');
    } finally {
      setUserRbacLoading(false);
    }
  };

  // Save custom permissions for a user
  const handleSaveUserPermissions = async () => {
    if (!selectedUserForRbac) return;
    try {
      setSavingUserPerms(true);
      const res = await rbacApi.updateUserPermissions(selectedUserForRbac.id, userCustomPerms);
      setUserRbacData(prev => ({
        ...prev,
        customPermissions: res.data.customPermissions,
        effectivePermissions: res.data.effectivePermissions
      }));
      setSuccess(`Permissions updated for ${selectedUserForRbac.firstName}`);
      setTimeout(() => setSuccess(''), 3500);
      fetchInitialData();
    } catch (err) {
      console.error('Failed to update custom permissions:', err);
      setError(err.response?.data?.message || 'Failed to update user permissions');
    } finally {
      setSavingUserPerms(false);
    }
  };

  // Toggle role permission in matrix
  const handleToggleRolePermission = async (role, permissionId) => {
    if (role === 'ADMIN') return; // Admin is permanent wildcard

    const currentPerms = roleMatrix[role] || [];
    const isGranted = currentPerms.includes('*') || currentPerms.includes(permissionId);

    let nextPerms;
    if (isGranted) {
      nextPerms = currentPerms.filter(p => p !== permissionId && p !== '*');
    } else {
      nextPerms = [...currentPerms, permissionId];
    }

    // Optimistic UI update
    setRoleMatrix(prev => ({
      ...prev,
      [role]: nextPerms
    }));

    try {
      await rbacApi.updateMatrix(role, nextPerms);
      setSuccess(`Updated ${ROLES_METADATA[role]?.label || role} permissions`);
      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      console.error('Failed to update matrix:', err);
      setError('Failed to save permission change to server');
      // Rollback
      fetchInitialData();
    }
  };

  // Reset role to defaults
  const handleResetRoleMatrix = async (role) => {
    try {
      setSavingMatrix(true);
      const res = await rbacApi.resetMatrix(role);
      setRoleMatrix(prev => ({
        ...prev,
        [role]: res.data.permissions
      }));
      setSuccess(`Reset ${ROLES_METADATA[role]?.label || role} to system defaults`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to reset role:', err);
      setError('Failed to reset role defaults');
    } finally {
      setSavingMatrix(false);
    }
  };

  // User CRUD
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await usersApi.create({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        jobTitle: formData.jobTitle,
        phone: formData.phone
      });
      setShowAddModal(false);
      setCopiedPassword(formData.password);
      setSuccess(`Member account created for ${formData.firstName} ${formData.lastName}`);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        role: 'STAFF',
        jobTitle: '',
        phone: '',
        password: '',
        isActive: true
      });
      fetchInitialData();
    } catch (err) {
      console.error('Failed to create user:', err);
      setError(err.response?.data?.error || 'Failed to create user account');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      setLoading(true);
      await usersApi.update(selectedUser.id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        role: formData.role,
        jobTitle: formData.jobTitle,
        phone: formData.phone,
        password: formData.password || undefined,
        isActive: formData.isActive
      });
      setShowEditModal(false);
      setSuccess(`Updated ${formData.firstName} ${formData.lastName}`);
      setTimeout(() => setSuccess(''), 3000);
      fetchInitialData();
    } catch (err) {
      console.error('Failed to update user:', err);
      setError(err.response?.data?.error || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      const newStatus = user.isActive ? 'INACTIVE' : 'ACTIVE';
      await usersApi.updateStatus(user.id, newStatus);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: !user.isActive, status: newStatus } : u));
      setSuccess(`User status marked as ${newStatus}`);
      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      console.error('Failed to toggle status:', err);
      setError('Failed to update user status');
    }
  };

  const handleDeleteUser = async (user) => {
    try {
      await usersApi.delete(user.id);
      setShowDeleteConfirm(null);
      setSuccess(`Deleted ${user.firstName} ${user.lastName}`);
      setTimeout(() => setSuccess(''), 2500);
      fetchInitialData();
    } catch (err) {
      console.error('Failed to delete user:', err);
      setError(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
    let pwd = '';
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password: pwd }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard');
    setTimeout(() => setSuccess(''), 2000);
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      role: user.role || 'STAFF',
      jobTitle: user.jobTitle || '',
      phone: user.phone || '',
      password: '',
      isActive: user.isActive !== false
    });
    setShowEditModal(true);
  };

  // Filtered members list
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q) ||
        user.jobTitle?.toLowerCase().includes(q) ||
        user.primaryEmail?.toLowerCase().includes(q);

      const matchesRole = filterRole === 'ALL' || user.role === filterRole;
      const matchesMailbox = filterMailbox === 'ALL' ||
        (filterMailbox === 'WITH' && user.hasMailbox) ||
        (filterMailbox === 'WITHOUT' && !user.hasMailbox);

      return matchesSearch && matchesRole && matchesMailbox;
    });
  }, [users, searchQuery, filterRole, filterMailbox]);

  const usersWithoutMailbox = useMemo(() => {
    return users.filter(u => !u.hasMailbox);
  }, [users]);

  return (
    <div className="space-y-6 pb-36 sm:pb-16 max-w-7xl mx-auto">
      {/* Toast Feedback */}
      {success && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle size={18} />
          <span className="text-sm font-medium">{success}</span>
        </div>
      )}
      {error && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 flex items-center gap-2 bg-red-600 text-white px-4 py-3 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-4 duration-200">
          <AlertCircle size={18} />
          <span className="text-sm font-medium">{error}</span>
          <button onClick={() => setError('')} className="ml-2 hover:opacity-80">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Hero Header - Apple Glass Surface */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-slate-200/80 p-5 sm:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-orange-600 uppercase tracking-wider">
              <span>Administration</span>
              <ChevronRight size={12} className="text-slate-400" />
              <span>Identity & Security</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Team Directory & Enterprise RBAC
            </h1>
            <p className="text-sm text-slate-500">
              Manage team accounts, corporate mailboxes, and fine-grained access control policies.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              onClick={fetchInitialData}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 active:scale-95 transition-all"
              title="Refresh Directory"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>

            <Can perform="users:create">
              <button
                onClick={() => {
                  generatePassword();
                  setShowAddModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-orange-500/20 active:scale-95 transition-all"
              >
                <Plus size={18} />
                <span>Add Member</span>
              </button>
            </Can>
          </div>
        </div>

        {/* Workspace Quick Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-100">
            <div className="bg-slate-50/80 rounded-xl p-3 sm:p-4">
              <div className="text-xs font-medium text-slate-500">Total Members</div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{stats.total || users.length}</div>
            </div>
            <div className="bg-slate-50/80 rounded-xl p-3 sm:p-4">
              <div className="text-xs font-medium text-slate-500">Active Accounts</div>
              <div className="text-xl sm:text-2xl font-bold text-emerald-600 mt-1">{stats.active || users.filter(u => u.isActive).length}</div>
            </div>
            <div className="bg-slate-50/80 rounded-xl p-3 sm:p-4">
              <div className="text-xs font-medium text-slate-500">Corporate Mailboxes</div>
              <div className="text-xl sm:text-2xl font-bold text-blue-600 mt-1">{stats.withMailbox || users.filter(u => u.hasMailbox).length}</div>
            </div>
            <div className="bg-slate-50/80 rounded-xl p-3 sm:p-4">
              <div className="text-xs font-medium text-slate-500">Security Roles</div>
              <div className="text-xl sm:text-2xl font-bold text-purple-600 mt-1">5 Standard</div>
            </div>
          </div>
        )}

        {/* Apple Segmented Tab Control */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl mt-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('team')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap active:scale-98 ${
              activeTab === 'team'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users size={16} />
            <span>Team Directory</span>
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-200/60 text-slate-700">
              {users.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap active:scale-98 ${
              activeTab === 'matrix'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck size={16} className="text-purple-600" />
            <span>Roles & Permissions Matrix</span>
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-purple-100 text-purple-700 font-bold">
              RBAC
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('mailboxes');
              fetchUnlinkedMailboxes();
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap active:scale-98 ${
              activeTab === 'mailboxes'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail size={16} className="text-blue-600" />
            <span>Mailbox Provisioning</span>
            {usersWithoutMailbox.length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-orange-100 text-orange-700 font-bold">
                {usersWithoutMailbox.length} pending
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('audit');
              fetchAuditLogs();
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap active:scale-98 ${
              activeTab === 'audit'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History size={16} className="text-slate-500" />
            <span>Security Audit Trail</span>
          </button>
        </div>
      </div>

      {/* ========================================================== */}
      {/* TAB 1: TEAM DIRECTORY                                     */}
      {/* ========================================================== */}
      {activeTab === 'team' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search member by name, email, or designation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-2 text-xs sm:text-sm font-medium bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 text-slate-700"
              >
                <option value="ALL">All Roles</option>
                <option value="ADMIN">Admins</option>
                <option value="MANAGER">Managers</option>
                <option value="STAFF">Staff</option>
                <option value="FINANCE">Finance</option>
                <option value="AUDITOR">Auditors</option>
              </select>

              <select
                value={filterMailbox}
                onChange={(e) => setFilterMailbox(e.target.value)}
                className="px-3 py-2 text-xs sm:text-sm font-medium bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 text-slate-700"
              >
                <option value="ALL">All Mailboxes</option>
                <option value="WITH">With Mailbox</option>
                <option value="WITHOUT">Pending Mailbox</option>
              </select>

              {/* View Toggle */}
              <div className="flex items-center p-0.5 bg-slate-100 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-all ${
                    viewMode === 'grid' ? 'bg-white shadow-xs text-orange-600' : 'text-slate-500'
                  }`}
                  title="Grid View"
                >
                  <Grid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-md transition-all ${
                    viewMode === 'table' ? 'bg-white shadow-xs text-orange-600' : 'text-slate-500'
                  }`}
                  title="List View"
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Copied Password Banner */}
          {copiedPassword && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Key className="text-emerald-600" size={20} />
                <div>
                  <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">
                    New Account Password Generated
                  </p>
                  <p className="text-sm font-mono text-emerald-900 mt-0.5 select-all">
                    {copiedPassword}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(copiedPassword)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Copy size={13} />
                  <span>Copy</span>
                </button>
                <button
                  onClick={() => setCopiedPassword(null)}
                  className="p-1.5 text-emerald-700 hover:bg-emerald-100 rounded-lg"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Members List - Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map((user) => {
                const roleMeta = ROLES_METADATA[user.role] || ROLES_METADATA.STAFF;
                const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
                const hasOverrides = user.customPermissions && user.customPermissions.length > 0;

                return (
                  <div
                    key={user.id}
                    className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${roleMeta.gradient} flex items-center justify-center text-white font-bold text-base shadow-sm`}>
                            {initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-bold text-slate-900 text-base leading-tight">
                                {user.firstName} {user.lastName}
                              </h3>
                              {!user.isActive && (
                                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-500 rounded">
                                  INACTIVE
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {user.jobTitle || 'Team Member'}
                            </p>
                          </div>
                        </div>

                        {/* Dropdown Menu */}
                        <Menu as="div" className="relative">
                          <Menu.Button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 active:scale-95 transition-all">
                            <Sliders size={16} />
                          </Menu.Button>
                          <Transition
                            as={Fragment}
                            enter="transition ease-out duration-100"
                            enterFrom="transform opacity-0 scale-95"
                            enterTo="transform opacity-100 scale-100"
                            leave="transition ease-in duration-75"
                            leaveFrom="transform opacity-100 scale-100"
                            leaveTo="transform opacity-0 scale-95"
                          >
                            <Menu.Items className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200/80 p-1.5 z-30 focus:outline-none">
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => openUserPermissionsDrawer(user)}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                                      active ? 'bg-purple-50 text-purple-700' : 'text-slate-700'
                                    }`}
                                  >
                                    <ShieldCheck size={14} className="text-purple-600" />
                                    <span>Manage Permissions</span>
                                  </button>
                                )}
                              </Menu.Item>

                              <Can perform="users:update">
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() => openEditModal(user)}
                                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                                        active ? 'bg-slate-50 text-slate-900' : 'text-slate-700'
                                      }`}
                                    >
                                      <Edit size={14} />
                                      <span>Edit Details</span>
                                    </button>
                                  )}
                                </Menu.Item>
                              </Can>

                              <Can perform="users:update">
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() => handleToggleStatus(user)}
                                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                                        active ? 'bg-slate-50 text-slate-900' : 'text-slate-700'
                                      }`}
                                    >
                                      {user.isActive ? (
                                        <>
                                          <UserX size={14} className="text-amber-500" />
                                          <span>Deactivate Account</span>
                                        </>
                                      ) : (
                                        <>
                                          <UserCheck size={14} className="text-emerald-500" />
                                          <span>Activate Account</span>
                                        </>
                                      )}
                                    </button>
                                  )}
                                </Menu.Item>
                              </Can>

                              <Can perform="users:delete">
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() => setShowDeleteConfirm(user)}
                                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                                        active ? 'bg-red-50 text-red-700' : 'text-red-600'
                                      }`}
                                    >
                                      <Trash2 size={14} />
                                      <span>Delete Member</span>
                                    </button>
                                  )}
                                </Menu.Item>
                              </Can>
                            </Menu.Items>
                          </Transition>
                        </Menu>
                      </div>

                      {/* Contact coordinates */}
                      <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <Mail size={13} className="text-slate-400 flex-shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-2">
                            <Phone size={13} className="text-slate-400 flex-shrink-0" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer Badges & Actions */}
                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Role Badge */}
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${roleMeta.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${roleMeta.dot}`}></span>
                          <span>{roleMeta.label}</span>
                        </span>

                        {/* Overrides Badge */}
                        {hasOverrides && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-700">
                            <Sparkles size={10} />
                            <span>+{user.customPermissions.length} overrides</span>
                          </span>
                        )}
                      </div>

                      {/* Mailbox status indicator */}
                      <div>
                        {user.hasMailbox ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                            <CheckCircle size={12} />
                            <span>Mailbox Active</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowProvisionModal(true);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 px-2 py-1 rounded-lg active:scale-95 transition-all"
                          >
                            <MailPlus size={12} />
                            <span>Provision</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Members List - Table View */}
          {viewMode === 'table' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                      <th className="py-3 px-4">Member</th>
                      <th className="py-3 px-4">Role & RBAC</th>
                      <th className="py-3 px-4">Corporate Mailbox</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredUsers.map((user) => {
                      const roleMeta = ROLES_METADATA[user.role] || ROLES_METADATA.STAFF;
                      const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();

                      return (
                        <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${roleMeta.gradient} flex items-center justify-center text-white font-bold text-xs shadow-xs`}>
                                {initials}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900">
                                  {user.firstName} {user.lastName}
                                </div>
                                <div className="text-xs text-slate-500">{user.email}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${roleMeta.badge}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${roleMeta.dot}`}></span>
                                <span>{roleMeta.label}</span>
                              </span>
                              {user.customPermissions && user.customPermissions.length > 0 && (
                                <span className="px-1.5 py-0.5 text-[10px] rounded bg-purple-100 text-purple-700 font-bold">
                                  +{user.customPermissions.length}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            {user.hasMailbox ? (
                              <div className="flex items-center gap-1.5 text-xs text-slate-700">
                                <CheckCircle size={14} className="text-emerald-500" />
                                <span>{user.primaryEmail || user.email}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">No mailbox linked</span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                              user.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openUserPermissionsDrawer(user)}
                                className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                title="Inspect & Configure Permissions"
                              >
                                <ShieldCheck size={16} />
                              </button>
                              <button
                                onClick={() => openEditModal(user)}
                                className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Edit Details"
                              >
                                <Edit size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {filteredUsers.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
              <Users className="mx-auto text-slate-300" size={40} />
              <h3 className="mt-3 font-bold text-slate-900 text-base">No team members found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No users match your search criteria. Try clearing the filter or invite a new member.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 2: ENTERPRISE RBAC PERMISSIONS MATRIX                 */}
      {/* ========================================================== */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          {/* Matrix Header & Role Simulator */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck size={20} className="text-purple-600" />
                <span>Enterprise Role-Permission Matrix</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Authorize against granular permissions. Toggling capabilities modifies real-time security policies across the workspace.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Simulate Role:</span>
              <select
                value={selectedRoleSim}
                onChange={(e) => setSelectedRoleSim(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-100 border border-slate-200 rounded-xl text-slate-800 focus:outline-none"
              >
                {Object.keys(ROLES_METADATA).map(k => (
                  <option key={k} value={k}>{ROLES_METADATA[k].label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Interactive Matrix Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 text-xs font-bold text-slate-700 border-b border-slate-200/80">
                    <th className="py-4 px-4 min-w-[280px]">Permission Capability</th>
                    <th className="py-4 px-3 text-center min-w-[110px]">
                      <div className="flex flex-col items-center">
                        <span className="text-purple-700">Administrator</span>
                        <span className="text-[10px] text-slate-400 font-normal">Superuser</span>
                      </div>
                    </th>
                    <th className="py-4 px-3 text-center min-w-[120px]">
                      <div className="flex flex-col items-center">
                        <span className="text-blue-700">Operations Lead</span>
                        <button
                          onClick={() => handleResetRoleMatrix('MANAGER')}
                          className="text-[10px] text-slate-400 hover:text-blue-600 underline font-normal"
                        >
                          Reset defaults
                        </button>
                      </div>
                    </th>
                    <th className="py-4 px-3 text-center min-w-[120px]">
                      <div className="flex flex-col items-center">
                        <span className="text-slate-800">Technician</span>
                        <button
                          onClick={() => handleResetRoleMatrix('STAFF')}
                          className="text-[10px] text-slate-400 hover:text-slate-600 underline font-normal"
                        >
                          Reset defaults
                        </button>
                      </div>
                    </th>
                    <th className="py-4 px-3 text-center min-w-[120px]">
                      <div className="flex flex-col items-center">
                        <span className="text-emerald-700">Finance</span>
                        <button
                          onClick={() => handleResetRoleMatrix('FINANCE')}
                          className="text-[10px] text-slate-400 hover:text-emerald-600 underline font-normal"
                        >
                          Reset defaults
                        </button>
                      </div>
                    </th>
                    <th className="py-4 px-3 text-center min-w-[120px]">
                      <div className="flex flex-col items-center">
                        <span className="text-amber-700">Auditor</span>
                        <button
                          onClick={() => handleResetRoleMatrix('AUDITOR')}
                          className="text-[10px] text-slate-400 hover:text-amber-600 underline font-normal"
                        >
                          Reset defaults
                        </button>
                      </div>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-sm">
                  {categories.map((category) => {
                    const categoryPerms = permissionsCatalog.filter(p => p.category === category);
                    if (categoryPerms.length === 0) return null;

                    return (
                      <React.Fragment key={category}>
                        {/* Section Header */}
                        <tr className="bg-slate-100/60 font-bold text-xs text-slate-700 tracking-wide">
                          <td colSpan={6} className="py-2.5 px-4">
                            <span className="uppercase text-[11px] text-slate-500 font-extrabold mr-2">Module:</span>
                            {category}
                          </td>
                        </tr>

                        {categoryPerms.map((perm) => {
                          return (
                            <tr key={perm.id} className="hover:bg-slate-50/50 transition-colors">
                              {/* Permission Info */}
                              <td className="py-3 px-4">
                                <div className="flex items-start gap-2.5">
                                  <div>
                                    <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                                      {perm.label}
                                    </div>
                                    <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                                      {perm.description}
                                    </div>
                                    <div className="mt-1 flex items-center gap-1.5">
                                      <code className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                        {perm.id}
                                      </code>
                                      {perm.riskLevel === 'critical' && (
                                        <span className="text-[9px] font-bold px-1.5 py-0.2 bg-red-100 text-red-700 rounded-full">
                                          CRITICAL
                                        </span>
                                      )}
                                      {perm.riskLevel === 'elevated' && (
                                        <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-700 rounded-full">
                                          ELEVATED
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* ADMIN (Permanent Wildcard) */}
                              <td className="py-3 px-3 text-center">
                                <div className="inline-flex items-center justify-center p-1.5 bg-purple-50 text-purple-700 rounded-lg" title="Permanently granted to Administrator">
                                  <Lock size={15} />
                                </div>
                              </td>

                              {/* Roles (MANAGER, STAFF, FINANCE, AUDITOR) */}
                              {['MANAGER', 'STAFF', 'FINANCE', 'AUDITOR'].map((roleKey) => {
                                const perms = roleMatrix[roleKey] || [];
                                const isGranted = perms.includes('*') || perms.includes(perm.id);

                                return (
                                  <td key={roleKey} className="py-3 px-3 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleRolePermission(roleKey, perm.id)}
                                      className={`w-10 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out inline-flex items-center active:scale-95 ${
                                        isGranted ? 'bg-orange-600 justify-end' : 'bg-slate-200 justify-start'
                                      }`}
                                      title={`Toggle ${perm.label} for ${roleKey}`}
                                    >
                                      <span className="w-5 h-5 rounded-full bg-white shadow-xs"></span>
                                    </button>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 3: MAILBOX PROVISIONING                                */}
      {/* ========================================================== */}
      {activeTab === 'mailboxes' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Mail size={20} className="text-blue-600" />
                <span>Corporate Email Provisioning</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Provision custom domain mailboxes (`@exoinafrica.com`) on Stalwart Mail Server with 1 click.
              </p>
            </div>

            {usersWithoutMailbox.length > 0 && domains.length > 0 && (
              <button
                onClick={() => {
                  setSelectedUsers(usersWithoutMailbox.map(u => u.id));
                  setShowBulkModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs active:scale-95 transition-all"
              >
                <MailPlus size={16} />
                <span>Bulk Provision ({usersWithoutMailbox.length} pending)</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pending Users */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                <AlertCircle size={16} className="text-orange-500" />
                <span>Team Members Pending Corporate Mailbox ({usersWithoutMailbox.length})</span>
              </h3>
              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {usersWithoutMailbox.map((u) => (
                  <div key={u.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900 text-xs sm:text-sm">{u.firstName} {u.lastName}</div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedUser(u);
                        setShowProvisionModal(true);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg active:scale-95 transition-all"
                    >
                      Provision
                    </button>
                  </div>
                ))}
                {usersWithoutMailbox.length === 0 && (
                  <div className="py-8 text-center text-xs text-slate-400">
                    All active team members have corporate mailboxes configured!
                  </div>
                )}
              </div>
            </div>

            {/* Unlinked Mailboxes */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                <LinkIcon size={16} className="text-purple-500" />
                <span>Unlinked Mailboxes ({unlinkedMailboxes.length})</span>
              </h3>
              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {unlinkedMailboxes.map((m) => (
                  <div key={m.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900 text-xs sm:text-sm">{m.email}</div>
                      <div className="text-[11px] text-slate-400">Domain: {m.domain?.domain}</div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedUser({ id: null, mailboxToLink: m.id });
                        setShowLinkModal(true);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg active:scale-95 transition-all"
                    >
                      Link to Member
                    </button>
                  </div>
                ))}
                {unlinkedMailboxes.length === 0 && (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No unlinked mailboxes in the hosting pool.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 4: SECURITY AUDIT TRAIL                                */}
      {/* ========================================================== */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <History size={20} className="text-slate-600" />
                <span>Security & Authorization Audit Trail</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Immutable audit trail of member provisionings, status updates, and role modifications.
              </p>
            </div>
            <button
              onClick={fetchAuditLogs}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Refresh Logs"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 px-3">Action</th>
                  <th className="py-3 px-3">Target Details</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 font-mono text-slate-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {log.action}
                    </td>
                    <td className="py-3 px-3">
                      {log.details || log.targetUserId || '-'}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded font-semibold text-[10px]">
                        COMPLETED
                      </span>
                    </td>
                  </tr>
                ))}
                {auditLogs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      No security audit events recorded recently.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* SLIDE-OVER DRAWER / BOTTOM SHEET: USER PERMISSIONS        */}
      {/* ========================================================== */}
      <Transition.Root show={!!selectedUserForRbac} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setSelectedUserForRbac(null)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-300"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-200"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                    <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-2xl">
                      {/* Header */}
                      <div className="p-6 bg-slate-50 border-b border-slate-200">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="text-purple-600" size={20} />
                              <Dialog.Title className="text-lg font-bold text-slate-900">
                                User Access Capabilities
                              </Dialog.Title>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              Configure granular permission overrides for this individual account.
                            </p>
                          </div>
                          <button
                            type="button"
                            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
                            onClick={() => setSelectedUserForRbac(null)}
                          >
                            <X size={18} />
                          </button>
                        </div>

                        {selectedUserForRbac && (
                          <div className="mt-4 flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200/80">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                              {selectedUserForRbac.firstName?.[0]}{selectedUserForRbac.lastName?.[0]}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-sm">
                                {selectedUserForRbac.firstName} {selectedUserForRbac.lastName}
                              </div>
                              <div className="text-xs text-slate-500">
                                Base Role: <span className="font-semibold text-purple-700">{selectedUserForRbac.role}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-6 flex-1 space-y-6">
                        {userRbacLoading ? (
                          <div className="py-12 text-center">
                            <RefreshCw className="animate-spin mx-auto text-purple-600" size={24} />
                            <p className="text-xs text-slate-500 mt-2">Loading member capabilities...</p>
                          </div>
                        ) : (
                          <>
                            {/* Inherited Role Base */}
                            <div className="bg-purple-50/60 rounded-xl border border-purple-200/60 p-4">
                              <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wide flex items-center gap-1.5">
                                <Info size={14} />
                                <span>Inherited Role Capabilities</span>
                              </h4>
                              <p className="text-xs text-purple-700 mt-1">
                                Inherited automatically from role <strong>{selectedUserForRbac?.role}</strong>:
                              </p>
                              <div className="mt-2 flex flex-wrap gap-1">
                                {userRbacData?.roleBasePermissions?.map(p => (
                                  <span key={p} className="px-2 py-0.5 text-[11px] font-mono rounded bg-white text-purple-800 border border-purple-200">
                                    {p}
                                  </span>
                                ))}
                                {userRbacData?.roleBasePermissions?.length === 0 && (
                                  <span className="text-xs text-slate-400 italic">No base permissions</span>
                                )}
                              </div>
                            </div>

                            {/* Custom Overrides */}
                            <div>
                              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-2">
                                Individual Custom Overrides
                              </h4>
                              <p className="text-xs text-slate-500 mb-3">
                                Grant specific capabilities that go beyond the user's base role.
                              </p>

                              <div className="divide-y divide-slate-100 max-h-[45vh] overflow-y-auto border border-slate-200 rounded-xl">
                                {permissionsCatalog.map((perm) => {
                                  const isBase = userRbacData?.roleBasePermissions?.includes('*') ||
                                    userRbacData?.roleBasePermissions?.includes(perm.id);
                                  const isCustom = userCustomPerms.includes(perm.id);

                                  return (
                                    <div key={perm.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                                      <div className="pr-2">
                                        <div className="text-xs font-semibold text-slate-900">{perm.label}</div>
                                        <div className="text-[10px] text-slate-500">{perm.id}</div>
                                      </div>

                                      {isBase ? (
                                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-500 rounded">
                                          Inherited
                                        </span>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (isCustom) {
                                              setUserCustomPerms(prev => prev.filter(p => p !== perm.id));
                                            } else {
                                              setUserCustomPerms(prev => [...prev, perm.id]);
                                            }
                                          }}
                                          className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-150 inline-flex items-center active:scale-95 ${
                                            isCustom ? 'bg-purple-600 justify-end' : 'bg-slate-200 justify-start'
                                          }`}
                                        >
                                          <span className="w-4 h-4 rounded-full bg-white shadow-xs"></span>
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedUserForRbac(null)}
                          className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveUserPermissions}
                          disabled={savingUserPerms}
                          className="px-5 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-1.5"
                        >
                          {savingUserPerms && <RefreshCw size={14} className="animate-spin" />}
                          <span>Save Overrides</span>
                        </button>
                      </div>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      {/* ========================================================== */}
      {/* MODAL: ADD NEW MEMBER (APPLE SHEET & RESPONSIVE DIALOG)   */}
      {/* ========================================================== */}
      <Transition appear show={showAddModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowAddModal(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" />
          </Transition.Child>

          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 translate-y-8 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-8 sm:scale-95"
              >
                <Dialog.Panel className="w-full sm:max-w-lg transform overflow-hidden rounded-t-3xl sm:rounded-3xl bg-white text-left align-bottom sm:align-middle shadow-2xl transition-all border border-slate-100 max-h-[90vh] flex flex-col">
                  {/* Mobile Grab Handle */}
                  <div className="sm:hidden flex justify-center pt-3 pb-1">
                    <div className="w-12 h-1.5 rounded-full bg-slate-300" />
                  </div>

                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <Dialog.Title className="text-lg font-bold text-slate-900">
                        Add Team Member
                      </Dialog.Title>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Create a verified user account with assigned RBAC privileges.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAddModal(false)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <form onSubmit={handleCreateUser} className="p-6 space-y-4 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">First Name *</label>
                        <input
                          type="text"
                          required
                          value={formData.firstName}
                          onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                          className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                          placeholder="e.g. Jane"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name *</label>
                        <input
                          type="text"
                          required
                          value={formData.lastName}
                          onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                          className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                          placeholder="e.g. Wanjiku"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Corporate Email Address *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                        placeholder="jane@exoinafrica.com"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Role *</label>
                        <select
                          value={formData.role}
                          onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                          className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                        >
                          <option value="STAFF">Field Technician (Staff)</option>
                          <option value="MANAGER">Operations Lead (Manager)</option>
                          <option value="FINANCE">Finance & Billing</option>
                          <option value="AUDITOR">Compliance Auditor</option>
                          <option value="ADMIN">Administrator (Superuser)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Job Title</label>
                        <input
                          type="text"
                          value={formData.jobTitle}
                          onChange={(e) => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
                          className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                          placeholder="e.g. Field Engineer"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                        placeholder="e.g. +254 712 345 678"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-700">Account Password *</label>
                        <button
                          type="button"
                          onClick={generatePassword}
                          className="text-[11px] font-semibold text-orange-600 hover:text-orange-700"
                        >
                          Regenerate
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={formData.password}
                          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                          className="w-full pl-3.5 pr-10 py-2.5 text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setShowAddModal(false)}
                        className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-md active:scale-95 transition-all"
                      >
                        Create Member
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* ========================================================== */}
      {/* MODAL: EDIT MEMBER DETAILS                                 */}
      {/* ========================================================== */}
      <Transition appear show={showEditModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowEditModal(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" />
          </Transition.Child>

          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 translate-y-8 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-8 sm:scale-95"
              >
                <Dialog.Panel className="w-full sm:max-w-lg transform overflow-hidden rounded-t-3xl sm:rounded-3xl bg-white text-left align-bottom sm:align-middle shadow-2xl transition-all border border-slate-100 max-h-[90vh] flex flex-col">
                  {/* Mobile Grab Handle */}
                  <div className="sm:hidden flex justify-center pt-3 pb-1">
                    <div className="w-12 h-1.5 rounded-full bg-slate-300" />
                  </div>

                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <Dialog.Title className="text-lg font-bold text-slate-900">
                        Edit Member Details
                      </Dialog.Title>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Update profile, designation, and primary access role.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <form onSubmit={handleUpdateUser} className="p-6 space-y-4 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">First Name</label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                          className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                          className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                        <select
                          value={formData.role}
                          onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                          className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                        >
                          <option value="STAFF">Field Technician (Staff)</option>
                          <option value="MANAGER">Operations Lead (Manager)</option>
                          <option value="FINANCE">Finance & Billing</option>
                          <option value="AUDITOR">Compliance Auditor</option>
                          <option value="ADMIN">Administrator (Superuser)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Job Title</label>
                        <input
                          type="text"
                          value={formData.jobTitle}
                          onChange={(e) => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
                          className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Reset Password (leave empty to keep current)</label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                        placeholder="••••••••••••"
                      />
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setShowEditModal(false)}
                        className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-md active:scale-95 transition-all"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* ========================================================== */}
      {/* MODAL: PROVISION MAILBOX FOR USER                          */}
      {/* ========================================================== */}
      <Transition appear show={showProvisionModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowProvisionModal(false)}>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" />
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Dialog.Panel className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100">
                <Dialog.Title className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <MailPlus className="text-blue-600" size={20} />
                  <span>Provision Corporate Mailbox</span>
                </Dialog.Title>
                <p className="text-xs text-slate-500 mt-1">
                  Create a dedicated email account on Stalwart Mail for {selectedUser?.firstName} {selectedUser?.lastName}.
                </p>

                <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/60 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Suggested Address:</span>
                    <span className="font-mono font-semibold text-blue-700">
                      {selectedUser?.email}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Domain:</span>
                    <span className="font-semibold text-slate-800">
                      {domains[0]?.domain || 'exoinafrica.com'}
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    onClick={() => setShowProvisionModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        setLoading(true);
                        await usersApi.provisionMailbox(selectedUser.id, {
                          domainId: domains[0]?.id
                        });
                        setShowProvisionModal(false);
                        setSuccess('Mailbox provisioned successfully');
                        fetchInitialData();
                      } catch (err) {
                        setError(err.response?.data?.error || 'Failed to provision mailbox');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md active:scale-95 transition-all"
                  >
                    Provision Now
                  </button>
                </div>
              </Dialog.Panel>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* ========================================================== */}
      {/* MODAL: DELETE CONFIRMATION                                 */}
      {/* ========================================================== */}
      <Transition appear show={!!showDeleteConfirm} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowDeleteConfirm(null)}>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" />
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Dialog.Panel className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 text-center">
                <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
                  <Trash2 size={24} />
                </div>
                <Dialog.Title className="text-base font-bold text-slate-900">
                  Delete Member Account?
                </Dialog.Title>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to delete {showDeleteConfirm?.firstName} {showDeleteConfirm?.lastName}? This action permanently revokes all access permissions.
                </p>

                <div className="mt-6 flex items-center justify-center gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteUser(showDeleteConfirm)}
                    className="px-5 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md active:scale-95 transition-all"
                  >
                    Yes, Delete
                  </button>
                </div>
              </Dialog.Panel>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default UsersPage;
