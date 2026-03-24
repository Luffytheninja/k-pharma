// Shared type definitions for K-Pharma

export interface Drug {
  id?: string;
  nafdac_number: string;
  name: string;
  manufacturer: string;
  category?: string;
  composition?: string;
  drug_class?: string;
  oncology_notes?: string;
  status: "verified" | "caution" | "not_found";
  cached_at?: string;
  
  // Retail
  cost_price?: number;
  selling_price?: number;
  reorder_point?: number;
  avg_daily_usage?: number;
}

export interface InventoryBatch {
  id: string;
  pharmacy_id: string;
  drug_id: string;
  drug_name: string;
  drug_reg_no: string;
  quantity: number;
  expiry_date: string; // ISO date
  added_at: string;
}

export interface Transaction {
  id: string;
  pharmacy_id: string;
  inventory_id: string;
  drug_name: string;
  quantity: number; // Positive for restock, negative for sale
  type: "sale" | "restock" | "adjustment";
  cost_price?: number;
  selling_price?: number;
  margin?: number;
  reason?: string;
  sold_at: string;
}

export interface Pharmacy {
  id: string;
  name: string;
  owner_id: string; // Supabase UID
  created_at: string;
}

export interface Branch {
  id: string;
  pharmacy_id: string;
  name: string;
  location?: string;
}

export interface Alert {
  id: string;
  type: "expiring" | "low_stock";
  drug_name: string;
  inventory_id: string;
  message: string;
  dismissed: boolean;
}

// Derived for display — groups batches by drug
export interface InventoryItem {
  drug_id: string;
  drug_name: string;
  drug_reg_no: string;
  total_quantity: number;
  nearest_expiry: string;
  batches: InventoryBatch[];
  status: "healthy" | "expiring" | "low_stock";
  
  // Expanded for retail views
  cost_price?: number;
  selling_price?: number;
  reorder_point?: number;
  avg_daily_usage?: number;
}
