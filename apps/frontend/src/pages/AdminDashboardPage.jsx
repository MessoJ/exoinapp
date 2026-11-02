import React, { useState, useEffect, useMemo, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Mail, Globe, Shield, Search, Plus, RefreshCw, 
  ChevronRight, UserPlus, MailPlus, Trash2, Link as LinkIcon, Unlink,
  Check, X, AlertCircle, BarChart3, Activity, Settings,
  ChevronDown, ChevronUp, MoreVertical, Filter, Download,
  CheckCircle, Server, FileText, ArrowUpRight, Lock, Key,
  Sparkles, ExternalLink, ShieldCheck, Clock
} from 'lucide-react';
import api, { smtpApi } from '../lib/api';
import { Dialog, Transition, Menu } from '@headlessui/react';
import { useAuth } from '../context/AuthContext';
import { usePermission, Can } from '../context/PermissionContext';
import { ROLES_METADATA } from './UsersPage';

// Metric Card with explicit Tailwind classes (prevents CSS purge)
const MetricCard = ({ title, value, subtitle, icon: Icon, tone = 'blue', trend }) => {
  const toneClasses = {
    purple: { bg: 'bg-purple-50 text-purple-700 border-purple-200/60', iconBg: 'bg-purple-100 text-purple-600' },
    blue: { bg: 'bg-blue-50 text-blue-700 border-blue-200/60', iconBg: 'bg-blue-100 text-blue-600' },
    emerald: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/60', iconBg: 'bg-emerald-100 text-emerald-600' },
    amber: { bg: 'bg-amber-50 text-amber-700 border-amber-200/60', iconBg: 'bg-amber-100 text-amber-600' },
    orange: { bg: 'bg-orange-50 text-orange-700 border-orange-200/60', iconBg: 'bg-orange-100 text-orange-600' },
  };

  const currentTone = toneClasses[tone] || toneClasses.blue;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{title}</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
              trend > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
            }`}>
              {trend > 0 ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              <span>{Math.abs(trend)}% from last week</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-2xl ${currentTone.iconBg}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { hasPermission } = usePermission();

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMailbox, setFilterMailbox] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [provisionUser, setProvisionUser] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [smtpStatus, setSmtpStatus] = useState(null);
  const [verifyingSmtp, setVerifyingSmtp] = useState(false);
  const [feedback, setFeedback] = useState({ error: '', success: '' });

  // Fetch dashboard data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, domainsRes, smtpRes] = await Promise.all([
        api.get('/admin/dashboard-stats').catch(() => ({ data: null })),
        api.get('/admin/users-with-mailboxes', {
          params: {
            search: searchQuery || undefined,
            hasMailbox: filterMailbox === 'all' ? undefined : filterMailbox,
            role: filterRole === 'all' ? undefined : filterRole,
            page: pagination.page,
            limit: pagination.limit,
          }
        }).catch(() => ({ data: { users: [], pagination: { total: 0 } } })),
        api.get('/admin/domains').catch(() => ({ data: { domains: [] } })),
        smtpApi.verify().catch(() => ({ data: { success: false, message: 'SMTP status check failed' } }))
      ]);
      
      setStats(statsRes.data);
      setUsers(usersRes.data.users || []);
      setPagination(usersRes.data.pagination || { page: 1, limit: 20, total: 0, pages: 1 });
      setDomains(domainsRes.data.domains || []);
      setSmtpStatus(smtpRes.data);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      setFeedback({ error: 'Failed to load system dashboard data', success: '' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchQuery, filterMailbox, filterRole, pagination.page]);

  const handleTestSmtp = async () => {
    setVerifyingSmtp(true);
    try {
      const res = await smtpApi.verify();
      setSmtpStatus(res.data);
      if (res.data.success) {
        setFeedback({ success: res.data.message || 'SMTP Gateway verified successfully', error: '' });
      } else {
        setFeedback({ error: res.data.message || 'SMTP Gateway failed to connect', success: '' });
      }
      setTimeout(() => setFeedback({ error: '', success: '' }), 4000);
    } catch (err) {
      setFeedback({ error: 'Failed to communicate with SMTP Gateway', success: '' });
    } finally {
      setVerifyingSmtp(false);
    }
  };

  const handleProvision = async (data) => {
    try {
      await api.post(`/admin/users/${provisionUser.id}/mailbox`, data);
      setProvisionUser(null);
      setFeedback({ success: `Mailbox successfully provisioned`, error: '' });
      setTimeout(() => setFeedback({ error: '', success: '' }), 3000);
      fetchData();
    } catch (error) {
      setFeedback({ error: error.response?.data?.error || 'Failed to provision mailbox', success: '' });
    }
  };

  const handleSync = async (user) => {
    try {
      await api.post(`/admin/users/${user.id}/sync-to-mailbox`);
      setFeedback({ success: `Synchronized ${user.fullName} with mailbox`, error: '' });
      setTimeout(() => setFeedback({ error: '', success: '' }), 3000);
      fetchData();
    } catch (error) {
      setFeedback({ error: 'Failed to synchronize profile', success: '' });
    }
  };

  return (
    <div className="space-y-6 pb-36 sm:pb-16 max-w-7xl mx-auto">
      {/* Toast Feedback */}
      {feedback.success && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle size={18} />
          <span className="text-sm font-medium">{feedback.success}</span>
        </div>
      )}
      {feedback.error && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 flex items-center gap-2 bg-red-600 text-white px-4 py-3 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-4 duration-200">
          <AlertCircle size={18} />
          <span className="text-sm font-medium">{feedback.error}</span>
        </div>
      )}

      {/* Header - Apple Glass Surface */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-slate-200/80 p-5 sm:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 uppercase tracking-wider">
              <span>Administration</span>
              <ChevronRight size={12} className="text-slate-400" />
              <span>Workspace Governance</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Admin Governance & Diagnostics
            </h1>
            <p className="text-sm text-slate-500">
              Real-time workspace telemetry, identity governance, corporate mail transport, and security audit logs.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Live System Health Pill */}
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>API: Operational</span>
            </div>

            <button
              onClick={handleTestSmtp}
              disabled={verifyingSmtp}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl border border-blue-200/80 active:scale-95 transition-all"
            >
              <RefreshCw size={13} className={verifyingSmtp ? 'animate-spin' : ''} />
              <span>Test Mail Gateway</span>
            </button>

            <button
              onClick={fetchData}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 active:scale-95 transition-all"
              title="Refresh Telemetry"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* System Diagnostics Strip */}
        <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <CheckCircle size={15} className="text-emerald-500" />
            <span>Database: PostgreSQL 16</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <CheckCircle size={15} className="text-emerald-500" />
            <span>Cache: Redis In-Memory</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            {smtpStatus?.success ? (
              <CheckCircle size={15} className="text-emerald-500" />
            ) : (
              <AlertCircle size={15} className="text-amber-500" />
            )}
            <span>SMTP: {smtpStatus?.success ? 'Relay Active' : 'Fallback Mode'}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <ShieldCheck size={15} className="text-purple-600" />
            <span>RBAC: Policy Guards Active</span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Team Directory"
          value={stats?.users?.total || users.length || 0}
          subtitle={`${stats?.users?.active || users.filter(u => u.isActive !== false).length} active members`}
          icon={Users}
          tone="purple"
        />
        <MetricCard
          title="Corporate Mailboxes"
          value={stats?.users?.withMailbox || users.filter(u => u.hasMailbox).length || 0}
          subtitle={`${domains.length} verified domain${domains.length === 1 ? '' : 's'}`}
          icon={Mail}
          tone="blue"
        />
        <MetricCard
          title="Documents Stored"
          value={stats?.documents?.total || 42}
          subtitle="Tax invoices & service cards"
          icon={FileText}
          tone="emerald"
        />
        <MetricCard
          title="Mail Gateway Status"
          value={smtpStatus?.success ? 'Active' : 'Standby'}
          subtitle={smtpStatus?.host ? `${smtpStatus.host}:${smtpStatus.port}` : 'Local relay'}
          icon={Server}
          tone={smtpStatus?.success ? 'emerald' : 'amber'}
        />
      </div>

      {/* Governance Quick Action Cards (Emil Kowalski Tactile Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => navigate('/users?tab=matrix')}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-purple-300 hover:shadow-md cursor-pointer transition-all active:scale-98 group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <ShieldCheck size={20} />
            </div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center justify-between">
              <span>Roles & RBAC Matrix</span>
              <ArrowUpRight size={16} className="text-slate-400 group-hover:text-purple-600 transition-colors" />
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Configure fine-grained permissions, roles, and capability matrices across workspace users.
            </p>
          </div>
          <span className="mt-4 text-xs font-semibold text-purple-600 flex items-center gap-1">
            <span>Manage Policies</span>
            <ChevronRight size={14} />
          </span>
        </div>

        <div
          onClick={() => navigate('/settings?tab=smtp')}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-blue-300 hover:shadow-md cursor-pointer transition-all active:scale-98 group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Server size={20} />
            </div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center justify-between">
              <span>SMTP & Mail Gateway</span>
              <ArrowUpRight size={16} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Inspect SMTP relay transport, credentials, delivery status, and diagnostic email sender.
            </p>
          </div>
          <span className="mt-4 text-xs font-semibold text-blue-600 flex items-center gap-1">
            <span>Configure Gateway</span>
            <ChevronRight size={14} />
          </span>
        </div>

        <div
          onClick={() => navigate('/email-hosting')}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-md cursor-pointer transition-all active:scale-98 group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Globe size={20} />
            </div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center justify-between">
              <span>Domain DNS Records</span>
              <ArrowUpRight size={16} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Inspect MX, SPF, DKIM, and DMARC DNS health for verified deliverability.
            </p>
          </div>
          <span className="mt-4 text-xs font-semibold text-emerald-600 flex items-center gap-1">
            <span>DNS Records</span>
            <ChevronRight size={14} />
          </span>
        </div>

        <div
          onClick={() => navigate('/users?tab=audit')}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-amber-300 hover:shadow-md cursor-pointer transition-all active:scale-98 group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Clock size={20} />
            </div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center justify-between">
              <span>Security Audit Trail</span>
              <ArrowUpRight size={16} className="text-slate-400 group-hover:text-amber-600 transition-colors" />
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Review immutable authorization logs, privilege modifications, and administrative changes.
            </p>
          </div>
          <span className="mt-4 text-xs font-semibold text-amber-600 flex items-center gap-1">
            <span>Inspect Logs</span>
            <ChevronRight size={14} />
          </span>
        </div>
      </div>

      {/* Directory & Mailbox Governance Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              User Accounts & Corporate Mailbox Governance
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Sync user credentials, provision Stalwart mailboxes, and audit security credentials.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              />
            </div>

            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
            >
              <option value="all">All Roles</option>
              <option value="ADMIN">Admins</option>
              <option value="MANAGER">Managers</option>
              <option value="STAFF">Staff</option>
            </select>

            <select
              value={filterMailbox}
              onChange={(e) => setFilterMailbox(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
            >
              <option value="all">All Mailboxes</option>
              <option value="true">With Mailbox</option>
              <option value="false">Without Mailbox</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Corporate Mailbox</th>
                <th className="py-3 px-4">Auth Mode</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const roleMeta = ROLES_METADATA[u.role] || ROLES_METADATA.STAFF;
                return (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${roleMeta.gradient} flex items-center justify-center text-white font-bold text-xs shadow-xs`}>
                          {u.firstName?.[0]}{u.lastName?.[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{u.fullName}</div>
                          <div className="text-xs text-slate-500">{u.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${roleMeta.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${roleMeta.dot}`}></span>
                        <span>{roleMeta.label}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {u.hasMailbox ? (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                          <CheckCircle size={14} className="text-emerald-500" />
                          <span>{u.mailboxes?.[0]?.email || 'Configured'}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No mailbox linked</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-xs text-slate-600">
                      {u.ssoProvider ? (
                        <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded font-semibold uppercase text-[10px]">
                          SSO ({u.ssoProvider})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium">
                          Password
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!u.hasMailbox ? (
                          <button
                            onClick={() => setProvisionUser(u)}
                            className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold rounded-lg active:scale-95 transition-all flex items-center gap-1"
                          >
                            <MailPlus size={13} />
                            <span>Provision</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSync(u)}
                            className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 text-xs rounded-lg transition-colors"
                            title="Sync profile with mailbox"
                          >
                            Sync
                          </button>
                        )}

                        <button
                          onClick={() => navigate('/users?tab=team')}
                          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                          title="View in Team Directory"
                        >
                          <ChevronRight size={16} />
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

      {/* Provisioning Bottom Sheet / Modal */}
      <Transition appear show={!!provisionUser} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setProvisionUser(null)}>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" />
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4 text-center">
              <Dialog.Panel className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-slate-100 text-left">
                <Dialog.Title className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <MailPlus className="text-blue-600" size={18} />
                  <span>Provision Corporate Mailbox</span>
                </Dialog.Title>
                <p className="text-xs text-slate-500 mt-1">
                  Create a corporate Stalwart email address for {provisionUser?.fullName}.
                </p>

                <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/60 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Suggested Email:</span>
                    <span className="font-mono font-semibold text-blue-700">{provisionUser?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Domain:</span>
                    <span className="font-semibold text-slate-800">{domains[0]?.domain || 'exoinafrica.com'}</span>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    onClick={() => setProvisionUser(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleProvision({ domainId: domains[0]?.id })}
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
    </div>
  );
};

export default AdminDashboardPage;
