import React, { useState, useEffect } from 'react';
import { Download, X, Share, Smartphone, PlusSquare, CheckCircle } from 'lucide-react';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // 1. Check if already installed / running in standalone mode
    const checkStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      window.navigator.standalone === true;
    
    setIsStandalone(checkStandalone);

    // 2. Check if user already dismissed this session
    const isDismissed = sessionStorage.getItem('pwa_prompt_dismissed') === 'true';
    if (isDismissed) {
      setDismissed(true);
    }

    // 3. Detect iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua) && !/crios|fxios/.test(ua);
    setIsIOS(isIOSDevice);

    // 4. Capture beforeinstallprompt for Android / Chrome / Edge
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      setTimeout(() => setDismissed(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  // Do not show if already in standalone app, dismissed, or not ready
  if (isStandalone || dismissed || (!deferredPrompt && !isIOS)) {
    return null;
  }

  return (
    <>
      {/* Floating Bottom Apple-styled PWA Install Bar */}
      <div className="fixed bottom-20 md:bottom-6 left-3 right-3 md:left-auto md:right-6 md:w-96 z-40 animate-in slide-in-from-bottom-5 duration-300">
        <div className="bg-slate-900/95 backdrop-blur-xl text-white p-3.5 rounded-2xl border border-slate-800 shadow-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-orange-600 flex items-center justify-center text-white shrink-0 shadow-sm">
              <Smartphone size={20} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">Install Exoin App</p>
              <p className="text-[11px] text-slate-300 truncate">
                {installed ? 'App ready on home screen!' : 'One-tap mobile access & offline ready'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {installed ? (
              <span className="p-2 text-emerald-400 flex items-center gap-1 text-xs font-bold">
                <CheckCircle size={18} />
              </span>
            ) : (
              <button
                onClick={handleInstallClick}
                className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-500/25 touch-manipulation"
              >
                {isIOS ? 'Instructions' : 'Install'}
              </button>
            )}

            <button
              onClick={handleDismiss}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg active:scale-90 transition-colors"
              aria-label="Dismiss install prompt"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Safari Installation Modal Guide */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-slate-900 shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-4">
              <Smartphone size={28} />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">Add to Home Screen</h3>
            <p className="text-xs text-slate-500 mb-6">
              Install Exoin Workspace on your iPhone or iPad for a full-screen app experience.
            </p>

            <div className="space-y-3 text-left text-xs bg-slate-50 p-4 rounded-2xl mb-6 border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-white shadow-xs flex items-center justify-center text-blue-600 shrink-0">
                  <Share size={15} />
                </div>
                <span>1. Tap the <strong>Share</strong> button in Safari's bottom toolbar.</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-white shadow-xs flex items-center justify-center text-slate-800 shrink-0">
                  <PlusSquare size={15} />
                </div>
                <span>2. Scroll down and tap <strong>Add to Home Screen</strong>.</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-white shadow-xs flex items-center justify-center text-orange-600 shrink-0">
                  <CheckCircle size={15} />
                </div>
                <span>3. Tap <strong>Add</strong> in the top right corner.</span>
              </div>
            </div>

            <button
              onClick={() => {
                setShowIOSGuide(false);
                handleDismiss();
              }}
              className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold active:scale-95 transition-all shadow-md"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAInstallPrompt;
