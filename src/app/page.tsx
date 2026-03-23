"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import AuthScreen from "@/components/AuthScreen";
import Dashboard from "@/components/Dashboard";
import ScanScreen from "@/components/ScanScreen";
import VerifiedResult from "@/components/VerifiedResult";
import InventoryList from "@/components/InventoryList";
import AlertsScreen from "@/components/AlertsScreen";
import ActivityLog from "@/components/ActivityLog";
import AddToStockModal from "@/components/AddToStockModal"; // Ensure import is present
import { Drug, InventoryItem } from "@/lib/types";
import { getInventoryItems, getCachedDrug, cacheDrug } from "@/lib/store";
import { useOnlineStatus } from "@/lib/hooks";
import { supabase } from "@/lib/supabase";

type View = "dashboard" | "verify" | "inventory" | "alerts" | "logs";

export default function Home() {
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "update_password" | "onboarding" | undefined>(undefined);

  const checkOnboardingStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("pharmacies")
        .select("id")
        .eq("owner_id", userId)
        .maybeSingle();
      
      if (error) throw error;
      setIsOnboarded(!!data);
      if (!data) setAuthMode("onboarding");
    } catch (e) {
      console.error("Onboarding check failed:", e);
      setIsOnboarded(false);
      setAuthMode("onboarding");
    }
  };
  const [view, setView] = useState<View>("dashboard");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [verifiedDrug, setVerifiedDrug] = useState<Drug | null>(null);
  
  // Track adding stock globally
  const [stockingDrug, setStockingDrug] = useState<Drug | null>(null);

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const isOnline = useOnlineStatus();

  // DEEP DEBUG NET
  const [globalError, setGlobalError] = useState("");

  useEffect(() => {
    setMounted(true);
    
    // Auth Listener
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthed(!!session);
      if (session?.user) {
        checkOnboardingStatus(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthed(!!session);
      if (event === "PASSWORD_RECOVERY") {
        setAuthMode("update_password");
      }
      if (session?.user) {
        checkOnboardingStatus(session.user.id);
      } else {
        setIsOnboarded(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshInventory = useCallback(() => {
    setInventory(getInventoryItems());
  }, []);

  useEffect(() => {
    if (isAuthed === true) refreshInventory();
  }, [isAuthed, refreshInventory]);

  const handleVerify = async (regNo: string) => {
    setIsVerifying(true);
    setVerifyError("");

    // Check local cache first (offline support)
    const localCache = getCachedDrug(regNo);
    if (localCache && !isOnline) {
      setVerifiedDrug(localCache);
      setIsVerifying(false);
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nafdac_number: regNo }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      const drug: Drug = {
        nafdac_number: regNo,
        name: data.drug?.name ?? "Unknown",
        manufacturer: data.drug?.manufacturer ?? "",
        status: data.status as Drug["status"],
        composition: data.drug?.composition,
        drug_class: data.drug?.drug_class,
        oncology_notes: data.drug?.oncology_notes,
        cached_at: new Date().toISOString(),
      };

      // Cache locally
      cacheDrug(drug);
      setVerifiedDrug(drug);
    } catch (err: any) {
      if (err.name === "AbortError") {
        setVerifyError("Taking longer than usual… Check your connection and try again.");
      } else if (!isOnline) {
        const cached = getCachedDrug(regNo);
        if (cached) {
          setVerifiedDrug(cached);
        } else {
          setVerifyError("Not available offline. Try manual entry or check network.");
        }
      } else {
        setVerifyError("Verification failed. Please try again.");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const alertCount = inventory.filter((i) => i.status !== "healthy").length;

  if (!mounted) return null;

  if (isAuthed === false || (isAuthed === true && isOnboarded === false) || authMode === "update_password" || authMode === "onboarding") {
    return (
      <AuthScreen 
        initialMode={authMode || (isAuthed && !isOnboarded ? "onboarding" : "login")} 
        onSuccess={() => { 
          setIsAuthed(true); 
          setIsOnboarded(null); // Trigger re-check
          if (authMode === "update_password") setAuthMode(undefined);
          else if (authMode === "onboarding") setAuthMode(undefined);
        }} 
      />
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#f8f9fa]">
      <AnimatePresence mode="wait">
        {view === "dashboard" && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 overflow-y-auto"
          >
            <Dashboard
              onVerify={() => setView("verify")}
              onInventory={() => { refreshInventory(); setView("inventory"); }}
              onAlerts={() => { refreshInventory(); setView("alerts"); }}
              onLogs={() => { refreshInventory(); setView("logs"); }}
              onLogout={() => { setIsAuthed(false); setView("dashboard"); }}
              alertCount={alertCount}
            />
          </motion.div>
        )}

        {view === "logs" && (
          <motion.div
            key="logs"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="absolute inset-0 overflow-y-auto"
          >
            <ActivityLog onBack={() => setView("dashboard")} />
          </motion.div>
        )}

        {view === "verify" && (
          <motion.div
            key="verify"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="absolute inset-0"
          >
            <ScanScreen
              onBack={() => { setView("dashboard"); setVerifyError(""); }}
              onVerify={handleVerify}
              isLoading={isVerifying}
              errorMessage={verifyError}
            />
          </motion.div>
        )}

        {view === "inventory" && (
          <motion.div
            key="inventory"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="absolute inset-0 overflow-y-auto"
          >
            <InventoryList
              items={inventory}
              onAddNew={() => setView("verify")}
              onBack={() => setView("dashboard")}
              onRefresh={refreshInventory}
            />
          </motion.div>
        )}

        {view === "alerts" && (
          <motion.div
            key="alerts"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="absolute inset-0 overflow-y-auto"
          >
            <AlertsScreen
              items={inventory}
              onBack={() => setView("dashboard")}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drug result overlay — sits above everything */}
      <AnimatePresence>
        {verifiedDrug && (
          <VerifiedResult
            drug={verifiedDrug}
            onClose={() => { setVerifiedDrug(null); setView("dashboard"); }}
            onAddStock={() => {
              // Capture drug then hide Verified popup to surface the Stock modal exclusively
              setStockingDrug(verifiedDrug);
              setVerifiedDrug(null); 
              setView("inventory"); // Immediately transition layout away from the Camera verify screen
            }}
          />
        )}
      </AnimatePresence>

      {/* Add To Stock Overlay */}
      <AnimatePresence>
        {stockingDrug && (
          <AddToStockModal
            drug={stockingDrug}
            onClose={() => setStockingDrug(null)}
            onAdded={() => {
              setStockingDrug(null);
              refreshInventory();
              setView("inventory");
            }}
          />
        )}
      </AnimatePresence>

      {/* Global Error Net Overlay */}
      {globalError && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white p-6 shadow-2xl safe-top">
          <h3 className="font-bold text-lg mb-2">Caught Hidden Error!</h3>
          <p className="font-mono text-xs overflow-auto max-h-40">{globalError}</p>
          <button 
            onClick={() => setGlobalError("")}
            className="mt-4 px-4 py-2 bg-white text-red-600 font-bold rounded-lg text-sm"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
