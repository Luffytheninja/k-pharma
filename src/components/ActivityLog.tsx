"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, History, TrendingUp, TrendingDown, Search, Download, Trash2, Calendar } from "lucide-react";
import { getTransactions, purgeAllAppData } from "@/lib/store";
import { cn } from "@/lib/utils";

interface ActivityLogProps {
  onBack: () => void;
}

export default function ActivityLog({ onBack }: ActivityLogProps) {
  const allTxs = useMemo(() => getTransactions(), []);
  const [search, setSearch] = useState("");
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const filtered = allTxs.filter(t => 
    t.drug_name.toLowerCase().includes(search.toLowerCase()) ||
    t.type.toLowerCase().includes(search.toLowerCase())
  );

  const stats = useMemo(() => {
    let salesCount = 0;
    let totalRevenue = 0;
    let totalRestock = 0;

    allTxs.forEach(t => {
      if (t.type === "sale") {
        salesCount++;
        totalRevenue += (Math.abs(t.quantity) * (t.selling_price || 0));
      } else if (t.type === "restock") {
        totalRestock++;
      }
    });

    return { salesCount, totalRevenue, totalRestock };
  }, [allTxs]);

  const handleExport = () => {
    const csv = [
      ["Date", "Product", "Type", "Quantity", "Cost", "Sell", "Margin %"],
      ...allTxs.map(t => [
        new Date(t.sold_at).toLocaleString(),
        t.drug_name,
        t.type,
        t.quantity,
        t.cost_price || 0,
        t.selling_price || 0,
        t.margin ? t.margin.toFixed(2) : 0
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ko-mart-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="flex flex-col min-h-screen bg-trust-surface">
      {/* Header */}
      <div className="bg-white border-b border-trust-border px-7 pt-14 pb-6 sticky top-0 z-10 shadow-card">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="w-11 h-11 bg-trust-surface rounded-button flex items-center justify-center text-trust-text-secondary hover:bg-brand-50 transition-colors duration-200">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-heading-md font-bold text-trust-text tracking-tight">Activity Log</h1>
              <p className="text-trust-text-muted text-label font-medium mt-0.5">Audit Trail & Ledger</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExport} className="w-11 h-11 bg-trust-surface rounded-button flex items-center justify-center text-brand hover:bg-brand-50 transition-colors duration-200">
              <Download size={20} />
            </button>
            <button onClick={() => setShowConfirmReset(true)} className="w-11 h-11 bg-danger-light rounded-button flex items-center justify-center text-danger hover:bg-danger/10 transition-colors duration-200">
              <Trash2 size={20} />
            </button>
          </div>
        </div>

        {/* Quick Summary */}
        <div className="flex gap-3 overflow-x-auto hide-scrollbar -mx-2 px-2 mb-5">
          <div className="card-premium bg-brand text-white px-5 py-4 min-w-[150px] shadow-elevated" style={{ borderColor: 'transparent' }}>
            <span className="section-label text-white/60 block">Revenue (Logged)</span>
            <p className="text-body-lg font-bold mt-1">₦{stats.totalRevenue.toLocaleString()}</p>
          </div>
          <div className="card px-5 py-4 min-w-[130px]">
            <span className="section-label block">Total Sales</span>
            <p className="text-body-lg font-bold text-trust-text mt-1">{stats.salesCount}</p>
          </div>
          <div className="card px-5 py-4 min-w-[130px]">
            <span className="section-label block">Restocks</span>
            <p className="text-body-lg font-bold text-trust-text mt-1">{stats.totalRestock}</p>
          </div>
        </div>

        <div className="input-icon">
          <Search size={18} className="icon" />
          <input
            type="text"
            placeholder="Search log..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '48px', height: '48px' }}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 p-7 space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-trust-text-faint">
            <History size={44} />
            <p className="font-semibold text-label text-trust-text-muted">No activity recorded yet</p>
          </div>
        ) : (
          filtered.map((tx) => (
            <div key={tx.id} className="card p-5 flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-button flex items-center justify-center shrink-0",
                tx.type === "sale" ? "bg-success-light text-success" : "bg-blue-50 text-blue-600"
              )}>
                {tx.type === "sale" ? <TrendingDown size={22} /> : <TrendingUp size={22} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-trust-text text-label truncate">{tx.drug_name}</h4>
                  <span className={cn(
                    "badge ml-2",
                    tx.type === "sale" ? "badge-success" : "badge-neutral"
                  )}>
                    {tx.type}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-label font-semibold text-trust-text-secondary tracking-tight">
                    {tx.quantity > 0 ? "+" : ""}{tx.quantity} units 
                    {tx.selling_price && ` · ₦${(Math.abs(tx.quantity)*tx.selling_price).toLocaleString()}`}
                  </p>
                  <div className="flex items-center gap-1.5 text-label-sm text-trust-text-muted font-semibold">
                    <Calendar size={12} />
                    {new Date(tx.sold_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reset Confirmation */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-7">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowConfirmReset(false)} />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white rounded-modal p-8 w-full max-w-sm relative z-10 text-center shadow-elevated"
          >
            <div className="w-16 h-16 bg-danger-light border border-danger-border text-danger rounded-card flex items-center justify-center mx-auto mb-6">
              <Trash2 size={28} />
            </div>
            <h3 className="text-heading-lg font-bold text-trust-text mb-3">Factory Reset?</h3>
            <p className="text-trust-text-secondary text-label font-medium mb-8 leading-relaxed">
              This will permanently delete all inventory, logs, and settings. This cannot be undone.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={purgeAllAppData}
                className="btn-danger w-full"
              >
                CLEAR EVERYTHING
              </button>
              <button 
                onClick={() => setShowConfirmReset(false)}
                className="btn-secondary w-full"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
