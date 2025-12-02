import React, { useState } from 'react';
import { PenTool, Check, Plus, ChevronDown, X, Folder } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useSignatures from '../../hooks/useSignatures';

/**
 * SignaturePicker Component
 * A dropdown component that shows saved signatures and allows selection
 * or creation of new signatures. Can be used in any document editor.
 */
const SignaturePicker = ({ 
  onSelect, 
  currentSignature = null,
  showLabel = true,
  compact = false 
}) => {
  const navigate = useNavigate();
  const { signatures, selectedSignature, selectSignature } = useSignatures();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (signature) => {
    selectSignature(signature);
    if (onSelect) {
      onSelect(signature?.dataUrl || null);
    }
    setIsOpen(false);
  };

  const handleManageSignatures = () => {
    setIsOpen(false);
    navigate('/signatures');
  };

  const activeSignature = currentSignature 
    ? signatures.find(s => s.dataUrl === currentSignature) 
    : selectedSignature;

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 transition-colors ${
          compact 
            ? 'p-2 hover:bg-slate-100 rounded-lg text-slate-600' 
            : 'px-4 py-2 border border-slate-200 rounded-xl hover:border-slate-300 bg-white text-left w-full'
        }`}
        title={compact ? 'Select Signature' : undefined}
      >
        {compact ? (
          <PenTool size={18} />
        ) : (
          <>
            <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
              {activeSignature ? (
                <img 
                  src={activeSignature.dataUrl} 
                  alt={activeSignature.name}
                  className="w-6 h-6 object-contain"
                />
              ) : (
                <PenTool size={14} className="text-slate-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              {showLabel && (
                <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Signature</p>
              )}
              <p className="text-sm text-slate-900 truncate">
                {activeSignature ? activeSignature.name : 'No signature selected'}
              </p>
            </div>
            <ChevronDown 
              size={16} 
              className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            />
          </>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden min-w-[280px]">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <span className="text-sm font-medium text-slate-700">Select Signature</span>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-slate-200 rounded text-slate-400"
              >
                <X size={14} />
              </button>
            </div>

            {/* Signature List */}
            <div className="max-h-64 overflow-y-auto">
              {signatures.length === 0 ? (
                <div className="p-6 text-center text-slate-500">
                  <PenTool size={24} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No signatures saved</p>
                  <p className="text-xs text-slate-400">Create one in Signature Management</p>
                </div>
              ) : (
                <>
                  {/* Clear option */}
                  <button
                    onClick={() => handleSelect(null)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left ${
                      !activeSignature ? 'bg-orange-50' : ''
                    }`}
                  >
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                      <X size={16} className="text-slate-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-700">No Signature</p>
                      <p className="text-xs text-slate-400">Remove signature from document</p>
                    </div>
                    {!activeSignature && (
                      <Check size={16} className="text-orange-500" />
                    )}
                  </button>

                  {/* Saved signatures */}
                  {signatures.map(signature => (
                    <button
                      key={signature.id}
                      onClick={() => handleSelect(signature)}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left ${
                        activeSignature?.id === signature.id ? 'bg-orange-50' : ''
                      }`}
                    >
                      <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden">
                        <img 
                          src={signature.dataUrl} 
                          alt={signature.name}
                          className="w-8 h-8 object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {signature.name}
                          {signature.isDefault && (
                            <span className="ml-2 text-xs text-orange-500 font-normal">(Default)</span>
                          )}
                        </p>
                        <p className="text-xs text-slate-400">{signature.createdAt}</p>
                      </div>
                      {activeSignature?.id === signature.id && (
                        <Check size={16} className="text-orange-500 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-3 py-2 border-t border-slate-100 bg-slate-50">
              <button
                onClick={handleManageSignatures}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors text-sm font-medium"
              >
                <Folder size={16} />
                Manage Signatures
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SignaturePicker;
