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
  UserCheck
} from 'lucide-react';

const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenu, setActiveMenu] = useState(null);

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
    <div className="max-w-7xl mx-auto space-y-6 antialiased">
      {/* 1. Apple-style Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 backdrop-blur-xl p-4 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Clients Directory</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/50">
              {clients.length} Total
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage customer accounts, dispatch locations, and service histories
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
      <div className="bg-white/90 backdrop-blur-md rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 border border-slate-200/80 shadow-xs">
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
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <div className="w-10 h-10 border-3 border-orange-600/30 border-t-orange-600 rounded-full animate-spin"></div>
          <p className="text-xs font-medium text-slate-400">Loading client directory...</p>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Users size={32} />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">No clients found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
            {searchQuery ? `No results matching "${searchQuery}". Check your spelling or try another keyword.` : 'Build your customer directory to issue instant job cards and invoices.'}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        <div className="absolute right-0 top-full mt-1 bg-white/95 backdrop-blur-xl border border-slate-100 rounded-2xl shadow-xl py-1 z-30 w-36 animate-in fade-in zoom-in-95 duration-100">
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
                <span className="text-[11px] font-semibold text-slate-400">
                  {client._count?.documents || 0} Docs Issued
                </span>

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
                    <span>Records</span>
                    <ArrowUpRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientsPage;
