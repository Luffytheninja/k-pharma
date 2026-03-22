"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Package } from "lucide-react";
import { Drug } from "@/lib/types";
import { addBatch } from "@/lib/store";

interface AddToStockModalProps {
  drug: Drug;
  onClose: () => void;
  onAdded: () => void;
}

export default function AddToStockModal({ drug, onClose, onAdded }: AddToStockModalProps) {
  const [quantity, setQuantity] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [error, setError] = useState("");

  const handleSave = () => {
    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) { setError("Enter a valid quantity"); return; }
    if (!expiryDate) { setError("Expiry date is required"); return; }
    
    // Very lenient check just to prevent completely invalid dates:
    const exDateObj = new Date(expiryDate);
    if (isNaN(exDateObj.getTime())) { setError("Please enter a valid date"); return; }

    addBatch({
      drug_id: drug.nafdac_number,
      drug_name: drug.name,
      drug_reg_no: drug.nafdac_number,
      quantity: qty,
      expiry_date: expiryDate,
    });

    onAdded();
  };

  // Min date = tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999]"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[10000] bg-white rounded-t-[32px] shadow-2xl"
      >
        <div className="p-6">
          {/* Handle */}
          <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-6" />

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#004d40]/10 rounded-xl flex items-center justify-center">
                <Package size={20} className="text-[#004d40]" />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-base leading-none">Add to Stock</h3>
                <p className="text-slate-400 text-xs mt-0.5 truncate max-w-[200px]">{drug.name}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
              <X size={20} />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {/* Quantity */}
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-2">
                Quantity (units)
              </label>
              <input
                type="number"
                inputMode="numeric"
                placeholder="e.g. 100"
                value={quantity}
                onChange={(e) => { setQuantity(e.target.value); setError(""); }}
                className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-4 text-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#004d40]/30 focus:border-[#004d40]/50 transition"
              />
            </div>

            {/* Expiry Date */}
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-2">
                Expiry Date
              </label>
              <input
                type="date"
                min={minDate}
                value={expiryDate}
                onChange={(e) => { setExpiryDate(e.target.value); setError(""); }}
                className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-4 text-base font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#004d40]/30 focus:border-[#004d40]/50 transition"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm font-semibold">{error}</p>
            )}

            <button
              onClick={handleSave}
              className="w-full h-14 bg-[#004d40] text-white rounded-2xl font-bold text-base mt-2 shadow-lg shadow-[#004d40]/20 active:scale-[0.98] transition-transform"
            >
              Save Batch
            </button>
          </div>
        </div>
        {/* Safe area spacer */}
        <div className="h-6" />
      </motion.div>
    </>
  );
}
