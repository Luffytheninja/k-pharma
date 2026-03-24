# KO-Mart (Premium Retail PWA)

A high-performance, secure, and offline-first Pharmaceutical & Retail Management Solution.

## Core Features

- **📶 True Offline Support**: Built with **Serwist** for advanced PWA caching. Work, scan, and sell even without an internet connection.
- **🛡️ Multi-Role Security**: Intelligent switching between **Staff Mode** (Sales) and **Manager Mode** (Admin) with **bcrypt-hashed PIN protection**.
- **💳 Financial Reconciliation**: Integrated tracking for **Cash**, **POS**, and **Bank Transfer** payments with real-time margin analysis.
- **📄 Digital Receipts**: Instant receipt generation with one-tap sharing (WhatsApp/Copy-to-Clipboard) for customers.
- **📱 Mobile-First UX**: Premium "Modern Trust" design system with glassmorphism and metallic accents, optimized for tablets and mobile.
- **🔍 Smart Verification**: NAFCAC-integrated product scanner and regulatory registry verification.
- **📢 Real-time Alerts**: Automated tracking for low stock and expiring items within 30 days.

## Tech Stack

- **Framework**: Next.js 16+ (App Router, Webpack-optimized)
- **Offline**: Serwist (@serwist/next)
- **Styling**: Tailwind CSS + CSS Variable Design Tokens
- **Database**: Supabase (PostgreSQL + Realtime)
- **Security**: Local PIN verification (bcryptjs) + Supabase Auth

## Development

1. Setup environment variables in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   NAFDAC_API_KEY=...
   ```
2. Install dependencies: `npm install`
3. Database Setup: Run the `supabase_schema_upgrade.sql` in the Supabase SQL Editor to align your backend with the current scaling.
4. Run dev server: `npm run dev`

## Operations

### Staff Mode (Default)
- **Sell Product**: Record retail sales with triple-payment options.
- **Receipts**: Generate and share customer transaction summaries.
- **Add Stock**: Scan and verify new products into the local cache.

### Manager Mode (Enter PIN)
- **Overview**: Real-time revenue, sales tracking, and profitability analysis.
- **Inventory Control**: Bulk adjustments, cost-price tracking, and reorder threshold management.
- **Audit Trail**: Full historical log of every transaction.

---
Designed with ❤️ for Scalable African Retail.
