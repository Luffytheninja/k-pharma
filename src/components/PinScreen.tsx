"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, AlertCircle, Delete } from "lucide-react";
import { cn } from "@/lib/utils";
import { getStoredPin, setStoredPin, verifyPin } from "@/lib/store";

interface PinScreenProps {
  onSuccess: () => void;
}

export default function PinScreen({ onSuccess }: PinScreenProps) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupStep, setSetupStep] = useState<"set" | "confirm">("set");
  const [attempts, setAttempts] = useState(0);
  const [lockout, setLockout] = useState(0);
  const [isError, setIsError] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = getStoredPin();
    if (!stored) setIsSettingUp(true);
  }, []);

  useEffect(() => {
    if (lockout > 0) {
      const timer = setInterval(() => setLockout((p) => p - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [lockout]);

  const handleKeyPress = (num: string) => {
    if (lockout > 0) return;
    const current = isSettingUp && setupStep === "confirm" ? confirmPin : pin;
    if (current.length >= 4) return;

    const newVal = current + num;
    if (isSettingUp && setupStep === "confirm") {
      setConfirmPin(newVal);
      if (newVal.length === 4) handleSetupConfirm(newVal);
    } else {
      setPin(newVal);
      if (newVal.length === 4) {
        if (isSettingUp) {
          // Move to confirm step
          setTimeout(() => {
            setSetupStep("confirm");
          }, 200);
        } else {
          handleLogin(newVal);
        }
      }
    }
  };

  const handleBackspace = () => {
    if (isSettingUp && setupStep === "confirm") {
      setConfirmPin((p) => p.slice(0, -1));
    } else {
      setPin((p) => p.slice(0, -1));
    }
  };

  const handleLogin = (finalPin: string) => {
    if (verifyPin(finalPin)) {
      onSuccess();
    } else {
      triggerError();
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setPin("");
      if (newAttempts >= 3) {
        setLockout(30);
        setAttempts(0);
      }
    }
  };

  const handleSetupConfirm = (finalConfirm: string) => {
    if (finalConfirm === pin) {
      setStoredPin(pin);
      onSuccess();
    } else {
      triggerError();
      setConfirmPin("");
      setSetupStep("set");
      setPin("");
    }
  };

  const triggerError = () => {
    setIsError(true);
    setTimeout(() => setIsError(false), 600);
  };

  const currentPin = isSettingUp && setupStep === "confirm" ? confirmPin : pin;

  const subtitle = lockout > 0
    ? `Too many attempts. Wait ${lockout}s`
    : isSettingUp
      ? setupStep === "set"
        ? "Create your 4-digit PIN to secure the app"
        : "Re-enter PIN to confirm"
      : "Enter your PIN to continue";

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 bg-[#f8f9fa] flex flex-col items-center justify-between p-8 z-50 overflow-hidden">
      {/* Top half */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="w-20 h-20 bg-[#004d40] rounded-[28px] flex items-center justify-center mb-8 shadow-xl shadow-[#004d40]/30"
        >
          <Shield size={36} className="text-white" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h1 className="text-3xl font-black text-slate-800 text-center tracking-tight mb-2">K-Pharma</h1>
          <p className={cn(
            "text-center text-sm font-medium transition-colors",
            lockout > 0 ? "text-red-500" : isError ? "text-red-400" : "text-slate-400"
          )}>
            {subtitle}
          </p>
        </motion.div>

        {/* PIN dots */}
        <div className="flex gap-5 mt-10">
          {[0, 1, 2, 3].map((idx) => (
            <motion.div
              key={idx}
              animate={isError ? { x: [0, -8, 8, -8, 8, 0], transition: { duration: 0.4 } } : {}}
              className={cn(
                "w-4 h-4 rounded-full border-2 transition-all duration-150",
                currentPin.length > idx
                  ? isError
                    ? "bg-red-500 border-red-500"
                    : "bg-[#004d40] border-[#004d40] scale-110"
                  : "border-slate-300 bg-transparent"
              )}
            />
          ))}
        </div>

        {isSettingUp && (
          <div className="flex gap-2 mt-6">
            {["set", "confirm"].map((step, i) => (
              <div
                key={step}
                className={cn(
                  "h-1 w-8 rounded-full transition-all duration-300",
                  setupStep === step ? "bg-[#004d40]" : i === 0 && setupStep === "confirm" ? "bg-[#004d40]/40" : "bg-slate-200"
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Keypad */}
      <div className="w-full max-w-[320px] mb-4">
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <motion.button
              key={num}
              whileTap={{ scale: 0.92, backgroundColor: "#e2e8f0" }}
              onClick={() => handleKeyPress(num.toString())}
              disabled={lockout > 0}
              className="h-[72px] rounded-2xl bg-white border border-slate-100 shadow-sm text-2xl font-bold text-slate-700 flex items-center justify-center disabled:opacity-40"
            >
              {num}
            </motion.button>
          ))}
          {/* Empty spacer */}
          <div />
          <motion.button
            whileTap={{ scale: 0.92, backgroundColor: "#e2e8f0" }}
            onClick={() => handleKeyPress("0")}
            disabled={lockout > 0}
            className="h-[72px] rounded-2xl bg-white border border-slate-100 shadow-sm text-2xl font-bold text-slate-700 flex items-center justify-center disabled:opacity-40"
          >
            0
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleBackspace}
            className="h-[72px] rounded-2xl flex items-center justify-center text-slate-400"
          >
            <Delete size={24} />
          </motion.button>
        </div>

        {isSettingUp && setupStep === "confirm" && (
          <button
            onClick={() => { setSetupStep("set"); setPin(""); setConfirmPin(""); }}
            className="w-full mt-4 text-center text-sm text-[#004d40] font-semibold py-2"
          >
            ← Back to set PIN
          </button>
        )}
      </div>
    </div>
  );
}
