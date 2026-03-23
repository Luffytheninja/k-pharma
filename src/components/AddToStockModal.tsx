"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, X, Calendar, DollarSign, Package, AlertTriangle, TrendingUp, Loader2 } from "lucide-react";
import { Drug } from "@/lib/types";
import { addBatch, getCachedDrug, cacheDrug } from "@/lib/store";

interface AddToStockModalProps {
  drug: Drug;
  onClose: () => void;
  onAdded: () => void;
}

export default function AddToStockModal({ drug, onClose, onAdded }: AddToStockModalProps) {
  const [quantity, setQuantity] = useState("");
  const [expiry, setExpiry] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [reorderPoint, setReorderPoint] = useState("");
  const [avgDailyUsage, setAvgDailyUsage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const existing = getCachedDrug(drug.nafdac_number);
    if (existing) {
      setCostPrice(existing.cost_price?.toString() || "");
      setSellingPrice(existing.selling_price?.toString() || "");
      setReorderPoint(existing.reorder_point?.toString() || "10");
      setAvgDailyUsage(existing.avg_daily_usage?.toString() || "1");
    }
  }, [drug.nafdac_number]);

  const handleAdd = async () => {
    if (!quantity || parseInt(quantity) <= 0) {
      setError("Enter a valid quantity");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // Cache pricing data on the Drug object
      cacheDrug({
        ...drug,
        nafdac_number: drug.nafdac_number,
        name: drug.name || "Unknown Product",
        manufacturer: drug.manufacturer || "",
        status: drug.status,
        cost_price: costPrice ? parseFloat(costPrice) : undefined,
        selling_price: sellingPrice ? parseFloat(sellingPrice) : undefined,
        reorder_point: reorderPoint ? parseInt(reorderPoint) : 10,
        avg_daily_usage: avgDailyUsage ? parseFloat(avgDailyUsage) : 1,
      });

      // Add batch with only InventoryBatch-compatible fields
      addBatch({
        drug_id: drug.nafdac_number,
        drug_name: drug.name || "Unknown Product",
        drug_reg_no: drug.nafdac_number,
        quantity: parseInt(quantity),
        expiry_date: expiry || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      });
      onAdded();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to add stock";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 32, stiffness: 350 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-modal shadow-elevated max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-7 pb-4 border-b border-trust-border">
          <div>
            <h2 className="text-heading-md font-bold text-trust-text tracking-tight">Add to Stock</h2>
            <p className="text-trust-text-muted text-label font-medium mt-0.5">{drug.name || drug.nafdac_number}</p>
          </div>
          <button onClick={onClose} className="w-11 h-11 bg-trust-surface rounded-button flex items-center justify-center text-trust-text-secondary hover:bg-brand-50 transition-colors duration-200">
            <X size={20} />
          </button>
        </div>

        <div className="p-7 space-y-5">
          {/* Quantity */}
          <div>
            <label className="section-label block mb-2">Quantity *</label>
            <div className="input-icon">
              <Package className="icon" size={18} />
              <input
                type="number"
                min="1"
                placeholder="Number of units"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '48px' }}
              />
            </div>
          </div>

          {/* Expiry */}
          <div>
            <label className="section-label block mb-2">Expiry Date</label>
            <div className="input-icon">
              <Calendar className="icon" size={18} />
              <input
                type="date"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '48px' }}
              />
            </div>
          </div>

          {/* Pricing Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="section-label block mb-2">Cost Price (₦)</label>
              <div className="input-icon">
                <DollarSign className="icon" size={18} />
                <input
                  type="number"
                  placeholder="0"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '48px' }}
                />
              </div>
            </div>
            <div>
              <label className="section-label block mb-2">Sell Price (₦)</label>
              <div className="input-icon">
                <TrendingUp className="icon" size={18} />
                <input
                  type="number"
                  placeholder="0"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '48px' }}
                />
              </div>
            </div>
          </div>

          {/* Reorder & Usage */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="section-label block mb-2">Reorder Point</label>
              <div className="input-icon">
                <AlertTriangle className="icon" size={18} />
                <input
                  type="number"
                  placeholder="10"
                  value={reorderPoint}
                  onChange={(e) => setReorderPoint(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '48px' }}
                />
              </div>
            </div>
            <div>
              <label className="section-label block mb-2">Avg Daily Use</label>
              <input
                type="number"
                step="0.1"
                placeholder="1"
                value={avgDailyUsage}
                onChange={(e) => setAvgDailyUsage(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="text-danger text-label font-semibold bg-danger-light p-4 rounded-card border border-danger-border">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={handleAdd}
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : (
                <>
                  <Plus size={20} />
                  Confirm & Add
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
    </>
  );
}
