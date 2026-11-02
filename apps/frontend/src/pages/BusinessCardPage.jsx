import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { 
  ArrowLeft, Save, Download, Share2, Eye, Edit3, 
  User, Briefcase, Phone, Mail, Globe, MapPin, 
  Camera, Upload, X, Check, Loader2, Copy, Link2,
  ExternalLink, Printer, Image, Sparkles, RefreshCw,
  ChevronDown, Layers, Square, CreditCard, ChevronRight,
  Repeat, Contact, Smartphone
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { BusinessCardTemplate } from '../components/templates/ExoinBusinessCardAlternatives';
import { createRoot } from 'react-dom/client';
import { useAuth } from '../context/AuthContext';

// Helper function to render export version and capture with html2canvas
const renderForExport = async (data, elementId = 'card-front') => {
  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'absolute';
  tempContainer.style.left = '-9999px';
  tempContainer.style.top = '0';
  document.body.appendChild(tempContainer);
  
  const root = createRoot(tempContainer);
  
  return new Promise((resolve, reject) => {
    root.render(<BusinessCardTemplate data={data} forExport={true} side="all" />);
    
    setTimeout(async () => {
      try {
        const targetElement = tempContainer.querySelector(`#${elementId}`);
        if (!targetElement) {
          throw new Error(`Element #${elementId} not found`);
        }
        
        const canvas = await html2canvas(targetElement, {
          scale: 4,
          backgroundColor: null,
          logging: false,
          useCORS: true,
          allowTaint: true,
        });
        
        root.unmount();
        document.body.removeChild(tempContainer);
        resolve(canvas);
      } catch (error) {
        root.unmount();
        document.body.removeChild(tempContainer);
        reject(error);
      }
    }, 120);
  });
};

// Apple-style Share Modal
const ShareModal = ({ isOpen, onClose, cardData }) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/cards/${cardData?.id || 'preview'}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[70] p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-white/40 dark:border-slate-800 w-full max-w-md p-6 pb-8 sm:pb-6 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
              <CreditCard size={18} />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Share Digital Card</h3>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
          Share this contactless digital business card with your clients and partners.
        </p>
        
        <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700 mb-5">
          <Link2 size={16} className="text-slate-400 ml-2 shrink-0" />
          <input 
            type="text" 
            value={shareUrl} 
            readOnly 
            className="flex-1 bg-transparent text-xs text-slate-600 dark:text-slate-300 focus:outline-none truncate px-1" 
          />
          <button 
            onClick={handleCopy} 
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-transform duration-200 active:scale-95 flex items-center gap-1.5 ${
              copied 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'bg-orange-500 text-white hover:bg-orange-600 shadow-xs'
            }`}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => window.open(`mailto:?subject=${encodeURIComponent('Digital Business Card')}&body=${encodeURIComponent(`Check out my official business card: ${shareUrl}`)}`, '_blank')} 
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-2xl transition-transform duration-200 active:scale-95"
          >
            <Mail size={15} /> Send via Mail
          </button>
          <button 
            onClick={() => window.open(shareUrl, '_blank')} 
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-2xl transition-transform duration-200 active:scale-95 shadow-xs"
          >
            <ExternalLink size={15} /> Open Preview
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Business Card Page
const BusinessCardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const cardRef = useRef(null);
  const downloadMenuRef = useRef(null);
  const [step, setStep] = useState('form'); // 'form' | 'preview'
  const [mobileTab, setMobileTab] = useState('form'); // 'form' | 'preview' on phones
  const [viewMode, setViewMode] = useState('both'); // 'both' | 'flip'
  const [activeSide, setActiveSide] = useState('front'); // 'front' | 'back'
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [vcfDownloaded, setVcfDownloaded] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [savedCardId, setSavedCardId] = useState(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target)) {
        setShowDownloadMenu(false);
      }
    };
    if (showDownloadMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDownloadMenu]);

  const defaultFullName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Francis Meso';
  const defaultEmail = user?.email || 'mesofrancis@outlook.com';
  const defaultPhone = user?.phone || '0739443244';
  const defaultTitle = user?.jobTitle || 'Managing Director';

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      fullName: defaultFullName || 'Francis Meso',
      jobTitle: defaultTitle || 'Managing Director',
      department: 'Executive',
      phone: defaultPhone || '0739443244',
      email: defaultEmail || 'mesofrancis@outlook.com',
      website: 'www.exoin.africa',
      address: 'Nairobi, Kenya',
    }
  });

  const formData = watch();

  const handleAutofillProfile = () => {
    if (user) {
      setValue('fullName', `${user.firstName || ''} ${user.lastName || ''}`.trim() || formData.fullName);
      setValue('email', user.email || formData.email);
      setValue('phone', user.phone || formData.phone);
      setValue('jobTitle', user.jobTitle || formData.jobTitle);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 350));
    setStep('preview');
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setSavedCardId('card-' + Date.now());
      alert('Business card details saved successfully!');
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save business card');
    } finally {
      setSaving(false);
    }
  };

  const downloadCanvas = (canvas, filename) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
  };

  const handleDownloadFront = async () => {
    setDownloading(true);
    try {
      const exportData = { ...formData, photoUrl: photoPreview };
      const canvas = await renderForExport(exportData, 'card-front');
      const filename = `business-card-${formData.fullName?.replace(/\s+/g, '-').toLowerCase() || 'exoin'}-front.png`;
      downloadCanvas(canvas, filename);
    } catch (error) {
      console.error('Failed to download front:', error);
      alert('Failed to generate front image');
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadBack = async () => {
    setDownloading(true);
    try {
      const exportData = { ...formData, photoUrl: photoPreview };
      const canvas = await renderForExport(exportData, 'card-back');
      const filename = `business-card-${formData.fullName?.replace(/\s+/g, '-').toLowerCase() || 'exoin'}-back.png`;
      downloadCanvas(canvas, filename);
    } catch (error) {
      console.error('Failed to download back:', error);
      alert('Failed to generate back image');
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadBothSeparate = async () => {
    setDownloading(true);
    try {
      const exportData = { ...formData, photoUrl: photoPreview };
      const frontCanvas = await renderForExport(exportData, 'card-front');
      downloadCanvas(frontCanvas, `business-card-${formData.fullName?.replace(/\s+/g, '-').toLowerCase() || 'exoin'}-front.png`);
      
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const backCanvas = await renderForExport(exportData, 'card-back');
      downloadCanvas(backCanvas, `business-card-${formData.fullName?.replace(/\s+/g, '-').toLowerCase() || 'exoin'}-back.png`);
    } catch (error) {
      console.error('Failed to download:', error);
      alert('Failed to generate print images');
    } finally {
      setDownloading(false);
    }
  };

  // Direct vCard (.vcf) download for 1-tap phone contact addition
  const handleDownloadVCF = () => {
    const nameParts = (formData.fullName || 'Exoin Officer').trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const vCardContent = `BEGIN:VCARD
VERSION:3.0
N:${lastName};${firstName};;;
FN:${formData.fullName}
TITLE:${formData.jobTitle}
TEL:${formData.phone}
EMAIL:${formData.email}
URL:https://${formData.website || 'www.exoin.africa'}
ADR:;;${formData.address || 'Nairobi, Kenya'};;;
ORG:Exoin Africa
END:VCARD`;

    const blob = new Blob([vCardContent], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${(formData.fullName || 'contact').replace(/\s+/g, '_')}.vcf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setVcfDownloaded(true);
    setTimeout(() => setVcfDownloaded(false), 2500);
  };

  // Native mobile share API with fallback to share modal
  const handleNativeShare = async () => {
    const shareUrl = `${window.location.origin}/cards/${savedCardId || 'preview'}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${formData.fullName} - Business Card | Exoin Africa`,
          text: `Contact details for ${formData.fullName} (${formData.jobTitle} at Exoin Africa)`,
          url: shareUrl
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          setShowShareModal(true);
        }
      }
    } else {
      setShowShareModal(true);
    }
  };

  const handlePrint = async () => {
    setDownloading(true);
    try {
      const exportData = { ...formData, photoUrl: photoPreview };
      const frontCanvas = await renderForExport(exportData, 'card-front');
      const backCanvas = await renderForExport(exportData, 'card-back');
      const frontDataUrl = frontCanvas.toDataURL('image/png', 1.0);
      const backDataUrl = backCanvas.toDataURL('image/png', 1.0);

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Business Card - ${formData.fullName || 'Exoin'}</title>
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 30px; background: #fff; text-align: center; }
                .cards { display: flex; flex-direction: column; gap: 40px; align-items: center; margin-top: 20px; }
                .card-image { width: 420px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
              </style>
            </head>
            <body>
              <h2>Exoin Africa Official Business Card</h2>
              <div class="cards">
                <div><p style="font-size: 12px; color: #64748b; margin-bottom: 8px;">FRONT</p><img class="card-image" src="${frontDataUrl}" /></div>
                <div><p style="font-size: 12px; color: #64748b; margin-bottom: 8px;">BACK</p><img class="card-image" src="${backDataUrl}" /></div>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 500);
      }
    } catch (error) {
      console.error('Print error:', error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20 antialiased text-slate-800 dark:text-slate-100">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => step === 'preview' ? setStep('form') : navigate(-1)} 
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-transform duration-150 active:scale-95"
            title="Back"
          >
            <ArrowLeft size={18} />
          </button>
          
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-sm shadow-orange-500/25">
            <CreditCard size={20} />
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Corporate Business Card</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Official Exoin Africa Executive Stationery & Digital Identity</p>
          </div>
        </div>

        {/* Action Controls & Mobile Switcher */}
        <div className="flex items-center gap-2">
          {step === 'form' && (
            <div className="flex sm:hidden bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700">
              <button
                onClick={() => setMobileTab('form')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                  mobileTab === 'form' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                }`}
              >
                Card Form
              </button>
              <button
                onClick={() => setMobileTab('preview')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                  mobileTab === 'preview' ? 'bg-white dark:bg-slate-900 text-orange-600 shadow-xs' : 'text-slate-500'
                }`}
              >
                Live Card
              </button>
            </div>
          )}

          {step === 'preview' && (
            <>
              {/* Quick Contact VCF Button */}
              <button 
                onClick={handleDownloadVCF}
                className={`h-9 px-3 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-transform duration-150 active:scale-95 ${
                  vcfDownloaded 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                }`}
                title="Download Contact (.vcf) for instant addition to phone address book"
              >
                {vcfDownloaded ? <Check size={15} /> : <Contact size={15} />}
                <span className="hidden sm:inline">{vcfDownloaded ? 'Saved!' : 'Add to Contacts'}</span>
              </button>

              <button 
                onClick={handleSave} 
                disabled={saving} 
                className="w-9 h-9 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-transform duration-150 active:scale-95"
                title="Save Card"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              </button>

              <button 
                onClick={handleNativeShare} 
                className="w-9 h-9 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-transform duration-150 active:scale-95"
                title="Share Card"
              >
                <Share2 size={16} />
              </button>

              <div className="relative" ref={downloadMenuRef}>
                <button 
                  onClick={() => setShowDownloadMenu(!showDownloadMenu)} 
                  disabled={downloading}
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-2xl text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-orange-500/20 transition-transform duration-150 active:scale-95 disabled:opacity-50"
                >
                  {downloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                  <span>Download</span>
                  <ChevronDown size={13} className={`transition-transform duration-200 ${showDownloadMenu ? 'rotate-180' : ''}`} />
                </button>

                {showDownloadMenu && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 py-1.5 z-50 animate-in zoom-in-95 duration-150">
                    <button 
                      onClick={() => { handleDownloadBothSeparate(); setShowDownloadMenu(false); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors"
                    >
                      <Layers size={16} className="text-orange-500" />
                      <div>
                        <div className="text-xs font-semibold text-slate-800 dark:text-white">Print Package (300 DPI)</div>
                        <div className="text-[10px] text-slate-400">Separate Front & Back PNGs</div>
                      </div>
                    </button>
                    <button 
                      onClick={() => { handleDownloadFront(); setShowDownloadMenu(false); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <Square size={16} className="text-blue-500" />
                      <div>
                        <div className="text-xs font-semibold text-slate-800 dark:text-white">Front Side Only</div>
                        <div className="text-[10px] text-slate-400">Emblem & QR Code</div>
                      </div>
                    </button>
                    <button 
                      onClick={() => { handleDownloadBack(); setShowDownloadMenu(false); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <Square size={16} className="text-emerald-500" />
                      <div>
                        <div className="text-xs font-semibold text-slate-800 dark:text-white">Back Side Only</div>
                        <div className="text-[10px] text-slate-400">Coordinates & Title</div>
                      </div>
                    </button>
                    <button 
                      onClick={() => { handleDownloadVCF(); setShowDownloadMenu(false); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors border-t border-slate-100 dark:border-slate-800"
                    >
                      <Contact size={16} className="text-purple-500" />
                      <div>
                        <div className="text-xs font-semibold text-slate-800 dark:text-white">vCard Contact (.vcf)</div>
                        <div className="text-[10px] text-slate-400">One-tap phone contacts save</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Stepper Progress Pill */}
      <div className="flex items-center justify-center gap-3">
        <button 
          onClick={() => setStep('form')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 active:scale-95 ${
            step === 'form' 
              ? 'bg-orange-50 text-orange-700 border border-orange-200/60 shadow-xs' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px]">1</span>
          <span>Card Specifications</span>
        </button>

        <ChevronRight size={14} className="text-slate-300" />

        <button 
          onClick={handleSubmit(onSubmit)}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 active:scale-95 ${
            step === 'preview' 
              ? 'bg-orange-50 text-orange-700 border border-orange-200/60 shadow-xs' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
            step === 'preview' ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-500'
          }`}>2</span>
          <span>Print & Export</span>
        </button>
      </div>

      {/* Step 1: Form and Live Preview */}
      {step === 'form' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Card Form */}
          <div className={`bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xs border border-slate-200/60 dark:border-slate-800 space-y-5 ${
            mobileTab === 'preview' ? 'hidden sm:block' : 'block'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                  <User size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">Executive Details</h2>
                  <p className="text-xs text-slate-400">Card details update dynamically in the live canvas</p>
                </div>
              </div>

              {user && (
                <button
                  type="button"
                  onClick={handleAutofillProfile}
                  className="px-2.5 py-1 text-[11px] font-semibold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 rounded-xl transition-colors"
                >
                  Use My Profile
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Photo Upload */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Officer Portrait (Optional)
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {photoPreview ? (
                      <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-orange-500/30">
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400">
                        <Camera size={20} />
                      </div>
                    )}
                    {photoPreview && (
                      <button 
                        type="button" 
                        onClick={() => setPhotoPreview(null)} 
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-xs"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                  <label className="flex-1 cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    <div className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors">
                      <Upload size={14} />
                      <span>{photoPreview ? 'Change Photo' : 'Upload Officer Photo'}</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input 
                  {...register('fullName', { required: 'Name is required' })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-orange-500 focus:outline-none transition-all"
                  placeholder="e.g. Francis Meso"
                />
                {errors.fullName && <p className="text-red-500 text-[10px] mt-1">{errors.fullName.message}</p>}
              </div>

              {/* Title & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Job Title *
                  </label>
                  <input 
                    {...register('jobTitle', { required: 'Job title is required' })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-orange-500 focus:outline-none transition-all"
                    placeholder="e.g. Managing Director"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Department
                  </label>
                  <select 
                    {...register('department')}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-orange-500 focus:outline-none transition-all"
                  >
                    <option value="Executive">Executive</option>
                    <option value="Operations">Operations</option>
                    <option value="Field Services">Field Services</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Phone Number *
                  </label>
                  <input 
                    {...register('phone', { required: 'Phone is required' })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-orange-500 focus:outline-none transition-all"
                    placeholder="0739443244"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Corporate Email *
                  </label>
                  <input 
                    {...register('email', { required: 'Email is required' })}
                    type="email"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-orange-500 focus:outline-none transition-all"
                    placeholder="mesofrancis@outlook.com"
                  />
                </div>
              </div>

              {/* Website & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Website
                  </label>
                  <input 
                    {...register('website')}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-orange-500 focus:outline-none transition-all"
                    placeholder="www.exoin.africa"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Location
                  </label>
                  <input 
                    {...register('address')}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-orange-500 focus:outline-none transition-all"
                    placeholder="Nairobi, Kenya"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm shadow-orange-500/25 transition-transform duration-150 active:scale-95 disabled:opacity-50 min-h-[44px]"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                <span>Proceed to Card Export</span>
              </button>
            </form>
          </div>

          {/* Live Preview Panel */}
          <div className={`space-y-3 ${mobileTab === 'form' ? 'hidden sm:block' : 'block'}`}>
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Live Preview</h3>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">• Updates live</span>
              </div>

              {/* View mode toggle (Both vs Flip) */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setViewMode('both')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                    viewMode === 'both' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Both Sides
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('flip')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all flex items-center gap-1 ${
                    viewMode === 'flip' ? 'bg-white dark:bg-slate-900 text-orange-600 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  <Repeat size={12} />
                  <span>3D Flip</span>
                </button>
              </div>
            </div>

            {/* Canvas Preview Container with Responsive Scaling */}
            <div className="bg-slate-100/90 dark:bg-slate-850 rounded-3xl p-4 sm:p-6 flex flex-col items-center justify-center min-h-[380px] border border-slate-200/60 dark:border-slate-800 overflow-hidden">
              
              {viewMode === 'both' ? (
                /* Classic Stacked View */
                <div className="w-full flex justify-center overflow-hidden py-2">
                  <div className="transform scale-[0.66] xs:scale-[0.76] sm:scale-[0.88] md:scale-95 origin-top transition-transform duration-300">
                    <BusinessCardTemplate data={{ ...formData, photoUrl: photoPreview }} forExport={false} side="all" />
                  </div>
                </div>
              ) : (
                /* Interactive 3D Flip Card View */
                <div className="flex flex-col items-center py-4">
                  <div className="w-full flex justify-center overflow-hidden">
                    <div 
                      onClick={() => setActiveSide(prev => prev === 'front' ? 'back' : 'front')}
                      className="cursor-pointer select-none group transform scale-[0.68] xs:scale-[0.78] sm:scale-[0.90] md:scale-100 origin-center transition-transform duration-300"
                      style={{ perspective: '1200px', width: '450px', height: '270px' }}
                    >
                      <div 
                        style={{
                          width: '100%',
                          height: '100%',
                          position: 'relative',
                          transformStyle: 'preserve-3d',
                          transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                          transform: activeSide === 'back' ? 'rotateY(180deg)' : 'rotateY(0deg)'
                        }}
                      >
                        {/* Front Side */}
                        <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
                          <BusinessCardTemplate data={{ ...formData, photoUrl: photoPreview }} forExport={false} side="front" />
                        </div>
                        {/* Back Side */}
                        <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                          <BusinessCardTemplate data={{ ...formData, photoUrl: photoPreview }} forExport={false} side="back" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Flip Controller Button */}
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveSide(prev => prev === 'front' ? 'back' : 'front')}
                      className="px-4 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-transform duration-150 active:scale-95"
                    >
                      <Repeat size={13} className="text-orange-500" />
                      <span>Viewing: <strong className="uppercase">{activeSide}</strong> (Tap to flip)</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      ) : (
        /* Step 2: Final Preview & Export Stage */
        <div className="flex flex-col items-center space-y-6">
          <div ref={cardRef} className="bg-slate-100/90 dark:bg-slate-850 rounded-3xl p-4 sm:p-8 border border-slate-200/60 dark:border-slate-800 overflow-hidden w-full flex justify-center">
            <div className="w-full flex justify-center overflow-hidden py-2">
              <div className="transform scale-[0.68] xs:scale-[0.78] sm:scale-[0.90] md:scale-100 origin-top transition-transform duration-300">
                <BusinessCardTemplate data={{ ...formData, photoUrl: photoPreview }} forExport={false} side="all" />
              </div>
            </div>
          </div>

                    {/* Download & Print Action Buttons */}
          <div className="w-full max-w-lg flex flex-col gap-3 px-2 pb-36 sm:pb-12">
            <button 
              onClick={handleDownloadBothSeparate} 
              disabled={downloading}
              className="w-full py-3.5 px-5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-orange-500/25 transition-transform duration-150 active:scale-95 min-h-[48px]"
            >
              {downloading ? <Loader2 size={16} className="animate-spin" /> : <Layers size={16} />}
              <span>Print Ready PNGs (Front & Back - 300 DPI)</span>
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <button 
                onClick={handleDownloadFront} 
                disabled={downloading}
                className="py-3 px-3 bg-slate-900 hover:bg-black text-white rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-transform duration-150 active:scale-95 min-h-[44px]"
              >
                <Square size={14} className="text-orange-400" />
                <span>Front Side Only</span>
              </button>

              <button 
                onClick={handleDownloadBack} 
                disabled={downloading}
                className="py-3 px-3 bg-slate-900 hover:bg-black text-white rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-transform duration-150 active:scale-95 min-h-[44px]"
              >
                <Square size={14} className="text-orange-400" />
                <span>Back Side Only</span>
              </button>

              <button 
                onClick={handleDownloadVCF} 
                className={`py-3 px-3 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-transform duration-150 active:scale-95 min-h-[44px] shadow-xs ${
                  vcfDownloaded 
                    ? "bg-emerald-600 text-white" 
                    : "bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                }`}
              >
                {vcfDownloaded ? <Check size={15} /> : <Contact size={15} className="text-orange-500" />}
                <span>{vcfDownloaded ? "Saved!" : "Save Contact (.vcf)"}</span>
              </button>

              <button 
                onClick={handlePrint} 
                disabled={downloading}
                className="py-3 px-3 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-transform duration-150 active:scale-95 shadow-xs min-h-[44px]"
              >
                <Printer size={15} />
                <span>Print Card</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      <ShareModal 
        isOpen={showShareModal} 
        onClose={() => setShowShareModal(false)} 
        cardData={{ ...formData, id: savedCardId }} 
      />
    </div>
  );
};

export default BusinessCardPage;
