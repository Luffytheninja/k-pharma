"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, ShoppingCart, AlertCircle } from "lucide-react";
import { InventoryItem } from "@/lib/types";
import { sellFromInventory } from "@/lib/store";

interface QuickSellModalProps {
  item: InventoryItem;
  onClose: () => void;
  onSold: (remaining: number) => void;
}

export default function QuickSellModal({ item, onClose, onSold }: QuickSellModalProps) {
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<number | null>(null);

  const handleSell = () => {
    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) { setError("Enter a valid quantity"); return; }
    if (qty > item.total_quantity) { setError(`Only ${item.total_quantity} units available`); return; }

    const result = sellFromInventory(item.drug_id, qty);
    if (result.success) {
      setSuccess(result.remaining);
      setTimeout(() => {
        onSold(result.remaining);
      }, 1500);
    } else {
      setError("Sale failed — insufficient stock");
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-60"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-70 bg-white rounded-t-[32px] shadow-2xl"
      >
        <div className="p-6">
          <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-6" />

          {success !== null ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center py-8 gap-4"
            >
              <div className="w-20 h-20 bg-green-50 border-2 border-green-100 rounded-full flex items-center justify-center">
                <ShoppingCart size={32} className="text-[#2e7d32]" />
              </div>
              <h3 className="text-xl font-black text-slate-800">Sale Logged</h3>
              <p className="text-slate-500 text-sm font-medium">
                {success} units remaining in stock
              </p>
            </motion.div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-black text-slate-800 text-lg leading-none">{item.drug_name}</h3>
                  <p className="text-slate-400 text-sm mt-1 font-medium">{item.total_quantity} units in stock</p>
                </div>
                <button onClick={onClose} className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                  <X size={20} />
                </button>
              </div>

              {/* Stock indicator */}
              <div className="bg-slate-50 rounded-2xl p-4 mb-4 flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-xs font-bold text-slate-500 uppercase mb-1.5">
                    <span>Stock</span>
                    <span>{item.total_quantity} units</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#004d40] rounded-full transition-all"
                      style={{ width: `${Math.min(100, (item.total_quantity / 200) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">
                      Quantity to Sell
                    </label>
                    <span className="text-xs font-bold text-[#2e7d32]">
                      {item.selling_price ? `₦${item.selling_price.toLocaleString()} each` : "No price set"}
                    </span>
                  </div>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="0"
                    value={quantity}
                    onChange={(e) => { setQuantity(e.target.value); setError(""); }}
                    autoFocus
                    className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-4 text-2xl font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#004d40]/30 transition text-center"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-500 text-sm font-semibold bg-red-50 rounded-xl px-4 py-3">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                <button
                  onClick={handleSell}
                  className="w-full h-14 bg-[#004d40] text-white rounded-2xl font-bold text-base shadow-lg shadow-[#004d40]/20 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={20} />
                  {item.selling_price && parseInt(quantity, 10) > 0 
                    ? `Charge ₦${(parseInt(quantity, 10) * item.selling_price).toLocaleString()}` 
                    : "Deduct FIFO"}
                </button>
              </div>
            </>
          )}
        </div>
        <div className="h-6" />
      </motion.div>
    </>
  );
}
