"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertTriangle, XCircle, Plus, FlaskConical, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Drug } from "@/lib/types";
import { getProMode } from "@/lib/store";
interface VerifiedResultProps {
  drug: Drug;
  onClose: () => void;
  onAddStock: () => void;
}

export default function VerifiedResult({ drug, onClose, onAddStock }: VerifiedResultProps) {
  const proMode = typeof window !== "undefined" ? getProMode() : false;

  const configs = {
    verified: {
      bg: "bg-[#2e7d32]",
      light: "bg-green-50 border-green-100",
      icon: <CheckCircle className="text-white" size={40} />,
      header: "Verified",
      subtext: "Safe to dispense",
      textColor: "text-[#2e7d32]",
      badge: "bg-green-100 text-[#2e7d32]",
    },
    caution: {
      bg: "bg-[#ff8f00]",
      light: "bg-amber-50 border-amber-100",
      icon: <AlertTriangle className="text-white" size={40} />,
      header: "Caution",
      subtext: "Verify source before dispensing",
      textColor: "text-[#ff8f00]",
      badge: "bg-amber-100 text-[#ff8f00]",
    },
    not_found: {
      bg: "bg-[#c62828]",
      light: "bg-red-50 border-red-100",
      icon: <XCircle className="text-white" size={40} />,
      header: "Not Verified",
      subtext: "Drug not found in NAFDAC registry",
      textColor: "text-[#c62828]",
      badge: "bg-red-100 text-[#c62828]",
    },
  };

  const cfg = configs[drug.status];

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-end"
          onClick={onClose}
        />
      </AnimatePresence>

      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[36px] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        {/* Status strip */}
        <div className={cn("p-8 flex flex-col items-center text-center", cfg.bg)}>
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4">
            {cfg.icon}
          </div>
          <h2 className="text-4xl font-black text-white uppercase tracking-tight leading-none">{cfg.header}</h2>
          <p className="text-white/70 text-sm mt-2 font-medium">{cfg.subtext}</p>
        </div>

        <div className="p-6 flex flex-col gap-4">
          {/* Drug details card */}
          {drug.name && drug.name !== "Unknown Drug" && (
            <div className={cn("rounded-2xl border p-5", cfg.light)}>
              <h3 className="text-lg font-black text-slate-800">{drug.name}</h3>
              <div className="grid grid-cols-2 gap-y-3 mt-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">NAFDAC No.</span>
                  <span className="text-sm font-mono font-bold text-slate-700">{drug.nafdac_number}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Manufacturer</span>
                  <span className="text-sm font-bold text-slate-700 text-right block">{drug.manufacturer}</span>
                </div>
              </div>
            </div>
          )}

          {/* Professional Mode extras */}
          {proMode && drug.status !== "not_found" && (drug.composition || drug.drug_class || drug.oncology_notes) && (
            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center gap-2 mb-3">
                <FlaskConical size={16} className="text-[#004d40]" />
                <span className="text-xs font-black text-[#004d40] uppercase tracking-wider">Professional Mode</span>
              </div>
              {drug.composition && (
                <div className="mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Composition</span>
                  <p className="text-sm text-slate-700 font-medium">{drug.composition}</p>
                </div>
              )}
              {drug.drug_class && (
                <div className="mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Drug Class</span>
                  <p className="text-sm text-slate-700 font-medium">{drug.drug_class}</p>
                </div>
              )}
              {drug.oncology_notes && (
                <div className="bg-purple-50 rounded-xl p-3 border border-purple-100 mt-3">
                  <div className="flex items-center gap-1 mb-1">
                    <Info size={12} className="text-purple-600" />
                    <span className="text-[10px] font-black text-purple-600 uppercase">Oncology Note</span>
                  </div>
                  <p className="text-xs text-purple-700 font-medium">{drug.oncology_notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 mt-2">
            {drug.status !== "not_found" && (
              <button
                onClick={onAddStock}
                className="w-full h-14 bg-[#004d40] text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-[#004d40]/20 active:scale-[0.98] transition-transform"
              >
                <Plus size={20} />
                Add to Stock
              </button>
            )}
            <button
              onClick={onClose}
              className="w-full h-14 bg-slate-100 text-slate-600 rounded-2xl font-bold text-base active:scale-[0.98] transition-transform"
            >
              Done
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
