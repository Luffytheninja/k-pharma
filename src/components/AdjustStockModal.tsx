"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, X, Minus, Plus, Loader2 } from "lucide-react";
import { InventoryItem } from "@/lib/types";
import { adjustStock } from "@/lib/store";
import { cn } from "@/lib/utils";

interface AdjustStockModalProps {
  item: InventoryItem;
  onClose: () => void;
  onAdjusted: () => void;
}

const REASONS = [
  "Damage / Breakage",
  "Expired — Disposal",
  "Miscounted / Shortage",
  "Customer Return",
  "Other",
];

export default function AdjustStockModal({ item, onClose, onAdjusted }: AdjustStockModalProps) {
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAdjust = () => {
    if (!reason) {
      setError("Select a reason before adjusting");
      return;
    }
    if (qty <= 0 || qty > item.total_quantity) {
      setError("Quantity exceeds what's in stock");
      return;
    }
    setLoading(true);
    setError("");
    try {
      adjustStock(item.drug_id, qty, reason);
      onAdjusted();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Adjustment failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
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
        className="relative mt-auto md:my-auto bg-white shadow-elevated w-full md:max-w-md rounded-t-modal md:rounded-modal max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-7 pb-4 border-b border-trust-border">
          <div>
            <h2 className="text-heading-md font-bold text-trust-text tracking-tight">Adjust Stock</h2>
            <p className="text-trust-text-muted text-label font-medium mt-0.5">{item.drug_name}</p>
          </div>
          <button onClick={onClose} className="w-11 h-11 bg-trust-surface rounded-button flex items-center justify-center text-trust-text-secondary hover:bg-brand-50 transition-colors duration-200">
            <X size={20} />
          </button>
        </div>

        <div className="p-7 space-y-6 overflow-y-auto">
          {/* Reason */}
          <div>
            <span className="section-label block mb-3">Reason for Adjustment</span>
            <div className="flex flex-wrap gap-2.5">
              {REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={cn(
                    "px-4 py-3 rounded-button text-label font-semibold border transition-all duration-200",
                    reason === r
                      ? "bg-brand text-white border-brand shadow-sm"
                      : "bg-trust-surface text-trust-text-secondary border-trust-border hover:border-brand/30"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className="flex flex-col items-center gap-4">
            <span className="section-label">Remove Quantity</span>
            <div className="flex items-center gap-6">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-14 h-14 bg-trust-surface rounded-button flex items-center justify-center text-trust-text-secondary hover:bg-brand-50 active:bg-brand-50 transition-colors duration-200 border border-trust-border"
              >
                <Minus size={22} />
              </button>
              <span className="text-heading-xl font-bold text-trust-text min-w-[4rem] text-center tabular-nums">{qty}</span>
              <button
                onClick={() => setQty(Math.min(item.total_quantity, qty + 1))}
                className="w-14 h-14 bg-trust-surface rounded-button flex items-center justify-center text-trust-text-secondary hover:bg-brand-50 active:bg-brand-50 transition-colors duration-200 border border-trust-border"
              >
                <Plus size={22} />
              </button>
            </div>
            <p className="text-label text-trust-text-muted font-medium">{item.total_quantity} in stock</p>
          </div>

          {/* Summary */}
          <div className="bg-warning-light border border-warning-border rounded-card p-5 text-center">
            <span className="section-label text-warning block mb-2">After Adjustment</span>
            <p className="text-heading-lg font-bold text-trust-text tabular-nums">
              {item.total_quantity} → {Math.max(0, item.total_quantity - qty)} units
            </p>
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
              onClick={handleAdjust}
              disabled={loading}
              className="btn-primary w-full bg-warning hover:bg-warning/90 border-warning/30"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : (
                <>
                  <AlertTriangle size={20} />
                  Confirm • Remove {qty} Unit{qty !== 1 ? "s" : ""}
                </>
              )}
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
