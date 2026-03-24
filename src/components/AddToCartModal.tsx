"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, X, Minus, Plus } from "lucide-react";
import { InventoryItem } from "@/lib/types";

interface AddToCartModalProps {
  item: InventoryItem;
  existingQty: number;
  onClose: () => void;
  onAdd: (qty: number) => void;
}

export default function AddToCartModal({ item, existingQty, onClose, onAdd }: AddToCartModalProps) {
  const maxAvailable = Math.max(0, item.total_quantity - existingQty);
  const [qty, setQty] = useState(Math.min(1, maxAvailable));
  const [error, setError] = useState("");
  const total = qty * (item.selling_price || 0);

  const handleAdd = () => {
    if (qty <= 0 || qty > maxAvailable) {
      setError(`Insufficient stock. Only ${maxAvailable} more available.`);
      return;
    }
    setError("");
    onAdd(qty);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col md:items-center md:justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", damping: 32, stiffness: 350 }}
        className="relative mt-auto md:my-auto bg-white shadow-elevated w-full md:max-w-md rounded-t-modal md:rounded-modal overflow-hidden flex flex-col max-h-[95vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-7 pb-4 border-b border-trust-border">
          <div>
            <h2 className="text-heading-md font-bold text-trust-text tracking-tight">Add to Cart</h2>
            <p className="text-trust-text-muted text-label font-medium mt-0.5">{item.drug_name}</p>
          </div>
          <button onClick={onClose} className="w-11 h-11 bg-trust-surface rounded-button flex items-center justify-center text-trust-text-secondary hover:bg-brand-50 transition-colors duration-200">
            <X size={20} />
          </button>
        </div>

        <div className="p-7 space-y-6 overflow-y-auto">
          {/* Quantity selector */}
          <div className="flex flex-col items-center gap-4">
            <span className="section-label">Quantity</span>
            <div className="flex items-center gap-6">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-14 h-14 bg-trust-surface rounded-button flex items-center justify-center text-trust-text-secondary hover:bg-brand-50 active:bg-brand-50 transition-colors duration-200 border border-trust-border"
              >
                <Minus size={22} />
              </button>
              <span className="text-heading-xl font-bold text-trust-text min-w-[4rem] text-center tabular-nums">{qty}</span>
              <button
                onClick={() => setQty(Math.min(maxAvailable, qty + 1))}
                className="w-14 h-14 bg-trust-surface rounded-button flex items-center justify-center text-trust-text-secondary hover:bg-brand-50 active:bg-brand-50 transition-colors duration-200 border border-trust-border"
              >
                <Plus size={22} />
              </button>
            </div>
            <p className="text-label text-trust-text-muted font-medium">
              {maxAvailable} remaining (already in cart: {existingQty})
            </p>
          </div>

          {/* Total */}
          <div className="bg-trust-surface rounded-card p-5 border border-trust-border-subtle text-center">
            <span className="section-label block mb-1">Total Charge</span>
            <p className="text-heading-xl font-bold text-brand tabular-nums">₦{total.toLocaleString()}</p>
          </div>

          {/* Error */}
          {error && (
            <div className="text-danger text-label font-semibold bg-danger-light p-4 rounded-card border border-danger-border">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleAdd}
              className="btn-primary w-full"
            >
              <ShoppingCart size={20} />
              Add to Cart — ₦{total.toLocaleString()}
            </button>
            <button
              onClick={onClose}
              className="btn-secondary w-full"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
