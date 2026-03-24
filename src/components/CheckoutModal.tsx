"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, X, Minus, Plus, Loader2, Trash2 } from "lucide-react";
import { InventoryItem } from "@/lib/types";
import { sellFromInventory } from "@/lib/store";

export interface CartItem {
  item: InventoryItem;
  qty: number;
}

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

  const total = cart.reduce((sum, c) => sum + (c.item.selling_price || 0) * c.qty, 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setLoading(true);
    setError("");
    
    try {
      // Process all items
      for (const cartItem of cart) {
        if (cartItem.qty > cartItem.item.total_quantity) {
          throw new Error(`Insufficient stock for ${cartItem.item.drug_name}. Available: ${cartItem.item.total_quantity}`);
        }
      }
      
      for (const cartItem of cart) {
        sellFromInventory(cartItem.item.drug_id, cartItem.qty);
      }
      
      onCompleted();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Checkout failed";
      setError(msg);
      setLoading(false);
    }
  };

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
            <h2 className="text-heading-md font-bold text-trust-text tracking-tight">Cart Checkout</h2>
            <p className="text-trust-text-muted text-label font-medium mt-0.5">{cart.length} item{cart.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} className="w-11 h-11 bg-trust-surface rounded-button flex items-center justify-center text-trust-text-secondary hover:bg-brand-50 transition-colors duration-200">
            <X size={20} />
          </button>
        </div>

        <div className="p-7 flex-1 overflow-y-auto space-y-4">
          {error && (
            <div className="bg-danger/10 border border-danger/20 text-danger p-4 rounded-card text-label font-semibold mb-2">
              {error}
            </div>
          )}

          {cart.length === 0 ? (
            <div className="py-12 text-center text-trust-text-muted">
              <ShoppingCart size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-body font-semibold">Your cart is empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((c) => (
                <div key={c.item.drug_id} className="flex items-center justify-between bg-trust-surface p-4 rounded-card border border-trust-border-subtle">
                  <div className="flex-1 mr-4">
                    <h3 className="font-bold text-trust-text leading-tight">{c.item.drug_name}</h3>
                    <p className="text-label-sm text-trust-text-secondary mt-1">₦{(c.item.selling_price || 0).toLocaleString()} each</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => onUpdateQty(c.item.drug_id, -1)}
                      className="w-8 h-8 rounded-full bg-white border border-trust-border flex items-center justify-center active:bg-trust-border-subtle"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="font-bold w-6 text-center">{c.qty}</span>
                    <button 
                      onClick={() => onUpdateQty(c.item.drug_id, 1)}
                      className="w-8 h-8 rounded-full bg-white border border-trust-border flex items-center justify-center active:bg-trust-border-subtle"
                    >
                      <Plus size={14} />
                    </button>
                    <button 
                      onClick={() => onRemove(c.item.drug_id)}
                      className="ml-2 w-8 h-8 rounded-full bg-danger/10 text-danger flex items-center justify-center"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-7 border-t border-trust-border bg-trust-surface/50">
          <div className="flex justify-between items-center mb-6">
            <span className="text-body font-semibold text-trust-text-secondary">Grand Total</span>
            <span className="text-heading-lg font-bold text-brand">₦{total.toLocaleString()}</span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={loading || cart.length === 0}
            className="btn-primary w-full shadow-button-lift h-14"
          >
            {loading ? <Loader2 size={24} className="animate-spin" /> : (
              <>
                <ShoppingCart size={24} />
                Complete Transaction
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
