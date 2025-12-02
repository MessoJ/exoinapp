import React, { useState, useEffect } from 'react';
import { 
  Users, Mail, Globe, Shield, Search, Plus, RefreshCw, 
  ChevronRight, UserPlus, MailPlus, Trash2, Link, Unlink,
  Check, X, AlertCircle, BarChart3, Activity, Settings,
  ChevronDown, ChevronUp, MoreVertical, Filter, Download
} from 'lucide-react';
import api from '../lib/api';

// Stats Card Component
const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
        <p className="text-3xl font-bold mt-1 text-gray-900 dark:text-white">{value}</p>
        {subtitle && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
        )}
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-xl bg-${color}-100 dark:bg-${color}-900/30`}>
        <Icon className={`h-6 w-6 text-${color}-600 dark:text-${color}-400`} />
      </div>
    </div>
  </div>
);

// User Row Component
const UserRow = ({ user, onProvision, onViewMailboxes, onSync, expanded, onToggle }) => {
  const [showActions, setShowActions] = useState(false);
  
  return (
    <>
      <tr 
        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
        onClick={onToggle}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-900 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{user.fullName}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
            user.role === 'MANAGER' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
            'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}>
            {user.role}
          </span>
        </td>
        <td className="px-4 py-3">
          {user.hasMailbox ? (
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {user.mailboxCount} mailbox{user.mailboxCount > 1 ? 'es' : ''}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <X className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-500">No mailbox</span>
            </div>
          )}
        </td>
        <td className="px-4 py-3">
          {user.ssoProvider ? (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              {user.ssoProvider}
            </span>
          ) : (
            <span className="text-sm text-gray-400">Password</span>
          )}
        </td>
        <td className="px-4 py-3 relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowActions(!showActions); }}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <MoreVertical className="h-4 w-4 text-gray-500" />
          </button>
          
          {showActions && (
            <div className="absolute right-4 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-10">
              {!user.hasMailbox && (
                <button
                  onClick={(e) => { e.stopPropagation(); onProvision(user); setShowActions(false); }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <MailPlus className="h-4 w-4" />
                  Provision Mailbox
                </button>
              )}
              {user.hasMailbox && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); onViewMailboxes(user); setShowActions(false); }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    View Mailboxes
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onSync(user); setShowActions(false); }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Sync to Mailbox
                  </button>
                </>
              )}
            </div>
          )}
        </td>
      </tr>
      
      {/* Expanded mailbox details */}
      {expanded && user.mailboxes.length > 0 && (
        <tr className="bg-gray-50 dark:bg-gray-800/50">
          <td colSpan={5} className="px-4 py-3">
            <div className="pl-14">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mailboxes</h4>
              <div className="space-y-2">
                {user.mailboxes.map((mb) => (
                  <div 
                    key={mb.id}
                    className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-orange-500" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{mb.fullAddress}</p>
                        <p className="text-sm text-gray-500">{mb.displayName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {mb.usedMb || 0} / {mb.quotaMb} MB
                        </p>
                        <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-1">
                          <div 
                            className={`h-full rounded-full ${mb.quotaPercent > 80 ? 'bg-red-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min(100, mb.quotaPercent)}%` }}
                          />
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        mb.isActive 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {mb.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

// Provision Modal Component
const ProvisionModal = ({ user, domains, onClose, onProvision }) => {
  const [domainId, setDomainId] = useState(domains[0]?.id || '');
  const [localPart, setLocalPart] = useState(user.email.split('@')[0]);
  const [quotaMb, setQuotaMb] = useState(1024);
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onProvision({ domainId, localPart, quotaMb });
    setLoading(false);
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Provision Mailbox for {user.fullName}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Domain
            </label>
            <select
              value={domainId}
              onChange={(e) => setDomainId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {domains.map((d) => (
                <option key={d.id} value={d.id}>@{d.domain}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address
            </label>
            <div className="flex">
              <input
                type="text"
                value={localPart}
                onChange={(e) => setLocalPart(e.target.value)}
                className="flex-1 px-4 py-2 border border-r-0 border-gray-300 dark:border-gray-600 rounded-l-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <span className="px-4 py-2 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-r-lg text-gray-700 dark:text-gray-300">
                @{domains.find(d => d.id === domainId)?.domain}
              </span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Quota (MB)
            </label>
            <input
              type="number"
              value={quotaMb}
              onChange={(e) => setQuotaMb(parseInt(e.target.value))}
              min={100}
              max={10240}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? 'Provisioning...' : 'Create Mailbox'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Admin Dashboard Component
const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMailbox, setFilterMailbox] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [expandedUser, setExpandedUser] = useState(null);
  const [provisionUser, setProvisionUser] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [activeTab, setActiveTab] = useState('users');

  // Fetch dashboard data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, domainsRes] = await Promise.all([
        api.get('/admin/dashboard-stats'),
        api.get('/admin/users-with-mailboxes', {
          params: {
            search: searchQuery || undefined,
            hasMailbox: filterMailbox === 'all' ? undefined : filterMailbox,
            role: filterRole === 'all' ? undefined : filterRole,
            page: pagination.page,
            limit: pagination.limit,
          }
        }),
        api.get('/admin/domains'),
      ]);
      
      setStats(statsRes.data);
      setUsers(usersRes.data.users);
      setPagination(usersRes.data.pagination);
      setDomains(domainsRes.data.domains);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchQuery, filterMailbox, filterRole, pagination.page]);

  // Handlers
  const handleProvision = async (data) => {
    try {
      await api.post(`/admin/users/${provisionUser.id}/mailbox`, data);
      setProvisionUser(null);
      fetchData();
    } catch (error) {
      console.error('Failed to provision mailbox:', error);
      alert(error.response?.data?.error || 'Failed to provision mailbox');
    }
  };

  const handleSync = async (user) => {
    try {
      await api.post(`/admin/users/${user.id}/sync-to-mailbox`);
      fetchData();
    } catch (error) {
      console.error('Failed to sync:', error);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage users, mailboxes, and email hosting</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium">
            <UserPlus className="h-4 w-4" />
            Add User
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Total Users" 
            value={stats.users.total}
            subtitle={`${stats.users.active} active`}
            icon={Users}
            color="blue"
          />
          <StatCard 
            title="With Mailbox" 
            value={stats.users.withMailbox}
            subtitle={`${stats.users.mailboxCoverage}% coverage`}
            icon={Mail}
            color="green"
          />
          <StatCard 
            title="Domains" 
            value={stats.domains.total}
            subtitle={`${stats.domains.verified} verified`}
            icon={Globe}
            color="purple"
          />
          <StatCard 
            title="Total Mailboxes" 
            value={stats.mailboxes.total}
            subtitle={`${stats.mailboxes.active} active`}
            icon={BarChart3}
            color="orange"
          />
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {['users', 'domains', 'audit'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab === 'users' && 'Users & Mailboxes'}
              {tab === 'domains' && 'Domains'}
              {tab === 'audit' && 'Audit Log'}
            </button>
          ))}
        </nav>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          {/* Filters */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            
            <select
              value={filterMailbox}
              onChange={(e) => setFilterMailbox(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Users</option>
              <option value="true">With Mailbox</option>
              <option value="false">Without Mailbox</option>
            </select>
            
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Manager</option>
              <option value="STAFF">Staff</option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Mailbox
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Auth
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    expanded={expandedUser === user.id}
                    onToggle={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                    onProvision={() => setProvisionUser(user)}
                    onViewMailboxes={() => setExpandedUser(user.id)}
                    onSync={handleSync}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                  disabled={pagination.page >= pagination.pages}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Domains Tab */}
      {activeTab === 'domains' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900 dark:text-white">Email Domains</h3>
            <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium">
              <Plus className="h-4 w-4" />
              Add Domain
            </button>
          </div>
          
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {domains.map((domain) => (
              <div key={domain.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{domain.domain}</p>
                    <p className="text-sm text-gray-500">
                      {domain.mailboxCount} mailboxes • {domain.aliasCount} aliases
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    domain.isVerified
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {domain.isVerified ? 'Verified' : 'Pending Verification'}
                  </span>
                  {domain.isPrimary && (
                    <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                      Primary
                    </span>
                  )}
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                    <Settings className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit Tab */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm">
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
          
          {stats?.recentActivity && (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {stats.recentActivity.map((activity, i) => (
                <div key={i} className="p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    activity.action === 'CREATE' ? 'bg-green-100 dark:bg-green-900/30' :
                    activity.action === 'DELETE' ? 'bg-red-100 dark:bg-red-900/30' :
                    'bg-blue-100 dark:bg-blue-900/30'
                  }`}>
                    <Activity className={`h-5 w-5 ${
                      activity.action === 'CREATE' ? 'text-green-600' :
                      activity.action === 'DELETE' ? 'text-red-600' :
                      'text-blue-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {activity.action} by {activity.user}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Provision Modal */}
      {provisionUser && (
        <ProvisionModal
          user={provisionUser}
          domains={domains}
          onClose={() => setProvisionUser(null)}
          onProvision={handleProvision}
        />
      )}
    </div>
  );
};

export default AdminDashboardPage;
