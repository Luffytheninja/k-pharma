"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Mail, Lock, Store, ArrowRight, Loader2, AlertCircle, User } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface AuthScreenProps {
  onSuccess: () => void;
  initialMode?: "login" | "signup" | "onboarding" | "forgot" | "update_password";
}

export default function AuthScreen({ onSuccess, initialMode = "login" }: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "signup" | "onboarding" | "forgot" | "update_password">(initialMode);
  
  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    }
  }, [initialMode]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pharmacyName, setPharmacyName] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleAuth = async () => {
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await checkOnboarding();
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setSuccessMsg("Reset link sent! Please check your email inbox.");
      } else if (mode === "update_password") {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setSuccessMsg("Password updated successfully! You can now log in.");
        setMode("login");
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.session) {
          setSuccessMsg("Account created! Please verify your email before logging in.");
          return;
        }
        setMode("onboarding");
      }
    } catch (e: any) {
      setError(e.message || "An authentication error occurred");
    } finally {
      setLoading(false);
    }
  };

  const checkOnboarding = async () => {
    const { data: { user }, error: uErr } = await supabase.auth.getUser();
    if (uErr) throw uErr;
    if (!user) {
      setError("No active session found. Please try logging in again.");
      return;
    }

    const { data: pharmacy, error: pErr } = await supabase
      .from("pharmacies")
      .select("*")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (pErr) throw pErr;

    if (pharmacy) {
      onSuccess();
    } else {
      setMode("onboarding");
    }
  };

  const handleRegisterStore = async () => {
    if (!username.trim()) {
      setError("Please enter your name / username");
      return;
    }
    if (!pharmacyName.trim()) {
      setError("Please enter a store name");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const { data: { user }, error: uErr } = await supabase.auth.getUser();
      if (uErr) throw uErr;
      if (!user) {
        throw new Error("Session expired. Please log in again.");
      }

      // 1. Sync Username to Auth Metadata
      await supabase.auth.updateUser({
        data: { display_name: username }
      });

      const { data: existing } = await supabase
        .from("pharmacies")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (existing) {
        onSuccess();
        return;
      }

      const { data: pharmacy, error: pErr } = await supabase
        .from("pharmacies")
        .insert([{ name: pharmacyName, owner_id: user.id }])
        .select()
        .single();

      if (pErr) throw pErr;

      const { error: bErr } = await supabase.from("branches").insert([{ 
        pharmacy_id: pharmacy.id, 
        name: "Main Branch" 
      }]);

      if (bErr) throw bErr;

      onSuccess();
    } catch (e: any) {
      console.error("Store Registration Error:", e);
      setError(e.message || "Failed to register store. Check your internet connection.");
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
          className="w-20 h-20 bg-[#0f172a] rounded-[28px] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-[#0f172a]/30"
        >
          <Shield size={36} className="text-white" />
        </motion.div>

        <h1 className="text-3xl font-black text-slate-800 text-center tracking-tight mb-2 uppercase">
          {mode === "onboarding" ? "Register Store" : mode === "forgot" ? "Reset Access" : mode === "update_password" ? "New Password" : "KO-Mart"}
        </h1>
        <p className="text-center text-sm font-medium text-slate-400 mb-8 px-4">
          {mode === "onboarding" ? "Welcome! Choose a name for your store." 
            : mode === "forgot" ? "We'll send you a secure link to your admin email." 
            : mode === "update_password" ? "Secure your account with a fresh password."
            : mode === "login" ? "Enter your admin credentials" : "Create a new store account"}
        </p>

        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {mode === "onboarding" ? (
              <motion.div key="onboarding" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
                <div className="relative">
                  <User className="absolute left-4 top-4 text-slate-400" size={20} />
                  <input
                    type="text"
                    placeholder="Your Full Name / Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full h-14 bg-white border border-slate-200 rounded-2xl pl-12 pr-4 font-bold text-slate-800 focus:ring-2 focus:ring-[#0f172a]/20 outline-none transition-all"
                  />
                </div>
                <div className="relative">
                  <Store className="absolute left-4 top-4 text-slate-400" size={20} />
                  <input
                    type="text"
                    placeholder="Store Name (e.g. KO-Mart Central)"
                    value={pharmacyName}
                    onChange={(e) => setPharmacyName(e.target.value)}
                    className="w-full h-14 bg-white border border-slate-200 rounded-2xl pl-12 pr-4 font-bold text-slate-800 focus:ring-2 focus:ring-[#0f172a]/20 outline-none transition-all"
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
                    disabled={mode === "update_password"}
                    className="w-full h-14 bg-white border border-slate-200 rounded-2xl pl-12 pr-4 font-bold text-slate-800 focus:ring-2 focus:ring-[#0f172a]/20 outline-none transition-all disabled:opacity-50"
                  />
                </div>
                {mode !== "forgot" && (
                  <div className="relative">
                    <Lock className="absolute left-4 top-4 text-slate-400" size={20} />
                    <input
                      type="password"
                      placeholder={mode === "update_password" ? "New Password" : "Password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-14 bg-white border border-slate-200 rounded-2xl pl-12 pr-4 font-bold text-slate-800 focus:ring-2 focus:ring-[#0f172a]/20 outline-none transition-all"
                    />
                  </div>
                )}
                {mode === "login" && (
                  <div className="text-right px-1">
                    <button 
                      onClick={() => { setMode("forgot"); setError(""); setSuccessMsg(""); }}
                      className="text-xs font-bold text-[#0f172a]/60 hover:text-[#0f172a]"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-xs font-bold bg-red-50 p-4 rounded-xl">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 text-green-600 text-xs font-bold bg-green-50 p-4 rounded-xl">
              <Shield size={14} />
              {successMsg}
            </div>
          )}

          <button
            onClick={mode === "onboarding" ? handleRegisterStore : handleAuth}
            disabled={loading}
            className="w-full h-14 bg-[#0f172a] text-white rounded-2xl font-black text-lg shadow-lg shadow-[#0f172a]/20 flex items-center justify-center gap-2 transform active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 size={24} className="animate-spin" /> : (
              <>
                {mode === "login" ? "Sign In" : mode === "signup" ? "Get Started" : mode === "forgot" ? "Send Reset Link" : "Update Password"}
                <ArrowRight size={20} />
              </>
            )}
          </button>

          {mode !== "onboarding" && mode !== "update_password" && (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setSuccessMsg(""); }}
                className="w-full py-2 text-sm font-bold text-slate-500 hover:text-[#0f172a] transition-colors"
              >
                {mode === "login" ? "Need a store account? Sign Up" : "Already have an account? Log In"}
              </button>
              {mode === "forgot" && (
                <button
                  onClick={() => { setMode("login"); setError(""); setSuccessMsg(""); }}
                  className="w-full py-2 text-xs font-black text-[#0f172a] uppercase tracking-wider"
                >
                  ← Back to Login
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
