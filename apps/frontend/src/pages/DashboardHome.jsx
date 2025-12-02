import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardApi, documentsApi, clientsApi, mailApi } from '../lib/api';
import { 
  FileText, 
  Users, 
  DollarSign, 
  Clock,
  TrendingUp,
  Plus,
  ChevronRight,
  Receipt,
  FileSpreadsheet,
  Mail,
  Inbox,
  Send,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

const DashboardHome = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [recentDocuments, setRecentDocuments] = useState([]);
  const [recentEmails, setRecentEmails] = useState([]);
  const [mailStats, setMailStats] = useState({ unread: 0, total: 0, configured: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, activityRes, docsRes] = await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getActivity(5),
          documentsApi.getAll({ page: 1, limit: 5 })
        ]);
        setStats(statsRes.data);
        setActivity(activityRes.data);
        setRecentDocuments(docsRes.data.documents);

        // Fetch mail stats (non-blocking)
        try {
          const mailStatus = await mailApi.getAccountStatus();
          if (mailStatus.data.configured) {
            setMailStats({ ...mailStats, configured: true });
            const foldersRes = await mailApi.getFolders();
            const inbox = foldersRes.data.folders?.find(f => f.name === 'INBOX');
            if (inbox) {
              setMailStats({ unread: inbox.unread || 0, total: inbox.total || 0, configured: true });
            }
            // Get recent emails
            const emailsRes = await mailApi.getMessages({ folder: 'INBOX', limit: 3 });
            setRecentEmails(emailsRes.data.emails || []);
          }
        } catch (mailErr) {
          console.log('Mail not configured yet');
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Welcome back, {user?.name?.split(' ')[0] || 'User'}!
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">Here's what's happening with your documents today.</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 -mx-3 px-3 sm:mx-0 sm:px-0">
          <Link 
            to="/mail?compose=true"
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm whitespace-nowrap"
          >
            <Mail size={16} />
            <span className="hidden sm:inline">Compose</span>
          </Link>
          <Link 
            to="/documents/new?type=INVOICE"
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors text-sm whitespace-nowrap"
          >
            <Plus size={16} />
            <span>Invoice</span>
          </Link>
          <Link 
            to="/documents/new?type=QUOTATION"
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium transition-colors text-sm whitespace-nowrap"
          >
            <Plus size={16} />
            <span>Quote</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Total Documents</p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">{stats?.documentsCount || 0}</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <FileText className="text-orange-600 dark:text-orange-400" size={20} />
            </div>
          </div>
          <div className="mt-3 sm:mt-4 flex items-center gap-1 text-xs sm:text-sm">
            <TrendingUp className="text-green-500" size={14} />
            <span className="text-green-600 font-medium">+12%</span>
            <span className="text-slate-400 hidden sm:inline">from last month</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Clients</p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">{stats?.clientsCount || 0}</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Users className="text-blue-600 dark:text-blue-400" size={20} />
            </div>
          </div>
          <div className="mt-3 sm:mt-4 flex items-center gap-1 text-xs sm:text-sm">
            <TrendingUp className="text-green-500" size={14} />
            <span className="text-green-600 font-medium">+3</span>
            <span className="text-slate-400 hidden sm:inline">new this month</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Total Revenue</p>
              <p className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(stats?.totalRevenue || 0)}</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <DollarSign className="text-green-600 dark:text-green-400" size={20} />
            </div>
          </div>
          <div className="mt-3 sm:mt-4 flex items-center gap-1 text-xs sm:text-sm">
            <TrendingUp className="text-green-500" size={14} />
            <span className="text-green-600 font-medium">+8.3%</span>
            <span className="text-slate-400 hidden sm:inline">from last month</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Pending</p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">{stats?.pendingAmount || 0}</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
              <Clock className="text-amber-600 dark:text-amber-400" size={20} />
            </div>
          </div>
          <div className="mt-3 sm:mt-4 text-xs sm:text-sm">
            <span className="text-slate-400">Pending approval</span>
          </div>
        </div>
      </div>

      {/* Email Widget - NEW */}
      {mailStats.configured && (
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 rounded-xl flex items-center justify-center">
                <Mail className="text-white" size={20} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-white">Email</h2>
                <p className="text-blue-200 text-xs sm:text-sm">
                  {mailStats.unread > 0 ? `${mailStats.unread} unread messages` : 'All caught up!'}
                </p>
              </div>
            </div>
            <Link 
              to="/mail" 
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Inbox size={16} />
              Open Inbox
            </Link>
          </div>
          
          {recentEmails.length > 0 ? (
            <div className="space-y-2">
              {recentEmails.slice(0, 3).map((email, idx) => (
                <Link 
                  key={email.id || idx}
                  to="/mail"
                  className={`block p-3 rounded-lg transition-colors ${
                    !email.isRead ? 'bg-white/15 hover:bg-white/20' : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm truncate ${!email.isRead ? 'font-semibold text-white' : 'text-blue-100'}`}>
                      {email.fromName || email.fromAddress?.split('@')[0] || 'Unknown'}
                    </span>
                    <span className="text-xs text-blue-300 ml-2 flex-shrink-0">
                      {new Date(email.sentAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className={`text-sm truncate ${!email.isRead ? 'text-blue-100' : 'text-blue-200'}`}>
                    {email.subject || '(No subject)'}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-blue-200">
              <Mail size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent emails</p>
            </div>
          )}
        </div>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Recent Documents */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Recent Documents</h2>
            <Link to="/documents" className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center gap-1">
              View all <ChevronRight size={16} />
            </Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {recentDocuments.map((doc) => (
              <Link 
                key={doc.id} 
                to={`/documents/${doc.id}`}
                className="p-3 sm:p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`h-9 w-9 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    doc.type === 'INVOICE' ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-blue-100 dark:bg-blue-900/30'
                  }`}>
                    {doc.type === 'INVOICE' ? (
                      <Receipt className="text-orange-600 dark:text-orange-400" size={18} />
                    ) : (
                      <FileSpreadsheet className="text-blue-600 dark:text-blue-400" size={18} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white text-sm sm:text-base truncate">{doc.documentNumber}</p>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">{doc.client?.name || 'No client'}</p>
                  </div>
                </div>
                <div className="text-right ml-3 flex-shrink-0">
                  <p className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">{formatCurrency(doc.total)}</p>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{formatDate(doc.createdAt)}</p>
                </div>
              </Link>
            ))}
            {recentDocuments.length === 0 && (
              <div className="p-6 sm:p-8 text-center text-slate-500 dark:text-slate-400">
                No documents yet. Create your first invoice or quotation!
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-700">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Recent Activity</h2>
          </div>
          <div className="p-4 space-y-4">
            {activity.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="text-orange-600 dark:text-orange-400" size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    <span className="font-medium">{item.type}</span> {item.documentNumber}
                    {item.action && ` was ${item.action}`}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{formatDate(item.createdAt)}</p>
                </div>
              </div>
            ))}
            {activity.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-4">
          <Link 
            to="/documents/new?type=INVOICE"
            className="bg-white/10 hover:bg-white/20 rounded-xl p-3 sm:p-4 text-center transition-colors"
          >
            <Receipt className="text-orange-400 mx-auto mb-1 sm:mb-2" size={20} />
            <p className="text-white text-xs sm:text-sm font-medium">Invoice</p>
          </Link>
          <Link 
            to="/documents/new?type=QUOTATION"
            className="bg-white/10 hover:bg-white/20 rounded-xl p-3 sm:p-4 text-center transition-colors"
          >
            <FileSpreadsheet className="text-blue-400 mx-auto mb-1 sm:mb-2" size={20} />
            <p className="text-white text-xs sm:text-sm font-medium">Quote</p>
          </Link>
          <Link 
            to="/clients/new"
            className="bg-white/10 hover:bg-white/20 rounded-xl p-3 sm:p-4 text-center transition-colors"
          >
            <Users className="text-green-400 mx-auto mb-1 sm:mb-2" size={20} />
            <p className="text-white text-xs sm:text-sm font-medium">Client</p>
          </Link>
          <Link 
            to="/mail"
            className="bg-white/10 hover:bg-white/20 rounded-xl p-3 sm:p-4 text-center transition-colors relative hidden sm:block"
          >
            <Mail className="text-cyan-400 mx-auto mb-1 sm:mb-2" size={20} />
            <p className="text-white text-xs sm:text-sm font-medium">Email</p>
            {mailStats.unread > 0 && (
              <span className="absolute top-2 right-2 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                {mailStats.unread > 9 ? '9+' : mailStats.unread}
              </span>
            )}
          </Link>
          <Link 
            to="/documents?type=LETTERHEAD"
            className="bg-white/10 hover:bg-white/20 rounded-xl p-3 sm:p-4 text-center transition-colors hidden sm:block"
          >
            <FileText className="text-purple-400 mx-auto mb-1 sm:mb-2" size={20} />
            <p className="text-white text-xs sm:text-sm font-medium">Letter</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
