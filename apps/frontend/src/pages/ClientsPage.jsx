import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { clientsApi } from '../lib/api';
import { 
  Users, 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  MapPin, 
  MoreVertical, 
  Trash2, 
  Edit, 
  Building, 
  Send, 
  ArrowUpRight,
  FileText,
  UserCheck,
  Printer,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  X,
  CreditCard,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Receipt
} from 'lucide-react';

const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenu, setActiveMenu] = useState(null);

  // Statement & Ledger Modal State
  const [statementModalClient, setStatementModalClient] = useState(null);
  const [statementData, setStatementData] = useState(null);
  const [loadingStatement, setLoadingStatement] = useState(false);
  const [statementDateRange, setStatementDateRange] = useState({ startDate: '', endDate: '' });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [feedback, setFeedback] = useState({ success: '', error: '' });

  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await clientsApi.getAll();
      setClients(response.data?.clients || response.data || []);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    if (!confirm('Are you sure you want to remove this client from your directory?')) return;
    try {
      await clientsApi.delete(id);
      fetchClients();
    } catch (error) {
      console.error('Failed to delete client:', error);
      alert(error.response?.data?.error || 'Failed to delete client');
    }
    setActiveMenu(null);
  };

  // Open Statement of Account Modal
  const handleOpenStatement = async (client, customDates = statementDateRange) => {
    setStatementModalClient(client);
    setLoadingStatement(true);
    try {
      const params = {};
      if (customDates.startDate) params.startDate = customDates.startDate;
      if (customDates.endDate) params.endDate = customDates.endDate;

      const res = await clientsApi.getStatement(client.id, params);
      setStatementData(res.data);
    } catch (err) {
      console.error('Failed to fetch client statement:', err);
      setFeedback({ error: 'Failed to load client ledger statement', success: '' });
    } finally {
      setLoadingStatement(false);
    }
  };

  // Handle Date Filter Change in Statement Modal
  const handleDateFilterChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...statementDateRange, [name]: value };
    setStatementDateRange(updated);
    if (statementModalClient) {
      handleOpenStatement(statementModalClient, updated);
    }
  };

  // Email Statement to Client via Stalwart
  const handleEmailStatement = async () => {
    if (!statementModalClient) return;
    setSendingEmail(true);
    try {
      const res = await clientsApi.emailStatement(statementModalClient.id);
      if (res.data?.success) {
        setFeedback({ 
          success: `Statement dispatched to ${res.data.recipient} via Stalwart Mail!`, 
          error: '' 
        });
      } else {
        setFeedback({ error: 'Failed to dispatch email statement', success: '' });
      }
      setTimeout(() => setFeedback({ success: '', error: '' }), 4000);
    } catch (err) {
      setFeedback({ error: err.response?.data?.error || 'Failed to email statement', success: '' });
    } finally {
      setSendingEmail(false);
    }
  };

  // Print Statement
  const handlePrintStatement = () => {
    window.print();
  };

  const filteredClients = clients.filter(client => {
    const q = searchQuery.toLowerCase();
    return (
      (client.name && client.name.toLowerCase().includes(q)) ||
      (client.email && client.email.toLowerCase().includes(q)) ||
      (client.contactPerson && client.contactPerson.toLowerCase().includes(q)) ||
      (client.phone && client.phone.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 antialiased pb-36 sm:pb-16">
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

      {/* 1. Apple-style Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 backdrop-blur-xl p-4 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Clients Directory & CRM</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/50">
              {clients.length} Total
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage customer accounts, dispatch locations, financial ledgers, and statement generation
          </p>
        </div>

        <Link 
          to="/clients/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-slate-900/10 active:scale-95 transition-all touch-manipulation"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Add Client</span>
        </Link>
      </div>

      {/* 2. Apple Spotlight Search Filter */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 border border-slate-200/80 shadow-xs print:hidden">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client name, email, contact person..."
            className="w-full pl-10 pr-4 py-2 bg-slate-100/70 focus:bg-white text-xs sm:text-sm text-slate-800 rounded-xl border border-transparent focus:border-slate-300 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
          />
        </div>
      </div>

      {/* 3. Clients Bento Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 print:hidden">
          <div className="w-10 h-10 border-3 border-orange-600/30 border-t-orange-600 rounded-full animate-spin"></div>
          <p className="text-xs font-medium text-slate-400">Loading client directory...</p>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs print:hidden">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Users size={32} />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">No clients found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
            {searchQuery ? `No results matching "${searchQuery}". Check your spelling or try another keyword.` : 'Build your customer directory to issue instant job cards, invoices and financial statements.'}
          </p>
          {!searchQuery && (
            <Link
              to="/clients/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
            >
              <Plus size={15} /> Add First Client
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print:hidden">
          {filteredClients.map((client) => (
            <div 
              key={client.id}
              className="group bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-slate-200/80 hover:border-slate-300 hover:shadow-lg transition-all relative flex flex-col justify-between"
            >
              <div>
                {/* Card Top: Avatar & Action Menu */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-700 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                      {client.name ? client.name.charAt(0).toUpperCase() : 'C'}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 text-sm truncate leading-tight group-hover:text-orange-600 transition-colors">
                        {client.name}
                      </h3>
                      {client.contactPerson && (
                        <p className="text-[11px] text-slate-500 truncate mt-0.5 flex items-center gap-1">
                          <UserCheck size={12} className="text-slate-400 shrink-0" />
                          <span>{client.contactPerson}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setActiveMenu(activeMenu === client.id ? null : client.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors active:scale-90"
                      aria-label="Actions"
                    >
                      <MoreVertical size={16} />
                    </button>
                    
                    {activeMenu === client.id && (
                      <>
                        <div 
                          className="fixed inset-0 z-20" 
                          onClick={() => setActiveMenu(null)} 
                        />
                        <div className="absolute right-0 top-full mt-1 bg-white/95 backdrop-blur-xl border border-slate-100 rounded-2xl shadow-xl py-1 z-30 w-44 animate-in fade-in zoom-in-95 duration-100">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenu(null);
                              handleOpenStatement(client);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 text-left"
                          >
                            <FileText size={14} className="text-blue-600" />
                            <span>Account Statement</span>
                          </button>
                          <Link
                            to={`/clients/${client.id}/edit`}
                            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            <Edit size={14} /> Edit Client
                          </Link>
                          <button
                            type="button"
                            onClick={(e) => handleDelete(client.id, e)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 text-left"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Contact List */}
                <div className="space-y-1.5 py-3 border-y border-slate-100 text-xs text-slate-600">
                  {client.email && (
                    <div className="flex items-center gap-2 truncate">
                      <Mail size={13} className="text-slate-400 shrink-0" />
                      <a href={`mailto:${client.email}`} className="truncate hover:text-orange-600 hover:underline">
                        {client.email}
                      </a>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2 truncate">
                      <Phone size={13} className="text-slate-400 shrink-0" />
                      <a href={`tel:${client.phone}`} className="hover:text-orange-600">
                        {client.phone}
                      </a>
                    </div>
                  )}
                  {(client.addressLine1 || client.city) && (
                    <div className="flex items-start gap-2 text-slate-500 line-clamp-1">
                      <MapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />
                      <span className="truncate">{client.addressLine1}{client.city ? `, ${client.city}` : ''}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer: Quick Actions */}
              <div className="pt-3 flex items-center justify-between text-xs mt-2">
                <button
                  type="button"
                  onClick={() => handleOpenStatement(client)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold text-[11px] transition-all active:scale-95"
                >
                  <Receipt size={13} />
                  <span>Statement</span>
                </button>

                <div className="flex items-center gap-1.5">
                  {client.email && (
                    <Link 
                      to={`/mail?compose=true&to=${encodeURIComponent(client.email)}&subject=${encodeURIComponent(`Service correspondence from Exoin Africa`)}`}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors active:scale-95"
                      title="Send Email"
                    >
                      <Send size={13} />
                    </Link>
                  )}
                  <Link
                    to={`/documents?clientId=${client.id}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-xl font-bold text-[11px] transition-colors"
                  >
                    <span>{client._count?.documents || 0} Docs</span>
                    <ArrowUpRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================== */}
      {/* 4. STATEMENT OF ACCOUNT & FINANCIAL LEDGER MODAL           */}
      {/* ========================================================== */}
      {statementModalClient && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:static">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto border border-slate-200 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 print:shadow-none print:border-none print:max-h-full print:w-full print:rounded-none">
            
            {/* Modal Action Bar (Hidden in Print) */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10 print:hidden">
              <div className="flex items-center gap-2">
                <Receipt className="text-blue-600" size={20} />
                <h2 className="text-base font-bold text-slate-900">
                  Client Financial Statement & Ledger
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleEmailStatement}
                  disabled={sendingEmail}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 active:scale-95 transition-all"
                  title="Dispatch statement to client email"
                >
                  {sendingEmail ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                  <span>{sendingEmail ? 'Dispatching...' : 'Email Client'}</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintStatement}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <Printer size={13} />
                  <span>Print PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatementModalClient(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl active:scale-95 transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Date Filters Header (Hidden in Print) */}
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
              <span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Statement Period:</span>
              <div className="flex items-center gap-2">
                <input 
                  type="date"
                  name="startDate"
                  value={statementDateRange.startDate}
                  onChange={handleDateFilterChange}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <span className="text-slate-400">to</span>
                <input 
                  type="date"
                  name="endDate"
                  value={statementDateRange.endDate}
                  onChange={handleDateFilterChange}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Modal Body / Official Printable Document */}
            {loadingStatement ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-10 h-10 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                <p className="text-xs text-slate-400 font-medium">Computing financial ledger & transactions...</p>
              </div>
            ) : statementData ? (
              <div className="p-6 sm:p-8 space-y-6">
                
                {/* Official Letterhead Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b-2 border-slate-900 pb-6">
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                      {statementData.company?.name || 'EXOIN AFRICA'}
                    </h1>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {statementData.company?.tagline || 'Autonomous Hygiene & Specialized Facility Solutions'}
                    </p>
                    <div className="mt-3 text-xs text-slate-600 space-y-0.5 font-mono">
                      <p>KRA PIN: {statementData.company?.taxId || 'A015776087P'}</p>
                      <p>Phone: {statementData.company?.phone || '0739443244'}</p>
                      <p>Email: {statementData.company?.email || 'admin@exoinafrica.com'}</p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right space-y-1">
                    <span className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-black uppercase tracking-wider rounded-lg">
                      Statement of Account
                    </span>
                    <p className="text-xs text-slate-500 pt-1 font-mono">
                      Generated: {new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Client Coordinates & Remittance Box */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/70 rounded-2xl p-4 border border-slate-200/60 text-xs">
                  <div>
                    <h3 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Statement Issued To:</h3>
                    <p className="text-sm font-bold text-slate-900">{statementData.client.name}</p>
                    {statementData.client.contactPerson && <p className="text-slate-600">Attn: {statementData.client.contactPerson}</p>}
                    {statementData.client.email && <p className="text-slate-600">{statementData.client.email}</p>}
                    {statementData.client.phone && <p className="text-slate-600">{statementData.client.phone}</p>}
                    {(statementData.client.addressLine1 || statementData.client.city) && (
                      <p className="text-slate-500">{statementData.client.addressLine1}{statementData.client.city ? `, ${statementData.client.city}` : ''}</p>
                    )}
                  </div>

                  <div className="border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-6 space-y-1">
                    <h3 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Bank Remittance Coordinates:</h3>
                    <p className="font-semibold text-slate-800">Bank: {statementData.company?.bankName || 'Equity Bank Kenya'}</p>
                    <p className="font-mono text-slate-700">Account: {statementData.company?.bankAccount || '0123456789012'}</p>
                    <p className="text-slate-600">Branch: {statementData.company?.bankBranch || 'Westlands Supreme Branch'}</p>
                  </div>
                </div>

                {/* 3 Metrics Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Invoiced</p>
                    <p className="text-base sm:text-lg font-black text-slate-900 mt-1 font-mono">
                      {statementData.summary.currency} {statementData.summary.totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200/80">
                    <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Total Paid</p>
                    <p className="text-base sm:text-lg font-black text-emerald-800 mt-1 font-mono">
                      {statementData.summary.currency} {statementData.summary.totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className={`rounded-2xl p-4 border ${statementData.summary.totalOutstanding > 0 ? 'bg-orange-50 border-orange-200 text-orange-900' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
                    <p className="text-[11px] font-bold uppercase tracking-wider">Balance Due</p>
                    <p className="text-base sm:text-lg font-black mt-1 font-mono">
                      {statementData.summary.currency} {statementData.summary.totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {/* Ledger Transactions Table */}
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-600 uppercase font-mono text-[10px] tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="px-3.5 py-2.5">Date</th>
                        <th className="px-3.5 py-2.5">Doc #</th>
                        <th className="px-3.5 py-2.5">Type</th>
                        <th className="px-3.5 py-2.5">Description</th>
                        <th className="px-3.5 py-2.5 text-right">Invoiced</th>
                        <th className="px-3.5 py-2.5 text-right">Paid</th>
                        <th className="px-3.5 py-2.5 text-right font-bold">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {statementData.transactions.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-4 py-8 text-center text-slate-400 font-sans">
                            No billing transactions recorded in this period.
                          </td>
                        </tr>
                      ) : (
                        statementData.transactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-3.5 py-2.5 whitespace-nowrap text-slate-600">
                              {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                            </td>
                            <td className="px-3.5 py-2.5 font-bold text-slate-900 whitespace-nowrap">
                              {tx.documentNumber}
                            </td>
                            <td className="px-3.5 py-2.5 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                tx.type === 'INVOICE' ? 'bg-blue-100 text-blue-800' :
                                tx.type === 'RECEIPT' ? 'bg-emerald-100 text-emerald-800' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {tx.type}
                              </span>
                            </td>
                            <td className="px-3.5 py-2.5 font-sans text-slate-700 max-w-[200px] truncate">
                              {tx.description}
                            </td>
                            <td className="px-3.5 py-2.5 text-right text-slate-900 font-bold">
                              {tx.debit > 0 ? tx.debit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                            </td>
                            <td className="px-3.5 py-2.5 text-right text-emerald-700 font-bold">
                              {tx.credit > 0 ? tx.credit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                            </td>
                            <td className="px-3.5 py-2.5 text-right font-black text-slate-900 bg-slate-50/50">
                              {tx.runningBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Aging Breakdown Grid */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs">
                  <h4 className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-2">
                    Aging of Outstanding Balance (Days)
                  </h4>
                  <div className="grid grid-cols-4 gap-2 text-center font-mono">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                      <span className="text-[10px] text-slate-400 block">Current (0-30)</span>
                      <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                        {statementData.summary.currency} {statementData.summary.aging.current.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                      <span className="text-[10px] text-slate-400 block">31-60 Days</span>
                      <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                        {statementData.summary.currency} {statementData.summary.aging.days30_60.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                      <span className="text-[10px] text-slate-400 block">61-90 Days</span>
                      <span className="font-bold text-amber-700 text-xs mt-0.5 block">
                        {statementData.summary.currency} {statementData.summary.aging.days61_90.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                      <span className="text-[10px] text-slate-400 block">&gt; 90 Days</span>
                      <span className="font-bold text-red-600 text-xs mt-0.5 block">
                        {statementData.summary.currency} {statementData.summary.aging.days90Plus.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Document Footer */}
                <div className="border-t border-slate-200 pt-4 text-center text-[11px] text-slate-400">
                  <p>Thank you for choosing Exoin Africa. Please quote your client name or document number upon settlement.</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsPage;
