"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Mail, Lock, Store, ArrowRight, Loader2, AlertCircle, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { setPharmacyId, syncFromCloud, setStoredPin } from "@/lib/store";

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
  const [adminPin, setAdminPin] = useState("");
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
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "An authentication error occurred";
      setError(msg);
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
      setPharmacyId(pharmacy.id);
      await syncFromCloud();
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
    if (adminPin.length !== 4 || !/^\d+$/.test(adminPin)) {
      setError("Please enter a 4-digit Admin PIN");
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

      // Sync Username to Auth Metadata
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

      setPharmacyId(pharmacy.id);
      setStoredPin(adminPin);
      await syncFromCloud();
      onSuccess();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to register store. Check your internet connection.";
      console.error("Store Registration Error:", e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const headingText = () => {
    switch (mode) {
      case "onboarding": return "Set Up Store";
      case "forgot": return "Reset Access";
      case "update_password": return "New Password";
      default: return "KO-Mart";
    }
  };

  const subtitleText = () => {
    switch (mode) {
      case "onboarding": return "Welcome! Choose a name for your store.";
      case "forgot": return "We'll send a secure reset link to your email.";
      case "update_password": return "Secure your account with a fresh password.";
      case "login": return "Sign in to your store account";
      default: return "Create a new store account";
    }
  };

  return (
    <div className="fixed inset-0 bg-trust-surface flex flex-col items-center justify-center p-8 z-50 overflow-hidden">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-18 h-18 bg-brand rounded-[20px] flex items-center justify-center mx-auto mb-8 shadow-elevated relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/8 to-transparent" />
          <Shield size={32} className="text-white relative z-10" />
        </motion.div>

        {/* Title */}
        <h1 className="text-heading-xl font-bold text-trust-text text-center tracking-tight mb-2">
          {headingText()}
        </h1>
        <p className="text-center text-label font-medium text-trust-text-secondary mb-8 px-2">
          {subtitleText()}
        </p>

        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {mode === "onboarding" ? (
              <motion.div key="onboarding" initial={{ x: 16, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.2 }} className="space-y-4">
                {/* Username */}
                <div className="input-icon">
                  <User className="icon" size={20} />
                  <input
                    type="text"
                    placeholder="Your Full Name / Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: '48px' }}
                  />
                </div>
                {/* Store Name */}
                <div className="input-icon">
                  <Store className="icon" size={20} />
                  <input
                    type="text"
                    placeholder="Store Name (e.g. KO-Mart Central)"
                    value={pharmacyName}
                    onChange={(e) => setPharmacyName(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: '48px' }}
                  />
                </div>
                {/* Admin PIN */}
                <div className="input-icon">
                  <Lock className="icon" size={20} />
                  <input
                    type="password"
                    placeholder="Create 4-Digit Admin PIN"
                    value={adminPin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setAdminPin(val);
                    }}
                    maxLength={4}
                    pattern="[0-9]*"
                    inputMode="numeric"
                    className="input-field"
                    style={{ paddingLeft: '48px', letterSpacing: '4px', fontSize: '18px' }}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div key="auth" initial={{ x: -16, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.2 }} className="space-y-4">
                {/* Email */}
                <div className="input-icon">
                  <Mail className="icon" size={20} />
                  <input
                    type="email"
                    placeholder="Admin Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={mode === "update_password"}
                    className="input-field"
                    style={{ paddingLeft: '48px' }}
                  />
                </div>
                {/* Password */}
                {mode !== "forgot" && (
                  <div className="input-icon">
                    <Lock className="icon" size={20} />
                    <input
                      type="password"
                      placeholder={mode === "update_password" ? "New Password" : "Password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field"
                      style={{ paddingLeft: '48px' }}
                    />
                  </div>
                )}
                {mode === "login" && (
                  <div className="text-right px-1">
                    <button 
                      onClick={() => { setMode("forgot"); setError(""); setSuccessMsg(""); }}
                      className="text-label font-semibold text-trust-text-muted hover:text-brand transition-colors min-h-0"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 text-danger text-label font-semibold bg-danger-light p-4 rounded-card border border-danger-border">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          {/* Success */}
          {successMsg && (
            <div className="flex items-center gap-3 text-success text-label font-semibold bg-success-light p-4 rounded-card border border-success-border">
              <Shield size={16} className="shrink-0" />
              {successMsg}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={mode === "onboarding" ? handleRegisterStore : handleAuth}
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? <Loader2 size={22} className="animate-spin" /> : (
              <>
                {mode === "login" ? "Sign In" : mode === "signup" ? "Get Started" : mode === "forgot" ? "Send Reset Link" : mode === "onboarding" ? "Finish Setup" : "Update Password"}
                <ArrowRight size={18} />
              </>
            )}
          </button>

          {/* Mode Toggle */}
          {mode !== "onboarding" && mode !== "update_password" && (
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setSuccessMsg(""); }}
                className="btn-ghost w-full text-label"
              >
                {mode === "login" ? "Need a store account? Sign Up" : "Already have an account? Log In"}
              </button>
              {mode === "forgot" && (
                <button
                  onClick={() => { setMode("login"); setError(""); setSuccessMsg(""); }}
                  className="btn-ghost w-full text-label font-bold text-brand"
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
