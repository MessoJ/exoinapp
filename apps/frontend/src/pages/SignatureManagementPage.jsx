import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  PenTool, Save, Trash2, Download, Upload, Plus, Edit3, 
  Check, X, Loader2, FileImage, Pen, Type, Grid
} from 'lucide-react';

// Inline Signature Canvas Component
const SignatureCanvas = ({ onSave, initialSignature, size = 'large' }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Set canvas background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Load initial signature if exists
    if (initialSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        setHasSignature(true);
      };
      img.src = initialSignature;
    }
  }, [initialSignature]);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x * (canvas.width / rect.width), y * (canvas.height / rect.height));
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1e293b';
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    
    ctx.lineTo(x * (canvas.width / rect.width), y * (canvas.height / rect.height));
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (hasSignature && onSave) {
      onSave(canvasRef.current.toDataURL('image/png'));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const dimensions = size === 'large' ? { width: 500, height: 200 } : { width: 300, height: 120 };

  return (
    <div className="flex flex-col gap-3">
      <div className="relative bg-white border-2 border-dashed border-slate-300 rounded-xl overflow-hidden">
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          className="cursor-crosshair touch-none"
          style={{ width: '100%', height: 'auto' }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        
        {/* Guidelines */}
        <div className="absolute bottom-8 left-4 right-4 border-b border-slate-200 pointer-events-none"></div>
        <div className="absolute bottom-4 left-4 text-xs text-slate-400 pointer-events-none">Sign here</div>
        
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400">
            <div className="text-center">
              <PenTool size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Draw your signature above the line</p>
            </div>
          </div>
        )}
      </div>
      
      <button
        onClick={clearCanvas}
        className="self-end px-3 py-1.5 text-sm text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1.5"
      >
        <Trash2 size={14} /> Clear
      </button>
    </div>
  );
};

// Signature Card Component
const SignatureCard = ({ signature, onSelect, onDelete, onDownload, isSelected }) => {
  return (
    <div 
      className={`relative group bg-white border-2 rounded-xl p-4 cursor-pointer transition-all ${
        isSelected ? 'border-orange-500 ring-2 ring-orange-200' : 'border-slate-200 hover:border-slate-300'
      }`}
      onClick={() => onSelect(signature)}
    >
      {isSelected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-md">
          <Check size={14} />
        </div>
      )}
      
      <div className="h-24 flex items-center justify-center bg-slate-50 rounded-lg mb-3 overflow-hidden">
        <img 
          src={signature.dataUrl} 
          alt={signature.name} 
          className="max-h-full max-w-full object-contain"
        />
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-slate-900 text-sm">{signature.name}</p>
          <p className="text-xs text-slate-500">{signature.createdAt}</p>
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => { e.stopPropagation(); onDownload(signature); }}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
            title="Download"
          >
            <Download size={14} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(signature.id); }}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
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
  const [activeTab, setActiveTab] = useState('draw'); // 'draw' or 'upload'
  const fileInputRef = useRef(null);

  // Load signatures from localStorage on mount
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

  // Save signatures to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('exoin_signatures', JSON.stringify(signatures));
  }, [signatures]);

  const handleSaveNewSignature = () => {
    if (!newSignatureData || !newSignatureName.trim()) {
      alert('Please draw a signature and provide a name');
      return;
    }

    setSaving(true);
    
    const newSignature = {
      id: Date.now().toString(),
      name: newSignatureName.trim(),
      dataUrl: newSignatureData,
      createdAt: new Date().toLocaleDateString('en-US', { 
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
      alert('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setNewSignatureData(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteSignature = (id) => {
    if (window.confirm('Are you sure you want to delete this signature?')) {
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

  const handleSelectSignature = (signature) => {
    setSelectedSignature(signature);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
            <PenTool className="text-orange-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Signature Management</h1>
            <p className="text-slate-500">Create and manage your digital signatures for documents</p>
          </div>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors shadow-sm"
        >
          <Plus size={18} /> New Signature
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Pen className="text-blue-600" size={18} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{signatures.length}</p>
              <p className="text-sm text-slate-500">Total Signatures</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Check className="text-green-600" size={18} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {selectedSignature?.name || 'None'}
              </p>
              <p className="text-sm text-slate-500">Active Signature</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Grid className="text-purple-600" size={18} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {signatures.find(s => s.isDefault)?.name || 'None'}
              </p>
              <p className="text-sm text-slate-500">Default Signature</p>
            </div>
          </div>
        </div>
      </div>

      {/* Create New Signature Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 animate-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">Create New Signature</h3>
              <button 
                onClick={() => { setIsCreating(false); setNewSignatureData(null); setNewSignatureName(''); }}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => { setActiveTab('draw'); setNewSignatureData(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all ${
                  activeTab === 'draw' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <PenTool size={16} /> Draw
              </button>
              <button
                onClick={() => { setActiveTab('upload'); setNewSignatureData(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all ${
                  activeTab === 'upload' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Upload size={16} /> Upload
              </button>
            </div>

            {/* Signature Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Signature Name</label>
              <input
                type="text"
                value={newSignatureName}
                onChange={(e) => setNewSignatureName(e.target.value)}
                placeholder="e.g., My Official Signature"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              />
            </div>

            {/* Draw Tab */}
            {activeTab === 'draw' && (
              <SignatureCanvas 
                onSave={setNewSignatureData}
              />
            )}

            {/* Upload Tab */}
            {activeTab === 'upload' && (
              <div className="space-y-4">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors"
                >
                  {newSignatureData ? (
                    <div className="space-y-3">
                      <img src={newSignatureData} alt="Uploaded" className="max-h-24 mx-auto" />
                      <p className="text-sm text-slate-500">Click to change</p>
                    </div>
                  ) : (
                    <>
                      <FileImage size={40} className="mx-auto mb-3 text-slate-400" />
                      <p className="text-slate-600 font-medium">Click to upload an image</p>
                      <p className="text-sm text-slate-400">PNG or JPG with transparent background preferred</p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => { setIsCreating(false); setNewSignatureData(null); setNewSignatureName(''); }}
                className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNewSignature}
                disabled={!newSignatureData || !newSignatureName.trim() || saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Save Signature
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signatures Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Your Signatures</h3>
          <span className="text-sm text-slate-500">Click to select • Double-click to set as default</span>
        </div>

        <div className="p-5">
          {signatures.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <PenTool size={28} className="text-slate-400" />
              </div>
              <h4 className="text-lg font-medium text-slate-900 mb-1">No signatures yet</h4>
              <p className="text-slate-500 mb-4">Create your first digital signature to use in documents</p>
              <button
                onClick={() => setIsCreating(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors"
              >
                <Plus size={18} /> Create Signature
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {signatures.map(signature => (
                <SignatureCard
                  key={signature.id}
                  signature={signature}
                  isSelected={selectedSignature?.id === signature.id}
                  onSelect={handleSelectSignature}
                  onDelete={handleDeleteSignature}
                  onDownload={handleDownloadSignature}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Selected Signature Preview */}
      {selectedSignature && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-900">Selected Signature Preview</h3>
          </div>
          
          <div className="p-8 flex items-center justify-center bg-slate-50">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <img 
                src={selectedSignature.dataUrl} 
                alt={selectedSignature.name}
                className="max-h-32"
              />
              <p className="text-center text-sm text-slate-500 mt-3">{selectedSignature.name}</p>
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 flex justify-center gap-3">
            <button
              onClick={() => handleSetDefault(selectedSignature)}
              disabled={selectedSignature.isDefault}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                selectedSignature.isDefault 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Check size={16} />
              {selectedSignature.isDefault ? 'Default Signature' : 'Set as Default'}
            </button>
            <button
              onClick={() => handleDownloadSignature(selectedSignature)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <Download size={16} /> Download
            </button>
          </div>
        </div>
      )}

      {/* Usage Guide */}
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-200">
        <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Edit3 size={18} className="text-orange-600" /> How to Use Signatures
        </h3>
        <div className="grid md:grid-cols-3 gap-6 text-sm text-slate-600">
          <div>
            <p className="font-medium text-slate-900 mb-1">1. Create</p>
            <p>Draw your signature directly or upload an existing image file.</p>
          </div>
          <div>
            <p className="font-medium text-slate-900 mb-1">2. Select</p>
            <p>Choose a signature to use when creating invoices, quotations, or letterheads.</p>
          </div>
          <div>
            <p className="font-medium text-slate-900 mb-1">3. Apply</p>
            <p>Your selected signature will be available in all document editors.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignatureManagementPage;
