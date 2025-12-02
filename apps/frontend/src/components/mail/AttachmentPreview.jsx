import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  FileText,
  File,
  Image as ImageIcon,
  Film,
  Music,
  Code,
  Archive,
  Table,
  Presentation,
  FileSpreadsheet,
  Loader2,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
} from 'lucide-react';

import { mailApi } from '../../lib/api';

/**
 * Format file size for display
 */
const formatSize = (bytes) => {
  if (!bytes) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

/**
 * Get file type category from filename or mime type
 */
const getFileType = (filename, mimeType) => {
  const ext = filename?.split('.').pop()?.toLowerCase();
  
  // Images
  if (mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext)) {
    return 'image';
  }
  
  // PDFs
  if (mimeType === 'application/pdf' || ext === 'pdf') {
    return 'pdf';
  }
  
  // Videos
  if (mimeType?.startsWith('video/') || ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext)) {
    return 'video';
  }
  
  // Audio
  if (mimeType?.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext)) {
    return 'audio';
  }
  
  // Text/Code
  if (mimeType?.startsWith('text/') || ['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts', 'jsx', 'tsx', 'py', 'java', 'c', 'cpp', 'h', 'sh', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'log'].includes(ext)) {
    return 'text';
  }
  
  // Spreadsheets
  if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) {
    return 'spreadsheet';
  }
  
  // Documents
  if (['doc', 'docx', 'odt', 'rtf'].includes(ext)) {
    return 'document';
  }
  
  // Presentations
  if (['ppt', 'pptx', 'odp'].includes(ext)) {
    return 'presentation';
  }
  
  // Archives
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)) {
    return 'archive';
  }
  
  return 'unknown';
};

/**
 * Get icon for file type
 */
const getFileIcon = (type) => {
  const icons = {
    image: ImageIcon,
    pdf: FileText,
    video: Film,
    audio: Music,
    text: Code,
    spreadsheet: FileSpreadsheet,
    document: FileText,
    presentation: Presentation,
    archive: Archive,
    unknown: File,
  };
  return icons[type] || File;
};

/**
 * Get color for file type
 */
const getFileColor = (type) => {
  const colors = {
    image: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30',
    pdf: 'text-red-500 bg-red-100 dark:bg-red-900/30',
    video: 'text-pink-500 bg-pink-100 dark:bg-pink-900/30',
    audio: 'text-green-500 bg-green-100 dark:bg-green-900/30',
    text: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
    spreadsheet: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30',
    document: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
    presentation: 'text-orange-500 bg-orange-100 dark:bg-orange-900/30',
    archive: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30',
    unknown: 'text-slate-500 bg-slate-100 dark:bg-slate-700',
  };
  return colors[type] || colors.unknown;
};

/**
 * Image Preview Component
 */
const ImagePreview = ({ url, filename, onZoomIn, onZoomOut, onRotate, zoom, rotation }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className="flex-1 flex items-center justify-center bg-slate-900/95 overflow-hidden">
      {!loaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-white/50" />
        </div>
      )}
      
      {error ? (
        <div className="text-center text-white/70">
          <AlertCircle size={48} className="mx-auto mb-2 text-red-400" />
          <p>Failed to load image</p>
        </div>
      ) : (
        <img
          src={url}
          alt={filename}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`max-w-full max-h-full object-contain transition-all duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
          }}
          draggable={false}
        />
      )}
    </div>
  );
};

/**
 * PDF Preview Component
 */
const PdfPreview = ({ url, filename }) => {
  const [loading, setLoading] = useState(true);

  return (
    <div className="flex-1 flex flex-col bg-slate-800">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
          <Loader2 className="w-8 h-8 animate-spin text-white/50" />
        </div>
      )}
      <iframe
        src={`${url}#toolbar=0&view=FitH`}
        className="flex-1 w-full border-0"
        title={filename}
        onLoad={() => setLoading(false)}
      />
    </div>
  );
};

/**
 * Video Preview Component
 */
const VideoPreview = ({ url, filename, mimeType }) => {
  return (
    <div className="flex-1 flex items-center justify-center bg-black">
      <video
        src={url}
        controls
        className="max-w-full max-h-full"
        controlsList="nodownload"
      >
        <source src={url} type={mimeType} />
        Your browser does not support video playback.
      </video>
    </div>
  );
};

/**
 * Audio Preview Component
 */
const AudioPreview = ({ url, filename, mimeType }) => {
  const Icon = getFileIcon('audio');
  
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 p-8">
      <div className={`w-32 h-32 rounded-2xl flex items-center justify-center mb-6 ${getFileColor('audio')}`}>
        <Icon size={64} />
      </div>
      <p className="text-white font-medium mb-6">{filename}</p>
      <audio src={url} controls className="w-full max-w-md">
        <source src={url} type={mimeType} />
        Your browser does not support audio playback.
      </audio>
    </div>
  );
};

/**
 * Text/Code Preview Component
 */
const TextPreview = ({ url, filename }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(url)
      .then(res => res.text())
      .then(text => {
        setContent(text);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [url]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const ext = filename?.split('.').pop()?.toLowerCase();
  const isCode = ['json', 'js', 'ts', 'jsx', 'tsx', 'py', 'java', 'c', 'cpp', 'html', 'css', 'xml', 'yaml', 'yml', 'sh'].includes(ext);

  return (
    <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        <span className="text-sm text-slate-400">{filename}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 rounded transition-colors"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <AlertCircle size={32} className="mb-2" />
            <p>Failed to load file</p>
          </div>
        ) : (
          <pre className={`text-sm text-slate-300 whitespace-pre-wrap font-mono ${isCode ? 'leading-relaxed' : ''}`}>
            {content}
          </pre>
        )}
      </div>
    </div>
  );
};

/**
 * Unsupported File Preview
 */
const UnsupportedPreview = ({ attachment, onDownload }) => {
  const type = getFileType(attachment.filename, attachment.mimeType);
  const Icon = getFileIcon(type);
  const colorClass = getFileColor(type);

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 p-8">
      <div className={`w-24 h-24 rounded-2xl flex items-center justify-center mb-6 ${colorClass}`}>
        <Icon size={48} />
      </div>
      <p className="text-white font-medium text-lg mb-2">{attachment.filename}</p>
      <p className="text-slate-400 text-sm mb-1">{formatSize(attachment.size)}</p>
      <p className="text-slate-500 text-xs mb-6 uppercase">{attachment.mimeType || 'Unknown type'}</p>
      
      <p className="text-slate-400 text-sm mb-4">Preview not available for this file type</p>
      
      <button
        onClick={() => onDownload(attachment)}
        className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition-colors"
      >
        <Download size={18} />
        Download File
      </button>
    </div>
  );
};

/**
 * Attachment Gallery Navigation
 */
const GalleryNav = ({ current, total, onPrev, onNext }) => {
  if (total <= 1) return null;

  return (
    <>
      <button
        onClick={onPrev}
        disabled={current === 0}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-full transition-colors z-10"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={onNext}
        disabled={current === total - 1}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-full transition-colors z-10"
      >
        <ChevronRight size={24} />
      </button>
    </>
  );
};

/**
 * Attachment Thumbnails Strip
 */
const ThumbnailStrip = ({ attachments, current, onSelect, getUrl }) => {
  if (attachments.length <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 p-3 bg-black/80 border-t border-white/10">
      {attachments.map((att, index) => {
        const type = getFileType(att.filename, att.mimeType);
        const Icon = getFileIcon(type);
        const isImage = type === 'image';
        const isActive = index === current;

        return (
          <button
            key={att.id || index}
            onClick={() => onSelect(index)}
            className={`relative w-12 h-12 rounded-lg overflow-hidden transition-all ${
              isActive 
                ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-black' 
                : 'opacity-60 hover:opacity-100'
            }`}
          >
            {isImage ? (
              <img
                src={getUrl(att)}
                alt={att.filename}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className={`w-full h-full flex items-center justify-center ${getFileColor(type)}`}>
                <Icon size={20} />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

/**
 * Main Attachment Preview Modal
 */
const AttachmentPreview = ({
  attachment,
  attachments = [],
  isOpen,
  onClose,
  onDownload,
  getAttachmentUrl,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [blobUrl, setBlobUrl] = useState(null);
  const [isLoadingBlob, setIsLoadingBlob] = useState(false);
  const containerRef = useRef(null);

  // Set initial index when attachment changes
  useEffect(() => {
    if (attachment && attachments.length > 0) {
      const index = attachments.findIndex(a => a.id === attachment.id);
      setCurrentIndex(index >= 0 ? index : 0);
    }
    // Reset zoom/rotation when attachment changes
    setZoom(1);
    setRotation(0);
  }, [attachment, attachments]);

  const currentAttachment = attachments[currentIndex] || attachment;

  // Fetch blob if needed
  useEffect(() => {
    if (!currentAttachment) return;

    const url = getAttachmentUrl?.(currentAttachment) || currentAttachment.url;
    
    // If it's an API URL, we need to fetch with auth headers
    if (url && (url.startsWith('/api/') || !url.startsWith('http'))) {
      setIsLoadingBlob(true);
      // Extract ID if possible or just use the ID from attachment
      const id = currentAttachment.id;
      if (id) {
        mailApi.getAttachment(id)
          .then(response => {
            const newBlobUrl = window.URL.createObjectURL(new Blob([response.data], { type: currentAttachment.mimeType }));
            setBlobUrl(newBlobUrl);
            setIsLoadingBlob(false);
          })
          .catch(err => {
            console.error('Failed to load attachment blob:', err);
            setBlobUrl(url); // Fallback
            setIsLoadingBlob(false);
          });
      } else {
        setBlobUrl(url);
        setIsLoadingBlob(false);
      }
    } else {
      setBlobUrl(url);
      setIsLoadingBlob(false);
    }

    return () => {
      if (blobUrl && blobUrl.startsWith('blob:')) {
        window.URL.revokeObjectURL(blobUrl);
      }
    };
  }, [currentAttachment, getAttachmentUrl]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (currentIndex > 0) setCurrentIndex(i => i - 1);
          break;
        case 'ArrowRight':
          if (currentIndex < attachments.length - 1) setCurrentIndex(i => i + 1);
          break;
        case '+':
        case '=':
          setZoom(z => Math.min(z + 0.25, 3));
          break;
        case '-':
          setZoom(z => Math.max(z - 0.25, 0.5));
          break;
        case 'r':
          setRotation(r => r + 90);
          break;
        case 'f':
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, attachments.length, onClose]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (!currentAttachment) return null;

  const fileType = getFileType(currentAttachment.filename, currentAttachment.mimeType);
  // Use the blobUrl if available, otherwise fallback
  const url = blobUrl;

  const renderPreview = () => {
    if (isLoadingBlob) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-white/50" />
        </div>
      );
    }

    switch (fileType) {
      case 'image':
        return (
          <ImagePreview
            url={url}
            filename={currentAttachment.filename}
            zoom={zoom}
            rotation={rotation}
            onZoomIn={() => setZoom(z => Math.min(z + 0.25, 3))}
            onZoomOut={() => setZoom(z => Math.max(z - 0.25, 0.5))}
            onRotate={() => setRotation(r => r + 90)}
          />
        );
      case 'pdf':
        return <PdfPreview url={url} filename={currentAttachment.filename} />;
      case 'video':
        return <VideoPreview url={url} filename={currentAttachment.filename} mimeType={currentAttachment.mimeType} />;
      case 'audio':
        return <AudioPreview url={url} filename={currentAttachment.filename} mimeType={currentAttachment.mimeType} />;
      case 'text':
        return <TextPreview url={url} filename={currentAttachment.filename} />;
      default:
        return <UnsupportedPreview attachment={currentAttachment} onDownload={onDownload} />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col bg-black/95"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-black/80 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              <div className="min-w-0">
                <p className="text-white font-medium truncate">{currentAttachment.filename}</p>
                <p className="text-white/50 text-xs">
                  {formatSize(currentAttachment.size)}
                  {attachments.length > 1 && ` • ${currentIndex + 1} of ${attachments.length}`}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1">
              {/* Zoom controls (only for images) */}
              {fileType === 'image' && (
                <>
                  <button
                    onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))}
                    className="p-2 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors"
                    title="Zoom out (-)"
                  >
                    <ZoomOut size={18} />
                  </button>
                  <span className="text-white/60 text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
                  <button
                    onClick={() => setZoom(z => Math.min(z + 0.25, 3))}
                    className="p-2 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors"
                    title="Zoom in (+)"
                  >
                    <ZoomIn size={18} />
                  </button>
                  <button
                    onClick={() => setRotation(r => r + 90)}
                    className="p-2 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors"
                    title="Rotate (R)"
                  >
                    <RotateCw size={18} />
                  </button>
                  <div className="w-px h-5 bg-white/20 mx-1" />
                </>
              )}

              <button
                onClick={toggleFullscreen}
                className="p-2 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors"
                title="Fullscreen (F)"
              >
                {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>

              {url && (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors"
                  title="Open in new tab"
                >
                  <ExternalLink size={18} />
                </a>
              )}

              <button
                onClick={() => onDownload?.(currentAttachment)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors ml-2"
              >
                <Download size={16} />
                Download
              </button>
            </div>
          </div>

          {/* Preview Content */}
          <div className="flex-1 relative overflow-hidden">
            {renderPreview()}
            
            {/* Gallery Navigation */}
            <GalleryNav
              current={currentIndex}
              total={attachments.length}
              onPrev={() => setCurrentIndex(i => i - 1)}
              onNext={() => setCurrentIndex(i => i + 1)}
            />
          </div>

          {/* Thumbnail Strip */}
          <ThumbnailStrip
            attachments={attachments}
            current={currentIndex}
            onSelect={setCurrentIndex}
            getUrl={getAttachmentUrl}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Attachment Card for grid display
 */
export const AttachmentCard = ({ attachment, onClick, onDownload, getUrl }) => {
  const type = getFileType(attachment.filename, attachment.mimeType);
  const Icon = getFileIcon(type);
  const colorClass = getFileColor(type);
  const isImage = type === 'image';
  const url = getUrl?.(attachment) || attachment.url;

  return (
    <div
      onClick={() => onClick?.(attachment)}
      className="group relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden hover:border-orange-300 dark:hover:border-orange-500 hover:shadow-lg transition-all cursor-pointer"
    >
      {/* Preview Area */}
      <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
        {isImage && url ? (
          <img
            src={url}
            alt={attachment.filename}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${colorClass}`}>
            <Icon size={32} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
          {attachment.filename}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
          {formatSize(attachment.size)}
        </p>
      </div>

      {/* Hover Actions */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onDownload?.(attachment); }}
          className="p-2 bg-black/50 hover:bg-black/70 rounded-lg text-white transition-colors"
          title="Download"
        >
          <Download size={14} />
        </button>
      </div>
    </div>
  );
};

/**
 * Attachment List Item (compact view)
 */
export const AttachmentListItem = ({ attachment, onClick, onDownload, getUrl }) => {
  const type = getFileType(attachment.filename, attachment.mimeType);
  const Icon = getFileIcon(type);
  const colorClass = getFileColor(type);

  return (
    <div
      onClick={() => onClick?.(attachment)}
      className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-orange-300 dark:hover:border-orange-500 hover:shadow-sm transition-all cursor-pointer group"
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
          {attachment.filename}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {formatSize(attachment.size)}
        </p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onClick?.(attachment); }}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500"
          title="Preview"
        >
          <ExternalLink size={14} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDownload?.(attachment); }}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500"
          title="Download"
        >
          <Download size={14} />
        </button>
      </div>
    </div>
  );
};

/**
 * Attachment Chip (inline compact)
 */
export const AttachmentChip = ({ attachment, onClick }) => {
  const type = getFileType(attachment.filename, attachment.mimeType);
  const Icon = getFileIcon(type);

  return (
    <button
      onClick={() => onClick?.(attachment)}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full text-xs text-slate-600 dark:text-slate-300 transition-colors"
    >
      <Icon size={12} />
      <span className="truncate max-w-[120px]">{attachment.filename}</span>
    </button>
  );
};

export default AttachmentPreview;
