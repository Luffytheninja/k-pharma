"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Package, Calendar, ShoppingCart, Plus, Search, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { InventoryItem } from "@/lib/types";
import QuickSellModal from "./QuickSellModal";
import AdjustStockModal from "./AdjustStockModal";

interface InventoryListProps {
  items: InventoryItem[];
  onAddNew: () => void;
  onBack: () => void;
  onRefresh: () => void;
}

export default function InventoryList({ items, onAddNew, onBack, onRefresh }: InventoryListProps) {
  const [sellTarget, setSellTarget] = useState<InventoryItem | null>(null);
  const [adjustTarget, setAdjustTarget] = useState<InventoryItem | null>(null);
  const [search, setSearch] = useState("");
  const [now] = useState(() => Date.now());

  const filtered = search.trim()
    ? items.filter((i) => i.drug_name.toLowerCase().includes(search.toLowerCase()) || i.drug_reg_no.includes(search))
    : items;

  const statusConfig = {
    healthy: { label: "", labelClass: "" },
    expiring: { label: "Expiring Soon", labelClass: "badge-danger" },
    low_stock: { label: "Low Stock", labelClass: "badge-warning" },
  };

  // Compute summary totals
  const totalCost = filtered.reduce((sum, item) => sum + (item.total_quantity * (item.cost_price || 0)), 0);
  const totalRetail = filtered.reduce((sum, item) => sum + (item.total_quantity * (item.selling_price || 0)), 0);
  const potentialProfit = totalRetail - totalCost;
  const alertsCount = filtered.filter(i => i.status !== 'healthy').length;

  return (
    <div className="flex flex-col min-h-screen bg-trust-surface">
      {/* Header */}
      <div className="bg-white border-b border-trust-border px-7 pt-14 pb-6 sticky top-0 z-10 shadow-card">
        <div className="flex items-center gap-4 mb-5">
          <button
            onClick={onBack}
            className="w-11 h-11 bg-trust-surface rounded-button flex items-center justify-center text-trust-text-secondary hover:bg-brand-50 transition-colors duration-200"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-heading-md font-bold text-trust-text tracking-tight">Active Stock</h1>
            <p className="text-trust-text-muted text-label font-medium mt-0.5">{items.length} product{items.length !== 1 ? "s" : ""} tracked</p>
          </div>
        </div>

        {/* Summary Row */}
        <div className="flex gap-3 mb-5 overflow-x-auto hide-scrollbar pb-1 -mx-2 px-2 snap-x">
          <div className="card p-4 min-w-[130px] snap-start">
            <span className="section-label block">Total Value (Cost)</span>
            <p className="text-body font-bold text-trust-text mt-1">₦{totalCost.toLocaleString()}</p>
          </div>
          <div className="bg-success-light border border-success-border p-4 rounded-card min-w-[130px] snap-start">
            <span className="section-label text-success block">Potential Profit</span>
            <p className="text-body font-bold text-success mt-1">₦{potentialProfit.toLocaleString()}</p>
          </div>
          <div className="bg-warning-light border border-warning-border p-4 rounded-card min-w-[130px] snap-start">
            <span className="section-label text-warning block">Action Needed</span>
            <p className="text-body font-bold text-warning mt-1">{alertsCount} flagged</p>
          </div>
        </div>

        {/* Search */}
        <div className="input-icon">
          <Search size={18} className="icon" />
          <input
            type="text"
            placeholder="Search by name or registration..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '48px', height: '48px' }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-7 py-5 pb-28 space-y-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-5 text-trust-text-faint">
            <Package size={48} />
            <p className="font-semibold text-label text-trust-text-muted">
              {search ? "No products match your search" : "No products in inventory yet"}
            </p>
            {!search && (
              <button
                onClick={onAddNew}
                className="btn-primary"
              >
                Find & Add First Item
              </button>
            )}
          </div>
        ) : (
          filtered.map((item) => {
            const cfg = statusConfig[item.status];
            let daysToExpiry = 0;
            let isValidDate = false;
            if (item.nearest_expiry) {
              const d = new Date(item.nearest_expiry);
              if (!isNaN(d.getTime())) {
                isValidDate = true;
                daysToExpiry = Math.floor((d.getTime() - now) / (1000 * 60 * 60 * 24));
              }
            }

            const cost = item.cost_price || 0;
            const sell = item.selling_price || 0;
            const reorderPt = item.reorder_point || 10;
            const avgUsage = item.avg_daily_usage || 1;
            
            const margin = sell > 0 ? (((sell - cost) / sell) * 100).toFixed(0) : "0";
            const valCost = cost * item.total_quantity;
            const valProfit = (sell - cost) * item.total_quantity;
            const daysOfSupply = Math.floor(item.total_quantity / avgUsage);
            
            const stockPercent = Math.min(100, Math.max(0, (item.total_quantity / (reorderPt * 2)) * 100));
            const progressColor = item.total_quantity <= reorderPt ? "bg-warning" : "bg-success";

            return (
              <motion.div
                key={item.drug_id}
                layout
                className="card-premium overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex-1 mr-4">
                      <h3 className="font-bold text-trust-text text-body-lg leading-tight mb-1.5">{item.drug_name}</h3>
                      <span className="text-label-sm font-mono font-semibold text-trust-text-muted bg-trust-surface px-2.5 py-1 rounded-badge">{item.drug_reg_no}</span>
                    </div>
                    {(item.status !== "healthy" || daysOfSupply <= 14) && (
                      <span className={cn("badge whitespace-nowrap", cfg.labelClass || "badge-neutral")}>
                        {cfg.label || `${daysOfSupply}d supply`}
                      </span>
                    )}
                  </div>

                  {/* Stock Bar */}
                  <div className="mb-5 bg-trust-surface p-5 rounded-card border border-trust-border-subtle">
                    <div className="flex justify-between items-end mb-3">
                      <div>
                        <span className="section-label block mb-1">Units</span>
                        <p className="text-heading-lg font-bold text-trust-text leading-none">{item.total_quantity}</p>
                      </div>
                      <div className="text-right">
                        <span className="section-label block mb-0.5">Reorder at {reorderPt}</span>
                        <span className="text-label font-semibold text-trust-text-secondary">{daysOfSupply} days left</span>
                      </div>
                    </div>
                    <div className="h-2.5 w-full bg-trust-border rounded-full overflow-hidden mt-2">
                       <motion.div 
                         initial={{ width: 0 }} 
                         animate={{ width: `${stockPercent}%` }} 
                         transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                         className={cn("h-full rounded-full", progressColor)}
                       />
                    </div>
                  </div>

                  {/* Economics Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div className="bg-trust-surface p-4 rounded-card border border-trust-border-subtle">
                      <span className="section-label block mb-1">Est. Revenue</span>
                      <p className="text-label font-bold text-trust-text">₦{valCost.toLocaleString()} → ₦{(valCost + valProfit).toLocaleString()}</p>
                    </div>
                    <div className="bg-success-light p-4 rounded-card border border-success-border">
                      <div className="flex justify-between items-baseline">
                        <span className="section-label text-success block">Margin</span>
                        <span className="text-label-sm font-bold text-success">{margin}%</span>
                      </div>
                      <p className="text-label font-bold text-success mt-0.5">+ ₦{valProfit.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex gap-6">
                    <div>
                      <span className="section-label block mb-1">Pricing</span>
                      <p className="text-label font-semibold text-trust-text-secondary">
                         Cost ₦{cost.toLocaleString()} <span className="text-trust-text-faint">|</span> Sell ₦{sell.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="section-label block mb-1">Expiry</span>
                      <p className={cn("text-label font-semibold flex items-center gap-1.5", item.status === "expiring" ? "text-danger" : "text-trust-text-secondary")}>
                        <Calendar size={13} />
                        {isValidDate ? (daysToExpiry <= 0 ? "Expired" : daysToExpiry === 1 ? "Tomorrow" : daysToExpiry <= 30 ? `${daysToExpiry}d left` : new Date(item.nearest_expiry).toLocaleDateString(undefined, { month: "short", year: "numeric" })) : "Unknown"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t border-trust-border-subtle bg-trust-surface/50 px-6 py-4 flex gap-3">
                  <button
                    onClick={() => setSellTarget(item)}
                    className="flex-[2] h-12 bg-white border border-trust-border text-brand font-bold rounded-button flex items-center justify-center gap-2 hover:border-brand/30 active:bg-brand-50 transition-all duration-200 shadow-card"
                  >
                    <ShoppingCart size={16} />
                    Quick Sell
                  </button>
                  <button
                    onClick={() => setAdjustTarget(item)}
                    className="flex-1 h-12 bg-white border border-trust-border-subtle text-trust-text-muted font-semibold rounded-button flex items-center justify-center gap-2 hover:border-warning/30 active:bg-warning-light transition-all duration-200 shadow-card text-label"
                  >
                    <AlertTriangle size={14} />
                    Adjust
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* FAB */}
      <div className="fixed bottom-7 right-7">
        <button
          onClick={onAddNew}
          className="w-16 h-16 bg-brand text-white rounded-[18px] shadow-elevated flex items-center justify-center active:scale-90 transition-transform duration-200 relative overflow-hidden"
        >
          <div className="absolute inset-0 rounded-[18px] border border-metallic-light/20" />
          <Plus size={28} className="relative z-10" />
        </button>
      </div>

      {/* Modals */}
      {sellTarget && (
        <QuickSellModal
          item={sellTarget}
          onClose={() => setSellTarget(null)}
          onSold={() => {
            setSellTarget(null);
            onRefresh();
          }}
        />
      )}

      {adjustTarget && (
        <AdjustStockModal
          item={adjustTarget}
          onClose={() => setAdjustTarget(null)}
          onAdjusted={() => {
            setAdjustTarget(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}
