"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertTriangle, XCircle, Plus, FlaskConical, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Drug } from "@/lib/types";
import { getProMode } from "@/lib/store";

interface VerifiedResultProps {
  drug: Drug;
  onClose: () => void;
  onAddStock: () => void;
}

export default function VerifiedResult({ drug, onClose, onAddStock }: VerifiedResultProps) {
  const proMode = typeof window !== "undefined" ? getProMode() : false;

  const configs = {
    verified: {
      bg: "bg-brand",
      light: "bg-brand-50 border-brand-100",
      icon: <CheckCircle className="text-white" size={36} />,
      header: "Verified",
      subtext: "Safe for retail sale",
      textColor: "text-brand",
      badge: "badge-success",
    },
    caution: {
      bg: "bg-warning",
      light: "bg-warning-light border-warning-border",
      icon: <AlertTriangle className="text-white" size={36} />,
      header: "Caution",
      subtext: "Verify supply chain before sale",
      textColor: "text-warning",
      badge: "badge-warning",
    },
    not_found: {
      bg: "bg-danger",
      light: "bg-danger-light border-danger-border",
      icon: <XCircle className="text-white" size={36} />,
      header: "Not Verified",
      subtext: "Item not found in regulatory registry",
      textColor: "text-danger",
      badge: "badge-danger",
    },
  };

  const cfg = configs[drug.status];

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-end"
          onClick={onClose}
        />
      </AnimatePresence>

      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-modal shadow-elevated overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        {/* Status strip */}
        <div className={cn("p-8 flex flex-col items-center text-center relative", cfg.bg)}>
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-metallic-dark via-metallic-light to-metallic-dark opacity-40" />
          <div className="w-18 h-18 bg-white/15 rounded-full flex items-center justify-center mb-5">
            {cfg.icon}
          </div>
          <h2 className="text-heading-xl font-bold text-white uppercase tracking-tight leading-none">{cfg.header}</h2>
          <p className="text-white/65 text-label mt-2 font-medium">{cfg.subtext}</p>
        </div>

        <div className="p-7 flex flex-col gap-5">
          {/* Product details card */}
          {drug.name && drug.name !== "Unknown Drug" && (
            <div className={cn("card p-5", cfg.light)}>
              <h3 className="text-heading-md font-bold text-trust-text">{drug.name}</h3>
              <div className="grid grid-cols-2 gap-y-4 mt-4">
                <div>
                  <span className="section-label block mb-1">ID / Registration</span>
                  <span className="text-label font-mono font-bold text-trust-text-secondary">{drug.nafdac_number}</span>
                </div>
                <div>
                  <span className="section-label block mb-1">Manufacturer</span>
                  <span className="text-label font-bold text-trust-text-secondary text-right block">{drug.manufacturer}</span>
                </div>
              </div>
            </div>
          )}

          {/* Professional Mode extras */}
          {proMode && drug.status !== "not_found" && (drug.composition || drug.drug_class || drug.oncology_notes) && (
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <FlaskConical size={16} className="text-brand" />
                <span className="section-label text-brand">Product Deep-Scan</span>
              </div>
              {drug.composition && (
                <div className="mb-3">
                  <span className="section-label block mb-1">Specifications</span>
                  <p className="text-label text-trust-text-secondary font-medium">{drug.composition}</p>
                </div>
              )}
              {drug.drug_class && (
                <div className="mb-3">
                  <span className="section-label block mb-1">Category</span>
                  <p className="text-label text-trust-text-secondary font-medium">{drug.drug_class}</p>
                </div>
              )}
              {drug.oncology_notes && (
                <div className="bg-blue-50 rounded-card p-4 border border-blue-100 mt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Info size={14} className="text-blue-600" />
                    <span className="section-label text-blue-600">Product Info</span>
                  </div>
                  <p className="text-label text-blue-700 font-medium">{drug.oncology_notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 mt-1">
            {drug.status !== "not_found" && (
              <button
                onClick={onAddStock}
                className="btn-primary w-full"
              >
                <Plus size={20} />
                Add to Stock
              </button>
            )}
            <button
              onClick={onClose}
              className="btn-secondary w-full"
            >
              Done
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
