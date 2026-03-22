"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Bell, Check, Trash2, Calendar, Package } from "lucide-react";
import { InventoryItem } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AlertsScreenProps {
  items: InventoryItem[];
  onBack: () => void;
}

export default function AlertsScreen({ items, onBack }: AlertsScreenProps) {
  const threshold = 10;
  const alerts = items.filter((i) => i.status !== "healthy");
  const expiring = alerts.filter((i) => i.status === "expiring");
  const lowStock = alerts.filter((i) => i.status === "low_stock");

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f9fa]">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 pt-14 pb-5 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">Alerts</h1>
            <p className="text-slate-400 text-xs font-medium">
              {alerts.length === 0 ? "All clear — nothing to review" : `${alerts.length} item${alerts.length !== 1 ? "s" : ""} need attention`}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 py-5 space-y-6">
        {alerts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center h-64 gap-4 text-slate-300"
          >
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
              <Check size={36} className="text-[#2e7d32]" />
            </div>
            <p className="font-bold text-slate-500 text-base">All clear</p>
            <p className="text-slate-400 text-sm text-center px-4">
              No drugs expiring soon.<br />No low stock warnings.
            </p>
          </motion.div>
        ) : (
          <>
            {/* Expiring Soon */}
            {expiring.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar size={16} className="text-red-500" />
                  <h2 className="text-xs font-black text-red-500 uppercase tracking-wider">Expiring Within 30 Days</h2>
                  <span className="ml-auto text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{expiring.length}</span>
                </div>
                <div className="space-y-3">
                  {expiring.map((item) => {
                    const days = Math.floor(
                      (new Date(item.nearest_expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                    );
                    return (
                      <AlertCard
                        key={item.drug_id}
                        title={item.drug_name}
                        subtitle={`${item.drug_reg_no} · ${item.total_quantity} units`}
                        flag={days <= 0 ? "Expired" : days === 1 ? "Expires tomorrow" : `${days} days left`}
                        flagClass="bg-red-50 text-red-600 border-red-100"
                        icon={<Calendar size={18} className="text-red-500" />}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Low Stock */}
            {lowStock.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Package size={16} className="text-amber-500" />
                  <h2 className="text-xs font-black text-amber-500 uppercase tracking-wider">Low Stock</h2>
                  <span className="ml-auto text-[10px] font-bold bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">{lowStock.length}</span>
                </div>
                <div className="space-y-3">
                  {lowStock.map((item) => (
                    <AlertCard
                      key={item.drug_id}
                      title={item.drug_name}
                      subtitle={item.drug_reg_no}
                      flag={`${item.total_quantity} units left`}
                      flagClass="bg-amber-50 text-amber-700 border-amber-100"
                      icon={<Package size={18} className="text-amber-500" />}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function AlertCard({ title, subtitle, flag, flagClass, icon }: {
  title: string;
  subtitle: string;
  flag: string;
  flagClass: string;
  icon: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-4"
    >
      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-extrabold text-slate-800 text-sm leading-tight truncate">{title}</h3>
        <p className="text-slate-400 text-xs font-medium mt-0.5 truncate">{subtitle}</p>
      </div>
      <span className={cn("text-[10px] font-black px-2.5 py-1.5 rounded-full border whitespace-nowrap", flagClass)}>
        {flag}
      </span>
    </motion.div>
  );
}
