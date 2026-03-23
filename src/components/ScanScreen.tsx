"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Search, Camera } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-14 pb-4 z-10 relative">
        <button
          onClick={onBack}
          className="w-12 h-12 bg-white/10 backdrop-blur-lg rounded-2xl flex items-center justify-center text-white"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="text-center">
          <h2 className="text-white font-black text-lg leading-none">Find Product</h2>
          <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest mt-0.5">
            Manual SKU Search
          </p>
        </div>
        <button
          onClick={() => {
            setShowSoon(true);
            setTimeout(() => setShowSoon(false), 2000);
          }}
          className="w-12 h-12 bg-white/5 backdrop-blur-lg rounded-2xl flex flex-col items-center justify-center text-white/30 relative overflow-hidden"
        >
          <Camera size={20} />
          {showSoon && (
            <motion.div 
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              className="absolute inset-0 bg-[#0f172a] flex items-center justify-center"
            >
              <span className="text-[8px] font-black uppercase leading-none">Soon</span>
            </motion.div>
          )}
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
          <Search size={28} className="text-white" />
        </div>
        <p className="text-white/60 text-sm font-medium mb-6 text-center px-4">
          Enter the Store SKU or NAFDAC ID<br />
          exactly as printed on the item
        </p>
        <input
          autoFocus
          type="text"
          placeholder="e.g. KO-1002 or A4-1234"
          value={regNo}
          onChange={(e) => setRegNo(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className="w-full max-w-sm h-16 bg-white/10 backdrop-blur text-white text-xl font-bold text-center rounded-2xl border-2 border-white/20 focus:border-[#0f172a] outline-none placeholder:text-white/20 tracking-wider transition-colors"
        />
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="mx-6 mb-4 bg-red-500/20 border border-red-500/30 text-red-300 text-sm font-semibold px-4 py-3 rounded-2xl text-center">
          {errorMessage}
        </div>
      )}

      {/* Bottom input area */}
      <div className="p-6 pb-10 space-y-3">
        {isLoading ? (
          <div className="w-full h-14 bg-white/10 rounded-2xl flex items-center justify-center gap-3 text-white font-bold">
            <Loader2 size={20} className="animate-spin" />
            Searching registry…
          </div>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!regNo.trim()}
            className={cn(
              "w-full h-14 rounded-2xl font-bold text-base transition-all active:scale-[0.98]",
              regNo.trim()
                ? "bg-[#0f172a] text-white shadow-lg shadow-[#0f172a]/40"
                : "bg-white/10 text-white/40"
            )}
          >
            Find Product
          </button>
        )}
      </div>
    </div>
  );
}
