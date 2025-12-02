import React, { useState, useEffect, Fragment } from 'react';
import { usersApi, emailHostingApi } from '../lib/api';
import { Dialog, Transition, Menu } from '@headlessui/react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Plus, 
  Mail,
  Shield,
  MoreVertical,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Link,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Copy,
  Search,
  Filter,
  Grid,
  List,
  ChevronDown,
  ExternalLink,
  Inbox,
  Settings,
  Key,
  User,
  Building2,
  Calendar,
  MailPlus
} from 'lucide-react';

// View Mode Toggle Component
const ViewModeToggle = ({ viewMode, setViewMode }) => (
  <div className="flex items-center bg-slate-100 rounded-lg p-1">
    <button
      onClick={() => setViewMode('grid')}
      className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-500 hover:text-slate-700'}`}
    >
      <Grid size={18} />
    </button>
    <button
      onClick={() => setViewMode('list')}
      className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-500 hover:text-slate-700'}`}
    >
      <List size={18} />
    </button>
  </div>
);

// User Card Component for Grid View
const UserCard = ({ user, onProvision, onLink, onToggleStatus, onDelete, onViewDetails, domains, getRoleBadge }) => {
  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getAvatarGradient = (role) => {
    const gradients = {
      ADMIN: 'from-purple-400 to-purple-600',
      MANAGER: 'from-blue-400 to-blue-600',
      STAFF: 'from-orange-400 to-orange-600'
    };
    return gradients[role] || gradients.STAFF;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 hover:shadow-lg hover:border-slate-300 transition-all group">
      {/* Header with Avatar and Actions */}
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br ${getAvatarGradient(user.role)} flex items-center justify-center text-white font-semibold text-sm sm:text-lg shadow-sm flex-shrink-0`}>
            {getInitials(user.firstName, user.lastName)}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900 text-sm sm:text-base truncate">{user.firstName} {user.lastName}</h3>
            <p className="text-xs sm:text-sm text-slate-500 truncate">{user.jobTitle || 'Team Member'}</p>
          </div>
        </div>
        <Menu as="div" className="relative">
          <Menu.Button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors sm:opacity-0 sm:group-hover:opacity-100">
            <MoreVertical size={16} />
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
            <Menu.Items className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-20">
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => onViewDetails(user)}
                    className={`${active ? 'bg-slate-50' : ''} w-full text-left px-4 py-2.5 text-sm text-slate-700 flex items-center gap-2`}
                  >
                    <User size={16} /> View Details
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => onToggleStatus(user.id, user.isActive)}
                    className={`${active ? 'bg-slate-50' : ''} w-full text-left px-4 py-2.5 text-sm text-slate-700 flex items-center gap-2`}
                  >
                    {user.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                    {user.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                )}
              </Menu.Item>
              <div className="h-px bg-slate-100 my-1" />
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => onDelete(user.id)}
                    className={`${active ? 'bg-red-50' : ''} w-full text-left px-4 py-2.5 text-sm text-red-600 flex items-center gap-2`}
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>

      {/* User Info */}
      <div className="space-y-2 mb-3 sm:mb-4">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
          <Mail size={14} className="text-slate-400 flex-shrink-0" />
          <span className="truncate">{user.email}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {getRoleBadge(user.role)}
          <span className={`px-2 py-0.5 text-xs rounded-full ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
            {user.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Mailbox Status */}
      <div className={`p-2.5 sm:p-3 rounded-lg ${user.hasMailbox ? 'bg-green-50 border border-green-200' : 'bg-slate-50 border border-slate-200'}`}>
        {user.hasMailbox ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-green-700 truncate">{user.primaryEmail}</span>
            </div>
            <button 
              onClick={() => window.location.href = '/mail'}
              className="p-1.5 bg-green-100 hover:bg-green-200 rounded-lg text-green-600 transition-colors flex-shrink-0"
              title="Open in Webmail"
            >
              <Inbox size={14} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <XCircle size={14} className="text-slate-400" />
              <span className="text-xs sm:text-sm text-slate-500">No mailbox</span>
            </div>
            <div className="flex items-center gap-1">
              {domains.length > 0 && (
                <button 
                  onClick={() => onProvision(user)}
                  className="p-1.5 bg-orange-100 hover:bg-orange-200 rounded-lg text-orange-600 transition-colors"
                  title="Create Mailbox"
                >
                  <MailPlus size={14} />
                </button>
              )}
              <button 
                onClick={() => onLink(user)}
                className="p-1.5 bg-blue-100 hover:bg-blue-200 rounded-lg text-blue-600 transition-colors"
                title="Link Mailbox"
              >
                <Link size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const UsersPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [domains, setDomains] = useState([]);
  const [unlinkedMailboxes, setUnlinkedMailboxes] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedPassword, setCopiedPassword] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterMailbox, setFilterMailbox] = useState('all');
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, statsRes, domainsRes] = await Promise.all([
        usersApi.getAll(),
        usersApi.getStats(),
        emailHostingApi.getDomains().catch(() => ({ data: { domains: [] } }))
      ]);
      setUsers(usersRes.data || []);
      setStats(statsRes.data);
      setDomains(domainsRes.data.domains || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnlinkedMailboxes = async () => {
    try {
      const res = await usersApi.getUnlinkedMailboxes();
      setUnlinkedMailboxes(res.data.mailboxes || []);
    } catch (error) {
      console.error('Failed to fetch unlinked mailboxes:', error);
    }
  };

  const getRoleBadge = (role) => {
    const colors = {
      ADMIN: 'bg-purple-100 text-purple-700 border border-purple-200',
      MANAGER: 'bg-blue-100 text-blue-700 border border-blue-200',
      STAFF: 'bg-slate-100 text-slate-700 border border-slate-200'
    };
    const icons = {
      ADMIN: <Shield size={12} />,
      MANAGER: <Building2 size={12} />,
      STAFF: <User size={12} />
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${colors[role] || colors.STAFF}`}>
        {icons[role]} {role}
      </span>
    );
  };

  const getMailboxBadge = (user) => {
    if (user.hasMailbox) {
      return (
        <div className="flex items-center gap-1.5">
          <CheckCircle size={14} className="text-green-500" />
          <span className="text-sm text-green-700">{user.primaryEmail}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 text-slate-400">
        <XCircle size={14} />
        <span className="text-sm">No mailbox</span>
      </div>
    );
  };

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchQuery === '' || 
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.primaryEmail && user.primaryEmail.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesMailbox = filterMailbox === 'all' || 
      (filterMailbox === 'with' && user.hasMailbox) ||
      (filterMailbox === 'without' && !user.hasMailbox);
    
    return matchesSearch && matchesRole && matchesMailbox;
  });

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="flex items-center gap-1 text-green-600 text-sm">
        <UserCheck size={14} />
        Active
      </span>
    ) : (
      <span className="flex items-center gap-1 text-slate-400 text-sm">
        <UserX size={14} />
        Inactive
      </span>
    );
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const handleAddUser = async (formData) => {
    try {
      setError('');
      await usersApi.create(formData);
      setSuccess('User created successfully!');
      setShowAddModal(false);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create user');
    }
  };

  const handleProvisionMailbox = async (userId, data) => {
    try {
      setError('');
      const res = await usersApi.provisionMailbox(userId, data);
      setSuccess(`Mailbox created: ${res.data.mailbox.email}`);
      if (res.data.password) {
        setCopiedPassword(res.data.password);
      }
      setShowProvisionModal(false);
      fetchData();
      setTimeout(() => { setSuccess(''); setCopiedPassword(null); }, 10000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to provision mailbox');
    }
  };

  const handleLinkMailbox = async (userId, mailboxId) => {
    try {
      setError('');
      await usersApi.linkMailbox(userId, mailboxId);
      setSuccess('Mailbox linked successfully!');
      setShowLinkModal(false);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to link mailbox');
    }
  };

  const handleBulkProvision = async (userIds, domainId) => {
    try {
      setError('');
      const res = await usersApi.bulkProvisionMailboxes(userIds, domainId);
      setSuccess(`Provisioned ${res.data.successful} of ${res.data.total} mailboxes`);
      setShowBulkModal(false);
      setSelectedUsers([]);
      fetchData();
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to bulk provision');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await usersApi.delete(userId);
      setSuccess('User deleted successfully');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await usersApi.updateStatus(userId, currentStatus ? 'INACTIVE' : 'ACTIVE');
      fetchData();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update status');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const usersWithoutMailbox = users.filter(u => !u.hasMailbox && u.isActive);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 text-orange-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-red-700 flex-1">{error}</p>
          <button onClick={() => setError('')} className="p-1.5 hover:bg-red-100 rounded-lg text-red-500 hover:text-red-700">
            <XCircle size={18} />
          </button>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
          <div className="p-2 bg-green-100 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div className="flex-1">
            <p className="text-green-700 font-medium">{success}</p>
            {copiedPassword && (
              <div className="mt-3 p-3 bg-green-100/50 rounded-lg flex items-center gap-3">
                <Key size={16} className="text-green-600" />
                <code className="bg-white px-3 py-1.5 rounded-lg text-sm font-mono text-green-800 border border-green-200">{copiedPassword}</code>
                <button onClick={() => copyToClipboard(copiedPassword)} className="p-1.5 hover:bg-green-200 rounded-lg transition-colors" title="Copy password">
                  <Copy size={14} className="text-green-600" />
                </button>
                <span className="text-xs text-green-600">Copy this password - it won't be shown again!</span>
              </div>
            )}
          </div>
          <button onClick={() => { setSuccess(''); setCopiedPassword(null); }} className="p-1.5 hover:bg-green-100 rounded-lg text-green-500 hover:text-green-700">
            <XCircle size={18} />
          </button>
        </div>
      )}

      {/* Modern Header with Gradient */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-orange-500/20 rounded-lg sm:rounded-xl">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-orange-400" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-white">Team Members</h1>
                <p className="text-slate-400 text-xs sm:text-base mt-0.5 sm:mt-1 hidden sm:block">Manage your team and their email accounts</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={fetchData}
                className="p-2 sm:p-2.5 bg-white/10 backdrop-blur-sm text-white rounded-lg sm:rounded-xl hover:bg-white/20 transition-all border border-white/10"
              >
                <RefreshCw size={18} />
              </button>
              <button 
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg sm:rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/25 text-sm sm:text-base"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Add Member</span>
              </button>
            </div>
          </div>
          
          {/* Bulk provision button - shown separately on mobile */}
          {usersWithoutMailbox.length > 0 && domains.length > 0 && (
            <button 
              onClick={() => { setSelectedUsers(usersWithoutMailbox.map(u => u.id)); setShowBulkModal(true); }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-sm text-white rounded-xl hover:bg-white/20 transition-all border border-white/10 w-full sm:hidden"
            >
              <MailPlus size={18} />
              <span>Provision All</span>
              <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">{usersWithoutMailbox.length}</span>
            </button>
          )}

          {/* Search and Filters */}
          <div className="mt-4 sm:mt-6 space-y-3">
          <div className="relative">
            <Search size={18} className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 bg-white/10 border border-white/10 rounded-lg sm:rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent text-sm sm:text-base"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/10 rounded-lg sm:rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-sm min-w-[100px]"
            >
              <option value="all" className="bg-slate-800">All Roles</option>
              <option value="ADMIN" className="bg-slate-800">Admins</option>
              <option value="MANAGER" className="bg-slate-800">Managers</option>
              <option value="STAFF" className="bg-slate-800">Staff</option>
            </select>
            <select
              value={filterMailbox}
              onChange={(e) => setFilterMailbox(e.target.value)}
              className="px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/10 rounded-lg sm:rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-sm min-w-[120px]"
            >
              <option value="all" className="bg-slate-800">All Mailboxes</option>
              <option value="with" className="bg-slate-800">With Mailbox</option>
              <option value="without" className="bg-slate-800">Without Mailbox</option>
            </select>
            <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} />
          </div>
        </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-5 hover:shadow-lg hover:border-slate-300 transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl sm:text-3xl font-bold text-slate-900">{stats?.total || 0}</p>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">Total Members</p>
            </div>
            <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg sm:rounded-xl group-hover:scale-110 transition-transform">
              <Users size={20} className="text-blue-600 sm:hidden" />
              <Users size={24} className="text-blue-600 hidden sm:block" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 h-1 sm:h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full" style={{ width: '100%' }} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-5 hover:shadow-lg hover:border-slate-300 transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl sm:text-3xl font-bold text-slate-900">{stats?.active || 0}</p>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">Active Users</p>
            </div>
            <div className="p-2 sm:p-3 bg-gradient-to-br from-green-100 to-green-50 rounded-lg sm:rounded-xl group-hover:scale-110 transition-transform">
              <UserCheck size={20} className="text-green-600 sm:hidden" />
              <UserCheck size={24} className="text-green-600 hidden sm:block" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 h-1 sm:h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all" 
              style={{ width: `${stats?.total ? (stats.active / stats.total * 100) : 0}%` }} 
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-5 hover:shadow-lg hover:border-slate-300 transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl sm:text-3xl font-bold text-slate-900">{stats?.admins || 0}</p>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">Administrators</p>
            </div>
            <div className="p-2 sm:p-3 bg-gradient-to-br from-purple-100 to-purple-50 rounded-lg sm:rounded-xl group-hover:scale-110 transition-transform">
              <Shield size={20} className="text-purple-600 sm:hidden" />
              <Shield size={24} className="text-purple-600 hidden sm:block" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 h-1 sm:h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full transition-all" 
              style={{ width: `${stats?.total ? (stats.admins / stats.total * 100) : 0}%` }} 
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-5 hover:shadow-lg hover:border-slate-300 transition-all group cursor-pointer" onClick={() => setFilterMailbox(filterMailbox === 'with' ? 'all' : 'with')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl sm:text-3xl font-bold text-slate-900">{stats?.withMailbox || 0}</p>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">With Mailbox</p>
            </div>
            <div className="p-2 sm:p-3 bg-gradient-to-br from-orange-100 to-orange-50 rounded-lg sm:rounded-xl group-hover:scale-110 transition-transform">
              <Mail size={20} className="text-orange-600 sm:hidden" />
              <Mail size={24} className="text-orange-600 hidden sm:block" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 h-1 sm:h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all" 
              style={{ width: `${stats?.total ? (stats.withMailbox / stats.total * 100) : 0}%` }} 
            />
          </div>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {filteredUsers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              domains={domains}
              getRoleBadge={getRoleBadge}
              onProvision={(u) => { setSelectedUser(u); setShowProvisionModal(true); }}
              onLink={(u) => { setSelectedUser(u); fetchUnlinkedMailboxes(); setShowLinkModal(true); }}
              onToggleStatus={handleToggleStatus}
              onDelete={handleDeleteUser}
              onViewDetails={() => {}}
            />
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Member</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Login Email</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Mailbox</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Role</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Status</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${user.role === 'ADMIN' ? 'from-purple-400 to-purple-600' : user.role === 'MANAGER' ? 'from-blue-400 to-blue-600' : 'from-orange-400 to-orange-600'} flex items-center justify-center text-white font-medium text-sm shadow-sm`}>
                          {(user.firstName?.charAt(0) || '') + (user.lastName?.charAt(0) || '')}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{user.firstName} {user.lastName}</p>
                          <p className="text-sm text-slate-500">{user.jobTitle || 'Team Member'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-slate-600">{user.email}</span>
                    </td>
                    <td className="px-6 py-4">
                      {getMailboxBadge(user)}
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      {getStatusBadge(user.isActive)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {!user.hasMailbox && domains.length > 0 && (
                          <button 
                            onClick={() => { setSelectedUser(user); setShowProvisionModal(true); }}
                            className="p-2 hover:bg-orange-50 rounded-lg text-orange-500 hover:text-orange-600 transition-colors"
                            title="Create Mailbox"
                          >
                            <MailPlus size={16} />
                          </button>
                        )}
                        {!user.hasMailbox && (
                          <button 
                            onClick={() => { setSelectedUser(user); fetchUnlinkedMailboxes(); setShowLinkModal(true); }}
                            className="p-2 hover:bg-blue-50 rounded-lg text-blue-500 hover:text-blue-600 transition-colors"
                            title="Link Existing Mailbox"
                          >
                            <Link size={16} />
                          </button>
                        )}
                        {user.hasMailbox && (
                          <button 
                            onClick={() => navigate('/mail')}
                            className="p-2 hover:bg-green-50 rounded-lg text-green-500 hover:text-green-600 transition-colors"
                            title="Open Webmail"
                          >
                            <ExternalLink size={16} />
                          </button>
                        )}
                        <Menu as="div" className="relative">
                          <Menu.Button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                            <MoreVertical size={16} />
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
                            <Menu.Items className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-20">
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => handleToggleStatus(user.id, user.isActive)}
                                    className={`${active ? 'bg-slate-50' : ''} w-full text-left px-4 py-2.5 text-sm text-slate-700 flex items-center gap-2`}
                                  >
                                    {user.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                                    {user.isActive ? 'Deactivate' : 'Activate'}
                                  </button>
                                )}
                              </Menu.Item>
                              <div className="h-px bg-slate-100 my-1" />
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => handleDeleteUser(user.id)}
                                    className={`${active ? 'bg-red-50' : ''} w-full text-left px-4 py-2.5 text-sm text-red-600 flex items-center gap-2`}
                                  >
                                    <Trash2 size={16} />
                                    Delete User
                                  </button>
                                )}
                              </Menu.Item>
                            </Menu.Items>
                          </Transition>
                        </Menu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                <Users size={32} className="text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                {searchQuery || filterRole !== 'all' || filterMailbox !== 'all' ? 'No matching members' : 'No team members yet'}
              </h3>
              <p className="text-slate-500 mb-4">
                {searchQuery || filterRole !== 'all' || filterMailbox !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Get started by adding your first team member'}
              </p>
              {!searchQuery && filterRole === 'all' && filterMailbox === 'all' && (
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Plus size={18} />
                  Add First Member
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Grid View Empty State */}
      {viewMode === 'grid' && filteredUsers.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 mx-auto bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <Users size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            {searchQuery || filterRole !== 'all' || filterMailbox !== 'all' ? 'No matching members' : 'No team members yet'}
          </h3>
          <p className="text-slate-500 mb-4">
            {searchQuery || filterRole !== 'all' || filterMailbox !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Get started by adding your first team member'}
          </p>
          {!searchQuery && filterRole === 'all' && filterMailbox === 'all' && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Plus size={18} />
              Add First Member
            </button>
          )}
        </div>
      )}

      {/* Add User Modal */}
      <AddUserModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSubmit={handleAddUser} />

      {/* Provision Mailbox Modal */}
      <ProvisionMailboxModal
        isOpen={showProvisionModal}
        onClose={() => { setShowProvisionModal(false); setSelectedUser(null); }}
        user={selectedUser}
        domains={domains}
        onSubmit={handleProvisionMailbox}
      />

      {/* Link Mailbox Modal */}
      <LinkMailboxModal
        isOpen={showLinkModal}
        onClose={() => { setShowLinkModal(false); setSelectedUser(null); }}
        user={selectedUser}
        mailboxes={unlinkedMailboxes}
        onSubmit={handleLinkMailbox}
      />

      {/* Bulk Provision Modal */}
      <BulkProvisionModal
        isOpen={showBulkModal}
        onClose={() => { setShowBulkModal(false); setSelectedUsers([]); }}
        userIds={selectedUsers}
        userCount={selectedUsers.length}
        domains={domains}
        onSubmit={handleBulkProvision}
      />
    </div>
  );
};

// Add User Modal Component
const AddUserModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', jobTitle: '', userRole: 'STAFF', password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(formData);
    setLoading(false);
    setFormData({ firstName: '', lastName: '', email: '', jobTitle: '', userRole: 'STAFF', password: '' });
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    let pass = '';
    for (let i = 0; i < 12; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    setFormData({ ...formData, password: pass });
    setShowPassword(true);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <Dialog.Title className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-orange-600" />
                  Add Team Member
                </Dialog.Title>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                      <input type="text" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                      <input type="text" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Job Title</label>
                    <input type="text" value={formData.jobTitle} onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                    <select value={formData.userRole} onChange={(e) => setFormData({ ...formData, userRole: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
                      <option value="STAFF">Staff</option>
                      <option value="MANAGER">Manager</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                    <div className="relative">
                      <input type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-2 pr-20 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" required minLength={8} />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="p-1.5 text-slate-400 hover:text-slate-600">
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button type="button" onClick={generatePassword} className="p-1.5 text-slate-400 hover:text-slate-600" title="Generate password">
                          <RefreshCw size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">Cancel</button>
                    <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2">
                      {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                      Add Member
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

// Provision Mailbox Modal Component
const ProvisionMailboxModal = ({ isOpen, onClose, user, domains, onSubmit }) => {
  const [domainId, setDomainId] = useState('');
  const [localPart, setLocalPart] = useState('');
  const [customPassword, setCustomPassword] = useState('');
  const [useAutoPassword, setUseAutoPassword] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && domains.length > 0) {
      const verifiedDomain = domains.find(d => d.isVerified) || domains[0];
      setDomainId(verifiedDomain?.id || '');
      const firstName = user.firstName?.toLowerCase().replace(/[^a-z]/g, '') || '';
      const lastName = user.lastName?.toLowerCase().replace(/[^a-z]/g, '') || '';
      setLocalPart(`${firstName}.${lastName}`);
    }
  }, [user, domains]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(user.id, { domainId, localPart, password: useAutoPassword ? undefined : customPassword });
    setLoading(false);
  };

  const selectedDomain = domains.find(d => d.id === domainId);

  if (!user) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <Dialog.Title className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-orange-600" />
                  Create Email Account
                </Dialog.Title>
                <p className="mt-2 text-sm text-slate-500">Create an email mailbox for <strong>{user.firstName} {user.lastName}</strong></p>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Domain</label>
                    <select value={domainId} onChange={(e) => setDomainId(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" required>
                      {domains.map(d => <option key={d.id} value={d.id}>{d.domain} {d.isVerified ? '✓' : '(unverified)'}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                    <div className="flex">
                      <input type="text" value={localPart} onChange={(e) => setLocalPart(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))} className="flex-1 px-4 py-2 border border-r-0 border-slate-200 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-orange-500" required />
                      <span className="px-4 py-2 bg-slate-100 border border-slate-200 text-slate-600 rounded-r-lg">@{selectedDomain?.domain || 'domain.com'}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={useAutoPassword} onChange={(e) => setUseAutoPassword(e.target.checked)} className="w-4 h-4 text-orange-600 rounded" />
                      <span className="text-sm text-slate-700">Auto-generate secure password</span>
                    </label>
                    {!useAutoPassword && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Custom Password</label>
                        <input type="password" value={customPassword} onChange={(e) => setCustomPassword(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" required={!useAutoPassword} minLength={8} />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">Cancel</button>
                    <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2">
                      {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                      Create Mailbox
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

// Link Mailbox Modal Component
const LinkMailboxModal = ({ isOpen, onClose, user, mailboxes, onSubmit }) => {
  const [selectedMailboxId, setSelectedMailboxId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMailboxId) return;
    setLoading(true);
    await onSubmit(user.id, selectedMailboxId);
    setLoading(false);
  };

  if (!user) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <Dialog.Title className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Link className="w-5 h-5 text-blue-600" />
                  Link Existing Mailbox
                </Dialog.Title>
                <p className="mt-2 text-sm text-slate-500">Link an existing mailbox to <strong>{user.firstName} {user.lastName}</strong></p>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  {mailboxes.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <Mail className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p>No unlinked mailboxes available</p>
                      <p className="text-sm mt-1">Create a new mailbox instead</p>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Select Mailbox</label>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {mailboxes.map(mb => (
                          <label key={mb.id} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${selectedMailboxId === mb.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                            <input type="radio" name="mailbox" value={mb.id} checked={selectedMailboxId === mb.id} onChange={(e) => setSelectedMailboxId(e.target.value)} className="w-4 h-4 text-blue-600" />
                            <div>
                              <p className="font-medium text-slate-900">{mb.email}</p>
                              {mb.displayName && <p className="text-sm text-slate-500">{mb.displayName}</p>}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">Cancel</button>
                    <button type="submit" disabled={loading || !selectedMailboxId || mailboxes.length === 0} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                      {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                      Link Mailbox
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

// Bulk Provision Modal Component
const BulkProvisionModal = ({ isOpen, onClose, userIds, userCount, domains, onSubmit }) => {
  const [domainId, setDomainId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (domains.length > 0) {
      const verifiedDomain = domains.find(d => d.isVerified) || domains[0];
      setDomainId(verifiedDomain?.id || '');
    }
  }, [domains]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(userIds, domainId);
    setLoading(false);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <Dialog.Title className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-orange-600" />
                  Bulk Provision Mailboxes
                </Dialog.Title>
                <p className="mt-2 text-sm text-slate-500">Create email accounts for <strong>{userCount} users</strong> without mailboxes</p>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Domain</label>
                    <select value={domainId} onChange={(e) => setDomainId(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" required>
                      {domains.map(d => <option key={d.id} value={d.id}>{d.domain} {d.isVerified ? '✓' : '(unverified)'}</option>)}
                    </select>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <p className="text-sm text-orange-800"><strong>Note:</strong> Email addresses will be generated automatically using the format <code className="bg-orange-100 px-1 rounded mx-1">firstname.lastname@domain</code>. Secure passwords will be auto-generated for each account.</p>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">Cancel</button>
                    <button type="submit" disabled={loading || !domainId} className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2">
                      {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                      Create {userCount} Mailboxes
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default UsersPage;
