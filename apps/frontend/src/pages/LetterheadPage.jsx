import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { CardLogo } from '../components/templates/ExoinLetterheadAlternatives';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { 
  Save, Download, Share2, Mail, FileText, PenTool, Edit3, 
  GripVertical, Maximize2, Minimize2, Globe, MapPin, Loader2, 
  ChevronLeft, ChevronRight, ArrowLeft, Link2, Copy, Check, ExternalLink, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import SignaturePicker from '../components/common/SignaturePicker';
import useSignatures from '../hooks/useSignatures';

// Page layout constants (A4 proportions scaled)
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

// Share Modal
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900">Share Letterhead</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        
        <p className="text-sm text-slate-500 mb-4">
          Share {documentName || 'this document'} with your recipient
        </p>
        
        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <Link2 size={18} className="text-slate-400 flex-shrink-0" />
          <input type="text" value={shareUrl} readOnly className="flex-1 bg-transparent text-sm text-slate-600 focus:outline-none truncate" />
          <button onClick={handleCopy} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${copied ? 'bg-green-500 text-white' : 'bg-orange-500 text-white hover:bg-orange-600'}`}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={() => window.open(`mailto:?subject=${encodeURIComponent(documentName || 'Document')}&body=${encodeURIComponent(`Please find your document here: ${shareUrl}`)}`, '_blank')} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50">
            <Mail size={18} /> Email
          </button>
          <button onClick={() => window.open(shareUrl, '_blank')} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50">
            <ExternalLink size={18} /> Preview
          </button>
        </div>
      </div>
    </div>
  );
};

// Footer Component - Same for all pages
const PageFooter = () => (
  <div className="bg-[#0F172A] text-white px-12 py-4 flex justify-between items-center relative overflow-hidden rounded-t-2xl shrink-0">
    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
    <div className="relative z-10 flex gap-6 text-[8px] font-mono text-slate-400">
      <div className="flex items-center gap-2">
        <Globe size={10} className="text-orange-500"/> www.exoin.africa
      </div>
      <div className="flex items-center gap-2">
        <MapPin size={10} className="text-orange-500"/> Nairobi, Kenya
      </div>
    </div>
    <div className="relative z-10 h-6 w-6 flex-shrink-0">
      <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
        <path d="M15 30 C15 21.7157 21.7157 15 30 15 H55 L55 45 L85 75 H60 C51.7157 75 45 68.2843 45 60 V60 L15 30 Z" fill="white" />
        <path d="M85 70 C85 78.2843 78.2843 85 70 85 H45 L45 55 L15 25 H40 C48.2843 25 55 31.7157 55 40 V40 L85 70 Z" fill="white" />
      </svg>
    </div>
    <div className="relative z-10 text-[10px] font-serif italic text-white tracking-wider opacity-90">
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
      <span className="text-3xl font-serif font-bold tracking-widest text-slate-900 uppercase">CONQUEROR</span>
    </div>
  </div>
);

// First Page Template (with full header/logo)
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
      className="w-[595px] h-[842px] bg-white shadow-2xl relative flex flex-col overflow-hidden print:shadow-none" 
      id={`letterhead-page-${pageNumber}`}
      data-page={pageNumber}
    >
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] opacity-[0.02] pointer-events-none"></div>
      
      {/* Full Header with Logo - ONLY on first page */}
      <div className="relative z-10 pt-8 px-12 pb-3 shrink-0">
        <div className="flex justify-between items-start">
          <CardLogo variant="light" scale={1.2} forExport={forExport} />
          <div className="text-right text-[9px] font-mono text-slate-400 mt-2">
            {totalPages > 1 && `pg ${pageNumber} of ${totalPages}`}
          </div>
        </div>
      </div>

      {/* Separator Line */}
      <div className="relative h-4 w-full overflow-hidden shrink-0">
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-50"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-[1px] bg-orange-500"></div>
      </div>

      <Watermark />

      {/* Body Content */}
      <div className="flex-1 px-12 py-4 relative z-10 text-slate-800 leading-relaxed overflow-hidden flex flex-col">
        {data.recipientName && (
          <div className="text-xs space-y-3 mb-5 shrink-0">
            <p className="font-semibold text-slate-600">{data.date}</p>
            <div className="space-y-0.5">
              <p className="font-medium text-slate-900">{data.recipientName}</p>
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
          <div className="pt-4 shrink-0">
            <p className="text-[11px] text-slate-600 mb-3">Yours sincerely,</p>
            {signature ? (
              <div className="mb-1">
                <img src={signature} alt="Signature" className="h-12 object-contain" />
              </div>
            ) : (
              <div className="h-12 mb-1 border-b border-dashed border-slate-300 w-40"></div>
            )}
            <p className="text-[11px] font-bold text-slate-900">{senderName || 'Your Name'}</p>
            <p className="text-[10px] text-slate-500">{senderTitle || 'Your Title'}</p>
            {signatureLabel && <p className="text-[9px] text-slate-400 mt-1 uppercase tracking-wider">{signatureLabel}</p>}
          </div>
        )}
      </div>

      <PageFooter />
      <div className="h-1 w-full bg-gradient-to-r from-orange-600 to-orange-400 shrink-0"></div>
    </div>
  );
};

// Continuation Page Template (minimal header, no logo)
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
      className="w-[595px] h-[842px] bg-white shadow-2xl relative flex flex-col overflow-hidden print:shadow-none" 
      id={`letterhead-page-${pageNumber}`}
      data-page={pageNumber}
    >
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] opacity-[0.02] pointer-events-none"></div>
      
      {/* Minimal Header - No logo, just page number */}
      <div className="relative z-10 pt-4 px-12 pb-2 shrink-0 flex justify-between items-center border-b border-slate-100">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 100 100" fill="none" className="w-5 h-5 opacity-30">
            <path d="M15 30 C15 21.7157 21.7157 15 30 15 H55 L55 45 L85 75 H60 C51.7157 75 45 68.2843 45 60 V60 L15 30 Z" fill="currentColor" />
            <path d="M85 70 C85 78.2843 78.2843 85 70 85 H45 L45 55 L15 25 H40 C48.2843 25 55 31.7157 55 40 V40 L85 70 Z" fill="currentColor" />
          </svg>
          <span className="text-[9px] font-mono text-slate-300 uppercase tracking-widest">Exoin Africa</span>
        </div>
        <div className="text-[9px] font-mono text-slate-400">
          pg {pageNumber} of {totalPages}
        </div>
      </div>

      <Watermark />

      <div className="flex-1 px-12 py-6 relative z-10 text-slate-800 leading-relaxed overflow-hidden flex flex-col">
        <div 
          className="letterhead-content text-[11px] flex-1 overflow-hidden"
          dangerouslySetInnerHTML={{ __html: contentHtml || '' }} 
        />
        
        {isLastPage && (
          <div className="pt-4 shrink-0">
            <p className="text-[11px] text-slate-600 mb-3">Yours sincerely,</p>
            {signature ? (
              <div className="mb-1">
                <img src={signature} alt="Signature" className="h-12 object-contain" />
              </div>
            ) : (
              <div className="h-12 mb-1 border-b border-dashed border-slate-300 w-40"></div>
            )}
            <p className="text-[11px] font-bold text-slate-900">{senderName || 'Your Name'}</p>
            <p className="text-[10px] text-slate-500">{senderTitle || 'Your Title'}</p>
            {signatureLabel && <p className="text-[9px] text-slate-400 mt-1 uppercase tracking-wider">{signatureLabel}</p>}
          </div>
        )}
      </div>

      <PageFooter />
      <div className="h-1 w-full bg-gradient-to-r from-orange-600 to-orange-400 shrink-0"></div>
    </div>
  );
};

// Enhanced Quill modules
const QUILL_MODULES = {
  toolbar: {
    container: [
      [{ 'header': [1, 2, 3, false] }],
      [{ 'font': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['blockquote'],
      ['link'],
      ['clean']
    ],
  },
  clipboard: { matchVisual: false },
};

const QUILL_FORMATS = [
  'header', 'font', 'size', 'bold', 'italic', 'underline', 'strike',
  'color', 'background', 'list', 'bullet', 'indent', 'align', 'blockquote', 'link'
];

const LetterheadPage = () => {
  const navigate = useNavigate();
  const { getDefaultSignature } = useSignatures();
  
  const [formData, setFormData] = useState({
    date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    recipientName: '',
    company: '',
    address: '',
    city: '',
    subject: ''
  });
  const [content, setContent] = useState('<p>Dear Valued Partner,</p><p><br></p><p>We are pleased to present this correspondence regarding our continued partnership and commitment to excellence in service delivery.</p><p><br></p><p>At Exoin Africa, we believe in building lasting relationships through transparent communication and exceptional service quality. Our team remains dedicated to exceeding your expectations and providing innovative solutions tailored to your specific needs.</p><p><br></p><p>Please do not hesitate to contact us should you have any questions or require further information. We look forward to continuing our successful collaboration.</p>');
  const [signature, setSignature] = useState(null);
  const [senderName, setSenderName] = useState('');
  const [senderTitle, setSenderTitle] = useState('');
  const [signatureLabel, setSignatureLabel] = useState('Authorized Signature');
  const [editorWidth, setEditorWidth] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentPreviewPage, setCurrentPreviewPage] = useState(1);
  
  const containerRef = useRef(null);
  const previewRef = useRef(null);
  const quillRef = useRef(null);

  useEffect(() => {
    const defaultSig = getDefaultSignature();
    if (defaultSig && !signature) {
      setSignature(defaultSig.dataUrl);
    }
  }, []);

  // Advanced content splitting with proper overflow detection
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
    
    const recipientInfoHeight = formData.recipientName ? 120 : 0;
    const signatureHeight = 100;
    const firstPageAvailable = FIRST_PAGE_CONTENT_HEIGHT - recipientInfoHeight - signatureHeight;
    const continuationPageAvailable = CONTINUATION_PAGE_CONTENT_HEIGHT - signatureHeight;
    
    const pages = [];
    let currentPageContent = '';
    let currentHeight = 0;
    let isFirstPage = true;
    
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const blockHeight = block.offsetHeight + 10;
      const maxHeight = isFirstPage ? firstPageAvailable : continuationPageAvailable;
      
      if (currentHeight + blockHeight > maxHeight && currentPageContent) {
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

  const contentPages = useMemo(() => splitContentIntoPages(content), [content, splitContentIntoPages]);
  const totalPages = contentPages.length;

  const handleUpdate = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSignatureSelect = (signatureDataUrl) => {
    setSignature(signatureDataUrl);
  };

  const handleMouseMove = useCallback((e) => {
    if (!isResizing || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    setEditorWidth(Math.min(70, Math.max(30, newWidth)));
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
      
      // Create a temporary container for export rendering
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.zIndex = '-1';
      tempContainer.style.backgroundColor = '#ffffff';
      document.body.appendChild(tempContainer);

      for (let i = 0; i < totalPages; i++) {
        const pageContent = contentPages[i];
        const isFirst = i === 0;
        const isLast = i === totalPages - 1;
        
        // Create a temporary div for this page
        const pageDiv = document.createElement('div');
        pageDiv.style.width = '595px';
        pageDiv.style.height = '842px';
        pageDiv.style.backgroundColor = '#ffffff';
        tempContainer.appendChild(pageDiv);

        // Render the component with forExport=true
        const { createRoot } = await import('react-dom/client');
        const root = createRoot(pageDiv);
        
        await new Promise((resolve) => {
          if (isFirst) {
            root.render(
              <FirstPageTemplate 
                data={formData} 
                contentHtml={pageContent} 
                signature={signature}
                pageNumber={i + 1} 
                totalPages={totalPages} 
                isLastPage={isLast} 
                senderName={senderName} 
                senderTitle={senderTitle}
                forExport={true}
                signatureLabel={signatureLabel}
              />
            );
          } else {
            root.render(
              <ContinuationPageTemplate 
                contentHtml={pageContent} 
                signature={signature}
                pageNumber={i + 1} 
                totalPages={totalPages} 
                isLastPage={isLast} 
                senderName={senderName} 
                senderTitle={senderTitle}
                forExport={true}
                signatureLabel={signatureLabel}
              />
            );
          }
          setTimeout(resolve, 1000); // Wait for render
        });

        const canvas = await html2canvas(pageDiv, { 
          scale: 2.5, useCORS: true, logging: false, backgroundColor: '#ffffff',
          windowWidth: 595, windowHeight: 842
        });
        
        const imgData = canvas.toDataURL('image/png', 1.0);
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);

        // Cleanup
        root.unmount();
        tempContainer.removeChild(pageDiv);
      }
      
      // Cleanup temp container
      document.body.removeChild(tempContainer);

      const filename = formData.recipientName 
        ? `Letterhead-${formData.recipientName.replace(/\s+/g, '_')}.pdf`
        : `Letterhead-${new Date().toISOString().split('T')[0]}.pdf`;
      
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
    alert('Letterhead saved to drafts!');
  };

  const handleSendEmail = () => {
    navigate('/mail?compose=true');
  };

  const goToNextPage = () => {
    if (currentPreviewPage < totalPages) {
      setCurrentPreviewPage(prev => prev + 1);
      const pageEl = document.getElementById(`letterhead-page-${currentPreviewPage + 1}`);
      pageEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const goToPrevPage = () => {
    if (currentPreviewPage > 1) {
      setCurrentPreviewPage(prev => prev - 1);
      const pageEl = document.getElementById(`letterhead-page-${currentPreviewPage - 1}`);
      pageEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Mobile state for toggling editor/preview
  const [mobileView, setMobileView] = useState('editor');

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 px-3 sm:px-6 py-3 flex justify-between items-center shrink-0 z-20">
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
            <FileText className="text-white" size={16} />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-slate-900">Letterhead Editor</h1>
            <p className="text-xs text-slate-500">
              Official Correspondence 
              {totalPages > 1 && <span className="ml-1 text-orange-600 font-medium">• {totalPages} pages</span>}
            </p>
          </div>
          <div className="sm:hidden">
            <h1 className="text-sm font-bold text-slate-900">Letterhead</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <div className="hidden sm:block">
            <SignaturePicker onSelect={handleSignatureSelect} currentSignature={signature} compact />
          </div>
          <div className="hidden sm:block h-5 w-px bg-slate-200 mx-2"></div>
          <button onClick={handleSave} className="p-2 sm:p-2.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title="Save Draft">
            <Save size={16} />
          </button>
          <button onClick={handleDownloadPDF} disabled={downloading} className="p-2 sm:p-2.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50" title="Download PDF">
            {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          </button>
          <button onClick={() => setShowShareModal(true)} className="hidden sm:flex p-2.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title="Share">
            <Share2 size={18} />
          </button>
          <button onClick={handleSendEmail} className="ml-1 px-3 sm:px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors shadow-sm flex items-center gap-1 sm:gap-2 text-sm font-medium" title="Send via Email">
            <Mail size={16} /> <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </div>

      {/* Document Details Bar */}
      <div className="bg-white border-b border-slate-200 px-3 sm:px-6 py-3 shrink-0 overflow-x-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 sm:gap-4 min-w-fit">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Date</label>
            <input type="text" value={formData.date} onChange={(e) => handleUpdate('date', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none px-2 sm:px-3 py-1.5 text-sm text-slate-900 rounded-lg transition-colors" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Recipient</label>
            <input type="text" value={formData.recipientName} onChange={(e) => handleUpdate('recipientName', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none px-2 sm:px-3 py-1.5 text-sm text-slate-900 rounded-lg transition-colors" placeholder="Recipient" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Company</label>
            <input type="text" value={formData.company} onChange={(e) => handleUpdate('company', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none px-2 sm:px-3 py-1.5 text-sm text-slate-900 rounded-lg transition-colors" placeholder="Company" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Subject</label>
            <input type="text" value={formData.subject} onChange={(e) => handleUpdate('subject', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none px-2 sm:px-3 py-1.5 text-sm text-slate-900 rounded-lg transition-colors" placeholder="Subject" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Your Name</label>
            <input type="text" value={senderName} onChange={(e) => setSenderName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none px-2 sm:px-3 py-1.5 text-sm text-slate-900 rounded-lg transition-colors" placeholder="Full name" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Your Title</label>
            <input type="text" value={senderTitle} onChange={(e) => setSenderTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none px-2 sm:px-3 py-1.5 text-sm text-slate-900 rounded-lg transition-colors" placeholder="Title" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sig. Label</label>
            <input type="text" value={signatureLabel} onChange={(e) => setSignatureLabel(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none px-2 sm:px-3 py-1.5 text-sm text-slate-900 rounded-lg transition-colors" placeholder="Signature" />
          </div>
        </div>
      </div>

      {/* Mobile View Toggle */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-3 py-2 flex justify-center gap-2">
        <button
          onClick={() => setMobileView('editor')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${mobileView === 'editor' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600'}`}
        >
          <Edit3 size={14} className="inline mr-1" /> Editor
        </button>
        <button
          onClick={() => setMobileView('preview')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${mobileView === 'preview' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600'}`}
        >
          <FileText size={14} className="inline mr-1" /> Preview
        </button>
      </div>

      {/* Main Split View */}
      <div ref={containerRef} className="flex-1 flex overflow-hidden">
        {/* Left: Enhanced Editor */}
        <div className={`bg-white border-r border-slate-200 flex flex-col ${mobileView === 'preview' ? 'hidden lg:flex' : 'flex'}`} style={{ width: typeof window !== 'undefined' && window.innerWidth < 1024 ? '100%' : `${editorWidth}%` }}>
          <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Edit3 size={14} className="text-orange-500" /> Content Editor
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400">{content.replace(/<[^>]*>/g, '').length} chars</span>
              <button onClick={() => setEditorWidth(editorWidth < 50 ? 60 : 40)} className="hidden lg:flex p-1.5 hover:bg-slate-200 rounded text-slate-400 transition-colors" title={editorWidth < 50 ? 'Expand Editor' : 'Shrink Editor'}>
                {editorWidth < 50 ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
              </button>
              <div className="lg:hidden">
                <SignaturePicker onSelect={handleSignatureSelect} currentSignature={signature} compact />
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <ReactQuill ref={quillRef} theme="snow" value={content} onChange={setContent}
              className="h-full flex flex-col letterhead-quill" placeholder="Start typing your letter content here..."
              modules={QUILL_MODULES} formats={QUILL_FORMATS} />
          </div>
        </div>

        {/* Resize Handle - Hidden on mobile */}
        <div className="hidden lg:flex w-1.5 bg-slate-200 hover:bg-orange-400 cursor-col-resize items-center justify-center transition-colors group" onMouseDown={() => setIsResizing(true)}>
          <GripVertical size={10} className="text-slate-400 group-hover:text-white transition-colors" />
        </div>

        {/* Right: Preview */}
        <div ref={previewRef} className={`bg-slate-300 p-3 sm:p-6 overflow-y-auto flex flex-col items-center ${mobileView === 'editor' ? 'hidden lg:flex' : 'flex'}`} style={{ width: typeof window !== 'undefined' && window.innerWidth < 1024 ? '100%' : `${100 - editorWidth - 0.5}%` }}>
          {totalPages > 1 && (
            <div className="mb-4 flex items-center gap-2 sm:gap-3 bg-white rounded-full px-3 sm:px-4 py-2 shadow-md">
              <button onClick={goToPrevPage} disabled={currentPreviewPage === 1} className="p-1 hover:bg-slate-100 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft size={18} />
              </button>
              <span className="text-xs sm:text-sm font-medium text-slate-700 min-w-[60px] sm:min-w-[80px] text-center">Page {currentPreviewPage} / {totalPages}</span>
              <button onClick={goToNextPage} disabled={currentPreviewPage === totalPages} className="p-1 hover:bg-slate-100 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>
          )}

          <div className="mb-4 text-[10px] text-slate-500 flex items-center gap-2 sm:gap-4">
            <span className="bg-white/80 px-2 py-1 rounded">A4 Format</span>
            <span className="bg-white/80 px-2 py-1 rounded">{totalPages === 1 ? 'Single Page' : `${totalPages} Pages`}</span>
          </div>

          {/* Scaled preview container for mobile */}
          <div className="space-y-8 transform origin-top scale-[0.5] sm:scale-[0.65] lg:scale-100 w-[595px]">
            {contentPages.map((pageContent, i) => {
              const isFirst = i === 0;
              const isLast = i === contentPages.length - 1;
              
              if (isFirst) {
                return (
                  <FirstPageTemplate key={i} data={formData} contentHtml={pageContent} signature={signature}
                    pageNumber={i + 1} totalPages={totalPages} isLastPage={isLast} senderName={senderName} senderTitle={senderTitle} signatureLabel={signatureLabel} />
                );
              } else {
                return (
                  <ContinuationPageTemplate key={i} contentHtml={pageContent} signature={signature}
                    pageNumber={i + 1} totalPages={totalPages} isLastPage={isLast} senderName={senderName} senderTitle={senderTitle} signatureLabel={signatureLabel} />
                );
              }
            })}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal 
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        documentName={formData.subject || 'Letterhead'}
      />

      {/* Enhanced Custom Styles */}
      <style>{`
        .letterhead-quill { display: flex; flex-direction: column; height: 100%; }
        .letterhead-quill .ql-toolbar { border: none; border-bottom: 1px solid #e2e8f0; background: #f8fafc; padding: 8px 12px; flex-wrap: wrap; }
        .letterhead-quill .ql-toolbar .ql-formats { margin-right: 12px; }
        .letterhead-quill .ql-toolbar button { width: 28px; height: 28px; padding: 4px; }
        .letterhead-quill .ql-toolbar button:hover { background: #e2e8f0; border-radius: 4px; }
        .letterhead-quill .ql-toolbar button.ql-active { background: #fed7aa; border-radius: 4px; }
        .letterhead-quill .ql-container { flex: 1; overflow-y: auto; border: none; font-family: 'Inter', system-ui, sans-serif; }
        .letterhead-quill .ql-editor { min-height: 100%; font-size: 14px; line-height: 1.8; padding: 24px 32px; color: #1e293b; }
        .letterhead-quill .ql-editor.ql-blank::before { color: #94a3b8; font-style: normal; left: 32px; }
        .letterhead-quill .ql-editor p { margin-bottom: 1em; }
        .letterhead-quill .ql-editor h1 { font-size: 1.5em; font-weight: 700; margin-bottom: 0.5em; }
        .letterhead-quill .ql-editor h2 { font-size: 1.25em; font-weight: 600; margin-bottom: 0.5em; }
        .letterhead-quill .ql-editor h3 { font-size: 1.1em; font-weight: 600; margin-bottom: 0.5em; }
        .letterhead-quill .ql-editor ul, .letterhead-quill .ql-editor ol { padding-left: 1.5em; margin-bottom: 1em; }
        .letterhead-quill .ql-editor li { margin-bottom: 0.25em; }
        .letterhead-quill .ql-editor blockquote { border-left: 3px solid #f97316; padding-left: 1em; margin: 1em 0; color: #64748b; font-style: italic; }
        
        .letterhead-content { font-family: 'Inter', system-ui, sans-serif; line-height: 1.6; color: #334155; }
        .letterhead-content p { margin-bottom: 0.75em; }
        .letterhead-content h1 { font-size: 1.3em; font-weight: 700; margin-bottom: 0.5em; color: #0f172a; }
        .letterhead-content h2 { font-size: 1.15em; font-weight: 600; margin-bottom: 0.5em; color: #0f172a; }
        .letterhead-content h3 { font-size: 1.05em; font-weight: 600; margin-bottom: 0.5em; color: #0f172a; }
        .letterhead-content ul, .letterhead-content ol { padding-left: 1.5em; margin-bottom: 0.75em; }
        .letterhead-content li { margin-bottom: 0.25em; }
        .letterhead-content blockquote { border-left: 2px solid #f97316; padding-left: 0.75em; margin: 0.75em 0; color: #64748b; font-style: italic; }
        .letterhead-content strong { font-weight: 600; color: #0f172a; }
        .letterhead-content em { font-style: italic; }
        .letterhead-content u { text-decoration: underline; }
        .letterhead-content a { color: #f97316; text-decoration: underline; }
        
        @media print {
          .shadow-2xl { box-shadow: none !important; }
          [id^="letterhead-page-"] { page-break-after: always; page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
};

export default LetterheadPage;

