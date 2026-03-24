"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function InstallPrompt() {
  const [isDeferred, setIsDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      return; // Already installed, do nothing
    }

    // Android/Chrome event
    const handler = (e: Event) => {
      e.preventDefault();
      setIsDeferred(e as BeforeInstallPromptEvent);
      // Wait a bit before showing to not bombard the user instantly
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // iOS check (iOS doesn't fire beforeinstallprompt, must use Share -> Add to Home Screen)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
    if (isIOS) {
       setTimeout(() => setShowPrompt(true), 5000);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (isDeferred) {
      isDeferred.prompt();
      const { outcome } = await isDeferred.userChoice;
      if (outcome === "accepted") {
        setShowPrompt(false);
      }
      setIsDeferred(null);
    } else {
      // iOS fallback alert
      alert("To install: tap the Share icon at the bottom of Safari, then select 'Add to Home Screen'.");
    }
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 50 }} 
        animate={{ opacity: 1, y: 0 }} 
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:bottom-8 md:w-96 bg-brand-900 border border-brand-800 text-white p-4 rounded-card shadow-elevated z-50 flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
             <Download size={20} className="text-brand-300" />
           </div>
           <div>
             <h4 className="text-body font-bold leading-tight">Install Admin App</h4>
             <p className="text-label-sm text-white/70">Add to home screen for offline use</p>
           </div>
        </div>
        <div className="flex items-center gap-2">
           <button 
             onClick={handleInstall}
             className="px-4 py-2 bg-brand-500 hover:bg-brand-600 rounded-badge text-label font-bold transition-colors"
           >
             Install
           </button>
           <button 
             onClick={() => setShowPrompt(false)}
             className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white transition-colors"
           >
             <X size={16} />
           </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
