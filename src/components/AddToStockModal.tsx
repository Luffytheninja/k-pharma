"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Package } from "lucide-react";
import { Drug } from "@/lib/types";
import { addBatch, cacheDrug } from "@/lib/store";

interface AddToStockModalProps {
  drug: Drug;
  onClose: () => void;
  onAdded: () => void;
}

export default function AddToStockModal({ drug, onClose, onAdded }: AddToStockModalProps) {
  const [quantity, setQuantity] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [costPrice, setCostPrice] = useState(drug.cost_price ? String(drug.cost_price) : "");
  const [sellingPrice, setSellingPrice] = useState(drug.selling_price ? String(drug.selling_price) : "");
  const [reorderPoint, setReorderPoint] = useState(drug.reorder_point ? String(drug.reorder_point) : "10");
  const [avgDailyUsage, setAvgDailyUsage] = useState(drug.avg_daily_usage ? String(drug.avg_daily_usage) : "1");
  
  const [error, setError] = useState("");

  const handleSave = () => {
    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) { setError("Enter a valid quantity"); return; }
    if (!expiryDate) { setError("Expiry date is required"); return; }
    
    const exDateObj = new Date(expiryDate);
    if (isNaN(exDateObj.getTime())) { setError("Please enter a valid date"); return; }

    const cost = parseFloat(costPrice) || 0;
    const sell = parseFloat(sellingPrice) || 0;
    const reorder = parseInt(reorderPoint, 10) || 10;
    const usage = parseInt(avgDailyUsage, 10) || 1;

    // 1. Log the individual batch tracking
    addBatch({
      drug_id: drug.nafdac_number,
      drug_name: drug.name,
      drug_reg_no: drug.nafdac_number,
      quantity: qty,
      expiry_date: expiryDate,
    });

    // 2. Globally update the drug profile with new pricing / settings
    cacheDrug({
      ...drug,
      cost_price: cost,
      selling_price: sell,
      reorder_point: reorder,
      avg_daily_usage: usage,
    });

    onAdded();
  };

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
        className="fixed bottom-0 left-0 right-0 z-[10000] bg-white rounded-t-[32px] shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
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
            {/* Batch Level inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-2">Qty Received</label>
                <input type="number" inputMode="numeric" placeholder="0" value={quantity} onChange={(e) => { setQuantity(e.target.value); setError(""); }} className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-4 text-lg font-bold focus:outline-none focus:border-[#004d40]" />
              </div>
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-2">Expiry Date</label>
                <input type="date" min={minDate} value={expiryDate} onChange={(e) => { setExpiryDate(e.target.value); setError(""); }} className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold focus:outline-none focus:border-[#004d40]" />
              </div>
            </div>

            <div className="h-px bg-slate-100 my-2" />

            {/* Economics & Thresholds */}
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Product Economics (Global)</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black text-slate-500 block mb-1">Cost Price (₦)</label>
                <input type="number" inputMode="numeric" placeholder="0" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-4 text-base font-bold focus:outline-none focus:border-[#004d40]" />
              </div>
              <div>
                <label className="text-xs font-black text-slate-500 block mb-1">Selling Price (₦)</label>
                <input type="number" inputMode="numeric" placeholder="0" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-4 text-base font-bold focus:outline-none focus:border-[#004d40]" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <label className="text-xs font-black text-slate-500 block mb-1">Reorder Point</label>
                <input type="number" inputMode="numeric" placeholder="10" value={reorderPoint} onChange={(e) => setReorderPoint(e.target.value)} className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-4 text-base font-bold focus:outline-none focus:border-[#004d40]" />
              </div>
              <div>
                <label className="text-xs font-black text-slate-500 block mb-1">Daily Usage (Avg)</label>
                <input type="number" inputMode="numeric" placeholder="1" value={avgDailyUsage} onChange={(e) => setAvgDailyUsage(e.target.value)} className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-4 text-base font-bold focus:outline-none focus:border-[#004d40]" />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm font-semibold">{error}</p>}

            <button onClick={handleSave} className="w-full h-14 bg-[#004d40] text-white rounded-2xl font-bold text-base mt-2 shadow-lg shadow-[#004d40]/20 active:scale-[0.98] transition-transform">
              Save Batch
            </button>
          </div>
        </div>
        <div className="h-6" />
      </motion.div>
    </>
  );
}
