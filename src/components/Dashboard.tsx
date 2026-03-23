"use client";

import { motion } from "framer-motion";
import { Search, Package, Bell, Wifi, WifiOff, History, ArrowRight, LogOut } from "lucide-react";
import { useOnlineStatus } from "@/lib/hooks";
import { supabase } from "@/lib/supabase";

interface DashboardProps {
  onVerify: () => void;
  onInventory: () => void;
  onAlerts: () => void;
  onLogs: () => void;
  onLogout: () => void;
  alertCount?: number;
}

export default function Dashboard({ onVerify, onInventory, onAlerts, onLogs, onLogout, alertCount = 0 }: DashboardProps) {
  const isOnline = useOnlineStatus();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f9fa] pb-10">
      {/* Header */}
      <header className="px-6 pt-14 pb-6 bg-[#004d40] text-white rounded-b-[40px] shadow-xl shadow-[#004d40]/20">
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="text-white/60 text-sm font-medium">{greeting}</p>
            <h1 className="text-3xl font-black tracking-tight leading-none">K-Pharma</h1>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button 
              onClick={handleLogout}
              className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white/60 hover:text-white"
            >
              <LogOut size={18} />
            </button>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
              isOnline ? "bg-white/15 text-white/80" : "bg-red-500/20 text-red-300"
            }`}>
              {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
              {isOnline ? "Online" : "Offline"}
            </div>
          </div>
        </div>
      </header>

      {/* Offline banner */}
      {!isOnline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="mx-6 mt-4 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold px-4 py-3 rounded-2xl flex items-center gap-2"
        >
          <WifiOff size={16} />
          Offline mode active — inventory and cached drugs available
        </motion.div>
      )}

      <div className="px-6 mt-8 flex flex-col gap-4 flex-1">
        {/* PRIMARY — Verify Drug (anchor feature) */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onVerify}
          className="w-full bg-[#004d40] text-white rounded-[28px] p-8 flex flex-col items-start gap-4 shadow-2xl shadow-[#004d40]/25 active:shadow-lg transition-all"
        >
          <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center">
            <Search size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight leading-none">Verify Product</h2>
            <p className="text-white/50 text-sm mt-1 font-medium">Enter NAFDAC registration number</p>
          </div>
        </motion.button>

        {/* SECONDARY ROW */}
        <div className="grid grid-cols-2 gap-4">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onInventory}
            className="bg-white border border-slate-100 rounded-[24px] p-5 flex flex-col items-start gap-3 shadow-sm"
          >
            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500">
              <Package size={22} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-700 leading-none">Inventory</h3>
              <p className="text-slate-400 text-xs mt-0.5 font-medium">Stock &amp; batches</p>
            </div>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onAlerts}
            className="relative bg-white border border-slate-100 rounded-[24px] p-5 flex flex-col items-start gap-3 shadow-sm overflow-hidden"
          >
            {alertCount > 0 && (
              <div className="absolute top-4 right-4 bg-[#ff8f00] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow">
                {alertCount > 9 ? "9+" : alertCount}
              </div>
            )}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${alertCount > 0 ? "bg-amber-50 text-[#ff8f00]" : "bg-slate-50 text-slate-400"}`}>
              <Bell size={22} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-700 leading-none">Alerts</h3>
              <p className="text-slate-400 text-xs mt-0.5 font-medium">
                {alertCount > 0 ? `${alertCount} need${alertCount === 1 ? "s" : ""} attention` : "All clear"}
              </p>
            </div>
          </motion.button>
        </div>

        {/* LOGS BUTTON - PRIORITY UTILITY */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onLogs}
          className="w-full bg-slate-800 text-white rounded-[24px] p-5 flex items-center justify-between shadow-lg shadow-slate-800/10 mt-2"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <History size={20} />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-black text-white leading-none">Activity Log</h3>
              <p className="text-white/40 text-[10px] mt-1 font-bold uppercase tracking-wider">Audit Trail &amp; Financials</p>
            </div>
          </div>
          <ArrowRight size={18} className="text-white/30" />
        </motion.button>
      </div>
    </div>
  );
}
