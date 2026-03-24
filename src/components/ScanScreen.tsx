"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Search, Camera } from "lucide-react";

interface ScanScreenProps {
  onVerify: (regNo: string) => void;
  isLoading: boolean;
  errorMessage?: string;
}

export default function ScanScreen({ onVerify, isLoading, errorMessage }: ScanScreenProps) {
  const [regNo, setRegNo] = useState("");
  const [showSoon, setShowSoon] = useState(false);

  const handleSubmit = () => {
    const trimmed = regNo.trim();
    if (trimmed) onVerify(trimmed);
  };

  return (
    <div className="flex flex-col h-full bg-trust-surface pt-4 md:pt-12">
      <div className="flex-1 flex flex-col items-center px-6">
        <div className="w-20 h-20 bg-brand-50 rounded-card flex items-center justify-center mb-6 shadow-sm border border-trust-border-subtle">
          <Search size={32} className="text-brand" />
        </div>
        <p className="text-trust-text-secondary text-body font-medium mb-8 text-center px-4 max-w-md">
          Enter the Store SKU or Registration ID exactly as printed on the item packaging to verify and stock.
        </p>
        <div className="w-full max-w-md relative">
          <input
            autoFocus
            type="text"
            placeholder="e.g. KO-1002 or A4-1234"
            value={regNo}
            onChange={(e) => setRegNo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="w-full h-18 bg-white text-trust-text text-xl font-bold text-center rounded-input border-2 border-trust-border focus:border-brand/40 focus:shadow-sm outline-none placeholder:text-trust-text-muted tracking-wider transition-all duration-200"
          />
          <button
            onClick={() => {
              setShowSoon(true);
              setTimeout(() => setShowSoon(false), 2000);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-trust-text-muted hover:text-brand transition-colors p-2"
          >
            <Camera size={24} />
            {showSoon && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="absolute top-12 right-0 bg-brand text-white px-3 py-1.5 rounded-badge text-label-sm font-bold shadow-elevated whitespace-nowrap"
              >
                Camera Soon
              </motion.div>
            )}
          </button>
        </div>
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="mx-7 mb-4 bg-danger/15 border border-danger/25 text-red-300 text-label font-semibold px-5 py-4 rounded-card text-center">
          {errorMessage}
        </div>
      )}

      {/* Bottom input area */}
      <div className="w-full max-w-md mx-auto p-6 pb-10 space-y-4">
        {isLoading ? (
          <div className="w-full h-16 bg-brand-50 rounded-button flex items-center justify-center gap-3 text-brand font-semibold shadow-sm border border-brand-100">
            <Loader2 size={24} className="animate-spin" />
            Searching registry...
          </div>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!regNo.trim()}
            className={`w-full transition-all duration-200 ${
              regNo.trim()
                ? "btn-primary shadow-button-lift"
                : "h-16 bg-trust-surface border-2 border-trust-border-subtle text-trust-text-muted rounded-button font-bold text-center flex items-center justify-center"
            }`}
          >
            Find Product
          </button>
        )}
      </div>
    </div>
  );
}
