"use client";

import { useState, useEffect, useMemo } from "react";
import { Package, TrendingUp, AlertTriangle, ArrowRight, DollarSign, ShoppingCart, ShieldCheck } from "lucide-react";
import { useOnlineStatus } from "@/lib/hooks";
import { supabase } from "@/lib/supabase";
import { getInventoryItems, getTransactions } from "@/lib/store";

interface DashboardProps {
  onVerify: () => void;
  onInventory: () => void;
  onAlerts: () => void;
  onLogs: () => void;
  alertCount?: number;
}

export default function Dashboard({ onVerify, onInventory, onAlerts, onLogs, alertCount = 0 }: DashboardProps) {
  const isOnline = useOnlineStatus();
  const [displayName, setDisplayName] = useState<string>("");
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.display_name) {
        setDisplayName(user.user_metadata.display_name);
      }
    });
  }, []);

  const inventory = useMemo(() => getInventoryItems(), []);
  const transactions = useMemo(() => getTransactions(), []);

  const metrics = useMemo(() => {
    const activeProducts = inventory.length;
    
    const today = new Date().toDateString();
    const todaySales = transactions.filter(t => 
      t.type === "sale" && new Date(t.sold_at).toDateString() === today
    );
    
    const salesCount = todaySales.length;
    const todayRevenue = todaySales.reduce((sum, t) => sum + (Math.abs(t.quantity) * (t.selling_price || 0)), 0);

    return { activeProducts, salesCount, todayRevenue };
  }, [inventory, transactions]);

  const recentTxs = useMemo(() => transactions.slice(0, 3), [transactions]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex flex-col min-h-screen bg-trust-surface p-4 md:p-8">
      
      {/* ── Welcome Header ── */}
      <div className="mb-6 md:mb-8">
        <p className="text-trust-text-secondary text-label-sm md:text-label font-medium">{greeting}{displayName ? `, ${displayName}` : ""}</p>
        <h1 className="text-heading-lg md:text-heading-xl font-bold tracking-tight text-trust-text mt-1">Store Overview</h1>
      </div>

      {!isOnline && (
        <div className="mb-8 bg-warning-light border border-warning-border text-warning text-label font-semibold px-5 py-4 rounded-card flex items-center gap-3">
          <AlertTriangle size={18} />
          Offline mode active — operating from local cache
        </div>
      )}

      {/* ── METRICS GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Metric 1 */}
        <div className="card-premium p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-full bg-brand-50 text-brand flex items-center justify-center">
              <Package size={22} />
            </div>
            {alertCount > 0 && (
              <span className="badge badge-warning flex items-center gap-1.5 cursor-pointer hover:bg-warning-light/80" onClick={onAlerts}>
                <AlertTriangle size={14} />
                {alertCount} Flagged
              </span>
            )}
          </div>
          <div>
            <h3 className="section-label">Active Products</h3>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-heading-xl font-bold text-trust-text">{metrics.activeProducts}</span>
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="card-premium p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-full bg-success-light text-success flex items-center justify-center border border-success-border">
              <TrendingUp size={22} />
            </div>
          </div>
          <div>
            <h3 className="section-label">Today&apos;s Sales</h3>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-heading-xl font-bold text-trust-text">{metrics.salesCount}</span>
              <span className="text-label text-trust-text-muted font-semibold">items sold</span>
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="card-premium p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-full bg-brand-50 text-brand flex items-center justify-center">
              <DollarSign size={22} />
            </div>
          </div>
          <div>
            <h3 className="section-label">Today&apos;s Revenue</h3>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-heading-xl font-bold text-trust-text">₦{metrics.todayRevenue.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── QUICK ACTIONS & RECENT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <div className="flex flex-col h-full">
          <h2 className="text-heading-md font-bold text-trust-text mb-3">Quick Actions</h2>
          <div className="bg-white border border-trust-border rounded-card p-5 md:p-6 flex flex-col gap-3 md:gap-4 shadow-sm flex-1 justify-center">
            <p className="text-trust-text-secondary text-xs md:text-label-sm mb-1">Update labels or record a retail sale.</p>
            <button
              onClick={onInventory}
              className="btn-primary w-full py-3.5 md:py-4 text-sm md:text-base"
            >
              <ShoppingCart size={18} className="mr-2" />
              Sell Stock (Retail)
            </button>
            <button
              onClick={onVerify}
              className="btn-secondary w-full py-3.5 md:py-4 text-sm md:text-base"
            >
              <ShieldCheck size={18} className="mr-2" />
              Add Stock (Bulk)
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-heading-md font-bold text-trust-text mb-4">Recent Activity</h2>
          <div className="bg-white border border-trust-border rounded-card shadow-sm overflow-hidden">
            <div className="divide-y divide-trust-border-subtle">
              {recentTxs.length === 0 ? (
                <div className="p-8 text-center">
                   <p className="text-label-sm text-trust-text-muted">No recent activity</p>
                </div>
              ) : (
                recentTxs.map((tx) => (
                  <div key={tx.id} className="p-4 px-6 hover:bg-trust-surface cursor-pointer select-none transition-colors flex justify-between items-center" onClick={onLogs}>
                    <div>
                      <p className="text-label font-bold text-trust-text">
                        {tx.type === "sale" ? "Sold" : tx.type === "restock" ? "Restocked" : "Adjusted"} {Math.abs(tx.quantity)}x {tx.drug_name}
                      </p>
                      <p className="text-label-sm text-trust-text-muted mt-0.5">
                        {new Date(tx.sold_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {tx.type === "sale" && tx.selling_price && (
                      <span className="text-label font-bold text-success">+₦{(Math.abs(tx.quantity) * tx.selling_price).toLocaleString()}</span>
                    )}
                  </div>
                ))
              )}
              {recentTxs.length > 0 && (
                <div className="p-4 px-6 bg-trust-surface/50 text-center text-label-sm font-semibold text-brand cursor-pointer hover:bg-brand-50 transition-colors" onClick={onLogs}>
                  View Full Audit Trail <ArrowRight size={14} className="inline ml-1" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
