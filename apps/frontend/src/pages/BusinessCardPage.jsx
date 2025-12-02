import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { 
  ArrowLeft, Save, Download, Share2, Eye, Edit3, 
  User, Briefcase, Phone, Mail, Globe, MapPin, 
  Camera, Upload, X, Check, Loader2, Copy, Link2,
  ExternalLink, Printer, Image, FileDown, QrCode,
  Smartphone, ChevronRight, Sparkles, RefreshCw,
  ChevronDown, Layers, Square
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { companyApi } from '../lib/api';

// Reusable Card Logo Component - Imported from template
// const CardLogo = ... (removed)

import { BusinessCardTemplate } from '../components/templates/ExoinBusinessCardAlternatives';
import { createRoot } from 'react-dom/client';

// Business Card Preview Component (for screen display - uses clipPath)
const BusinessCardPreview = ({ data }) => {
  return <BusinessCardTemplate data={data} forExport={false} />;
};

// Helper function to render export version and capture with html2canvas
const renderForExport = async (data, elementId = 'card-front') => {
  // Create a temporary container
  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'absolute';
  tempContainer.style.left = '-9999px';
  tempContainer.style.top = '0';
  document.body.appendChild(tempContainer);
  
  // Render the export version with forExport={true}
  const root = createRoot(tempContainer);
  
  return new Promise((resolve, reject) => {
    root.render(<BusinessCardTemplate data={data} forExport={true} />);
    
    // Wait for render to complete
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
        
        // Cleanup
        root.unmount();
        document.body.removeChild(tempContainer);
        
        resolve(canvas);
      } catch (error) {
        root.unmount();
        document.body.removeChild(tempContainer);
        reject(error);
      }
    }, 100);
  });
};



// Share Modal
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900">Share Business Card</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <p className="text-sm text-slate-500 mb-4">Share your digital business card with others</p>
        
        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <Link2 size={18} className="text-slate-400 flex-shrink-0" />
          <input 
            type="text" 
            value={shareUrl} 
            readOnly 
            className="flex-1 bg-transparent text-sm text-slate-600 focus:outline-none truncate" 
          />
          <button 
            onClick={handleCopy} 
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
              copied ? 'bg-green-500 text-white' : 'bg-orange-500 text-white hover:bg-orange-600'
            }`}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>

        <div className="flex gap-3 mt-6">
          <button 
            onClick={() => window.open(`mailto:?subject=My Business Card&body=${encodeURIComponent(shareUrl)}`, '_blank')} 
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Mail size={18} /> Email
          </button>
          <button 
            onClick={() => window.open(shareUrl, '_blank')} 
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <ExternalLink size={18} /> Open
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Business Card Page
const BusinessCardPage = () => {
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const downloadMenuRef = useRef(null);
  const [step, setStep] = useState('form'); // 'form' | 'preview' | 'edit'
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [savedCardId, setSavedCardId] = useState(null);

  // Close download menu when clicking outside
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

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      fullName: '',
      jobTitle: '',
      department: '',
      phone: '',
      email: '',
      website: 'exoin.africa',
      address: '',
    }
  });

  const formData = watch();

  // Handle photo upload
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

  // Generate card from form
  const onSubmit = async (data) => {
    setLoading(true);
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 800));
    setStep('preview');
    setLoading(false);
  };

  // Save card to database
  const handleSave = async () => {
    setSaving(true);
    try {
      // API call to save card data
      // const response = await companyApi.saveBusinessCard({ ...formData, photoUrl: photoPreview });
      // setSavedCardId(response.data.id);
      
      // Simulate save
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSavedCardId('card-' + Date.now());
      alert('Business card saved successfully!');
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save business card');
    } finally {
      setSaving(false);
    }
  };

  // Helper function to download canvas as PNG
  const downloadCanvas = (canvas, filename) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
  };

  // Download both sides as PNG
  const handleDownloadPNG = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3, // Higher resolution for print quality
        backgroundColor: null, // Transparent background
        logging: false,
        useCORS: true,
        allowTaint: true,
      });
      
      const filename = `business-card-${formData.fullName?.replace(/\s+/g, '-').toLowerCase() || 'exoin'}-full.png`;
      downloadCanvas(canvas, filename);
    } catch (error) {
      console.error('Failed to download:', error);
      alert('Failed to generate image');
    } finally {
      setDownloading(false);
    }
  };

  // Download front side only (uses export rendering)
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

  // Download back side only (uses export rendering)
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

  // Download both sides as separate files (uses export rendering)
  const handleDownloadBothSeparate = async () => {
    setDownloading(true);
    try {
      const exportData = { ...formData, photoUrl: photoPreview };
      
      // Download front
      const frontCanvas = await renderForExport(exportData, 'card-front');
      downloadCanvas(frontCanvas, `business-card-${formData.fullName?.replace(/\s+/g, '-').toLowerCase() || 'exoin'}-front.png`);
      
      // Small delay then download back
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const backCanvas = await renderForExport(exportData, 'card-back');
      downloadCanvas(backCanvas, `business-card-${formData.fullName?.replace(/\s+/g, '-').toLowerCase() || 'exoin'}-back.png`);
    } catch (error) {
      console.error('Failed to download:', error);
      alert('Failed to generate images');
    } finally {
      setDownloading(false);
    }
  };

  // Download as PDF (via backend)
  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      // For now, download both sides separately as high-quality PNGs
      // PDF generation can be added later via backend
      await handleDownloadBothSeparate();
    } catch (error) {
      console.error('Failed to download PDF:', error);
    } finally {
      setDownloading(false);
    }
  };

  // Print card - generates high-quality images for printing (uses export rendering)
  const handlePrint = async () => {
    setDownloading(true);
    try {
      const exportData = { ...formData, photoUrl: photoPreview };
      
      // Generate high-res images of both sides using export rendering
      const frontCanvas = await renderForExport(exportData, 'card-front');
      const backCanvas = await renderForExport(exportData, 'card-back');

      const frontDataUrl = frontCanvas.toDataURL('image/png', 1.0);
      const backDataUrl = backCanvas.toDataURL('image/png', 1.0);

      // Open print window with the images
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Business Card - ${formData.fullName || 'Exoin'}</title>
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                  font-family: Arial, sans-serif;
                  padding: 20px;
                  background: #f8fafc;
                }
                .container {
                  max-width: 800px;
                  margin: 0 auto;
                }
                h1 {
                  text-align: center;
                  color: #1e293b;
                  margin-bottom: 10px;
                  font-size: 24px;
                }
                .subtitle {
                  text-align: center;
                  color: #64748b;
                  margin-bottom: 30px;
                  font-size: 14px;
                }
                .cards {
                  display: flex;
                  flex-direction: column;
                  gap: 30px;
                  align-items: center;
                }
                .card-wrapper {
                  text-align: center;
                }
                .card-label {
                  font-size: 12px;
                  color: #64748b;
                  text-transform: uppercase;
                  letter-spacing: 1px;
                  margin-bottom: 10px;
                }
                .card-image {
                  width: 450px;
                  height: auto;
                  border-radius: 16px;
                  box-shadow: 0 10px 40px rgba(0,0,0,0.15);
                }
                .print-info {
                  margin-top: 40px;
                  padding: 20px;
                  background: #e2e8f0;
                  border-radius: 8px;
                  font-size: 12px;
                  color: #475569;
                }
                .print-info h3 {
                  font-size: 14px;
                  margin-bottom: 8px;
                  color: #1e293b;
                }
                @media print {
                  body { 
                    background: white; 
                    padding: 0;
                  }
                  .print-info { display: none; }
                  .cards {
                    gap: 20px;
                  }
                  .card-image {
                    width: 3.5in;
                    box-shadow: none;
                    border: 1px solid #e2e8f0;
                  }
                  @page { 
                    size: letter portrait;
                    margin: 0.5in;
                  }
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>Business Card</h1>
                <p class="subtitle">${formData.fullName || 'Your Name'} - ${formData.jobTitle || 'Job Title'}</p>
                
                <div class="cards">
                  <div class="card-wrapper">
                    <div class="card-label">Front Side</div>
                    <img src="${frontDataUrl}" alt="Business Card Front" class="card-image" />
                  </div>
                  <div class="card-wrapper">
                    <div class="card-label">Back Side</div>
                    <img src="${backDataUrl}" alt="Business Card Back" class="card-image" />
                  </div>
                </div>
                
                <div class="print-info">
                  <h3>Print Instructions</h3>
                  <p>• Standard business card size: 3.5" × 2" (90mm × 50mm)</p>
                  <p>• For best results, print on 300gsm card stock</p>
                  <p>• Select "Actual Size" in print settings to maintain correct dimensions</p>
                </div>
              </div>
              <script>
                window.onload = function() {
                  setTimeout(function() {
                    window.print();
                  }, 300);
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    } catch (error) {
      console.error('Failed to print:', error);
      alert('Failed to generate print preview');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => step === 'form' ? navigate(-1) : setStep('form')} 
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Business Card</h1>
              <p className="text-sm text-slate-500">
                {step === 'form' ? 'Enter your details' : step === 'preview' ? 'Preview your card' : 'Edit your card'}
              </p>
            </div>
          </div>

          {step !== 'form' && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setStep('form')} 
                className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Edit3 size={18} />
                <span className="hidden sm:inline">Edit</span>
              </button>
              
              <button 
                onClick={handleSave} 
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                <span className="hidden sm:inline">Save</span>
              </button>
              
              <div className="relative" ref={downloadMenuRef}>
                <button 
                  onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                  disabled={downloading}
                  className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  {downloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                  <span className="hidden sm:inline">Download</span>
                  <ChevronDown size={14} className={`transition-transform ${showDownloadMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Download Dropdown Menu */}
                {showDownloadMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
                    <button 
                      onClick={() => { handleDownloadBothSeparate(); setShowDownloadMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors"
                    >
                      <Layers size={18} className="text-orange-500" />
                      <div>
                        <div className="text-sm font-medium text-slate-700">Both Sides (Print)</div>
                        <div className="text-xs text-slate-500">High-res PNG files</div>
                      </div>
                    </button>
                    <button 
                      onClick={() => { handleDownloadFront(); setShowDownloadMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors"
                    >
                      <Square size={18} className="text-blue-500" />
                      <div>
                        <div className="text-sm font-medium text-slate-700">Front Only</div>
                        <div className="text-xs text-slate-500">Logo side</div>
                      </div>
                    </button>
                    <button 
                      onClick={() => { handleDownloadBack(); setShowDownloadMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors"
                    >
                      <Square size={18} className="text-green-500" />
                      <div>
                        <div className="text-sm font-medium text-slate-700">Back Only</div>
                        <div className="text-xs text-slate-500">Contact info side</div>
                      </div>
                    </button>
                    <div className="border-t border-slate-100 my-1"></div>
                    <button 
                      onClick={() => { handleDownloadPNG(); setShowDownloadMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors"
                    >
                      <Image size={18} className="text-slate-500" />
                      <div>
                        <div className="text-sm font-medium text-slate-700">Full Preview</div>
                        <div className="text-xs text-slate-500">Both sides in one image</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Share2 size={18} />
                <span className="hidden sm:inline">Share</span>
              </button>
              
              <button 
                onClick={handlePrint}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Printer size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${step === 'form' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'form' ? 'bg-orange-500 text-white' : 'bg-slate-300 text-white'}`}>1</div>
            <span className="font-medium">Enter Details</span>
          </div>
          <ChevronRight size={20} className="text-slate-300" />
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${step === 'preview' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'preview' ? 'bg-orange-500 text-white' : 'bg-slate-300 text-white'}`}>2</div>
            <span className="font-medium">Preview & Download</span>
          </div>
        </div>

        {step === 'form' ? (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <User className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Personal Information</h2>
                  <p className="text-sm text-slate-500">Fill in your business card details</p>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Photo Upload */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Profile Photo (Optional)</label>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {photoPreview ? (
                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-slate-200">
                          <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center">
                          <Camera size={24} className="text-slate-400" />
                        </div>
                      )}
                      {photoPreview && (
                        <button 
                          type="button"
                          onClick={() => setPhotoPreview(null)}
                          className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    <label className="flex-1">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handlePhotoUpload}
                      />
                      <div className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                        <Upload size={18} className="text-slate-500" />
                        <span className="text-sm text-slate-600">Upload Photo</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Full Name *</label>
                  <input 
                    {...register('fullName', { required: 'Name is required' })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    placeholder="John Doe"
                  />
                  {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>}
                </div>

                {/* Job Title */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Job Title *</label>
                  <input 
                    {...register('jobTitle', { required: 'Job title is required' })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    placeholder="Chief Operations Officer"
                  />
                  {errors.jobTitle && <p className="text-red-500 text-sm mt-1">{errors.jobTitle.message}</p>}
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Department</label>
                  <select 
                    {...register('department')}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  >
                    <option value="">Select department...</option>
                    <option value="Operations">Operations</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Sales">Sales</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Finance">Finance</option>
                    <option value="HR">Human Resources</option>
                    <option value="Executive">Executive</option>
                  </select>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number *</label>
                  <input 
                    {...register('phone', { required: 'Phone is required' })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    placeholder="+254 700 000 000"
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
                  <input 
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' }
                    })}
                    type="email"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    placeholder="john@exoin.africa"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                </div>

                {/* Website */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Website</label>
                  <input 
                    {...register('website')}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    placeholder="exoin.africa"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
                  <input 
                    {...register('address')}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    placeholder="Nairobi, Kenya"
                  />
                </div>

                {/* Submit */}
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 transition-all shadow-lg shadow-orange-500/25"
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      Generate Business Card
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Live Preview */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Live Preview</h3>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Eye size={16} />
                  <span>Updates as you type</span>
                </div>
              </div>
              
              <div className="bg-slate-100 rounded-2xl p-8 flex items-center justify-center" style={{ minHeight: '600px' }}>
                <div className="transform scale-75 origin-center">
                  <BusinessCardPreview data={{ ...formData, photoUrl: photoPreview }} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Preview Mode */
          <div className="flex flex-col items-center">
            <div ref={cardRef} className="bg-slate-100 rounded-2xl p-8">
              <BusinessCardPreview data={{ ...formData, photoUrl: photoPreview }} />
            </div>

            {/* Quick Actions */}
            <div className="mt-8 flex flex-col items-center gap-6">
              {/* Primary Download Options */}
              <div className="flex flex-wrap items-center justify-center gap-4">
                <button 
                  onClick={handleDownloadBothSeparate}
                  disabled={downloading}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 transition-all shadow-lg shadow-orange-500/25"
                >
                  {downloading ? <Loader2 size={18} className="animate-spin" /> : <Layers size={18} />}
                  Download for Print
                </button>
                <button 
                  onClick={handleDownloadFront}
                  disabled={downloading}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                  <Square size={18} />
                  Front Side
                </button>
                <button 
                  onClick={handleDownloadBack}
                  disabled={downloading}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                  <Square size={18} />
                  Back Side
                </button>
              </div>
              
              {/* Secondary Actions */}
              <div className="flex flex-wrap items-center justify-center gap-4">
                <button 
                  onClick={handleDownloadPNG}
                  disabled={downloading}
                  className="flex items-center gap-2 px-6 py-3 border border-slate-200 bg-white text-slate-700 rounded-xl font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  <Image size={18} />
                  Full Preview PNG
                </button>
                <button 
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center gap-2 px-6 py-3 border border-slate-200 bg-white text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                >
                  <Share2 size={18} />
                  Share Card
                </button>
                <button 
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-6 py-3 border border-slate-200 bg-white text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                >
                  <Printer size={18} />
                  Print
                </button>
                <button 
                  onClick={() => setStep('form')}
                  className="flex items-center gap-2 px-6 py-3 border border-slate-200 bg-white text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                >
                  <RefreshCw size={18} />
                  Start Over
                </button>
              </div>
            </div>

            {/* Tips */}
            <div className="mt-12 max-w-2xl">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
                <h4 className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Sparkles size={16} />
                  Print & Share Tips
                </h4>
                <ul className="text-sm text-blue-700 space-y-2">
                  <li>• <strong>For Print:</strong> Use "Download for Print" to get high-resolution (300 DPI) front and back images</li>
                  <li>• <strong>Standard Size:</strong> Business cards are 3.5" × 2" (90mm × 50mm)</li>
                  <li>• <strong>QR Code:</strong> Scan the QR code to save contact info directly to your phone</li>
                  <li>• <strong>Pro Tip:</strong> Send the PNG files to your local print shop for professional results</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

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
