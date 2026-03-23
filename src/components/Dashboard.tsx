"use client";

import { useState, useEffect } from "react";
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
  const [displayName, setDisplayName] = useState<string>("");
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.display_name) {
        setDisplayName(user.user_metadata.display_name);
      }
    });
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  return (
    <div className="flex flex-col min-h-screen bg-trust-surface pb-10">
      {/* ── Header ── */}
      <header className="px-7 pt-14 pb-8 bg-brand text-white rounded-b-[32px] shadow-elevated relative overflow-hidden">
        {/* Metallic trim at bottom edge */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-metallic-dark via-metallic-light to-metallic-dark opacity-30" />
        
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="text-white/60 text-label font-medium">{greeting}{displayName ? `, ${displayName}` : ""}</p>
            <h1 className="text-heading-xl font-bold tracking-tight leading-none mt-1">KO-Mart</h1>
          </div>
          <div className="flex flex-col items-end gap-3">
            <button 
              onClick={handleLogout}
              className="w-11 h-11 bg-white/10 rounded-button flex items-center justify-center text-white/60 hover:text-white hover:bg-white/15 transition-all duration-200"
            >
              <LogOut size={18} />
            </button>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-badge text-label-sm font-semibold ${
              isOnline ? "bg-white/12 text-white/75" : "bg-danger/20 text-red-300"
            }`}>
              {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
              {isOnline ? "Online" : "Offline"}
            </div>
          </div>
        </div>
      </header>

      {/* ── Offline Banner ── */}
      {!isOnline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="mx-7 mt-5 bg-warning-light border border-warning-border text-warning text-label font-semibold px-5 py-4 rounded-card flex items-center gap-3"
        >
          <WifiOff size={18} />
          Offline mode — local inventory and SKU cache available
        </motion.div>
      )}

      <div className="px-7 mt-8 flex flex-col gap-5 flex-1">
        {/* ── PRIMARY — Find Product (anchor feature) ── */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onVerify}
          className="card-premium w-full bg-brand text-white p-7 flex flex-col items-start gap-5 shadow-elevated active:shadow-card transition-all duration-200"
          style={{ borderColor: 'transparent' }}
        >
          <div className="w-14 h-14 bg-white/12 rounded-card flex items-center justify-center">
            <Search size={26} strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-heading-lg font-bold tracking-tight leading-none">Find Product</h2>
            <p className="text-white/55 text-label mt-2 font-medium">Search by Store SKU or Registration</p>
          </div>
        </motion.button>

        {/* ── SECONDARY ROW ── */}
        <div className="grid grid-cols-2 gap-4">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onInventory}
            className="card bg-white p-6 flex flex-col items-start gap-4 text-left"
          >
            <div className="w-12 h-12 bg-trust-surface rounded-button flex items-center justify-center text-trust-text-secondary">
              <Package size={22} />
            </div>
            <div>
              <h3 className="text-body font-bold text-trust-text leading-none">Inventory</h3>
              <p className="text-trust-text-muted text-label mt-1 font-medium">Stock & batches</p>
            </div>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onAlerts}
            className="card bg-white p-6 flex flex-col items-start gap-4 text-left relative overflow-hidden"
          >
            {alertCount > 0 && (
              <div className="absolute top-5 right-5 bg-warning text-white text-label-sm font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                {alertCount > 9 ? "9+" : alertCount}
              </div>
            )}
            <div className={`w-12 h-12 rounded-button flex items-center justify-center ${alertCount > 0 ? "bg-warning-light text-warning" : "bg-trust-surface text-trust-text-muted"}`}>
              <Bell size={22} />
            </div>
            <div>
              <h3 className="text-body font-bold text-trust-text leading-none">Alerts</h3>
              <p className="text-trust-text-muted text-label mt-1 font-medium">
                {alertCount > 0 ? `${alertCount} need${alertCount === 1 ? "s" : ""} attention` : "All clear"}
              </p>
            </div>
          </motion.button>
        </div>

        {/* ── ACTIVITY LOG ── */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onLogs}
          className="card-premium w-full bg-brand-dark text-white p-6 flex items-center justify-between mt-1"
          style={{ borderColor: 'transparent' }}
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-white/10 rounded-button flex items-center justify-center">
              <History size={20} />
            </div>
            <div className="text-left">
              <h3 className="text-label font-bold text-white leading-none">Activity Log</h3>
              <p className="text-white/40 text-label-sm mt-1 font-semibold uppercase tracking-wider">Audit Trail & Financials</p>
            </div>
          </div>
          <ArrowRight size={18} className="text-white/30" />
        </motion.button>
      </div>
    </div>
  );
}
