"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Mail, Lock, Store, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface AuthScreenProps {
  onSuccess: () => void;
}

export default function AuthScreen({ onSuccess }: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "signup" | "onboarding">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pharmacyName, setPharmacyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAuth = async () => {
    setLoading(true);
    setError("");
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        checkOnboarding();
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMode("onboarding");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const checkOnboarding = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: pharmacy } = await supabase
      .from("pharmacies")
      .select("*")
      .eq("owner_id", user.id)
      .single();

    if (pharmacy) {
      onSuccess();
    } else {
      setMode("onboarding");
    }
  };

  const handleRegisterStore = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: pharmacy, error: pErr } = await supabase
        .from("pharmacies")
        .insert([{ name: pharmacyName, owner_id: user.id }])
        .select()
        .single();

      if (pErr) throw pErr;

      // Create initial branch
      await supabase.from("branches").insert([{ 
        pharmacy_id: pharmacy.id, 
        name: "Main Branch" 
      }]);

      onSuccess();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#f8f9fa] flex flex-col items-center justify-center p-8 z-50 overflow-hidden">
      <div className="w-full max-w-sm">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 bg-[#004d40] rounded-[28px] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-[#004d40]/30"
        >
          <Shield size={36} className="text-white" />
        </motion.div>

        <h1 className="text-3xl font-black text-slate-800 text-center tracking-tight mb-2 uppercase">
          {mode === "onboarding" ? "Register Store" : "K-Pharma"}
        </h1>
        <p className="text-center text-sm font-medium text-slate-400 mb-8 px-4">
          {mode === "onboarding" 
            ? "Welcome! Name your pharmacy to start your first branch." 
            : mode === "login" ? "Enter your admin credentials" : "Create a new pharmacy account"}
        </p>

        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {mode === "onboarding" ? (
              <motion.div key="onboarding" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                <div className="relative">
                  <Store className="absolute left-4 top-4 text-slate-400" size={20} />
                  <input
                    type="text"
                    placeholder="Pharmacy Name (e.g. K-Pharma Lagos)"
                    value={pharmacyName}
                    onChange={(e) => setPharmacyName(e.target.value)}
                    className="w-full h-14 bg-white border border-slate-200 rounded-2xl pl-12 pr-4 font-bold text-slate-800 focus:ring-2 focus:ring-[#004d40]/20 outline-none transition-all"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div key="auth" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-4 text-slate-400" size={20} />
                  <input
                    type="email"
                    placeholder="Admin Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-14 bg-white border border-slate-200 rounded-2xl pl-12 pr-4 font-bold text-slate-800 focus:ring-2 focus:ring-[#004d40]/20 outline-none transition-all"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-4 text-slate-400" size={20} />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-14 bg-white border border-slate-200 rounded-2xl pl-12 pr-4 font-bold text-slate-800 focus:ring-2 focus:ring-[#004d40]/20 outline-none transition-all"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-xs font-bold bg-red-50 p-4 rounded-xl">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <button
            onClick={mode === "onboarding" ? handleRegisterStore : handleAuth}
            disabled={loading}
            className="w-full h-14 bg-[#004d40] text-white rounded-2xl font-black text-lg shadow-lg shadow-[#004d40]/20 flex items-center justify-center gap-2 transform active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 size={24} className="animate-spin" /> : (
              <>
                {mode === "login" ? "Sign In" : mode === "signup" ? "Get Started" : "Launch Store"}
                <ArrowRight size={20} />
              </>
            )}
          </button>

          {mode !== "onboarding" && (
            <button
              onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
              className="w-full py-2 text-sm font-bold text-slate-500 hover:text-[#004d40] transition-colors"
            >
              {mode === "login" ? "Need a pharmacy account? Sign Up" : "Already have an account? Log In"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
