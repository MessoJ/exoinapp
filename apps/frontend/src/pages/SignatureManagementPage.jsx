import React, { useState, useEffect, useRef } from 'react';
import { 
  PenTool, Save, Trash2, Download, Upload, Plus, Edit3, 
  Check, X, Loader2, FileImage, Pen, Type, Grid, CheckCircle2,
  Sparkles, ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Inline Signature Canvas Component with Touch Protection & DPI Scaling
const SignatureCanvas = ({ onSave, initialSignature, size = 'large' }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Scale for Retina/Mobile displays
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    ctx.scale(ratio, ratio);

    // Initial fill
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    
    if (initialSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasSignature(true);
      };
      img.src = initialSignature;
    }
  }, [initialSignature]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e) => {
    if (e.cancelable && e.type.startsWith('touch')) {
      e.preventDefault();
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    if (e.cancelable && e.type.startsWith('touch')) {
      e.preventDefault();
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e) => {
    if (e && e.cancelable && e.type && e.type.startsWith('touch')) {
      e.preventDefault();
    }
    setIsDrawing(false);
    if (hasSignature && onSave && canvasRef.current) {
      onSave(canvasRef.current.toDataURL('image/png'));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    setHasSignature(false);
    if (onSave) onSave(null);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="relative bg-white border-2 border-dashed border-slate-300 rounded-2xl overflow-hidden shadow-inner">
        <canvas
          ref={canvasRef}
          className="w-full h-44 sm:h-52 cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        
        {/* Guidelines */}
        <div className="absolute bottom-8 left-6 right-6 border-b border-slate-200 pointer-events-none"></div>
        <div className="absolute bottom-3 left-6 text-[10px] font-bold uppercase tracking-wider text-slate-400 pointer-events-none">
          Sign inside frame
        </div>
        
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400">
            <div className="text-center px-4">
              <PenTool size={28} className="mx-auto mb-2 opacity-40 text-orange-500" />
              <p className="text-xs sm:text-sm font-medium">Draw client or officer signature with finger / stylus</p>
            </div>
          </div>
        )}
      </div>
      
      <button
        type="button"
        onClick={clearCanvas}
        className="self-end px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-1.5 active:scale-95"
      >
        <Trash2 size={13} /> Clear Canvas
      </button>
    </div>
  );
};

// Apple-styled Signature Card
const SignatureCard = ({ signature, onSelect, onDelete, onDownload, isSelected }) => {
  return (
    <div 
      className={`group relative bg-white/90 backdrop-blur-md rounded-3xl p-4 sm:p-5 border cursor-pointer transition-all flex flex-col justify-between ${
        isSelected 
          ? 'border-orange-500 shadow-md ring-4 ring-orange-500/10' 
          : 'border-slate-200/80 hover:border-slate-300 hover:shadow-md'
      }`}
      onClick={() => onSelect(signature)}
    >
      {isSelected && (
        <div className="absolute top-3 right-3 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-xs">
          <Check size={13} strokeWidth={2.5} />
        </div>
      )}
      
      <div className="h-28 flex items-center justify-center bg-slate-50/80 rounded-2xl mb-3 overflow-hidden p-3 border border-slate-100">
        <img 
          src={signature.dataUrl} 
          alt={signature.name} 
          className="max-h-full max-w-full object-contain filter drop-shadow-sm"
        />
      </div>
      
      <div className="flex items-center justify-between pt-1">
        <div className="min-w-0 pr-2">
          <p className="font-bold text-slate-900 text-xs truncate leading-tight">{signature.name}</p>
          <p className="text-[10px] text-slate-400 mt-0.5 truncate">{signature.createdAt}</p>
        </div>
        
        <div className="flex items-center gap-1">
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); onDownload(signature); }}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors active:scale-90"
            title="Download PNG"
          >
            <Download size={14} />
          </button>
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(signature.id); }}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors active:scale-90"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

const SignatureManagementPage = () => {
  const [signatures, setSignatures] = useState([]);
  const [selectedSignature, setSelectedSignature] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newSignatureName, setNewSignatureName] = useState('');
  const [newSignatureData, setNewSignatureData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('draw');
  const fileInputRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('exoin_signatures');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSignatures(parsed);
        if (parsed.length > 0) {
          const defaultSig = parsed.find(s => s.isDefault) || parsed[0];
          setSelectedSignature(defaultSig);
        }
      } catch (e) {
        console.error('Failed to load signatures:', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('exoin_signatures', JSON.stringify(signatures));
  }, [signatures]);

  const handleSaveNewSignature = () => {
    if (!newSignatureData || !newSignatureName.trim()) {
      alert('Please draw or upload a signature and enter a title');
      return;
    }

    setSaving(true);
    
    const newSignature = {
      id: Date.now().toString(),
      name: newSignatureName.trim(),
      dataUrl: newSignatureData,
      createdAt: new Date().toLocaleDateString('en-GB', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }),
      isDefault: signatures.length === 0
    };

    setSignatures(prev => [...prev, newSignature]);
    setSelectedSignature(newSignature);
    setIsCreating(false);
    setNewSignatureName('');
    setNewSignatureData(null);
    setSaving(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG/JPG)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setNewSignatureData(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteSignature = (id) => {
    if (window.confirm('Delete this saved signature?')) {
      setSignatures(prev => prev.filter(s => s.id !== id));
      if (selectedSignature?.id === id) {
        setSelectedSignature(signatures.find(s => s.id !== id) || null);
      }
    }
  };

  const handleDownloadSignature = (signature) => {
    const link = document.createElement('a');
    link.href = signature.dataUrl;
    link.download = `${signature.name.replace(/\s+/g, '_')}_signature.png`;
    link.click();
  };

  const handleSetDefault = (signature) => {
    setSignatures(prev => prev.map(s => ({
      ...s,
      isDefault: s.id === signature.id
    })));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 antialiased">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 backdrop-blur-xl p-4 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 shadow-xs">
            <PenTool size={22} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">E-Signatures</h1>
            <p className="text-xs sm:text-sm text-slate-500">Official digital officer signatures for job cards, delivery notes, and tax invoices</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-slate-900/10 active:scale-95 transition-all touch-manipulation"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>New Signature</span>
        </button>
      </div>

      {/* 2. Apple Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Total Saved</span>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{signatures.length}</p>
        </div>

        <div className="bg-white/90 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Active Profile</span>
          <p className="text-sm sm:text-base font-bold text-slate-900 mt-1 truncate">
            {selectedSignature?.name || 'None selected'}
          </p>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white/90 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Default Signer</span>
          <p className="text-sm sm:text-base font-bold text-orange-600 mt-1 truncate">
            {signatures.find(s => s.isDefault)?.name || 'First registered'}
          </p>
        </div>
      </div>

      {/* 3. Modal: Create Signature */}
      {isCreating && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-5 sm:p-7 border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PenTool size={18} className="text-orange-500" />
                Capture New Signature
              </h3>
              <button 
                type="button"
                onClick={() => { setIsCreating(false); setNewSignatureData(null); setNewSignatureName(''); }}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400"
              >
                <X size={18} />
              </button>
            </div>

            {/* iOS Segmented Selector */}
            <div className="flex p-1 bg-slate-100 rounded-2xl mb-4">
              <button
                type="button"
                onClick={() => { setActiveTab('draw'); setNewSignatureData(null); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'draw' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <PenTool size={14} /> Draw Signature
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('upload'); setNewSignatureData(null); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'upload' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Upload size={14} /> Upload Image
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Signer Name / Title *</label>
              <input
                type="text"
                value={newSignatureName}
                onChange={(e) => setNewSignatureName(e.target.value)}
                placeholder="e.g. Francis Meso (Managing Director)"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
              />
            </div>

            {activeTab === 'draw' ? (
              <SignatureCanvas onSave={setNewSignatureData} />
            ) : (
              <div className="space-y-3">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center cursor-pointer hover:border-orange-500 hover:bg-orange-50/50 transition-colors"
                >
                  {newSignatureData ? (
                    <div className="space-y-2">
                      <img src={newSignatureData} alt="Uploaded" className="max-h-24 mx-auto" />
                      <p className="text-xs text-slate-500">Tap to choose another image</p>
                    </div>
                  ) : (
                    <>
                      <FileImage size={32} className="mx-auto mb-2 text-slate-400" />
                      <p className="text-xs font-bold text-slate-700">Choose PNG or JPG image</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Transparent background recommended</p>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2.5 mt-5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setIsCreating(false); setNewSignatureData(null); setNewSignatureName(''); }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNewSignature}
                disabled={!newSignatureData || !newSignatureName.trim() || saving}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20 active:scale-95 disabled:opacity-40 transition-all"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                <span>Save Signature</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Signatures Bento Grid */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">Saved Signatures</h2>
          <span className="text-xs text-slate-400">Tap card to select as active signer</span>
        </div>

        {signatures.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
              <PenTool size={26} />
            </div>
            <p className="text-sm font-bold text-slate-800">No signatures registered yet</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">Add your signature once and reuse it across all documents.</p>
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
            >
              <Plus size={14} /> Add Signature
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {signatures.map(signature => (
              <SignatureCard
                key={signature.id}
                signature={signature}
                isSelected={selectedSignature?.id === signature.id}
                onSelect={setSelectedSignature}
                onDelete={handleDeleteSignature}
                onDownload={handleDownloadSignature}
              />
            ))}
          </div>
        )}
      </div>

      {/* 5. Selected Signature Spotlight */}
      {selectedSignature && (
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center p-1 overflow-hidden">
              <img src={selectedSignature.dataUrl} alt={selectedSignature.name} className="max-h-full object-contain" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">{selectedSignature.name}</p>
              <p className="text-[11px] text-slate-400">Current default for generated documents</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSetDefault(selectedSignature)}
              disabled={selectedSignature.isDefault}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedSignature.isDefault 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {selectedSignature.isDefault ? '✓ Default Signature' : 'Set as Default'}
            </button>
            <button
              type="button"
              onClick={() => handleDownloadSignature(selectedSignature)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              Download
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignatureManagementPage;
