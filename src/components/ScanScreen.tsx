"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Search, Camera, Keyboard } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScanScreenProps {
  onBack: () => void;
  onVerify: (regNo: string) => void;
  isLoading: boolean;
  errorMessage?: string;
}

export default function ScanScreen({ onBack, onVerify, isLoading, errorMessage }: ScanScreenProps) {
  const [regNo, setRegNo] = useState("");
  const [inputMode, setInputMode] = useState<"scan" | "manual">("scan");

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
          <h2 className="text-white font-black text-lg leading-none">Verify Product</h2>
          <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest mt-0.5">
            {inputMode === "scan" ? "Scan Barcode" : "Manual Entry"}
          </p>
        </div>
        <button
          onClick={() => setInputMode(inputMode === "scan" ? "manual" : "scan")}
          className="w-12 h-12 bg-white/10 backdrop-blur-lg rounded-2xl flex items-center justify-center text-white"
        >
          {inputMode === "scan" ? <Keyboard size={20} /> : <Camera size={20} />}
        </button>
      </div>

      {/* Scanner viewport */}
      {inputMode === "scan" ? (
        <div className="flex-1 flex flex-col items-center justify-center relative px-8">
          {/* Scanner frame */}
          <div className="relative w-full max-w-[280px] aspect-square">
            {/* Animated scan line */}
            <motion.div
              animate={{ y: [0, 240, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
              className="absolute left-4 right-4 top-0 h-[2px] bg-[#004d40] shadow-[0_0_12px_#004d40] z-10 rounded-full"
            />
            {/* Corner markers */}
            {[["top-0 left-0 border-t-[3px] border-l-[3px] rounded-tl-2xl", ""],
              ["top-0 right-0 border-t-[3px] border-r-[3px] rounded-tr-2xl", ""],
              ["bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-2xl", ""],
              ["bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-2xl", ""]].map(([cls], i) => (
              <div key={i} className={cn("absolute w-8 h-8 border-[#004d40]", cls)} />
            ))}
            {/* Background placeholder */}
            <div className="absolute inset-0 bg-slate-900/50 rounded-2xl" />
          </div>

          <p className="text-white/40 text-sm font-medium mt-8 text-center">
            Point camera at barcode
          </p>
          <button
            onClick={() => setInputMode("manual")}
            className="mt-4 text-[#004d40]/80 text-sm font-bold bg-white/5 px-4 py-2 rounded-xl active:bg-white/10"
          >
            Switch to manual entry →
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
            <Search size={28} className="text-white" />
          </div>
          <p className="text-white/60 text-sm font-medium mb-6 text-center">
            Enter the NAFDAC registration number<br />
            exactly as printed on the packaging
          </p>
          <input
            autoFocus
            type="text"
            placeholder="e.g. A4-1234"
            value={regNo}
            onChange={(e) => setRegNo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="w-full max-w-sm h-16 bg-white/10 backdrop-blur text-white text-xl font-bold text-center rounded-2xl border-2 border-white/20 focus:border-[#004d40] outline-none placeholder:text-white/20 tracking-wider transition-colors"
          />
        </div>
      )}

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
            Checking registry… this may take a moment
          </div>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!regNo.trim() && inputMode === "manual"}
            className={cn(
              "w-full h-14 rounded-2xl font-bold text-base transition-all active:scale-[0.98]",
              regNo.trim()
                ? "bg-[#004d40] text-white shadow-lg shadow-[#004d40]/40"
                : "bg-white/10 text-white/40"
            )}
          >
            {inputMode === "scan" ? "Or type NAFDAC number above" : "Verify Drug"}
          </button>
        )}
      </div>
    </div>
  );
}
