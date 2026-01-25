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
  MessageSquare
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
      setClients(response.data.clients);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this client?')) return;
    try {
      await clientsApi.delete(id);
      fetchClients();
    } catch (error) {
      console.error('Failed to delete client:', error);
      alert(error.response?.data?.error || 'Failed to delete client');
    }
    setActiveMenu(null);
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
          <p className="text-slate-500">Manage your client directory</p>
        </div>
        <Link 
          to="/clients/new"
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus size={18} />
          Add Client
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search clients..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Clients Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600"></div>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-100">
          <Users className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="text-lg font-medium text-slate-900 mb-1">No clients found</h3>
          <p className="text-slate-500 mb-4">
            {searchQuery ? 'Try a different search term' : 'Get started by adding your first client'}
          </p>
          {!searchQuery && (
            <Link
              to="/clients/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus size={18} />
              Add Client
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <div 
              key={client.id}
              className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative"
            >
              {/* Menu */}
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setActiveMenu(activeMenu === client.id ? null : client.id)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <MoreVertical size={18} />
                </button>
                
                {activeMenu === client.id && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-10 w-36">
                    <Link
                      to={`/clients/${client.id}/edit`}
                      className="w-full flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-50 text-sm"
                    >
                      <Edit size={16} />
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(client.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 text-sm"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {/* Client Info */}
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center shrink-0">
                  <Building className="text-orange-600" size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate">{client.name}</h3>
                  {client.contactPerson && (
                    <p className="text-sm text-slate-500 truncate">{client.contactPerson}</p>
                  )}
                </div>
              </div>

              {/* Contact Details */}
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Mail size={14} className="text-slate-400 shrink-0" />
                  <span className="truncate">{client.email}</span>
                </div>
                {client.phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone size={14} className="text-slate-400 shrink-0" />
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.addressLine1 && (
                  <div className="flex items-start gap-2 text-sm text-slate-600">
                    <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{client.addressLine1}{client.city ? `, ${client.city}` : ''}</span>
                  </div>
                )}
              </div>

              {/* Documents Count */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {client._count?.documents || 0} documents
                </span>
                <div className="flex items-center gap-2">
                  {client.email && (
                    <Link 
                      to={`/mail?compose=true&to=${encodeURIComponent(client.email)}&subject=${encodeURIComponent(`Hello from Exoin Africa`)}`}
                      className="p-1.5 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
                      title="Send email"
                    >
                      <Send size={14} />
                    </Link>
                  )}
                  <Link 
                    to={`/documents?clientId=${client.id}`}
                    className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                  >
                    View Documents →
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
