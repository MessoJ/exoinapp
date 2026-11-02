import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { CardLogo } from '../components/templates/ExoinLetterheadAlternatives';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { 
  Save, Download, Share2, Mail, FileText, PenTool, Edit3, 
  GripVertical, Maximize2, Minimize2, Globe, MapPin, Loader2, 
  ChevronLeft, ChevronRight, ArrowLeft, Link2, Copy, Check, ExternalLink, X,
  Eye, Sliders, Sparkles, ZoomIn, ZoomOut, UserCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import SignaturePicker from '../components/common/SignaturePicker';
import useSignatures from '../hooks/useSignatures';

// Page layout constants (A4 proportions scaled: 595 x 842 pt)
const PAGE_CONFIG = {
  width: 595,
  height: 842,
  headerHeight: 100,
  continuationHeaderHeight: 40,
  footerHeight: 70,
  sideMargin: 48,
  contentPadding: 24,
  lineHeight: 20,
};

const FIRST_PAGE_CONTENT_HEIGHT = PAGE_CONFIG.height - PAGE_CONFIG.headerHeight - PAGE_CONFIG.footerHeight - (PAGE_CONFIG.contentPadding * 2);
const CONTINUATION_PAGE_CONTENT_HEIGHT = PAGE_CONFIG.height - PAGE_CONFIG.continuationHeaderHeight - PAGE_CONFIG.footerHeight - (PAGE_CONFIG.contentPadding * 2);

// Apple-style Share Modal
const ShareModal = ({ isOpen, onClose, documentName }) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/documents/share/${Math.random().toString(36).substring(7)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
              <Share2 size={18} />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Share Letterhead</h3>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        
        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          Anyone with this private link can view and download {documentName ? `"${documentName}"` : 'this official letterhead'}.
        </p>
        
        <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-2xl border border-slate-200/80 mb-5">
          <Link2 size={16} className="text-slate-400 ml-2 shrink-0" />
          <input 
            type="text" 
            value={shareUrl} 
            readOnly 
            className="flex-1 bg-transparent text-xs text-slate-600 focus:outline-none truncate px-1" 
          />
          <button 
            onClick={handleCopy} 
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 flex items-center gap-1.5 ${
              copied 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'bg-orange-500 text-white hover:bg-orange-600 shadow-sm'
            }`}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => window.open(`mailto:?subject=${encodeURIComponent(documentName || 'Official Letterhead')}&body=${encodeURIComponent(`Please find your official correspondence here: ${shareUrl}`)}`, '_blank')} 
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-2xl transition-all active:scale-95"
          >
            <Mail size={15} /> Send via Mail
          </button>
          <button 
            onClick={() => window.open(shareUrl, '_blank')} 
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-2xl transition-all active:scale-95 shadow-sm"
          >
            <ExternalLink size={15} /> Open Preview
          </button>
        </div>
      </div>
    </div>
  );
};

// Footer Component
const PageFooter = () => (
  <div className="bg-[#0F172A] text-white px-12 py-3.5 flex justify-between items-center relative overflow-hidden rounded-t-2xl shrink-0">
    <div className="relative z-10 flex gap-6 text-[8px] font-mono text-slate-400">
      <div className="flex items-center gap-1.5">
        <Globe size={10} className="text-orange-500"/> www.exoin.africa
      </div>
      <div className="flex items-center gap-1.5">
        <MapPin size={10} className="text-orange-500"/> Nairobi, Kenya • +254 739 443 244
      </div>
    </div>
    <div className="relative z-10 h-5 w-5 flex-shrink-0">
      <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
        <path d="M15 30 C15 21.7157 21.7157 15 30 15 H55 L55 45 L85 75 H60 C51.7157 75 45 68.2843 45 60 V60 L15 30 Z" fill="white" />
        <path d="M85 70 C85 78.2843 78.2843 85 70 85 H45 L45 55 L15 25 H40 C48.2843 25 55 31.7157 55 40 V40 L85 70 Z" fill="white" />
      </svg>
    </div>
    <div className="relative z-10 text-[9px] font-serif italic text-white tracking-wider opacity-90">
      Beyond Clean
    </div>
  </div>
);

// Watermark Component
const Watermark = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] overflow-hidden">
    <div className="flex flex-col items-center gap-4 transform -rotate-12">
      <svg viewBox="0 0 100 100" fill="none" className="w-32 h-32 text-slate-900">
        <path d="M15 30 C15 21.7157 21.7157 15 30 15 H55 L55 45 L85 75 H60 C51.7157 75 45 68.2843 45 60 V60 L15 30 Z" fill="currentColor" />
        <path d="M85 70 C85 78.2843 78.2843 85 70 85 H45 L45 55 L15 25 H40 C48.2843 25 55 31.7157 55 40 V40 L85 70 Z" fill="currentColor" />
      </svg>
      <span className="text-3xl font-serif font-bold tracking-widest text-slate-900 uppercase">EXOIN</span>
    </div>
  </div>
);

// First Page Template
const FirstPageTemplate = ({ 
  data, 
  contentHtml, 
  signature, 
  pageNumber, 
  totalPages, 
  isLastPage, 
  senderName, 
  senderTitle, 
  forExport = false, 
  signatureLabel = 'Authorized Signature' 
}) => {
  return (
    <div 
      className="w-[595px] h-[842px] bg-white shadow-xl relative flex flex-col overflow-hidden print:shadow-none" 
      id={`letterhead-page-${pageNumber}`}
      data-page={pageNumber}
    >
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] opacity-[0.02] pointer-events-none"></div>
      
      {/* Full Header with Logo */}
      <div className="relative z-10 pt-8 px-12 pb-3 shrink-0">
        <div className="flex justify-between items-start">
          <CardLogo variant="light" scale={1.2} forExport={forExport} />
          <div className="text-right text-[9px] font-mono text-slate-400 mt-2">
            {totalPages > 1 && `pg ${pageNumber} of ${totalPages}`}
          </div>
        </div>
      </div>

      {/* Brand Accent Separator */}
      <div className="relative h-3 w-full overflow-hidden shrink-0">
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-50"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-[1.5px] bg-orange-500"></div>
      </div>

      <Watermark />

      {/* Body Content */}
      <div className="flex-1 px-12 py-3 relative z-10 text-slate-800 leading-relaxed overflow-hidden flex flex-col">
        {(data.recipientName || data.subject) && (
          <div className="text-xs space-y-2.5 mb-4 shrink-0">
            <p className="font-semibold text-slate-600">{data.date}</p>
            <div className="space-y-0.5">
              {data.recipientName && <p className="font-semibold text-slate-900">{data.recipientName}</p>}
              {data.company && <p className="text-slate-600">{data.company}</p>}
              {data.address && <p className="text-slate-500">{data.address}</p>}
              {data.city && <p className="text-slate-500">{data.city}</p>}
            </div>
            {data.subject && (
              <p className="font-bold text-slate-900 uppercase tracking-wide text-[11px] border-b border-slate-200 pb-2 pt-1">
                RE: {data.subject}
              </p>
            )}
          </div>
        )}
        
        <div 
          className="letterhead-content text-[11px] flex-1 overflow-hidden"
          dangerouslySetInnerHTML={{ __html: contentHtml || '' }} 
        />
        
        {isLastPage && (
          <div className="pt-3 shrink-0">
            <p className="text-[11px] text-slate-600 mb-2">Yours sincerely,</p>
            {signature ? (
              <div className="mb-1">
                <img src={signature} alt="Signature" className="h-11 object-contain" />
              </div>
            ) : (
              <div className="h-10 mb-1 border-b border-dashed border-slate-300 w-36"></div>
            )}
            <p className="text-[11px] font-bold text-slate-900">{senderName || 'Authorized Signatory'}</p>
            <p className="text-[10px] text-slate-500">{senderTitle || 'Exoin Africa'}</p>
            {signatureLabel && <p className="text-[8px] text-slate-400 mt-0.5 uppercase tracking-wider">{signatureLabel}</p>}
          </div>
        )}
      </div>

      <PageFooter />
      <div className="h-1 w-full bg-gradient-to-r from-orange-600 to-orange-400 shrink-0"></div>
    </div>
  );
};

// Continuation Page Template
const ContinuationPageTemplate = ({ 
  contentHtml, 
  signature, 
  pageNumber, 
  totalPages, 
  isLastPage, 
  senderName, 
  senderTitle, 
  forExport = false, 
  signatureLabel = 'Authorized Signature' 
}) => {
  return (
    <div 
      className="w-[595px] h-[842px] bg-white shadow-xl relative flex flex-col overflow-hidden print:shadow-none" 
      id={`letterhead-page-${pageNumber}`}
      data-page={pageNumber}
    >
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] opacity-[0.02] pointer-events-none"></div>
      
      {/* Minimal Header */}
      <div className="relative z-10 pt-4 px-12 pb-2 shrink-0 flex justify-between items-center border-b border-slate-100">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 100 100" fill="none" className="w-4 h-4 opacity-30">
            <path d="M15 30 C15 21.7157 21.7157 15 30 15 H55 L55 45 L85 75 H60 C51.7157 75 45 68.2843 45 60 V60 L15 30 Z" fill="currentColor" />
            <path d="M85 70 C85 78.2843 78.2843 85 70 85 H45 L45 55 L15 25 H40 C48.2843 25 55 31.7157 55 40 V40 L85 70 Z" fill="currentColor" />
          </svg>
          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">Exoin Africa</span>
        </div>
        <div className="text-[9px] font-mono text-slate-400">
          pg {pageNumber} of {totalPages}
        </div>
      </div>

      <Watermark />

      <div className="flex-1 px-12 py-5 relative z-10 text-slate-800 leading-relaxed overflow-hidden flex flex-col">
        <div 
          className="letterhead-content text-[11px] flex-1 overflow-hidden"
          dangerouslySetInnerHTML={{ __html: contentHtml || '' }} 
        />
        
        {isLastPage && (
          <div className="pt-3 shrink-0">
            <p className="text-[11px] text-slate-600 mb-2">Yours sincerely,</p>
            {signature ? (
              <div className="mb-1">
                <img src={signature} alt="Signature" className="h-11 object-contain" />
              </div>
            ) : (
              <div className="h-10 mb-1 border-b border-dashed border-slate-300 w-36"></div>
            )}
            <p className="text-[11px] font-bold text-slate-900">{senderName || 'Authorized Signatory'}</p>
            <p className="text-[10px] text-slate-500">{senderTitle || 'Exoin Africa'}</p>
            {signatureLabel && <p className="text-[8px] text-slate-400 mt-0.5 uppercase tracking-wider">{signatureLabel}</p>}
          </div>
        )}
      </div>

      <PageFooter />
      <div className="h-1 w-full bg-gradient-to-r from-orange-600 to-orange-400 shrink-0"></div>
    </div>
  );
};

// Quill formatting
const QUILL_MODULES = {
  toolbar: {
    container: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'color': [] }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['blockquote', 'clean']
    ],
  },
  clipboard: { matchVisual: false },
};

const QUILL_FORMATS = [
  'header', 'bold', 'italic', 'underline',
  'color', 'list', 'bullet', 'align', 'blockquote'
];

const LetterheadPage = () => {
  const navigate = useNavigate();
  const { getDefaultSignature } = useSignatures();
  
  // Mobile tab switcher: 'editor' or 'preview'
  const [mobileTab, setMobileTab] = useState('editor');
  const [zoomScale, setZoomScale] = useState(1);
  const [autoScale, setAutoScale] = useState(1);

  const [formData, setFormData] = useState({
    date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    recipientName: '',
    company: '',
    address: '',
    city: 'Nairobi, Kenya',
    subject: ''
  });
  
  const [content, setContent] = useState(
    '<p>Dear Valued Partner,</p><p><br></p><p>We are pleased to present this correspondence regarding our continued partnership and commitment to excellence in service delivery.</p><p><br></p><p>At Exoin Africa, we deliver autonomous hygiene, pest control, and facility care solutions engineered to the highest professional standards. Our dedicated field technicians and operations team ensure every requirement is met with accuracy, accountability, and speed.</p><p><br></p><p>Please do not hesitate to contact our office should you have any questions or require further information. We look forward to continuing our successful collaboration.</p>'
  );
  
  const [signature, setSignature] = useState(null);
  const [senderName, setSenderName] = useState('Francis Meso');
  const [senderTitle, setSenderTitle] = useState('Managing Director');
  const [signatureLabel, setSignatureLabel] = useState('Authorized Signature');
  
  const [downloading, setDownloading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showRecipientDetails, setShowRecipientDetails] = useState(false);
  const [currentPreviewPage, setCurrentPreviewPage] = useState(1);

  const containerRef = useRef(null);
  const previewRef = useRef(null);
  const quillRef = useRef(null);

  // Dynamic mobile scale calculation
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        // Mobile screen auto-scaling
        const scale = Math.min(1, Math.max(0.46, (width - 32) / 595));
        setAutoScale(scale);
        setZoomScale(scale);
      } else {
        setAutoScale(1);
        setZoomScale(1);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const defaultSig = getDefaultSignature();
    if (defaultSig && !signature) {
      setSignature(defaultSig.dataUrl);
    }
  }, []);

  const handleUpdate = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSignatureSelect = (sig) => {
    setSignature(sig?.dataUrl || null);
  };

  // Content splitting logic
  const splitContentIntoPages = useCallback((htmlContent) => {
    if (!htmlContent || htmlContent === '<p><br></p>') return [''];
    
    const tempContainer = document.createElement('div');
    tempContainer.style.cssText = `
      position: absolute;
      visibility: hidden;
      width: 499px;
      font-size: 11px;
      line-height: 1.6;
      font-family: inherit;
    `;
    tempContainer.innerHTML = htmlContent;
    document.body.appendChild(tempContainer);
    
    const blocks = Array.from(tempContainer.children);
    if (blocks.length === 0) {
      document.body.removeChild(tempContainer);
      return [htmlContent];
    }
    
    const recipientInfoHeight = formData.recipientName ? 100 : 0;
    const signatureHeight = 85;
    const firstPageAvailable = FIRST_PAGE_CONTENT_HEIGHT - recipientInfoHeight - signatureHeight;
    const continuationPageAvailable = CONTINUATION_PAGE_CONTENT_HEIGHT - signatureHeight;
    
    const pages = [];
    let currentPageContent = '';
    let currentHeight = 0;
    let isFirstPage = true;
    
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const blockHeight = block.offsetHeight || 22;
      const availableHeight = isFirstPage ? firstPageAvailable : continuationPageAvailable;
      
      if (currentHeight + blockHeight > availableHeight && currentPageContent !== '') {
        pages.push(currentPageContent);
        currentPageContent = block.outerHTML;
        currentHeight = blockHeight;
        isFirstPage = false;
      } else {
        currentPageContent += block.outerHTML;
        currentHeight += blockHeight;
      }
    }
    
    if (currentPageContent) {
      pages.push(currentPageContent);
    }
    
    document.body.removeChild(tempContainer);
    return pages.length > 0 ? pages : [htmlContent];
  }, [formData.recipientName]);

  const contentPages = useMemo(() => {
    return splitContentIntoPages(content);
  }, [content, splitContentIntoPages]);

  const totalPages = contentPages.length;

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
      });
      
      for (let i = 0; i < totalPages; i++) {
        const pageEl = document.getElementById(`letterhead-page-${i + 1}`);
        if (!pageEl) continue;
        
        const canvas = await html2canvas(pageEl, {
          scale: 2.5,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        });
        
        const imgData = canvas.toDataURL('image/png');
        if (i > 0) pdf.addPage('a4', 'portrait');
        pdf.addImage(imgData, 'PNG', 0, 0, 595.28, 841.89);
      }
      
      const filename = `Exoin_Letterhead_${formData.subject ? formData.subject.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 25) : 'Official'}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleSave = () => {
    const letterheadData = {
      ...formData, content, senderName, senderTitle, signature, signatureLabel,
      savedAt: new Date().toISOString()
    };
    const drafts = JSON.parse(localStorage.getItem('exoin_letterhead_drafts') || '[]');
    drafts.unshift(letterheadData);
    localStorage.setItem('exoin_letterhead_drafts', JSON.stringify(drafts.slice(0, 10)));
    alert('Letterhead saved to drafts successfully!');
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] overflow-hidden antialiased text-slate-800">
      {/* Frosted Glass Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-4 md:px-6 py-3 flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-600 flex items-center justify-center transition-all active:scale-95"
            title="Go back"
          >
            <ArrowLeft size={17} />
          </button>
          
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-sm shadow-orange-500/25">
            <FileText size={18} />
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm md:text-base font-bold text-slate-900 tracking-tight">Official Letterhead</h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-50 text-orange-700 border border-orange-200/50">
                {totalPages} {totalPages === 1 ? 'Page' : 'Pages'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Standard Exoin Africa Corporate Stationery</p>
          </div>
        </div>

        {/* Mobile View Segmented Switcher */}
        <div className="flex md:hidden bg-slate-100 p-1 rounded-2xl border border-slate-200/60">
          <button
            onClick={() => setMobileTab('editor')}
            className={`px-3 py-1 text-xs font-semibold rounded-xl transition-all ${
              mobileTab === 'editor'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Editor
          </button>
          <button
            onClick={() => setMobileTab('preview')}
            className={`px-3 py-1 text-xs font-semibold rounded-xl transition-all ${
              mobileTab === 'preview'
                ? 'bg-white text-orange-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Preview
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <SignaturePicker onSelect={handleSignatureSelect} currentSignature={signature} compact />
          </div>
          
          <button 
            onClick={handleSave} 
            className="w-9 h-9 rounded-2xl bg-slate-100 hover:bg-slate-200/80 text-slate-600 flex items-center justify-center transition-all active:scale-95" 
            title="Save to Drafts"
          >
            <Save size={16} />
          </button>
          
          <button 
            onClick={() => setShowShareModal(true)} 
            className="w-9 h-9 rounded-2xl bg-slate-100 hover:bg-slate-200/80 text-slate-600 flex items-center justify-center transition-all active:scale-95" 
            title="Share Document"
          >
            <Share2 size={16} />
          </button>
          
          <button 
            onClick={handleDownloadPDF} 
            disabled={downloading} 
            className="px-3.5 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-2xl text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-orange-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {downloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
            <span className="hidden sm:inline">PDF</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Inputs & Rich Text Editor */}
        <div 
          className={`flex-1 flex flex-col overflow-y-auto bg-slate-50/50 p-4 md:p-6 border-r border-slate-200/60 ${
            mobileTab === 'preview' ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="max-w-2xl mx-auto w-full space-y-4">
            
            {/* Collapsible Recipient Details Card */}
            <div className="bg-white rounded-3xl p-4 shadow-xs border border-slate-200/60 transition-all">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setShowRecipientDetails(!showRecipientDetails)}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                    <Sliders size={15} />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Recipient & Signatory Coordinates
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      {formData.recipientName ? `${formData.recipientName} • ${formData.subject || 'Letter'}` : 'Tap to customize recipient, date & sign-off'}
                    </p>
                  </div>
                </div>
                <button className="text-xs text-orange-600 font-semibold px-2 py-1 rounded-lg hover:bg-orange-50">
                  {showRecipientDetails ? 'Collapse' : 'Edit'}
                </button>
              </div>

              {showRecipientDetails && (
                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Date</label>
                    <input 
                      type="text" 
                      value={formData.date} 
                      onChange={(e) => handleUpdate('date', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-orange-500 focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Subject</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Service Proposal / Quarterly Report" 
                      value={formData.subject} 
                      onChange={(e) => handleUpdate('subject', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-orange-500 focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Recipient Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. John Kamau" 
                      value={formData.recipientName} 
                      onChange={(e) => handleUpdate('recipientName', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-orange-500 focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Organization / Company</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Safaricom PLC" 
                      value={formData.company} 
                      onChange={(e) => handleUpdate('company', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-orange-500 focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Signatory Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Francis Meso" 
                      value={senderName} 
                      onChange={(e) => setSenderName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-orange-500 focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Signatory Role</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Managing Director" 
                      value={senderTitle} 
                      onChange={(e) => setSenderTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-orange-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Apple Styled Quill Editor Box */}
            <div className="bg-white rounded-3xl shadow-xs border border-slate-200/60 overflow-hidden flex flex-col flex-1 min-h-[460px]">
              <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Edit3 size={15} className="text-orange-500" />
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Letter Content</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {content.replace(/<[^>]*>/g, '').length} characters
                </span>
              </div>

              <div className="flex-1 p-2">
                <ReactQuill 
                  ref={quillRef} 
                  theme="snow" 
                  value={content} 
                  onChange={setContent}
                  className="h-[380px] flex flex-col letterhead-quill" 
                  placeholder="Draft your official corporate letter here..."
                  modules={QUILL_MODULES} 
                  formats={QUILL_FORMATS} 
                />
              </div>
            </div>

            {/* Mobile Signature Picker Button */}
            <div className="sm:hidden bg-white rounded-3xl p-4 shadow-xs border border-slate-200/60">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Attached Signature</label>
              <SignaturePicker onSelect={handleSignatureSelect} currentSignature={signature} />
            </div>

          </div>
        </div>

        {/* Right Side: Live A4 Visual Preview */}
        <div 
          ref={previewRef}
          className={`flex-1 bg-slate-100/80 p-4 md:p-8 overflow-y-auto flex flex-col items-center ${
            mobileTab === 'editor' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Zoom & Page Bar */}
          <div className="mb-6 flex items-center justify-between gap-3 w-full max-w-[595px] px-2">
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md rounded-2xl px-3 py-1.5 shadow-xs border border-slate-200/60 text-xs text-slate-600">
              <span className="font-semibold text-slate-800">A4 Preview</span>
              <span className="text-slate-300">•</span>
              <span>{totalPages} {totalPages === 1 ? 'Page' : 'Pages'}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-md rounded-2xl p-1 shadow-xs border border-slate-200/60">
              <button 
                onClick={() => setZoomScale(s => Math.max(0.4, Number((s - 0.1).toFixed(2))))} 
                className="w-7 h-7 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-600 active:scale-95"
                title="Zoom Out"
              >
                <ZoomOut size={15} />
              </button>
              <button 
                onClick={() => setZoomScale(autoScale)} 
                className="px-2 text-[11px] font-semibold text-slate-700 hover:text-orange-600"
                title="Reset Fit"
              >
                {Math.round(zoomScale * 100)}%
              </button>
              <button 
                onClick={() => setZoomScale(s => Math.min(1.4, Number((s + 0.1).toFixed(2))))} 
                className="w-7 h-7 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-600 active:scale-95"
                title="Zoom In"
              >
                <ZoomIn size={15} />
              </button>
            </div>
          </div>

          {/* Scaled Render Container */}
          <div className="flex flex-col items-center gap-8 w-full">
            {contentPages.map((pageContent, i) => {
              const isFirst = i === 0;
              const isLast = i === contentPages.length - 1;
              
              return (
                <div 
                  key={i}
                  style={{
                    transform: `scale(${zoomScale})`,
                    transformOrigin: 'top center',
                    marginBottom: zoomScale < 1 ? `${(1 - zoomScale) * -842}px` : '0px'
                  }}
                  className="transition-transform duration-200"
                >
                  {isFirst ? (
                    <FirstPageTemplate 
                      data={formData} 
                      contentHtml={pageContent} 
                      signature={signature}
                      pageNumber={i + 1} 
                      totalPages={totalPages} 
                      isLastPage={isLast} 
                      senderName={senderName} 
                      senderTitle={senderTitle} 
                      signatureLabel={signatureLabel} 
                    />
                  ) : (
                    <ContinuationPageTemplate 
                      contentHtml={pageContent} 
                      signature={signature}
                      pageNumber={i + 1} 
                      totalPages={totalPages} 
                      isLastPage={isLast} 
                      senderName={senderName} 
                      senderTitle={senderTitle} 
                      signatureLabel={signatureLabel} 
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal 
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        documentName={formData.subject || 'Official Letterhead'}
      />

      {/* Custom Scoped Styles */}
      <style>{`
        .letterhead-quill { display: flex; flex-direction: column; }
        .letterhead-quill .ql-toolbar { border: none !important; border-bottom: 1px solid #e2e8f0 !important; background: transparent; padding: 8px 12px; }
        .letterhead-quill .ql-container { flex: 1; border: none !important; font-family: 'Inter', system-ui, sans-serif; }
        .letterhead-quill .ql-editor { font-size: 14px; line-height: 1.8; padding: 16px 20px; color: #1e293b; min-height: 300px; }
        .letterhead-content { font-family: 'Inter', system-ui, sans-serif; line-height: 1.6; color: #334155; }
        .letterhead-content p { margin-bottom: 0.75em; }
        .letterhead-content h1 { font-size: 1.3em; font-weight: 700; margin-bottom: 0.5em; color: #0f172a; }
        .letterhead-content h2 { font-size: 1.15em; font-weight: 600; margin-bottom: 0.5em; color: #0f172a; }
        .letterhead-content h3 { font-size: 1.05em; font-weight: 600; margin-bottom: 0.5em; color: #0f172a; }
        .letterhead-content ul, .letterhead-content ol { padding-left: 1.5em; margin-bottom: 0.75em; }
        .letterhead-content li { margin-bottom: 0.25em; }
        .letterhead-content blockquote { border-left: 2px solid #f97316; padding-left: 0.75em; margin: 0.75em 0; color: #64748b; font-style: italic; }
      `}</style>
    </div>
  );
};

export default LetterheadPage;
