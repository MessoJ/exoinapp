import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { documentsApi, pdfApi, companyApi } from '../lib/api';
import { 
  ArrowLeft, 
  Download, 
  Edit, 
  Printer, 
  Send,
  Receipt,
  FileSpreadsheet,
  FileText,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import Logo from '../components/templates/Logo';

const DocumentViewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [docData, setDocData] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [docRes, companyRes] = await Promise.all([
          documentsApi.getById(id),
          companyApi.get()
        ]);
        setDocData(docRes.data);
        setCompany(companyRes.data);
      } catch (error) {
        console.error('Failed to fetch document:', error);
        navigate('/documents');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const handleDownloadPdf = async () => {
    try {
      const response = await pdfApi.generate(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = window.document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${docData.documentNumber}.pdf`);
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download PDF:', error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
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

  if (!docData) return null;

  const isInvoice = docData.type === 'INVOICE';
  const isQuotation = docData.type === 'QUOTATION';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            to="/documents"
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{docData.documentNumber}</h1>
            <p className="text-slate-500">{docData.type} • {docData.status}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {docData.client?.email && (
            <Link
              to={`/mail?compose=true&to=${encodeURIComponent(docData.client.email)}&subject=${encodeURIComponent(`${docData.type}: ${docData.documentNumber} - ${company?.name || 'Exoin Africa'}`)}&body=${encodeURIComponent(`Dear ${docData.client?.contactPerson || docData.client?.name || 'Customer'},\n\nPlease find attached ${docData.type.toLowerCase()} ${docData.documentNumber}.\n\nTotal Amount: ${formatCurrency(docData.total)}\n\nBest regards`)}&attachDoc=${docData.id}`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Mail size={18} />
              Email to Client
            </Link>
          )}
          <Link
            to={`/documents/${id}/edit`}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg font-medium transition-colors"
          >
            <Edit size={18} />
            Edit
          </Link>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg font-medium transition-colors"
          >
            <Printer size={18} />
            Print
          </button>
          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
          >
            <Download size={18} />
            Download PDF
          </button>
        </div>
      </div>

      {/* Document Preview */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden print:shadow-none">
        <div className="p-8 md:p-12" id="document-content">
          {/* Document Header */}
          <div className="flex justify-between items-start mb-12">
            <div>
              <Logo className="h-16 w-auto mb-4" />
              {company && (
                <div className="text-sm text-slate-600 space-y-1">
                  <p className="font-medium text-slate-900">{company.name}</p>
                  <p className="flex items-center gap-2">
                    <MapPin size={14} />
                    {company.address}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone size={14} />
                    {company.phone}
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail size={14} />
                    {company.email}
                  </p>
                </div>
              )}
            </div>
            <div className="text-right">
              <h2 className={`text-3xl font-black ${isInvoice ? 'text-orange-600' : 'text-blue-600'}`}>
                {docData.type}
              </h2>
              <p className="text-lg font-bold text-slate-900 mt-2">{docData.documentNumber}</p>
              <div className="mt-4 text-sm text-slate-600">
                <p>Date: <span className="font-medium text-slate-900">{formatDate(docData.issueDate)}</span></p>
                {docData.dueDate && (
                  <p>Due Date: <span className="font-medium text-slate-900">{formatDate(docData.dueDate)}</span></p>
                )}
              </div>
            </div>
          </div>

          {/* Bill To */}
          {docData.client && (
            <div className="mb-8 p-4 bg-slate-50 rounded-lg">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                {isInvoice ? 'Bill To' : 'Quote For'}
              </p>
              <p className="font-semibold text-slate-900">{docData.client.name}</p>
              {docData.client.addressLine1 && (
                <p className="text-sm text-slate-600">{docData.client.addressLine1}{docData.client.city ? `, ${docData.client.city}` : ''}</p>
              )}
              <p className="text-sm text-slate-600">{docData.client.email}</p>
              {docData.client.phone && (
                <p className="text-sm text-slate-600">{docData.client.phone}</p>
              )}
            </div>
          )}

          {/* Items Table */}
          <div className="mb-8">
            <table className="w-full">
              <thead>
                <tr className={`border-b-2 ${isInvoice ? 'border-orange-600' : 'border-blue-600'}`}>
                  <th className="text-left py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                  <th className="text-center py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Qty</th>
                  <th className="text-right py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Unit Price</th>
                  <th className="text-right py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {docData.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-4">
                      <p className="font-medium text-slate-900">{item.description}</p>
                    </td>
                    <td className="py-4 text-center text-slate-600">{item.quantity}</td>
                    <td className="py-4 text-right text-slate-600">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-4 text-right font-semibold text-slate-900">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-72">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-medium text-slate-900">{formatCurrency(docData.subtotal)}</span>
                </div>
                {docData.taxAmount > 0 && (
                  <div className="flex justify-between py-2">
                    <span className="text-slate-600">VAT (16%)</span>
                    <span className="font-medium text-slate-900">{formatCurrency(docData.taxAmount)}</span>
                  </div>
                )}
                <div className={`flex justify-between py-3 border-t-2 ${isInvoice ? 'border-orange-600' : 'border-blue-600'}`}>
                  <span className="font-bold text-slate-900">Total</span>
                  <span className={`font-bold text-xl ${isInvoice ? 'text-orange-600' : 'text-blue-600'}`}>
                    {formatCurrency(docData.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {docData.notes && (
            <div className="mt-8 pt-8 border-t border-slate-200">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Notes</p>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{docData.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-slate-200 text-center text-sm text-slate-500">
            <p>Thank you for your business!</p>
            {isInvoice && company?.bankName && (
              <div className="mt-4 p-4 bg-slate-50 rounded-lg inline-block text-left">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Bank Details</p>
                <p className="text-slate-700">{company.bankName}</p>
                <p className="text-slate-600">Account: {company.bankAccount}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewPage;
