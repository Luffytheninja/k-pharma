"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Package, Calendar, ShoppingCart, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { InventoryItem } from "@/lib/types";
import QuickSellModal from "./QuickSellModal";

interface InventoryListProps {
  items: InventoryItem[];
  onAddNew: () => void;
  onBack: () => void;
  onRefresh: () => void;
}

export default function InventoryList({ items, onAddNew, onBack, onRefresh }: InventoryListProps) {
  const [sellTarget, setSellTarget] = useState<InventoryItem | null>(null);
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? items.filter((i) => i.drug_name.toLowerCase().includes(search.toLowerCase()) || i.drug_reg_no.includes(search))
    : items;

  const statusConfig = {
    healthy: { label: "", labelClass: "" },
    expiring: { label: "Expiring Soon", labelClass: "bg-red-50 text-red-600 border-red-100" },
    low_stock: { label: "Low Stock", labelClass: "bg-amber-50 text-amber-600 border-amber-100" },
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f9fa]">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 pt-14 pb-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={onBack}
            className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">Active Stock</h1>
            <p className="text-slate-400 text-xs font-medium">{items.length} drug{items.length !== 1 ? "s" : ""} in inventory</p>
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
                daysToExpiry = Math.floor((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              }
            }

            return (
              <motion.div
                key={item.drug_id}
                layout
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 mr-4">
                      <h3 className="font-extrabold text-slate-800 text-base leading-tight">{item.drug_name}</h3>
                      <span className="text-[11px] font-mono font-bold text-slate-400 uppercase">{item.drug_reg_no}</span>
                    </div>
                    {item.status !== "healthy" && (
                      <span className={cn("text-[10px] font-black px-2.5 py-1 rounded-full border uppercase tracking-wider whitespace-nowrap", cfg.labelClass)}>
                        {cfg.label}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-6">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Qty</span>
                      <p className="text-2xl font-black text-slate-800 leading-none">
                        {item.total_quantity} <span className="text-xs text-slate-400 font-bold">units</span>
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Nearest Expiry</span>
                      <p className={cn("text-base font-bold flex items-center gap-1", item.status === "expiring" ? "text-red-600" : "text-slate-600")}>
                        <Calendar size={13} />
                        {isValidDate ? (daysToExpiry <= 0 ? "Expired" : daysToExpiry === 1 ? "Tomorrow" : daysToExpiry <= 30 ? `${daysToExpiry}d left` : new Date(item.nearest_expiry).toLocaleDateString(undefined, { month: "short", year: "numeric" })) : "Unknown Date"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Batches</span>
                      <p className="text-base font-bold text-slate-600">{item.batches.length}</p>
                    </div>
                  </div>
                </div>

                {/* Sell action */}
                <div className="border-t border-slate-50 px-5 py-3">
                  <button
                    onClick={() => setSellTarget(item)}
                    className="w-full h-11 bg-[#004d40]/8 text-[#004d40] font-bold rounded-xl flex items-center justify-center gap-2 text-sm active:bg-[#004d40]/15 transition-colors"
                  >
                    <ShoppingCart size={16} />
                    Quick Sell
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

      {/* Quick Sell Modal */}
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
    </div>
  );
}
