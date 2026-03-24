"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import AuthScreen from "@/components/AuthScreen";
import ScanScreen from "@/components/ScanScreen";
import VerifiedResult from "@/components/VerifiedResult";
import InventoryList from "@/components/InventoryList";
import AlertsScreen from "@/components/AlertsScreen";
import ActivityLog from "@/components/ActivityLog";
import AddToStockModal from "@/components/AddToStockModal";
import Dashboard from "@/components/Dashboard";
import PinPadModal from "@/components/PinPadModal";
import { Drug, InventoryItem } from "@/lib/types";
import { getInventoryItems, getCachedDrug, cacheDrug } from "@/lib/store";
import { useOnlineStatus } from "@/lib/hooks";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Search, Package, AlertTriangle, History, LogOut, Home, Lock, ShoppingCart, Plus } from "lucide-react";

type View = "home" | "dashboard" | "verify" | "inventory" | "alerts" | "logs";

export default function HomePage() {
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

  const [view, setView] = useState<View>("home");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [verifiedDrug, setVerifiedDrug] = useState<Drug | null>(null);
  const [stockingDrug, setStockingDrug] = useState<Drug | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [isAdminVerified, setIsAdminVerified] = useState(false);
  const [pendingAdminView, setPendingAdminView] = useState<View | null>(null);
  const [pendingStockDrug, setPendingStockDrug] = useState<Drug | null>(null);
  
  const isOnline = useOnlineStatus();

  useEffect(() => {
    setMounted(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthed(!!session);
      if (session?.user) checkOnboardingStatus(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthed(!!session);
      if (event === "PASSWORD_RECOVERY") setAuthMode("update_password");
      if (session?.user) checkOnboardingStatus(session.user.id);
      else setIsOnboarded(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshInventory = useCallback(() => setInventory(getInventoryItems()), []);

  useEffect(() => {
    if (isAuthed === true) refreshInventory();
  }, [isAuthed, refreshInventory]);

  const handleVerify = async (regNo: string) => {
    setIsVerifying(true);
    setVerifyError("");
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
      cacheDrug(drug);
      setVerifiedDrug(drug);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setVerifyError("Taking longer than usual... Check your connection and try again.");
      } else if (!isOnline) {
        const cached = getCachedDrug(regNo);
        if (cached) setVerifiedDrug(cached);
        else setVerifyError("Not available offline. Try manual entry or check network.");
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
          setIsOnboarded(null);
          if (authMode === "update_password" || authMode === "onboarding") setAuthMode(undefined);
        }} 
      />
    );
  }

  const navigateTo = (newView: View) => {
    // Reset admin verification if navigating back to home (Mistake Proofing)
    if (newView === "home") {
      setIsAdminVerified(false);
    }

    const adminViews = ["dashboard", "alerts", "logs"];
    if (adminViews.includes(newView) && !isAdminVerified) {
      setPendingAdminView(newView);
      return;
    }
    setView(newView);
    refreshInventory();
  };

  const TopHeader = () => (
    <header className="md:hidden bg-white border-b border-trust-border px-6 py-4 flex items-center justify-between z-30 shadow-sm sticky top-0 h-16">
      <div className="flex items-center gap-3">
        {view !== "home" && (
          <button onClick={() => navigateTo("home")} className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-trust-text-secondary hover:bg-trust-surface transition-colors">
            {isAdminVerified ? <Lock size={20} className="text-warning" /> : <Home size={20} />}
          </button>
        )}
        <h1 className="text-heading-md font-bold text-trust-text tracking-tight uppercase">
          {view === "home" ? "KO-Mart" : view === "verify" ? "Scanner" : view === "logs" ? "Audit Log" : view === "dashboard" ? "Dashboard" : view}
        </h1>
      </div>
      <div className="flex gap-2">
        {!isAdminVerified && (
          <button 
            onClick={() => setPendingAdminView("dashboard")}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-trust-surface text-trust-text-muted hover:text-brand hover:bg-brand-50 transition-colors"
          >
            <Lock size={18} />
          </button>
        )}
        <button 
          onClick={() => {
            if (isAdminVerified) {
              setIsAdminVerified(false);
              setView("home");
            } else {
              supabase.auth.signOut().then(() => setIsAuthed(false));
            }
          }}
          className={cn(
            "px-4 h-9 rounded-badge flex items-center justify-center gap-2 transition-all font-bold text-[11px] uppercase tracking-wider",
            isAdminVerified ? "bg-warning/10 text-warning border border-warning/20" : "bg-trust-surface text-trust-text-muted"
          )}
        >
          {isAdminVerified ? (
            <>
              <Lock size={14} />
              Lock
            </>
          ) : (
            <>
              <LogOut size={14} />
              Out
            </>
          )}
        </button>
      </div>
    </header>
  );

  const SidebarItem = ({ id, icon: Icon, label, badge }: { id: View, icon: React.ElementType, label: string, badge?: number }) => {
    const active = view === id;
    return (
      <button
        onClick={() => navigateTo(id)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-button font-medium transition-all duration-200 ${
          active ? "bg-white/10 text-white font-bold" : "text-white/70 hover:bg-white/5 hover:text-white"
        }`}
      >
        <Icon size={20} className={active ? "text-white" : "text-white/60"} />
        <span>{label}</span>
        {badge !== undefined && badge > 0 && (
          <span className="ml-auto bg-warning text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </button>
    );
  };

  const MobileTab = ({ id, icon: Icon, label, badge }: { id: View, icon: React.ElementType, label: string, badge?: number }) => {
    const active = view === id;
    return (
      <button
        onClick={() => navigateTo(id)}
        className="relative flex flex-col items-center justify-center flex-1 h-full py-1 gap-1 touch-manipulation"
      >
        <div className={`relative flex items-center justify-center w-8 h-8 rounded-full mb-0.5 transition-colors duration-200 ${active ? "bg-brand/10 text-brand" : "text-trust-text-muted"}`}>
          <Icon size={20} className={active ? "text-brand" : "text-trust-text-muted"} />
          {badge !== undefined && badge > 0 && (
            <span className="absolute -top-1 -right-1 bg-danger text-white text-[9px] font-bold min-w-[15px] h-[15px] rounded-full flex items-center justify-center border-[1.5px] border-white z-10">
              {badge > 9 ? "9+" : badge}
            </span>
          )}
        </div>
        <span className={`text-[9px] font-bold uppercase tracking-wider transition-colors ${active ? "text-brand" : "text-trust-text-muted"}`}>
          {label}
        </span>
      </button>
    );
  };

  return (
    <div className="flex h-[100dvh] bg-trust-surface overflow-hidden w-full">
      {/* Desktop Sidebar Navigation (Hidden if not Admin) */}
      {isAdminVerified && (
        <div className="hidden md:flex flex-col w-64 bg-brand text-white shadow-elevated z-40 relative">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-tight">KO-Mart</h1>
            <button onClick={() => navigateTo("home")} className="text-white/40 hover:text-white group">
              <Lock size={16} className="group-hover:scale-110 transition-transform" />
            </button>
          </div>
          
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto hide-scrollbar">
            <SidebarItem id="home" icon={Home} label="Staff Area" />
            <div className="h-px bg-white/10 my-4" />
            <SidebarItem id="dashboard" icon={Home} label="Overview" />
            <SidebarItem id="verify" icon={Search} label="Find Product" />
            <SidebarItem id="inventory" icon={Package} label="Inventory" />
            <SidebarItem id="alerts" icon={AlertTriangle} label="Alerts" badge={alertCount} />
            <SidebarItem id="logs" icon={History} label="Activity Log" />
          </nav>

          <div className="p-4 border-t border-white/10 space-y-2">
            <button 
              onClick={() => navigateTo("home")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-button text-warning hover:bg-white/5 transition-all duration-200 font-bold text-sm"
            >
              <Lock size={18} />
              <span>EXIT ADMIN MODE</span>
            </button>
            <button 
              onClick={() => supabase.auth.signOut().then(() => setIsAuthed(false))}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-button text-white/50 hover:bg-white/5 hover:text-white transition-all duration-200 font-medium"
            >
              <LogOut size={20} className="text-white/40" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 w-full relative">
        {/* Mobile App Bar */}
        <TopHeader />

        {/* Content Wrapper */}
        <main className="flex-1 overflow-y-auto w-full relative pb-20 md:pb-0 hide-scrollbar">
          <AnimatePresence mode="wait">
            {view === "home" && (
              <motion.div key="home" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="min-h-full flex flex-col items-center justify-center p-6 md:p-12 gap-6 relative">
                {!isAdminVerified && (
                  <button onClick={() => setPendingAdminView("dashboard")} className="absolute top-6 right-6 md:top-8 md:right-8 w-12 h-12 bg-white rounded-full shadow-card flex items-center justify-center text-trust-text-muted hover:text-brand hover:bg-brand-50 transition-colors">
                    <Lock size={20} />
                  </button>
                )}
                
                <div className="text-center mb-6">
                  <h2 className="text-heading-xl font-bold text-trust-text mb-2">Welcome Back</h2>
                  <p className="text-label text-trust-text-secondary">What would you like to do?</p>
                </div>

                <div className="w-full max-w-sm flex flex-col gap-4">
                  <button onClick={() => navigateTo("inventory")} className="w-full h-32 bg-brand text-white rounded-[24px] shadow-metallic-hover hover:-translate-y-1 transition-all duration-200 flex flex-col items-center justify-center gap-3 overflow-hidden relative group">
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                    <ShoppingCart size={32} />
                    <span className="text-heading-md font-bold">Sell Product</span>
                  </button>

                  <button onClick={() => navigateTo("verify")} className="w-full h-32 bg-white border border-trust-border rounded-[24px] shadow-card-hover hover:-translate-y-1 text-brand transition-all duration-200 flex flex-col items-center justify-center gap-3">
                    <Plus size={32} />
                    <span className="text-heading-md font-bold">Add Stock</span>
                  </button>
                </div>
              </motion.div>
            )}

            {view === "dashboard" && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="min-h-full">
                <Dashboard 
                  onVerify={() => navigateTo("verify")}
                  onInventory={() => navigateTo("inventory")}
                  onAlerts={() => navigateTo("alerts")}
                  onLogs={() => navigateTo("logs")}
                  alertCount={alertCount} 
                />
              </motion.div>
            )}
            
            {view === "verify" && (
              <motion.div key="verify" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="min-h-full max-w-2xl mx-auto md:p-8">
                <ScanScreen onVerify={handleVerify} isLoading={isVerifying} errorMessage={verifyError} />
              </motion.div>
            )}

            {view === "inventory" && (
              <motion.div key="inventory" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="min-h-full">
                <InventoryList 
                  items={inventory} 
                  onAddNew={() => navigateTo("verify")} 
                  onRefresh={refreshInventory} 
                  isAdmin={isAdminVerified} 
                />
              </motion.div>
            )}

            {view === "alerts" && (
              <motion.div key="alerts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="min-h-full">
                <AlertsScreen items={inventory} />
              </motion.div>
            )}

            {view === "logs" && (
              <motion.div key="logs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="min-h-full">
                <ActivityLog />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
        
        {/* Mobile Bottom Navigation (Hidden if not Admin) */}
        {isAdminVerified && (
          <nav 
            className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-trust-border flex justify-around items-center h-16 pb-[env(safe-area-inset-bottom)] z-40 shadow-[0_-4px_24px_rgba(0,0,0,0.04)]"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0px)' }}
          >
            <MobileTab id="dashboard" icon={Home} label="Overview" />
            <MobileTab id="inventory" icon={Package} label="Stock" />
            <MobileTab id="verify" icon={Search} label="Search" />
            <MobileTab id="alerts" icon={AlertTriangle} label="Alerts" badge={alertCount} />
            <MobileTab id="logs" icon={History} label="Logs" />
          </nav>
        )}
      </div>

      <AnimatePresence>
        {verifiedDrug && (
          <VerifiedResult
            drug={verifiedDrug}
            onClose={() => { setVerifiedDrug(null); navigateTo("dashboard"); }}
            onAddStock={() => {
              if (!isAdminVerified) {
                setPendingStockDrug(verifiedDrug);
              } else {
                setStockingDrug(verifiedDrug);
                setVerifiedDrug(null);
                navigateTo("inventory");
              }
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {stockingDrug && (
          <AddToStockModal
            drug={stockingDrug}
            onClose={() => setStockingDrug(null)}
            onAdded={() => {
              setStockingDrug(null);
              refreshInventory();
              navigateTo("inventory");
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(pendingAdminView || pendingStockDrug) && (
          <PinPadModal
            onSuccess={() => {
               setIsAdminVerified(true);
               if (pendingAdminView) {
                 setView(pendingAdminView);
                 refreshInventory();
                 setPendingAdminView(null);
               }
               if (pendingStockDrug) {
                 setStockingDrug(pendingStockDrug);
                 setVerifiedDrug(null);
                 navigateTo("inventory");
                 setPendingStockDrug(null);
               }
            }}
            onCancel={() => {
               setPendingAdminView(null);
               setPendingStockDrug(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
