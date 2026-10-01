'use client';

import { useEffect, useState } from 'react';
import { Download, Sparkles, X } from 'lucide-react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

function isIosDevice() {
  if (typeof window === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isStandalone() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }

    const dismissed = sessionStorage.getItem('leadflow-install-dismissed') === 'true';
    const ios = isIosDevice();
    setIsIos(ios);

    if (ios && !dismissed && !isStandalone()) {
      const timer = window.setTimeout(() => setShowPrompt(true), 900);
      return () => window.clearTimeout(timer);
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      if (!dismissed && !isStandalone()) {
        setInstallEvent(event as BeforeInstallPromptEvent);
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem('leadflow-install-dismissed', 'true');
    setShowPrompt(false);
  };

  const installApp = async () => {
    if (!installEvent) return;

    await installEvent.prompt();
    await installEvent.userChoice.catch(() => undefined);
    setInstallEvent(null);
    dismiss();
  };

  if (!showPrompt || isStandalone()) return null;

  return (
    <div className="fixed inset-x-3 bottom-4 z-[70] mx-auto max-w-md rounded-2xl border border-blue-400/25 bg-slate-950/95 p-4 text-slate-100 shadow-2xl shadow-blue-950/40 backdrop-blur-xl sm:bottom-6">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Close install prompt"
        className="absolute right-3 top-3 rounded-lg p-1 text-slate-500 transition hover:bg-slate-800 hover:text-slate-200"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex gap-3 pr-8">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-blue-400/20 bg-blue-500/10">
          <Sparkles className="h-5 w-5 text-blue-300" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-bold">Download LeadFlow app</h2>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            {isIos
              ? 'On iPhone, tap Share and choose Add to Home Screen.'
              : 'Install it on your device for quick access and a full-screen app feel.'}
          </p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {!isIos && (
          <button
            type="button"
            onClick={installApp}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            <Download className="h-4 w-4" />
            Download App
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          className="rounded-xl border border-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-900 hover:text-white"
        >
          Later
        </button>
      </div>
    </div>
  );
}
