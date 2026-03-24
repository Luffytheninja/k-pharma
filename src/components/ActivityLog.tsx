"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, TrendingUp, TrendingDown, Search, Download, Trash2, Calendar } from "lucide-react";
import { getTransactions, purgeAllAppData } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function ActivityLog() {
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
      {/* Toolbar */}
      <div className="flex justify-between items-center px-6 md:px-8 pt-6 mb-6">
        <div className="flex flex-col">
          <h2 className="text-heading-md font-bold text-trust-text">Audit Trail</h2>
          <p className="text-label-sm text-trust-text-muted font-medium">{filtered.length} entries found</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="w-11 h-11 bg-white border border-trust-border rounded-button flex items-center justify-center text-brand hover:bg-brand-50 transition-colors duration-200 shadow-sm">
            <Download size={20} />
          </button>
          <button onClick={() => setShowConfirmReset(true)} className="w-11 h-11 bg-danger-light border border-danger-border rounded-button flex items-center justify-center text-danger hover:bg-danger/10 transition-colors duration-200 shadow-sm">
            <Trash2 size={20} />
          </button>
        </div>
      </div>

        {/* Quick Summary */}
        <div className="flex gap-4 overflow-x-auto hide-scrollbar -mx-2 px-6 md:px-8 mb-8 snap-x">
          <div className="relative overflow-hidden bg-brand text-white p-6 min-w-[200px] rounded-[24px] shadow-lg snap-start flex-1 border border-white/10">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-[0.15em] block mb-1">Total Revenue</span>
            <p className="text-heading-xl font-bold truncate tabular-nums">₦{stats.totalRevenue.toLocaleString()}</p>
          </div>
          
          <div className="card-premium p-6 min-w-[170px] snap-start flex-1 shadow-sm">
            <span className="section-label block mb-1">Sales count</span>
            <p className="text-heading-lg font-bold text-trust-text tabular-nums">{stats.salesCount}</p>
          </div>

          <div className="card-premium p-6 min-w-[170px] snap-start flex-1 shadow-sm">
            <span className="section-label block mb-1">Restocks</span>
            <p className="text-heading-lg font-bold text-trust-text tabular-nums">{stats.totalRestock}</p>
          </div>
        </div>

        <div className="px-4 md:px-8 mb-4">
          <div className="input-icon">
            <Search size={18} className="icon" />
            <input
              type="text"
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field shadow-sm !h-12 !bg-white"
              style={{ paddingLeft: '48px' }}
            />
          </div>
        </div>

      {/* List */}
      <div className="flex-1 px-4 md:px-8 pb-10 space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-trust-text-faint">
            <History size={44} />
            <p className="font-semibold text-label text-trust-text-muted">No activity recorded yet</p>
          </div>
        ) : (
          filtered.map((tx) => (
            <div key={tx.id} className="card p-4 flex items-center gap-3.5 md:gap-5">
              <div className={cn(
                "w-11 h-11 md:w-12 md:h-12 rounded-button flex items-center justify-center shrink-0 shadow-sm",
                tx.type === "sale" ? "bg-success-light text-success" : tx.type === "restock" ? "bg-blue-50 text-blue-600" : "bg-warning-light text-warning"
              )}>
                {tx.type === "sale" ? <TrendingDown size={20} /> : tx.type === "restock" ? <TrendingUp size={20} /> : <Search size={20} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-bold text-trust-text text-label md:text-body truncate leading-tight">{tx.drug_name}</h4>
                  <span className={cn(
                    "px-2 py-0.5 rounded-badge text-[10px] font-bold uppercase tracking-wider border shrink-0 ml-2",
                    tx.type === "sale" ? "bg-success/10 text-success border-success/20" : 
                    tx.type === "restock" ? "bg-blue-50 text-blue-600 border-blue-100" :
                    "bg-warning/10 text-warning border-warning/20"
                  )}>
                    {tx.type}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-label-sm md:text-label font-bold text-trust-text-secondary">
                    {tx.quantity > 0 ? "+" : ""}{tx.quantity} <span className="font-medium opacity-60">units</span>
                    {tx.selling_price && (
                      <span className="ml-1.5 opacity-80 tabular-nums">· ₦{(Math.abs(tx.quantity)*tx.selling_price).toLocaleString()}</span>
                    )}
                  </p>
                  <div className="flex items-center gap-1 text-[11px] text-trust-text-muted font-bold tabular-nums">
                    {new Date(tx.sold_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reset Confirmation */}
      <AnimatePresence>
        {showConfirmReset && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-10">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowConfirmReset(false)} />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[24px] p-6 md:p-8 w-full max-w-[360px] relative z-10 text-center shadow-2xl"
            >
              <div className="w-14 h-14 bg-danger-light border border-danger-border text-danger rounded-full flex items-center justify-center mx-auto mb-5">
                <Trash2 size={24} />
              </div>
              <h3 className="text-heading-lg font-bold text-trust-text mb-2">Factory Reset?</h3>
              <p className="text-trust-text-secondary text-label-sm font-medium mb-8 leading-relaxed">
                This will permanently delete all logs and settings for this store. This cannot be undone.
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={purgeAllAppData}
                  className="btn-danger w-full py-3.5"
                >
                  CLEAR EVERYTHING
                </button>
                <button 
                  onClick={() => setShowConfirmReset(false)}
                  className="btn-secondary w-full py-3.5"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
