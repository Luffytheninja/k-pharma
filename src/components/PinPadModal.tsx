"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, X, Delete } from "lucide-react";
import { cn } from "@/lib/utils";

interface PinPadModalProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PinPadModal({ onSuccess, onCancel }: PinPadModalProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const correctPin = typeof window !== "undefined" ? localStorage.getItem("kpharma_admin_pin") || "0000" : "0000";

  const handlePress = (num: string) => {
    if (error) setError(false);
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) {
        if (newPin === correctPin) {
          onSuccess();
        } else {
          setError(true);
          setTimeout(() => setPin(""), 400);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onCancel}
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative bg-white rounded-[24px] shadow-2xl w-full max-w-[340px] overflow-hidden"
        >
          <div className="p-5 md:p-6 text-center border-b border-trust-border">
            <div className="w-10 h-10 bg-warning-light rounded-full flex items-center justify-center mx-auto mb-3">
              <ShieldAlert size={20} className="text-warning" />
            </div>
            <h2 className="text-heading-md font-bold text-trust-text mb-0.5 md:mb-1">Admin Access</h2>
            <p className="text-label-sm font-medium text-trust-text-secondary">Enter your 4-digit manager PIN</p>
          </div>

        <div className="p-6">
          {/* PIN Indicators */}
          <div className={cn("flex justify-center gap-4 mb-8", error && "animate-[shake_0.4s_ease-in-out]")}>
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-4 h-4 rounded-full transition-colors duration-200",
                  pin.length > i ? "bg-brand" : "bg-trust-border-subtle",
                  error && "bg-danger"
                )}
              />
            ))}
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
              <button
                key={num}
                onClick={() => handlePress(num)}
                className="w-16 h-16 rounded-full bg-trust-surface text-trust-text text-heading-md font-bold flex items-center justify-center hover:bg-brand-50 hover:text-brand active:scale-95 transition-all mx-auto"
              >
                {num}
              </button>
            ))}
            <button
              onClick={onCancel}
              className="w-16 h-16 rounded-full text-trust-text-muted hover:text-trust-text active:scale-95 transition-all text-label font-bold flex items-center justify-center mx-auto"
            >
              <X size={24} />
            </button>
            <button
              onClick={() => handlePress("0")}
              className="w-16 h-16 rounded-full bg-trust-surface text-trust-text text-heading-md font-bold flex items-center justify-center hover:bg-brand-50 hover:text-brand active:scale-95 transition-all mx-auto"
            >
              0
            </button>
            <button
              onClick={handleBackspace}
              className="w-16 h-16 rounded-full text-trust-text-muted hover:text-trust-text active:scale-95 transition-all flex items-center justify-center mx-auto"
            >
              <Delete size={24} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
