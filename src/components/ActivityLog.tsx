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
    a.download = `k-pharma-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f9fa]">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 pt-14 pb-6 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">Activity Log</h1>
              <p className="text-slate-400 text-xs font-medium">Audit Trail &amp; Ledger</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExport} className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-[#004d40]">
              <Download size={20} />
            </button>
            <button onClick={() => setShowConfirmReset(true)} className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500">
              <Trash2 size={20} />
            </button>
          </div>
        </div>

        {/* Quick Summary */}
        <div className="flex gap-3 overflow-x-auto hide-scrollbar -mx-2 px-2">
          <div className="bg-[#004d40] text-white px-4 py-3 rounded-2xl min-w-[140px] shadow-lg shadow-[#004d40]/20">
            <span className="text-[9px] uppercase font-black text-white/60 tracking-wider">Revenue (Logged)</span>
            <p className="text-lg font-black mt-0.5">₦{stats.totalRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl min-w-[120px]">
            <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Total Sales</span>
            <p className="text-lg font-black text-slate-800 mt-0.5">{stats.salesCount}</p>
          </div>
          <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl min-w-[120px]">
            <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Restocks</span>
            <p className="text-lg font-black text-slate-800 mt-0.5">{stats.totalRestock}</p>
          </div>
        </div>

        <div className="mt-4 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
          <input
            type="text"
            placeholder="Search log..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 bg-slate-50 rounded-xl pl-10 pr-4 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#004d40]/10 border border-slate-100"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 p-6 space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-300">
            <History size={48} />
            <p className="font-bold text-sm">No activity recorded yet</p>
          </div>
        ) : (
          filtered.map((tx) => (
            <div key={tx.id} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                tx.type === "sale" ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"
              )}>
                {tx.type === "sale" ? <TrendingDown size={22} /> : <TrendingUp size={22} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h4 className="font-black text-slate-800 text-sm truncate">{tx.drug_name}</h4>
                  <span className={cn(
                    "text-[10px] font-black uppercase px-2 py-0.5 rounded-md",
                    tx.type === "sale" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                  )}>
                    {tx.type}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs font-bold text-slate-500 tracking-tight">
                    {tx.quantity > 0 ? "+" : ""}{tx.quantity} units 
                    {tx.selling_price && ` · ₦${(Math.abs(tx.quantity)*tx.selling_price).toLocaleString()}`}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                    <Calendar size={10} />
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowConfirmReset(false)} />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[32px] p-8 w-full max-w-sm relative z-10 text-center shadow-2xl"
          >
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2 font-display">Factory Reset?</h3>
            <p className="text-slate-500 text-sm font-medium mb-8">
              This will permanently delete all inventory, logs, and settings. This cannot be undone.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={purgeAllAppData}
                className="h-14 bg-red-500 text-white rounded-2xl font-black text-base shadow-lg shadow-red-500/30"
              >
                CLEAR EVERYTHING
              </button>
              <button 
                onClick={() => setShowConfirmReset(false)}
                className="h-14 bg-slate-100 text-slate-500 rounded-2xl font-bold text-base"
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
