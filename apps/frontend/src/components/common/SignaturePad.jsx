import React, { useRef, useState, useEffect } from 'react';
import { X, Check, Trash2, PenTool } from 'lucide-react';

const SignaturePad = ({ isOpen, onSave, onClose }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const canvas = canvasRef.current;
      if (canvas) {
        // Adjust for high-DPI displays on mobile
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * ratio;
        canvas.height = rect.height * ratio;
        const ctx = canvas.getContext('2d');
        ctx.scale(ratio, ratio);
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#0f172a';
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
    setIsDrawing(true);
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
    setHasSignature(true);
  };

  const stopDrawing = (e) => {
    if (e && e.cancelable && e.type && e.type.startsWith('touch')) {
      e.preventDefault();
    }
    setIsDrawing(false);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const save = () => {
    if (!hasSignature) return;
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-base">
            <PenTool size={18} className="text-orange-500" />
            Sign Document
          </h3>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 hover:bg-slate-200 rounded-full transition-colors touch-manipulation"
            aria-label="Close"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>
        
        <div className="p-4 sm:p-6">
          <p className="text-xs text-slate-500 mb-2">Draw client or technician signature with your finger or stylus:</p>
          <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 touch-none relative overflow-hidden select-none">
            <canvas
              ref={canvasRef}
              className="w-full h-44 sm:h-48 cursor-crosshair touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            {!hasSignature && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-sm font-medium">
                Sign inside this box
              </div>
            )}
          </div>
          
          <div className="flex gap-2.5 sm:gap-3 mt-4 sm:mt-6">
            <button 
              type="button"
              onClick={clear}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium text-sm transition-colors active:scale-95 touch-manipulation"
            >
              <Trash2 size={16} /> Clear
            </button>
            <button 
              type="button"
              onClick={save}
              disabled={!hasSignature}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-orange-500/25 active:scale-95 touch-manipulation"
            >
              <Check size={16} /> Use Signature
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignaturePad;
