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
  const [now] = useState(() => Date.now()); // Stable render timestamp to avoid impure useMemo warning

  const filtered = search.trim()
    ? items.filter((i) => i.drug_name.toLowerCase().includes(search.toLowerCase()) || i.drug_reg_no.includes(search))
    : items;

  const statusConfig = {
    healthy: { label: "", labelClass: "" },
    expiring: { label: "Expiring Soon", labelClass: "bg-red-50 text-red-600 border-red-100" },
    low_stock: { label: "Low Stock", labelClass: "bg-amber-50 text-amber-600 border-amber-100" },
  };

  // Compute summary totals
  const totalCost = filtered.reduce((sum, item) => sum + (item.total_quantity * (item.cost_price || 0)), 0);
  const totalRetail = filtered.reduce((sum, item) => sum + (item.total_quantity * (item.selling_price || 0)), 0);
  const potentialProfit = totalRetail - totalCost;
  const alertsCount = filtered.filter(i => i.status !== 'healthy').length;

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f9fa]">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 pt-14 pb-6 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={onBack}
            className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">Active Stock</h1>
            <p className="text-slate-400 text-xs font-medium">{items.length} product{items.length !== 1 ? "s" : ""} tracked</p>
          </div>
        </div>

        {/* Global Summary Row */}
        <div className="flex gap-3 mb-5 overflow-x-auto hide-scrollbar pb-1 -mx-2 px-2 snap-x">
          <div className="bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-[16px] min-w-[120px] snap-start">
            <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Total Value (Cost)</span>
            <p className="text-base font-black text-slate-800 mt-0.5">₦{totalCost.toLocaleString()}</p>
          </div>
          <div className="bg-green-50 border border-green-100 px-4 py-2.5 rounded-[16px] min-w-[120px] snap-start">
            <span className="text-[9px] uppercase font-black text-[#2e7d32] tracking-wider">Potential Profit</span>
            <p className="text-base font-black text-[#2e7d32] mt-0.5">₦{potentialProfit.toLocaleString()}</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 px-4 py-2.5 rounded-[16px] min-w-[120px] snap-start">
            <span className="text-[9px] uppercase font-black text-amber-600 tracking-wider">Action Needed</span>
            <p className="text-base font-black text-amber-600 mt-0.5">{alertsCount} flagged</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
          <input
            type="text"
            placeholder="Search by name or NAFDAC No."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 bg-slate-50 rounded-xl pl-10 pr-4 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#004d40]/20 border border-slate-100 placeholder:text-slate-300"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-4 pb-28 space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-slate-300">
            <Package size={52} />
            <p className="font-bold text-sm text-slate-400">
              {search ? "No drugs match your search" : "No drugs in inventory yet"}
            </p>
            {!search && (
              <button
                onClick={onAddNew}
                className="mt-2 bg-[#004d40] text-white text-sm font-bold px-6 py-3 rounded-xl"
              >
                Verify &amp; Add First Drug
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
            const progressColor = item.total_quantity <= reorderPt ? "bg-amber-500" : "bg-[#2e7d32]";

            return (
              <motion.div
                key={item.drug_id}
                layout
                className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 mr-4">
                      <h3 className="font-extrabold text-slate-800 text-lg leading-tight mb-1">{item.drug_name}</h3>
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase bg-slate-50 px-2 py-0.5 rounded-md">{item.drug_reg_no}</span>
                    </div>
                    {(item.status !== "healthy" || daysOfSupply <= 14) && (
                      <span className={cn("text-[9px] font-black px-2.5 py-1 rounded-full border uppercase tracking-wider whitespace-nowrap", cfg.labelClass || "bg-blue-50 text-blue-600 border-blue-100")}>
                        {cfg.label || `${daysOfSupply}d supply`}
                      </span>
                    )}
                  </div>

                  {/* Stock Bar */}
                  <div className="mb-5 bg-slate-50 p-4 rounded-[16px] border border-slate-100">
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-0.5 border-b-2 w-8 border-transparent">Units</span>
                        <p className="text-2xl font-black text-slate-800 leading-none">{item.total_quantity}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Reorder at {reorderPt}</span>
                        <span className="text-xs font-bold text-slate-500">{daysOfSupply} days left</span>
                      </div>
                    </div>
                    {/* Visual Progress */}
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden mt-2">
                       <motion.div 
                         initial={{ width: 0 }} 
                         animate={{ width: `${stockPercent}%` }} 
                         className={cn("h-full rounded-full transition-colors duration-500", progressColor)}
                       />
                    </div>
                  </div>

                  {/* Economics Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Est. Revenue</span>
                      <p className="text-sm font-black text-slate-700">₦{valCost.toLocaleString()} → ₦{(valCost + valProfit).toLocaleString()}</p>
                    </div>
                    <div className="bg-green-50/50 p-3 rounded-xl border border-green-50">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[9px] font-bold text-[#2e7d32]/70 uppercase tracking-wider block">Margin</span>
                        <span className="text-[10px] font-black text-[#2e7d32]">{margin}%</span>
                      </div>
                      <p className="text-sm font-black text-[#2e7d32]">+ ₦{valProfit.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Pricing</span>
                      <p className="text-xs font-bold text-slate-600">
                         Cost ₦{cost.toLocaleString()} <span className="text-slate-300">|</span> Sell ₦{sell.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Expiry</span>
                      <p className={cn("text-xs font-bold flex items-center gap-1", item.status === "expiring" ? "text-red-600" : "text-slate-600")}>
                        <Calendar size={11} />
                        {isValidDate ? (daysToExpiry <= 0 ? "Expired" : daysToExpiry === 1 ? "Tomorrow" : daysToExpiry <= 30 ? `${daysToExpiry}d left` : new Date(item.nearest_expiry).toLocaleDateString(undefined, { month: "short", year: "numeric" })) : "Unknown"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t border-slate-100 bg-slate-50/30 px-5 py-3 flex gap-2">
                  <button
                    onClick={() => setSellTarget(item)}
                    className="flex-[2] h-12 bg-white border border-slate-200 text-[#004d40] font-black rounded-xl flex items-center justify-center gap-2 active:bg-slate-50 transition-colors shadow-sm"
                  >
                    <ShoppingCart size={16} />
                    Quick Sell
                  </button>
                  <button
                    onClick={() => setAdjustTarget(item)}
                    className="flex-1 h-12 bg-white border border-slate-100 text-slate-400 font-bold rounded-xl flex items-center justify-center gap-2 active:bg-red-50 transition-colors shadow-sm text-xs"
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

      {/* FAB — Verify + Add */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={onAddNew}
          className="w-16 h-16 bg-[#004d40] text-white rounded-[22px] shadow-2xl shadow-[#004d40]/40 flex items-center justify-center active:scale-90 transition-transform"
        >
          <Plus size={28} />
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
