"use client";

import { useState } from "react";

import { motion } from "framer-motion";
import { Check, Calendar, Package } from "lucide-react";
import { InventoryItem } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AlertsScreenProps {
  items: InventoryItem[];
}

export default function AlertsScreen({ items }: AlertsScreenProps) {
  const [now] = useState(() => Date.now());
  const alerts = items.filter((i) => i.status !== "healthy");
  const expiring = alerts.filter((i) => i.status === "expiring");
  const lowStock = alerts.filter((i) => i.status === "low_stock");

  return (
    <div className="flex flex-col min-h-screen bg-trust-surface">


      <div className="flex-1 px-6 md:px-8 py-6 pb-28 space-y-7">
        {alerts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center justify-center h-64 gap-5 text-trust-text-faint"
          >
            <div className="w-18 h-18 bg-success-light rounded-full flex items-center justify-center border border-success-border">
              <Check size={32} className="text-success" />
            </div>
            <div className="text-center">
              <p className="font-bold text-body text-trust-text-secondary">All clear</p>
              <p className="text-trust-text-muted text-label mt-1 leading-relaxed">
                No products expiring soon.<br />No low stock warnings.
              </p>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Expiring Soon */}
            {expiring.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar size={16} className="text-danger" />
                  <h2 className="section-label text-danger">Expiring Within 30 Days</h2>
                  <span className="ml-auto badge badge-danger">{expiring.length}</span>
                </div>
                <div className="space-y-3">
                  {expiring.map((item) => {
                    const days = Math.floor(
                      (new Date(item.nearest_expiry).getTime() - now) / (1000 * 60 * 60 * 24)
                    );
                    return (
                      <AlertCard
                        key={item.drug_id}
                        title={item.drug_name}
                        subtitle={`${item.nafdac_number} · ${item.total_quantity} units`}
                        flag={days <= 0 ? "Expired" : days === 1 ? "Expires tomorrow" : `${days} days left`}
                        flagClass="badge-danger"
                        icon={<Calendar size={18} className="text-danger" />}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Low Stock */}
            {lowStock.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Package size={16} className="text-warning" />
                  <h2 className="section-label text-warning">Low Stock</h2>
                  <span className="ml-auto badge badge-warning">{lowStock.length}</span>
                </div>
                <div className="space-y-3">
                  {lowStock.map((item) => (
                    <AlertCard
                      key={item.drug_id}
                      title={item.drug_name}
                      subtitle={item.nafdac_number}
                      flag={`${item.total_quantity} units left`}
                      flagClass="badge-warning"
                      icon={<Package size={18} className="text-warning" />}
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="card p-5 flex items-center gap-4"
    >
      <div className="w-11 h-11 bg-trust-surface rounded-button flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-trust-text text-label leading-tight truncate">{title}</h3>
        <p className="text-trust-text-muted text-label font-medium mt-0.5 truncate">{subtitle}</p>
      </div>
      <span className={cn("badge whitespace-nowrap", flagClass)}>
        {flag}
      </span>
    </motion.div>
  );
}
