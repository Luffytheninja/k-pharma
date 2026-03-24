"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, X, Minus, Plus, Loader2, Trash2, CreditCard, Banknote, Landmark, CheckCircle2, Share2 } from "lucide-react";
import { InventoryItem } from "@/lib/types";
import { sellFromInventory } from "@/lib/store";
import { cn } from "@/lib/utils";

export interface CartItem {
  item: InventoryItem;
  qty: number;
}

type PaymentMethod = "cash" | "pos" | "transfer";

interface CheckoutModalProps {
  cart: CartItem[];
  onUpdateQty: (drugId: string, delta: number) => void;
  onRemove: (drugId: string) => void;
  onClose: () => void;
  onCompleted: () => void;
}

export default function CheckoutModal({ cart, onUpdateQty, onRemove, onClose, onCompleted }: CheckoutModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<{ id: string; total: number; method: PaymentMethod } | null>(null);

  const total = cart.reduce((sum, c) => sum + (c.item.selling_price || 0) * c.qty, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    setError("");
    
    try {
      // Simulate slight delay for professional feel
      await new Promise(resolve => setTimeout(resolve, 800));

      for (const cartItem of cart) {
        if (cartItem.qty > cartItem.item.total_quantity) {
          throw new Error(`Insufficient stock for ${cartItem.item.drug_name}. Available: ${cartItem.item.total_quantity}`);
        }
      }
      
      for (const cartItem of cart) {
        sellFromInventory(cartItem.item.drug_id, cartItem.qty, paymentMethod);
      }

      const id = Math.random().toString(36).substring(2, 9).toUpperCase();
      setReceiptData({ id, total, method: paymentMethod });
      setShowReceipt(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Checkout failed";
      setError(msg);
      setLoading(false);
    }
  };

  const handleDone = () => {
    onCompleted();
    onClose();
  };

  const handleShare = () => {
    if (!receiptData) return;
    const itemsText = cart.map(c => `${c.qty}x ${c.item.drug_name} = ₦${((c.item.selling_price||0)*c.qty).toLocaleString()}`).join('\n');
    const text = `KO-MART RECEIPT\nID: ${receiptData.id}\nDate: ${new Date().toLocaleString()}\n\nItems:\n${itemsText}\n\nTOTAL: ₦${receiptData.total.toLocaleString()}\nMethod: ${receiptData.method.toUpperCase()}\n\nThank you!`;
    
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      alert("Receipt copied to clipboard!");
    }
  };

  if (showReceipt && receiptData) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-brand/40 backdrop-blur-md" />
        <motion.div
           initial={{ opacity: 0, scale: 0.9, y: 20 }}
           animate={{ opacity: 1, scale: 1, y: 0 }}
           className="relative bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-elevated"
        >
          <div className="bg-success text-white p-8 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-2xl font-bold">Sale Successful</h2>
            <p className="opacity-80 font-medium">Ref: {receiptData.id}</p>
          </div>

          <div className="p-8 space-y-6">
            <div className="space-y-3">
              <p className="section-label">Summary</p>
              <div className="space-y-2">
                {cart.map(c => (
                  <div key={c.item.drug_id} className="flex justify-between text-label">
                    <span className="text-trust-text-secondary truncate pr-4">{c.qty}x {c.item.drug_name}</span>
                    <span className="font-bold shrink-0">₦{((c.item.selling_price || 0) * c.qty).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="h-px bg-trust-border border-dashed border-t mt-4 pt-4 flex justify-between">
                <span className="font-bold text-trust-text">Total Paid</span>
                <span className="text-xl font-bold text-brand font-mono">₦{receiptData.total.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={handleShare} className="flex-1 btn-secondary h-12 rounded-2xl gap-2">
                <Share2 size={18} /> Share
              </button>
              <button onClick={handleDone} className="flex-1 btn-primary h-12 rounded-2xl">
                Done
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col md:items-center md:justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", damping: 32, stiffness: 350 }}
        className="relative mt-auto md:my-auto bg-white shadow-elevated w-full md:max-w-xl rounded-t-modal md:rounded-modal overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between p-7 pb-4 border-b border-trust-border">
          <div>
            <h2 className="text-heading-md font-bold text-trust-text tracking-tight uppercase">Checkout</h2>
            <p className="text-trust-text-muted text-label font-medium mt-0.5">{cart.length} item{cart.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} className="w-11 h-11 bg-trust-surface rounded-button flex items-center justify-center text-trust-text-secondary hover:bg-brand-50 transition-colors duration-200">
            <X size={20} />
          </button>
        </div>

        <div className="p-7 flex-1 overflow-y-auto space-y-7 hide-scrollbar">
          {error && (
            <div className="bg-danger/10 border border-danger/20 text-danger p-4 rounded-card text-label font-semibold mb-2 flex gap-3 items-center">
              <X className="shrink-0" size={18} />
              {error}
            </div>
          )}

          {cart.length === 0 ? (
            <div className="py-12 text-center text-trust-text-muted">
              <ShoppingCart size={48} className="mx-auto mb-4 opacity-10" />
              <p className="text-body font-semibold">Your cart is empty</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <p className="section-label">Selected Products</p>
                {cart.map((c) => (
                  <div key={c.item.drug_id} className="flex items-center justify-between bg-trust-surface p-4 rounded-card border border-trust-border-subtle group">
                    <div className="flex-1 mr-4 overflow-hidden">
                      <h3 className="font-bold text-trust-text leading-tight truncate">{c.item.drug_name}</h3>
                      <p className="text-label-sm text-trust-text-secondary mt-1">₦{(c.item.selling_price || 0).toLocaleString()} / unit</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-white rounded-xl border border-trust-border p-1">
                        <button 
                          onClick={() => onUpdateQty(c.item.drug_id, -1)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-trust-surface"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="font-bold w-8 text-center font-mono">{c.qty}</span>
                        <button 
                          onClick={() => onUpdateQty(c.item.drug_id, 1)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-trust-surface"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button 
                        onClick={() => onRemove(c.item.drug_id)}
                        className="w-10 h-10 rounded-xl bg-danger/5 text-danger flex items-center justify-center hover:bg-danger/10 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <p className="section-label">Payment Method</p>
                <div className="grid grid-cols-3 gap-3">
                  {(['cash', 'pos', 'transfer'] as const).map((method) => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-2 p-4 rounded-card border-2 transition-all font-bold uppercase text-[10px] tracking-widest",
                        paymentMethod === method 
                          ? "bg-brand/5 border-brand text-brand" 
                          : "bg-white border-trust-border text-trust-text-muted hover:border-trust-border-subtle"
                      )}
                    >
                      {method === 'cash' && <Banknote size={24} />}
                      {method === 'pos' && <CreditCard size={24} />}
                      {method === 'transfer' && <Landmark size={24} />}
                      {method}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-7 border-t border-trust-border bg-white shadow-[0_-8px_24px_rgba(0,0,0,0.04)]">
          <div className="flex justify-between items-center mb-6">
            <span className="text-body font-bold text-trust-text-secondary uppercase tracking-tight">Amount Due</span>
            <span className="text-3xl font-black text-brand font-mono">₦{total.toLocaleString()}</span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={loading || cart.length === 0}
            className="btn-primary w-full shadow-button-lift h-16 rounded-2xl gap-3 text-lg"
          >
            {loading ? <Loader2 size={24} className="animate-spin" /> : (
              <>
                <CheckCircle2 size={24} />
                CONFIRM PAYMENT
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

