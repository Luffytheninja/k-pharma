# KO-Mart (K-Pharma PWA)

A premium, secure, and mobile-first Pharmaceutical Management Solution designed for retail pharmacies.

## Core Features

- **🛡️ Multi-Role Security**: Intelligent switching between **Staff Mode** (Retail) and **Manager Mode** (Admin).
- **🔒 PIN-Protected Audits**: Sensitive operations like activity logs, stock adjustments, and financial summaries are locked behind a secure PIN.
- **📱 Mobile-First UX**: Specifically optimized for high-density mobile displays and portrait/landscape tablet modes.
- **⚖️ Privacy Controls**: Cost prices are automatically hidden during retail sales to ensure wholesale data isn't exposed to customers.
- **🔍 Smart Verification**: NAFCAC-integrated product scanner and registry verification.
- **📢 Real-time Alerts**: Automated tracking for low stock and expiring items within 30 days.

## Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **Styling**: Tailwind CSS with custom Design Tokens (Glassmorphism, Neon/Metallic accents)
- **Database**: Supabase (PostgreSQL + Realtime)
- **Security**: Local PIN verification + Supabase Auth

## Development

1. Setup environment variables in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
2. Install dependencies: `npm install`
3. Run dev server: `npm run dev`

## Operations

### Staff Mode (Default)
- **Sell Product**: Record retail sales with simple unit pricing.
- **Add Stock**: Scan and verify new products into the local cache.

### Manager Mode (Enter PIN)
- **Overview**: Real-time revenue and sales tracking.
- **Inventory Control**: Bulk adjustments and cost-price tracking.
- **Audit Trail**: Full historical log of every transaction.
- **Lock**: Quick-lock functionality to return to Staff Mode instantly.

---
Designed with ❤️ for Advanced Pharmaceutical Retail.
