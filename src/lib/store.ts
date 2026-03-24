// Local state store using localStorage for MVP
// In production this becomes IndexedDB + Supabase sync
import { InventoryBatch, Transaction, Drug } from "./types";
import { supabase } from "./supabase";

const KEYS = {
  PIN: "kp_pin",
  BATCHES: "kp_batches",
  TRANSACTIONS: "kp_transactions",
  DRUG_CACHE: "kp_drug_cache",
  PRO_MODE: "kp_pro_mode",
  LOW_STOCK_THRESHOLD: "kp_low_stock",
  PHARMACY_ID: "kp_pid",
};

const generateId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// ─── PHARMACY ─────────────────────────────────────────
export function getPharmacyId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEYS.PHARMACY_ID);
}

export function setPharmacyId(id: string) {
  localStorage.setItem(KEYS.PHARMACY_ID, id);
}

// ─── PIN ──────────────────────────────────────────────
export function getStoredPin(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEYS.PIN);
}

export function setStoredPin(pin: string) {
  // Simple hash: in production use bcrypt via API route
  const hashed = btoa(pin + "k-pharma-salt-v1");
  localStorage.setItem(KEYS.PIN, hashed);
}

export function verifyPin(pin: string): boolean {
  const stored = getStoredPin();
  if (!stored) return false;
  const hashed = btoa(pin + "k-pharma-salt-v1");
  return stored === hashed;
}

// ─── INVENTORY BATCHES ────────────────────────────────
export function getBatches(): InventoryBatch[] {
  if (typeof window === "undefined") return [];
  const pharmacyId = getPharmacyId();
  try {
    const raw = localStorage.getItem(KEYS.BATCHES);
    const data = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(data)) return [];
    // Only return batches for the current pharmacy
    return data.filter((b) => b && b.drug_id && (b.pharmacy_id === pharmacyId || (!b.pharmacy_id && !pharmacyId)));
  } catch {
    localStorage.removeItem(KEYS.BATCHES); 
    return [];
  }
}

export function saveBatches(batches: InventoryBatch[]) {
  try {
    localStorage.setItem(KEYS.BATCHES, JSON.stringify(batches));
  } catch (e) {
    console.error("Failed to save batches to local storage", e);
  }
}

export function addBatch(batch: Omit<InventoryBatch, "id" | "added_at" | "pharmacy_id">): InventoryBatch {
  const batches = getBatches();
  const cachedDrug = getCachedDrug(batch.drug_id);
  const pharmacyId = getPharmacyId();
  
  const newBatch: InventoryBatch = {
    ...batch,
    id: generateId(),
    pharmacy_id: pharmacyId || "local",
    added_at: new Date().toISOString(),
  };
  saveBatches([...batches, newBatch]);

  // Log as Restock
  logTransaction({
    inventory_id: newBatch.id,
    drug_name: batch.drug_name,
    quantity: batch.quantity,
    type: "restock",
    pharmacy_id: pharmacyId || "local",
    cost_price: cachedDrug?.cost_price,
    selling_price: cachedDrug?.selling_price,
    margin: cachedDrug?.selling_price && cachedDrug?.cost_price ? ((cachedDrug.selling_price - cachedDrug.cost_price) / cachedDrug.selling_price) * 100 : 0
  });

  syncToCloud().catch(() => {}); // Optimistic sync attempt
  return newBatch;
}

// FIFO sell: deducts from oldest batch first
export function sellFromInventory(drug_id: string, quantity: number): { success: boolean; remaining: number } {
  const batches = getBatches();
  const drugBatches = batches
    .filter((b) => b.drug_id === drug_id && b.quantity > 0)
    .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()); // oldest first

  const totalAvailable = drugBatches.reduce((sum, b) => sum + b.quantity, 0);
  if (quantity > totalAvailable) return { success: false, remaining: totalAvailable };

  const pharmacyId = getPharmacyId();
  let remaining = quantity;
  const updatedBatches = batches.map((b) => {
    if (b.drug_id !== drug_id || remaining === 0) return b;
    const deduct = Math.min(b.quantity, remaining);
    remaining -= deduct;
    return { ...b, quantity: b.quantity - deduct };
  });

  saveBatches(updatedBatches.filter((b) => b.quantity > 0)); // remove zero-quantity batches
  
  const cachedDrug = getCachedDrug(drug_id);
  logTransaction({
    inventory_id: drugBatches[0]?.id ?? "",
    drug_name: drugBatches[0]?.drug_name ?? "",
    quantity: -quantity, // Negative for sale
    type: "sale",
    pharmacy_id: pharmacyId || "local",
    cost_price: cachedDrug?.cost_price,
    selling_price: cachedDrug?.selling_price,
    margin: cachedDrug?.selling_price && cachedDrug?.cost_price ? ((cachedDrug.selling_price - cachedDrug.cost_price) / cachedDrug.selling_price) * 100 : 0
  });

  syncToCloud().catch(() => {}); // Optimistic sync attempt
  return { success: true, remaining: totalAvailable - quantity };
}

export function adjustStock(drug_id: string, quantity: number, reason: string): { success: boolean; remaining: number } {
  const batches = getBatches();
  const drugBatches = batches
    .filter((b) => b.drug_id === drug_id && b.quantity > 0)
    .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()); 

  const totalAvailable = drugBatches.reduce((sum, b) => sum + b.quantity, 0);
  if (quantity > totalAvailable) return { success: false, remaining: totalAvailable };

  const pharmacyId = getPharmacyId();
  let remaining = quantity;
  const updatedBatches = batches.map((b) => {
    if (b.drug_id !== drug_id || remaining === 0) return b;
    const deduct = Math.min(b.quantity, remaining);
    remaining -= deduct;
    return { ...b, quantity: b.quantity - deduct };
  });

  saveBatches(updatedBatches.filter((b) => b.quantity > 0));
  
  const cachedDrug = getCachedDrug(drug_id);
  logTransaction({
    inventory_id: drugBatches[0]?.id ?? "",
    drug_name: drugBatches[0]?.drug_name ?? "",
    quantity: -quantity,
    type: "adjustment",
    pharmacy_id: pharmacyId || "local",
    cost_price: cachedDrug?.cost_price,
    selling_price: 0, 
    margin: 0,
    reason: reason // Utilized the previously unused reason param
  });

  syncToCloud().catch(() => {}); 
  return { success: true, remaining: totalAvailable - quantity };
}

// ─── TRANSACTIONS ─────────────────────────────────────
export function getTransactions(): Transaction[] {
  if (typeof window === "undefined") return [];
  const pharmacyId = getPharmacyId();
  try {
    const raw = localStorage.getItem(KEYS.TRANSACTIONS);
    const data = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(data)) return [];
    // Only return transactions for the current pharmacy
    return data.filter(t => t.pharmacy_id === pharmacyId || (!t.pharmacy_id && !pharmacyId));
  } catch {
    localStorage.removeItem(KEYS.TRANSACTIONS);
    return [];
  }
}

export function logTransaction(data: Omit<Transaction, "id" | "sold_at">) {
  const tx: Transaction = {
    ...data,
    id: generateId(),
    sold_at: new Date().toISOString(),
  };
  const txs = getTransactions();
  localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify([tx, ...txs]));
}

// ─── DRUG CACHE ───────────────────────────────────────
export function getCachedDrugAll(): Drug[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEYS.DRUG_CACHE);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch {
    localStorage.removeItem(KEYS.DRUG_CACHE);
    return [];
  }
}

export function getCachedDrug(nafdac_number: string): Drug | null {
  const cache = getCachedDrugAll();
  return cache.find((d) => d.nafdac_number === nafdac_number) ?? null;
}

export function cacheDrug(drug: Drug) {
  const cache = getCachedDrugAll();
  const existing = cache.findIndex((d) => d.nafdac_number === drug.nafdac_number);
  if (existing >= 0) cache[existing] = drug;
  else cache.push(drug);
  try {
    localStorage.setItem(KEYS.DRUG_CACHE, JSON.stringify(cache));
  } catch (e) {
    console.error("Failed to save drug cache", e);
  }
  syncToCloud().catch(() => {});
}

// ─── SETTINGS ─────────────────────────────────────────
export function getProMode(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KEYS.PRO_MODE) === "true";
}

export function setProMode(value: boolean) {
  localStorage.setItem(KEYS.PRO_MODE, String(value));
}

export function getLowStockThreshold(): number {
  const raw = localStorage.getItem(KEYS.LOW_STOCK_THRESHOLD);
  return raw ? parseInt(raw, 10) : 10;
}
export function purgeAllAppData() {
  if (typeof window === "undefined") return;
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  window.location.reload();
}
// ─── DERIVED INVENTORY VIEW ───────────────────────────
import { InventoryItem } from "./types";

export function getInventoryItems(): InventoryItem[] {
  const batches = getBatches();
  const threshold = getLowStockThreshold();
  const grouped: Map<string, InventoryBatch[]> = new Map();
  const drugCache = getCachedDrugAll();

  for (const batch of batches) {
    if (!batch || !batch.drug_id) continue;
    if (!grouped.has(batch.drug_id)) grouped.set(batch.drug_id, []);
    grouped.get(batch.drug_id)!.push(batch);
  }

  const items: InventoryItem[] = [];
  for (const [drug_id, batchList] of grouped.entries()) {
    if (!batchList || batchList.length === 0) continue;
    const sortedBatches = [...batchList].sort(
      (a, b) => new Date(a.expiry_date || 0).getTime() - new Date(b.expiry_date || 0).getTime()
    );
    const totalQty = batchList.reduce((s, b) => s + b.quantity, 0);
    const nearestExpiry = sortedBatches[0].expiry_date;
    const daysToExpiry = Math.floor(
      (new Date(nearestExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    const cachedDrug = drugCache.find((d) => d.nafdac_number === drug_id);
    const reorderLevel = cachedDrug?.reorder_point ?? threshold;

    let status: InventoryItem["status"] = "healthy";
    if (daysToExpiry <= 30) status = "expiring";
    else if (totalQty <= reorderLevel) status = "low_stock";

    items.push({
      drug_id,
      drug_name: sortedBatches[0].drug_name,
      drug_reg_no: sortedBatches[0].drug_reg_no,
      total_quantity: totalQty,
      nearest_expiry: nearestExpiry,
      batches: sortedBatches,
      status,
      // Attached retail mechanics
      cost_price: cachedDrug?.cost_price,
      selling_price: cachedDrug?.selling_price,
      reorder_point: reorderLevel,
      avg_daily_usage: cachedDrug?.avg_daily_usage,
    });
  }

  return items;
}

// ─── OFFLINE SYNC ENGINE ──────────────────────────────
export async function syncToCloud() {
  if (typeof window === "undefined" || !navigator.onLine) return;
  const pharmacyId = getPharmacyId();
  if (!pharmacyId) return;

  try {
    const batches = getBatches().filter(b => b.pharmacy_id === pharmacyId);
    if (batches.length > 0) {
      await supabase.from("inventory_batches").upsert(batches, { onConflict: "id" });
    }

    const txs = getTransactions().filter(t => t.pharmacy_id === pharmacyId);
    if (txs.length > 0) {
      await supabase.from("transactions").upsert(txs, { onConflict: "id" });
    }

    const cache = getCachedDrugAll();
    if (cache.length > 0) {
      // Map Drug interface strictly to drugs_cache table schema
      const drugsToSync = cache.map((d) => ({
        nafdac_number: d.nafdac_number,
        name: String(d.name),
        manufacturer: String(d.manufacturer),
        status: String(d.status),
        composition: d.composition ? String(d.composition) : null,
        drug_class: d.drug_class ? String(d.drug_class) : null,
        oncology_notes: d.oncology_notes ? String(d.oncology_notes) : null,
      }));
      await supabase.from("drugs_cache").upsert(drugsToSync, { onConflict: "nafdac_number" });
    }
    console.log("[K-Pharma] Background sync complete ✅");
  } catch (err) {
    console.error("[K-Pharma] Sync failed:", err);
  }
}

export async function syncFromCloud() {
  if (typeof window === "undefined" || !navigator.onLine) return;
  const pharmacyId = getPharmacyId();
  if (!pharmacyId) return;

  try {
    const { data: batches } = await supabase
      .from("inventory_batches")
      .select("*")
      .eq("pharmacy_id", pharmacyId);
    
    if (batches) saveBatches(batches);

    const { data: txs } = await supabase
      .from("transactions")
      .select("*")
      .eq("pharmacy_id", pharmacyId);
    
    if (txs) {
      localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(txs));
    }
    
    console.log("[K-Pharma] Background pull complete ✅");
  } catch (err) {
    console.error("[K-Pharma] Pull failed:", err);
  }
}
