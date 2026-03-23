"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, CheckCircle2 } from "lucide-react";
import { InventoryItem } from "@/lib/types";
import { adjustStock } from "@/lib/store";
import { cn } from "@/lib/utils";

interface AdjustStockModalProps {
  item: InventoryItem;
  onClose: () => void;
  onAdjusted: (remaining: number) => void;
}

const REASONS = [
  { id: "damage", label: "Damaged / Broken", icon: "💥" },
  { id: "expiry", label: "Expired", icon: "📅" },
  { id: "returns", label: "Return to Supplier", icon: "📦" },
  { id: "lost", label: "Theft / Lost", icon: "🕵️" },
  { id: "correction", label: "Inventory Correction", icon: "✏️" },
];

export default function AdjustStockModal({ item, onClose, onAdjusted }: AdjustStockModalProps) {
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<number | null>(null);

  const handleAdjust = () => {
    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) { setError("Enter quantity"); return; }
    if (qty > item.total_quantity) { setError("Exceeds stock"); return; }
    if (!reason) { setError("Select a reason"); return; }

    const result = adjustStock(item.drug_id, qty, reason);
    if (result.success) {
      setSuccess(result.remaining);
      setTimeout(() => onAdjusted(result.remaining), 1500);
    } else {
      setError("Adjustment failed");
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        className="relative w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl p-6 overflow-hidden"
      >
        <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-6 sm:hidden" />

        <AnimatePresence mode="wait">
          {success !== null ? (
            <motion.div 
              key="success"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center py-10"
            >
              <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 size={40} className="text-amber-500" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Stock Adjusted</h3>
              <p className="text-slate-400 font-bold mt-2">{success} units remaining on shelf</p>
            </motion.div>
          ) : (
            <motion.div key="form">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="font-black text-slate-800 text-2xl tracking-tight leading-none">Stock Adjustment</h3>
                  <p className="text-slate-400 text-xs mt-2 font-bold uppercase tracking-widest">{item.drug_name}</p>
                </div>
                <button onClick={onClose} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Quantity to Deduct</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      placeholder="0"
                      autoFocus
                      value={quantity}
                      onChange={(e) => {
                        setQuantity(e.target.value);
                        setError("");
                      }}
                      className="w-full bg-transparent text-3xl font-black text-slate-800 placeholder:text-slate-200 outline-none"
                    />
                    <div className="h-10 w-[1px] bg-slate-200" />
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-300 uppercase leading-none mb-1">On Hand</p>
                      <p className="text-xl font-black text-slate-500 leading-none">{item.total_quantity}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 ml-1">Reason for Adjustment</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {REASONS.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => {
                          setReason(r.id);
                          setError("");
                        }}
                        className={cn(
                          "w-full h-14 px-4 rounded-2xl flex items-center gap-3 border transition-all text-sm font-bold shadow-sm",
                          reason === r.id 
                            ? "bg-amber-50 border-amber-200 text-amber-700 ring-2 ring-amber-500/10" 
                            : "bg-white border-slate-100 text-slate-600 hover:border-slate-200"
                        )}
                      >
                        <span className="text-xl grayscale-0">{r.icon}</span>
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <AnimatePresence>
                    {error && (
                      <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-red-500 text-xs font-bold text-center mb-4 flex items-center justify-center gap-1.5"
                      >
                        <AlertTriangle size={14} />
                        {error}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <button
                    onClick={handleAdjust}
                    disabled={!quantity || !reason || !!success}
                    className="w-full h-16 bg-[#004d40] text-white rounded-[20px] font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-[#004d40]/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
                  >
                    Confirm Adjustment
                    <ArrowRight size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="h-6 sm:h-2" />
      </motion.div>
    </div>
  );
}

function ArrowRight({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
