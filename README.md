# 🛍️ ApnaBazar — Digitize Your Store

**AI-powered digitization platform for local clothing sellers.** Upload photos of your products, let AI extract titles, descriptions, prices & categories, and instantly get a shareable online storefront.

> Built for the hackathon — empowering small retailers to go digital in under 2 minutes.

Public URL - https://apna-bazar-cs.vercel.app

---

## ✨ Features

| Feature | Description |
|---|---|
| **AI Product Digitization** | Upload product images → **Automatic frontend compression to ~100KB** → Gemini 2.5 Flash extracts title, description, price, category & tags with robust error handling |
| **Seller Dashboard** | Manage your catalog, view analytics, edit products, and customize your store |
| **Instant Storefront** | Every seller gets a public `/store/:slug` page — share it via WhatsApp, Instagram, anywhere |
| **WhatsApp Buyer Contact** | Buyers can reach the seller directly from the storefront with a product-specific WhatsApp message |
| **Multi-language Support** | Full i18n for **English**, **Hindi (हिन्दी)**, and **Telugu (తెలుగు)** |
| **Auth & Security** | Email/password authentication with protected routes via Supabase Auth |
| **Store Customization** | Set store name, description, location, phone, and a unique slug |
| **Responsive Design** | Mobile-first UI with dark mode support |

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Build Tool** | [Vite 5](https://vitejs.dev/) |
| **Styling** | [Tailwind CSS 3](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| **Backend / BaaS** | [Supabase](https://supabase.com/) — Auth, PostgreSQL DB, Edge Functions, Storage |
| **AI** | Google Gemini 2.5 Flash (via Supabase Edge Function) |
| **Routing** | [React Router v6](https://reactrouter.com/) |
| **State & Data** | [TanStack React Query](https://tanstack.com/query) |
| **Charts** | [Recharts](https://recharts.org/) |
| **Forms** | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) validation |
| **Testing** | [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/) |

---

## 📁 Project Structure

```
hackathon-cs/
├── public/                     # Static assets
├── src/
│   ├── components/
│   │   ├── ui/                 # shadcn/ui primitives (button, dialog, toast, etc.)
│   │   ├── BuyerAuthModal.tsx  # Buyer login modal on storefront
│   │   ├── LanguageSwitcher.tsx# Language toggle (EN / HI / TE)
│   │   ├── OrderConfirmation.tsx
│   │   ├── ProductCard.tsx     # Product display card
│   │   ├── StoreSettings.tsx   # Seller store settings form
│   │   ├── StoreSetup.tsx      # Initial store setup wizard
│   │   └── UploadZone.tsx      # Drag-and-drop image upload with AI processing
│   ├── hooks/
│   │   ├── useAuth.tsx         # Authentication hook (Supabase)
│   │   ├── useSeller.tsx       # Seller data & products hook
│   │   ├── use-toast.ts        # Toast notification hook
│   │   └── use-mobile.tsx      # Mobile breakpoint hook
│   ├── i18n/
│   │   ├── LanguageContext.tsx  # React context for language state
│   │   └── translations.ts     # EN / HI / TE translation strings
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts       # Supabase client init
│   │       └── types.ts        # Auto-generated DB types
│   ├── lib/
│   │   ├── supabase.ts         # Supabase helper
│   │   └── utils.ts            # Utility functions (cn, etc.)
│   ├── pages/
│   │   ├── Index.tsx           # Landing page
│   │   ├── Auth.tsx            # Login / Sign-up page
│   │   ├── Dashboard.tsx       # Seller dashboard (protected)
│   │   ├── Storefront.tsx      # Public store page (/store/:slug)
│   │   └── NotFound.tsx        # 404 page
│   ├── test/                   # Test setup & example tests
│   ├── App.tsx                 # Root app with routing & providers
│   ├── main.tsx                # Entry point
│   └── index.css               # Global styles & Tailwind directives
├── supabase/
│   ├── functions/
│   │   └── digitize/           # Edge function — AI image analysis
│   │       └── index.ts
│   ├── migrations/             # SQL migrations for DB schema
│   └── config.toml             # Supabase project config
├── index.html                  # HTML entry point
├── package.json
├── tailwind.config.ts
├── vite.config.ts
├── vitest.config.ts
├── tsconfig.json
└── .env                        # Environment variables (not committed)
```

---

## 🗄️ Database Schema

Three core tables in Supabase PostgreSQL:

| Table | Description | Key Columns |
|---|---|---|
| `sellers` | Seller profiles | `user_id`, `store_name`, `store_slug`, `location`, `phone`, `store_description`, `contact_number`, `store_number`, `maps_url` |
| `products` | Product catalog | `seller_id`, `title`, `description`, `price`, `category`, `tags`, `image_url` |
| `files` | Uploaded file records | `seller_id`, `file_url`, `file_type`, `status` |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18 — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- **npm** (comes with Node.js) or **bun**
- A **Supabase** project (for auth, database, storage & edge functions)

### 1. Clone the repository

```bash
git clone <YOUR_GIT_URL>
cd hackathon-cs
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

### 4. Start the development server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build |
| `npm run build:dev` | Development build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests with Vitest |
| `npm run test:watch` | Run tests in watch mode |

---

## 🌐 Routes

| Path | Page | Access |
|---|---|---|
| `/` | Landing page | Public |
| `/auth` | Login / Sign-up | Public |
| `/dashboard` | Seller dashboard | 🔒 Protected (requires auth) |
| `/store/:slug` | Public storefront | Public |
| `*` | 404 Not Found | Public |

---

## 🛍️ Storefront Buyer Flow

The current buyer flow on the public storefront is:

1. Browse products on `/store/:slug`
2. See a temporary `Coming Soon` state for in-app ordering
3. Contact the seller directly on WhatsApp from the product card
4. Continue the purchase conversation with the seller on WhatsApp

This keeps the storefront easy to demo and deploy while direct seller contact remains active.

---

## 🤖 AI Digitization Flow

1. Seller uploads a product image via the **UploadZone** component
2. **Frontend Compression**: Large images are automatically compressed to ~100KB in the browser
3. Image is stored in **Supabase Storage**
4. The `digitize` **Supabase Edge Function** is invoked
4. The function sends the image to **Google Gemini 2.5 Flash** for analysis
5. AI returns structured JSON: `title`, `description`, `price`, `category`, `tags`
6. Product is saved to the `products` table and appears in the seller's catalog

---

## 🌍 Internationalization

The app supports three languages out of the box:

-  **English** (`en`)
-  **Hindi** (`hi`)
-  **Telugu** (`te`)

Users can switch languages using the **LanguageSwitcher** component in the navbar. Language preference is persisted in `localStorage`.

---

## 📄 License

This project was built for a hackathon. All rights reserved.
