"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Search, Camera } from "lucide-react";

interface ScanScreenProps {
  onBack: () => void;
  onVerify: (regNo: string) => void;
  isLoading: boolean;
  errorMessage?: string;
}

export default function ScanScreen({ onBack, onVerify, isLoading, errorMessage }: ScanScreenProps) {
  const [regNo, setRegNo] = useState("");
  const [showSoon, setShowSoon] = useState(false);

  const handleSubmit = () => {
    const trimmed = regNo.trim();
    if (trimmed) onVerify(trimmed);
  };

  return (
    <div className="fixed inset-0 bg-brand-dark z-50 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 pt-14 pb-5 z-10 relative">
        <button
          onClick={onBack}
          className="w-12 h-12 bg-white/10 rounded-button flex items-center justify-center text-white hover:bg-white/15 transition-colors duration-200"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="text-center">
          <h2 className="text-white font-bold text-heading-md leading-none">Find Product</h2>
          <p className="text-white/40 text-label-sm font-semibold uppercase tracking-wider mt-1">
            Manual SKU Search
          </p>
        </div>
        <button
          onClick={() => {
            setShowSoon(true);
            setTimeout(() => setShowSoon(false), 2000);
          }}
          className="w-12 h-12 bg-white/5 rounded-button flex flex-col items-center justify-center text-white/30 relative overflow-hidden hover:bg-white/10 transition-colors duration-200"
        >
          <Camera size={20} />
          {showSoon && (
            <motion.div 
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              className="absolute inset-0 bg-brand flex items-center justify-center rounded-button"
            >
              <span className="text-label-sm font-bold uppercase leading-none text-white/70">Soon</span>
            </motion.div>
          )}
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-7">
        <div className="w-16 h-16 bg-white/8 rounded-card flex items-center justify-center mb-7">
          <Search size={28} className="text-white/80" />
        </div>
        <p className="text-white/55 text-label font-medium mb-7 text-center px-4 leading-relaxed">
          Enter the Store SKU or Registration ID<br />
          exactly as printed on the item
        </p>
        <input
          autoFocus
          type="text"
          placeholder="e.g. KO-1002 or A4-1234"
          value={regNo}
          onChange={(e) => setRegNo(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className="w-full max-w-sm h-16 bg-white/8 text-white text-xl font-bold text-center rounded-input border-2 border-white/15 focus:border-metallic-light focus:shadow-metallic-glow outline-none placeholder:text-white/20 tracking-wider transition-all duration-200"
        />
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="mx-7 mb-4 bg-danger/15 border border-danger/25 text-red-300 text-label font-semibold px-5 py-4 rounded-card text-center">
          {errorMessage}
        </div>
      )}

      {/* Bottom input area */}
      <div className="p-7 pb-10 space-y-3">
        {isLoading ? (
          <div className="w-full h-14 bg-white/8 rounded-button flex items-center justify-center gap-3 text-white font-semibold">
            <Loader2 size={20} className="animate-spin" />
            Searching registry…
          </div>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!regNo.trim()}
            className={`w-full transition-all duration-200 active:scale-[0.98] ${
              regNo.trim()
                ? "btn-primary shadow-button-lift"
                : "h-14 bg-white/8 text-white/35 rounded-button font-semibold"
            }`}
          >
            Find Product
          </button>
        )}
      </div>
    </div>
  );
}
