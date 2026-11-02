import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardApi, documentsApi, clientsApi, mailApi } from '../lib/api';
import { 
  FileText, 
  Users, 
  Clock,
  TrendingUp,
  Plus,
  ChevronRight,
  Receipt,
  FileSpreadsheet,
  Mail,
  Inbox,
  Send,
  Truck,
  ClipboardCheck,
  CheckCircle2,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  PenTool,
  Calendar
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
          dashboardApi.getStats().catch(() => ({ data: {} })),
          dashboardApi.getActivity(5).catch(() => ({ data: [] })),
          documentsApi.getAll({ page: 1, limit: 6 }).catch(() => ({ data: { documents: [] } }))
        ]);
        setStats(statsRes.data || {});
        setActivity(activityRes.data || []);
        setRecentDocuments(docsRes.data?.documents || []);

        // Fetch mail stats (non-blocking)
        try {
          const mailStatus = await mailApi.getAccountStatus();
          if (mailStatus.data?.configured) {
            setMailStats(prev => ({ ...prev, configured: true }));
            const foldersRes = await mailApi.getFolders();
            const inbox = foldersRes.data?.folders?.find(f => f.name === 'INBOX');
            if (inbox) {
              setMailStats({ unread: inbox.unread || 0, total: inbox.total || 0, configured: true });
            }
            const emailsRes = await mailApi.getMessages({ folder: 'INBOX', limit: 3 });
            setRecentEmails(emailsRes.data?.emails || []);
          }
        } catch (mailErr) {
          // Mail unconfigured
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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short'
    });
  };

  const getDocBadge = (type) => {
    switch (type) {
      case 'INVOICE':
        return { label: 'Invoice', bg: 'bg-orange-50 text-orange-700 border-orange-200/60', icon: Receipt };
      case 'QUOTATION':
        return { label: 'Quotation', bg: 'bg-blue-50 text-blue-700 border-blue-200/60', icon: FileSpreadsheet };
      case 'DELIVERY_NOTE':
        return { label: 'Delivery Note', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/60', icon: Truck };
      case 'JOB_CARD':
        return { label: 'Job Card', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200/60', icon: ClipboardCheck };
      default:
        return { label: type || 'Document', bg: 'bg-slate-50 text-slate-700 border-slate-200/60', icon: FileText };
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-3 border-orange-600/30 border-t-orange-600 rounded-full animate-spin"></div>
        <p className="text-xs font-medium text-slate-400">Loading your workspace...</p>
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] || 'User';

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 antialiased">
      {/* 1. Apple Hero Welcome Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white p-6 sm:p-8 shadow-xl shadow-slate-950/10 border border-slate-800/80">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-orange-500/20 via-blue-500/10 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-semibold tracking-wide text-orange-300">
              <Sparkles size={13} className="text-orange-400" />
              <span>Exoin Africa Workspace</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              {greeting}, {firstName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Generate job cards, delivery notes, and tax invoices with instant on-site client signatures.
            </p>
          </div>

          {/* Quick Header CTA Action */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <Link
              to="/finance?type=job_card"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-semibold rounded-2xl shadow-lg shadow-orange-500/30 active:scale-95 transition-all touch-manipulation"
            >
              <ClipboardCheck size={18} strokeWidth={2.2} />
              <span>New Job Card</span>
            </Link>
            <Link
              to="/documents/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold rounded-2xl backdrop-blur-md border border-white/10 active:scale-95 transition-all touch-manipulation"
            >
              <Plus size={18} strokeWidth={2.2} />
              <span>Create Document</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Apple Bento Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Revenue */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Revenue</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp size={16} strokeWidth={2.5} />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
            {formatCurrency(stats?.totalRevenue || 0)}
          </p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <span>+8.3%</span>
            <span className="text-slate-400">vs last month</span>
          </p>
        </div>

        {/* Metric 2: Documents */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Documents</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <FileText size={16} strokeWidth={2.5} />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
            {stats?.documentsCount || 0}
          </p>
          <p className="text-[11px] text-slate-400 font-medium mt-1">
            Total records issued
          </p>
        </div>

        {/* Metric 3: Clients */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Clients</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={16} strokeWidth={2.5} />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
            {stats?.clientsCount || 0}
          </p>
          <p className="text-[11px] text-blue-600 font-medium mt-1">
            Active accounts
          </p>
        </div>

        {/* Metric 4: Pending Docs */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Pending</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={16} strokeWidth={2.5} />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
            {stats?.pendingAmount || 0}
          </p>
          <p className="text-[11px] text-amber-600 font-medium mt-1">
            Awaiting settlement
          </p>
        </div>
      </div>

      {/* 3. Primary Feature Action Tiles (Apple iOS Grid) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">Primary Actions</h2>
          <span className="text-xs text-slate-400">Touch to launch</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Card 1: Service Job Card */}
          <Link
            to="/finance?type=job_card"
            className="group relative bg-white/90 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 border border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-md active:scale-98 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                <ClipboardCheck size={20} className="text-orange-400" />
              </div>
              <ArrowUpRight size={16} className="text-slate-400 group-hover:text-slate-700 transition-colors" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">Service Job Card</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Technician & client sign</p>
            </div>
          </Link>

          {/* Card 2: Delivery Note */}
          <Link
            to="/finance?type=delivery_note"
            className="group relative bg-white/90 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 border border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-md active:scale-98 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Truck size={20} />
              </div>
              <ArrowUpRight size={16} className="text-slate-400 group-hover:text-slate-700 transition-colors" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">Delivery Note</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Dispatch & confirm items</p>
            </div>
          </Link>

          {/* Card 3: Tax Invoice */}
          <Link
            to="/finance?type=invoice"
            className="group relative bg-white/90 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 border border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-md active:scale-98 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
                <Receipt size={20} />
              </div>
              <ArrowUpRight size={16} className="text-slate-400 group-hover:text-slate-700 transition-colors" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">Tax Invoice</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Bill with VAT / eTIMS</p>
            </div>
          </Link>

          {/* Card 4: Quotation */}
          <Link
            to="/finance?type=quotation"
            className="group relative bg-white/90 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 border border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-md active:scale-98 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileSpreadsheet size={20} />
              </div>
              <ArrowUpRight size={16} className="text-slate-400 group-hover:text-slate-700 transition-colors" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">Quotation</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Proposals & cost estimates</p>
            </div>
          </Link>
        </div>
      </div>

      {/* 4. Split Section: Recent Documents & Activity / Quick Comms */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Documents Card */}
        <div className="lg:col-span-2 bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Recent Documents</h2>
              <p className="text-xs text-slate-400">Latest business documents issued</p>
            </div>
            <Link 
              to="/documents" 
              className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700 px-3 py-1.5 rounded-xl hover:bg-orange-50 transition-colors"
            >
              <span>View all</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="divide-y divide-slate-100/80">
            {recentDocuments.map((doc) => {
              const badge = getDocBadge(doc.type);
              const BadgeIcon = badge.icon;
              return (
                <Link 
                  key={doc.id} 
                  to={`/documents/${doc.id}`}
                  className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-50/80 active:bg-slate-100 transition-colors touch-manipulation"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
                      <BadgeIcon className="text-slate-700" size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-900 text-sm truncate">{doc.documentNumber}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {doc.client?.name || 'Private Client'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-3">
                    <p className="font-bold text-slate-900 text-sm">{formatCurrency(doc.total)}</p>
                    <p className="text-[11px] text-slate-400">{formatDate(doc.createdAt)}</p>
                  </div>
                </Link>
              );
            })}

            {recentDocuments.length === 0 && (
              <div className="p-10 text-center">
                <FileText className="mx-auto text-slate-300 mb-2" size={36} />
                <p className="text-sm font-semibold text-slate-700">No documents yet</p>
                <p className="text-xs text-slate-400 mt-1 mb-4">Start by creating your first service job card or invoice.</p>
                <Link
                  to="/finance?type=job_card"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
                >
                  <Plus size={14} /> Create Job Card
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Quick Hub (Signatures, Mail, Brand) */}
        <div className="space-y-4">
          {/* Internal Signatures Card */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <PenTool size={16} />
                </div>
                <h3 className="text-sm font-bold text-slate-900">E-Signatures</h3>
              </div>
              <Link to="/signatures" className="text-xs text-orange-600 font-semibold hover:underline">
                Manage
              </Link>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Store internal officer signatures to quickly sign generated job cards, letters, and delivery notes.
            </p>
          </div>

          {/* Email Widget */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-5 shadow-xs border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/10 text-white flex items-center justify-center">
                  <Mail size={16} />
                </div>
                <h3 className="text-sm font-bold text-white">Client Email Portal</h3>
              </div>
              <Link 
                to="/mail" 
                className="text-xs font-semibold text-orange-400 hover:text-orange-300"
              >
                Inbox
              </Link>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Send PDF job cards and invoices directly to clients from your verified company email address.
            </p>
            <Link
              to="/mail?compose=true"
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/10 hover:bg-white/20 active:scale-95 transition-all rounded-xl text-xs font-semibold text-white border border-white/10"
            >
              <Send size={14} />
              <span>Compose Message</span>
            </Link>
          </div>

          {/* Client Management Quick Link */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Client Directory</p>
                <p className="text-[11px] text-slate-400">{stats?.clientsCount || 0} registered contacts</p>
              </div>
            </div>
            <Link
              to="/clients/new"
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors active:scale-95"
              title="Add client"
            >
              <Plus size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
