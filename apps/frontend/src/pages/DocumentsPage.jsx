import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { documentsApi, pdfApi } from '../lib/api';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Receipt,
  FileSpreadsheet,
  Download,
  Eye,
  MoreVertical,
  Trash2,
  Edit,
  FileEdit,
  CreditCard,
  ChevronDown
} from 'lucide-react';

const DocumentsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [documents, setDocuments] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, currentPage: 1 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || '');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeMenu, setActiveMenu] = useState(null);
  const [showCreateDropdown, setShowCreateDropdown] = useState(false);

  const fetchDocuments = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;
      
      const response = await documentsApi.getAll(params);
      setDocuments(response.data.documents);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [typeFilter, statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDocuments(1);
  };

  const handlePageChange = (page) => {
    fetchDocuments(page);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await documentsApi.delete(id);
      fetchDocuments(pagination.currentPage);
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
    setActiveMenu(null);
  };

  const handleDownloadPdf = async (doc) => {
    try {
      const response = await pdfApi.generate(doc.id);
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${doc.documentNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download PDF:', error);
    }
  };

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

  const getStatusBadge = (status) => {
    const styles = {
      DRAFT: 'bg-slate-100 text-slate-700',
      SENT: 'bg-blue-100 text-blue-700',
      PAID: 'bg-green-100 text-green-700',
      OVERDUE: 'bg-red-100 text-red-700',
      CANCELLED: 'bg-slate-200 text-slate-500'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.DRAFT}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Documents</h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">Manage your invoices, quotations, and letterheads</p>
        </div>
        
        {/* Create New Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowCreateDropdown(!showCreateDropdown)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus size={18} />
            Create New
            <ChevronDown size={16} />
          </button>
          
          {showCreateDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowCreateDropdown(false)} />
              <div className="absolute right-0 sm:right-0 left-0 sm:left-auto top-full mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-20 w-full sm:w-64 animate-in slide-in-from-top-2 duration-200">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Create from Template</p>
                </div>
                
                <Link 
                  to="/editor/letterhead"
                  onClick={() => setShowCreateDropdown(false)}
                  className="flex items-center gap-3 px-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                    <FileEdit className="text-slate-600 dark:text-slate-300" size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Letterhead</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Official correspondence</p>
                  </div>
                </Link>
                
                <Link 
                  to="/editor/invoice"
                  onClick={() => setShowCreateDropdown(false)}
                  className="flex items-center gap-3 px-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                    <Receipt className="text-orange-600 dark:text-orange-400" size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Invoice</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Bill your clients</p>
                  </div>
                </Link>
                
                <Link 
                  to="/editor/quotation"
                  onClick={() => setShowCreateDropdown(false)}
                  className="flex items-center gap-3 px-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <FileSpreadsheet className="text-blue-600 dark:text-blue-400" size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Quotation</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Sales proposals</p>
                  </div>
                </Link>
                
                <Link 
                  to="/editor/business-card"
                  onClick={() => setShowCreateDropdown(false)}
                  className="flex items-center gap-3 px-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <CreditCard className="text-purple-600 dark:text-purple-400" size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Business Card</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Professional identity</p>
                  </div>
                </Link>
                
                <div className="border-t border-slate-100 dark:border-slate-700 mt-2 pt-2">
                  <Link 
                    to="/documents/new"
                    onClick={() => setShowCreateDropdown(false)}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300"
                  >
                    <Plus size={18} />
                    <span className="text-sm">Blank Document</span>
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-4 shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4">
          <form onSubmit={handleSearch} className="flex-1 min-w-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </form>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <Filter size={18} className="text-slate-400 flex-shrink-0" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
            >
              <option value="">All Types</option>
              <option value="INVOICE">Invoices</option>
              <option value="QUOTATION">Quotations</option>
              <option value="LETTERHEAD">Letterheads</option>
              <option value="RECEIPT">Receipts</option>
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
            >
              <option value="">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Documents Table / Cards */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600 mx-auto"></div>
          </div>
        ) : documents.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <FileText className="mx-auto text-slate-300 dark:text-slate-600 mb-4" size={48} />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No documents found</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">Get started by creating your first document</p>
            <Link
              to="/documents/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus size={18} />
              Create Document
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop Table - Hidden on mobile */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-100 dark:border-slate-600">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Document</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Client</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                            doc.type === 'INVOICE' ? 'bg-orange-100 dark:bg-orange-900/30' : 
                            doc.type === 'QUOTATION' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-slate-100 dark:bg-slate-700'
                          }`}>
                            {doc.type === 'INVOICE' ? (
                              <Receipt className="text-orange-600 dark:text-orange-400" size={18} />
                            ) : doc.type === 'QUOTATION' ? (
                              <FileSpreadsheet className="text-blue-600 dark:text-blue-400" size={18} />
                            ) : (
                              <FileText className="text-slate-600 dark:text-slate-400" size={18} />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">{doc.documentNumber}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{doc.type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-slate-700 dark:text-slate-300">{doc.client?.name || '—'}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900 dark:text-white">{formatCurrency(doc.total)}</p>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(doc.status)}
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-slate-500 dark:text-slate-400 text-sm">{formatDate(doc.createdAt)}</p>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1 relative">
                          <Link 
                            to={`/documents/${doc.id}`}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white"
                            title="View"
                          >
                            <Eye size={18} />
                          </Link>
                          <button
                            onClick={() => handleDownloadPdf(doc)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white"
                            title="Download PDF"
                          >
                            <Download size={18} />
                          </button>
                          <button
                            onClick={() => setActiveMenu(activeMenu === doc.id ? null : doc.id)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white"
                          >
                            <MoreVertical size={18} />
                          </button>
                          
                          {activeMenu === doc.id && (
                            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg py-1 z-10 w-36">
                              <Link
                                to={`/documents/${doc.id}/edit`}
                                className="w-full flex items-center gap-2 px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 text-sm"
                              >
                                <Edit size={16} />
                                Edit
                              </Link>
                              <button
                                onClick={() => handleDelete(doc.id)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm"
                              >
                                <Trash2 size={16} />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards - Hidden on desktop */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700">
              {documents.map((doc) => (
                <div key={doc.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors relative">
                  <div className="flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                      doc.type === 'INVOICE' ? 'bg-orange-100 dark:bg-orange-900/30' : 
                      doc.type === 'QUOTATION' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-slate-100 dark:bg-slate-700'
                    }`}>
                      {doc.type === 'INVOICE' ? (
                        <Receipt className="text-orange-600 dark:text-orange-400" size={18} />
                      ) : doc.type === 'QUOTATION' ? (
                        <FileSpreadsheet className="text-blue-600 dark:text-blue-400" size={18} />
                      ) : (
                        <FileText className="text-slate-600 dark:text-slate-400" size={18} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-slate-900 dark:text-white truncate">{doc.documentNumber}</p>
                        {getStatusBadge(doc.status)}
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{doc.client?.name || 'No client'}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="font-semibold text-slate-900 dark:text-white">{formatCurrency(doc.total)}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{formatDate(doc.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                    <Link 
                      to={`/documents/${doc.id}`}
                      className="flex-1 flex items-center justify-center gap-2 py-2 text-sm text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                    >
                      <Eye size={16} />
                      View
                    </Link>
                    <button
                      onClick={() => handleDownloadPdf(doc)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Download size={16} />
                      PDF
                    </button>
                    <Link
                      to={`/documents/${doc.id}/edit`}
                      className="flex-1 flex items-center justify-center gap-2 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Edit size={16} />
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 dark:border-slate-700">
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center sm:text-left">
                  Showing {((pagination.currentPage - 1) * 10) + 1} to {Math.min(pagination.currentPage * 10, pagination.total)} of {pagination.total}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <div className="hidden sm:flex items-center gap-1">
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium ${
                          page === pagination.currentPage 
                            ? 'bg-orange-600 text-white' 
                            : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <span className="sm:hidden text-sm text-slate-600 dark:text-slate-400 px-2">
                    {pagination.currentPage} / {pagination.pages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.pages}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DocumentsPage;
