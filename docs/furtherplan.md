# Further Plan — ApnaBazar Enhancements

## Status Key
- ✅ Feasible — low effort
- ⚠️ Feasible — medium effort
- 🔴 Feasible — high effort

---

## 1. App Documentation (`docs/`)

**Current state:** Only a README. No developer docs, API specs, or user guide.

**Plan:**
- [ ] Create `docs/` directory with markdown files:
  - `architecture.md` — C4 diagrams (context → containers → components → code), component tree, data flow diagram
  - `api.md` — Supabase Edge Function contract: request shape `{ imageUrl, sellerId }`, response shape `{ product }`, error codes (400, 429, 402, 500)
  - `database.md` — ER diagram, full schema dump, RLS policy explanations, trigger functions
  - `deployment.md` — Vercel + Supabase setup, environment variables, build commands
  - `user-guide.md` — Screenshot-based walkthrough for sellers (registration → upload → storefront)
- [ ] Add JSDoc/TSDoc comments to all public functions (`compressImage`, all `useSeller` methods, edge function handler)

**Impact:** Strengthens "System Design" and "Documentation" report sections. Helps evaluators understand architecture without reading all 7k lines.

---

## 2. Network Status & Upload Time Estimation

**Current state:** `UploadZone.tsx` (281 lines) has a progress bar and per-file state machine, but no time estimation or network health indicator.

**Plan:**
- [ ] Create `hooks/useNetworkStatus.ts`:
  - Expose `isOnline`, `connectionType` (4g/3g/2g), `effectiveBandwidth` (Mbps)
  - Use `navigator.onLine` + `navigator.connection` API
  - Show dismissable offline banner at top of app
- [ ] Add estimated upload time in UploadZone:
  - Track per-chunk upload speed → compute rolling average
  - Display `~X seconds remaining` during uploading step
  - Switch to `AI is processing...` during AI extraction
  - Show per-file progress (current / total files + current file name)
- [ ] Timeout + retry UI:
  - Upload timeout > 120s → show error with Retry button for that file
  - AI timeout > 45s → show error with Retry button
  - Exponential backoff on retry (optional but impressive)

**Implementation sketch:**
```ts
// hooks/useNetworkStatus.ts
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connection, setConnection] = useState<NetworkInformation | null>(null);
  // ... listeners for online/offline + connectionchange
  return { isOnline, type: connection?.effectiveType, bandwidth: connection?.downlink };
}
```

**Impact:** Production network resilience thinking. Strong for "Performance & Reliability" chapter.

---

## 3. Tour of the App (Onboarding Walkthrough)

**Current state:** New sellers land on a blank dashboard. `Dashboard.tsx` handles the "no store" case with `StoreSetup` wizard, but after setup the dashboard is empty with no guidance.

**Plan:**
- [ ] Add `AppTour.tsx` component:
  - Step 1: Highlight Upload Zone — "Upload your first product image here"
  - Step 2: Highlight AI result card — "AI extracts title, price, category automatically"
  - Step 3: Highlight product catalog — "Manage all your products here"
  - Step 4: Highlight share button — "Copy your storefront link and share with customers"
- [ ] Show only on first login; use `localStorage` flag OR add `onboarding_complete` boolean to `sellers` table
- [ ] Include skip button, dot navigation, and smooth scrolling to target elements
- [ ] Use `react-joyride` for quick implementation, or build a lightweight custom overlay

**DB change:** `ALTER TABLE sellers ADD COLUMN onboarding_complete boolean DEFAULT false;`

**Impact:** Directly supports the "non-technical seller can onboard in 2 minutes" thesis. Chapter-worthy UX content.

---

## 4. Developer Experience (DX)

**Current state:** Two competing Supabase clients, no error boundary, no structured logging, no validate script, both `bun.lock` and `package-lock.json` present.

**Plan:**
- [ ] **Consolidate Supabase clients:**
  - Delete `src/lib/supabase.ts`
  - Keep `src/integrations/supabase/client.ts` (typed with `Database` generic)
  - Update all imports across `useAuth.tsx`, `useSeller.tsx`, `UploadZone.tsx` → `@/integrations/supabase/client`
- [ ] **React Error Boundary** (`components/ErrorBoundary.tsx`):
  ```tsx
  class ErrorBoundary extends React.Component {
    state = { hasError: false, error: null };
    static getDerivedStateFromError(error) { return { hasError: true, error }; }
    render() { /* fallback UI with "Reload" button */ }
  }
  ```
- [ ] **Structured logger** (`lib/logger.ts`):
  ```ts
  export const logger = {
    info: (msg: string, data?: unknown) => console.log(`[ApnaBazar] ${msg}`, data ?? '');
    warn: (msg: string, data?: unknown) => console.warn(`[ApnaBazar] ${msg}`, data ?? '');
    error: (msg: string, error?: unknown) => console.error(`[ApnaBazar] ${msg}`, error ?? '');
  };
  ```
- [ ] **`npm run validate` script** in `package.json`:
  ```json
  "validate": "npm run lint && npx tsc --noEmit && npm run test"
  ```
- [ ] **Remove `bun.lock` and `bun.lockb`** — keep only `package-lock.json`

**Impact:** Code quality. Covers "Software Engineering Practices" in report.

---

## 5. UI Changes & Background Images

**Current state:** Standard shadcn look — white/gray cards, clean but generic. No background images. Dark mode toggle works.

**Plan:**
- [ ] **Landing page (`pages/Index.tsx`):**
  - Add full-bleed hero background image (Indian textile pattern or local market scene) with dark gradient overlay
  - Keep existing hero text, CTA buttons, feature cards
  - Add subtle parallax scroll effect on hero
- [ ] **Seller dashboard background:** Subtle gradient or repeating pattern on sidebar header area
- [ ] **Storefront customization (sellers can brand their store):**
  - Add `banner_url: text` column to `sellers` → seller uploads banner to Supabase Storage
  - Add `theme_color: text` column → seller picks a primary color via color picker
  - Public storefront renders the seller's banner + applies their theme color
- [ ] **Product card polish:**
  - Hover shadow + scale animation
  - Lazy loading with blur placeholder (CSS `filter: blur()` transition on image load)
- [ ] **Replace all raw "Loading..." text** with `<Skeleton>` components (shadcn already has `ui/skeleton.tsx` — use it)
- [ ] **Empty states:** Better illustrations + messages for empty product list, empty orders, etc.

**DB change:** 
```sql
ALTER TABLE sellers ADD COLUMN banner_url text;
ALTER TABLE sellers ADD COLUMN theme_color text DEFAULT '#8B5CF6';
```

**Impact:** Visual quality. Storefront personalization strengthens "brand identity for local sellers" narrative in report.

---

## 6. Role-Based Access Control (RBAC)

**Current state:** Only `sellers` concept exists. `orders` table has `buyer_id` but no buyer registration flow. `placeOrder()` exists in `Storefront.tsx` but is behind a "Coming Soon" CTA. No admin role.

**Plan:**
- [ ] **Migration: Add `profiles` table with role enum:**
  ```sql
  CREATE TYPE user_role AS ENUM ('seller', 'buyer', 'admin');
  CREATE TABLE profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'seller',
    created_at timestamptz DEFAULT now()
  );
  -- Update the handle_new_user() trigger to insert into profiles
  ```
- [ ] **Registration flow (`pages/Auth.tsx`):**
  - After email/password, show role picker: "I am a Seller" / "I am a Buyer"
  - Seller → existing dashboard flow
  - Buyer → redirect to storefront (can browse and place orders)
- [ ] **Buyer order flow:**
  - Enable the currently disabled `placeOrder()` in `Storefront.tsx`
  - Buyer enters name + phone in a modal → order is inserted into `orders` table with `pending` status
  - Seller sees incoming orders in the Dashboard "Orders" tab
- [ ] **Admin dashboard (`pages/Admin.tsx`, route `/admin`):**
  - Protected: only users with `role = 'admin'`
  - View all sellers + their product counts
  - View all orders platform-wide
  - Flag/unflag inappropriate products
  - Basic platform analytics (total sellers, products, orders)
- [ ] **Frontend route guards (`components/ProtectedRoute.tsx`):**
  ```tsx
  function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: user_role[] }) {
    const { user, loading } = useAuth();
    const { profile } = useProfile(); // new hook or extend useAuth
    if (loading) return <Skeleton />;
    if (!user) return <Navigate to="/auth" />;
    if (roles && !roles.includes(profile?.role)) return <Navigate to="/" />;
    return <>{children}</>;
  }
  ```
- [ ] **RLS policy updates:**
  - `sellers`: admin can read all, sellers read own
  - `products`: admin can read all, sellers CRUD own, buyers can read all (for storefront)
  - `orders`: sellers see orders for their products, buyers see own orders, admin sees all

**Impact:** Biggest architectural addition. Each role (seller/buyer/admin) generates its own report chapter. Order completion fills the current functional gap.

---

## 7. Stock / Inventory Management

**Current state:** `products` table has no `stock` or `quantity` field. Zero inventory tracking.

**Plan:**
- [ ] **Migration:**
  ```sql
  ALTER TABLE products ADD COLUMN stock integer DEFAULT 0;
  ALTER TABLE products ADD COLUMN low_stock_threshold integer DEFAULT 5;
  ```
- [ ] **Upload flow:** When AI returns product data, show editable stock field (default 1) in the review step
- [ ] **Dashboard product card (`ProductCard.tsx`):**
  - Show stock badge: green (> threshold), amber (<= threshold), red (0), gray (unlimited)
- [ ] **Bulk inventory editor** — new "Inventory" tab in dashboard:
  - Table: Product Image | Name | Current Stock | New Stock | Save
  - Inline editing with debounced save
- [ ] **Storefront:** Show "In Stock (X)" or "Out of Stock" on each product
- [ ] **Order → stock decrement:** When order status changes to `confirmed`, decrement `products.stock`. Prevent ordering if stock = 0.
- [ ] **Low stock alert:** On dashboard load, if any product is below threshold, show toast: "5 products are low in stock"

**Impact:** Completes the e-commerce loop. Without this, the app is a catalog, not a store. Fills "Inventory Management" chapter.

---

## 8. Testing — Unit Tests (Vitest)

**Current state:** `src/test/example.test.ts` contains only `expect(true).toBe(true)`. Zero real tests.

**Plan:**
- [ ] **`lib/utils.test.ts`** — test `compressImage`:
  - Mock canvas and File/Blob
  - Verify compression is called for files >150KB
  - Verify compression is skipped for files <=150KB
  - Verify quality fallback on failure
- [ ] **`hooks/useSeller.test.tsx`** — test with mocked Supabase:
  - Mock `supabase.from().select().eq().single()` for fetchSeller
  - Verify `createSeller` calls upsert with correct payload
  - Verify `deleteProduct` calls delete with correct id
  - Verify cascading: `fetchSeller` → triggers `fetchProducts`, `fetchFiles`, `fetchOrders`
- [ ] **Edge function response parsing test** — extract JSON-cleaning logic into its own function and test:
  - Input: `` ```json\n{"title": "x"}\n``` `` → Output: `{title: "x"}`
  - Input: `{"title": "x"}` → Output: `{title: "x"}` (no markdown)
  - Input: `garbage` → Output: fallback product
- [ ] **Translation key coverage test:**
  - Automate check: every key in `en` must exist in `te` and `hi` (currently true, but test ensures it stays true)
- [ ] **`npm run test` script:** ensure `vitest run` passes

**Goal:** >60% line coverage on business logic (utils, hooks, edge function parsing).

---

## 9. Testing — E2E Tests (Playwright)

**Current state:** `playwright.config.ts` + `playwright-fixture.ts` exist but zero `.spec.ts` files.

**Plan:**
- [ ] **`e2e/auth.spec.ts`:**
  - Visit `/`, click "Get Started" → redirected to `/auth`
  - Fill email + password → submit → redirected to `/dashboard`
- [ ] **`e2e/upload.spec.ts`** (requires a running Supabase instance):
  - Login as seller
  - Upload an image file to UploadZone
  - Verify progress states (uploading → processing → complete)
  - Verify product card appears in catalog after completion
- [ ] **`e2e/storefront.spec.ts`:**
  - Visit `/store/test-store`
  - Verify products are displayed
  - Click WhatsApp contact → verify WhatsApp URL opens with correct phone number
- [ ] **`e2e/i18n.spec.ts`:**
  - Switch language to Hindi → verify page text changes
  - Switch language to Telugu → verify page text changes
  - Refresh page → verify language persists

---

## 10. AI Accuracy Evaluation Framework

**Current state:** No mechanism to measure AI extraction quality. Edge function returns whatever Gemini outputs.

**Plan:**
- [ ] **Build an evaluation dataset:** Collect 30-50 labeled clothing product images with known:
  - Expected title
  - Expected category
  - Expected price range
  - Expected tags
- [ ] **Create `scripts/evaluate-ai.ts`** (standalone Node script):
  - Loads each test image
  - Calls the digitize edge function
  - Compares output against ground truth
  - Reports:
    - Title accuracy (exact match %)
    - Category accuracy (exact match %)
    - Price error (mean absolute error ± INR)
    - Tag overlap (Jaccard similarity)
- [ ] **Log results** to a JSON file and include in report as a table/chart
- [ ] **(Optional)** Add a "confidence score" field to the edge function response and show it in the dashboard

**Impact:** **Single highest-impact addition for your report.** Turns "we used AI" from a claim into a measured result with real numbers. Gives you a "Results & Evaluation" chapter with graphs.

---

## 11. Performance Benchmarking

**Current state:** No performance data collected.

**Plan:**
- [ ] **Create `scripts/benchmark.ts`** to measure:
  - Image compression ratio: original size vs compressed size (KB, % reduction)
  - Compression time: ms per image
  - Upload time to Supabase Storage: P50/P95/P99
  - AI processing time (edge function → Gemini → response): P50/P95/P99
  - Full pipeline time: upload → AI → DB insert → UI update
- [ ] **Compare against baseline:** Manual product entry (time to type title, description, price, category, tags)
  - Show: AI-assisted = ~30s per product vs manual = ~120s per product
- [ ] **Present results** as tables + bar charts in report

---

## 12. Order Flow Completion

**Current state:** `Storefront.tsx` has `placeOrder()` and `OrderConfirmation.tsx` (80 lines), but the order button is disabled with "Coming Soon" CTA. Dead code exists.

**Plan:**
- [ ] Enable `placeOrder()` in `Storefront.tsx`:
  - Buyer clicks "Order Now" → `BuyerAuthModal` opens (already exists)
  - Buyer enters name + phone (or logs in for authenticated flow)
  - On submit: `INSERT INTO orders (seller_id, product_id, quantity, buyer_name, buyer_phone, status)` → `'pending'`
  - Show `OrderConfirmation` modal with order details + WhatsApp contact
- [ ] Seller sees order in Dashboard "Orders" tab (already implemented in `Orders.tsx`, 194 lines — confirm it works end-to-end)
- [ ] Status transitions: pending → confirmed → completed | cancelled
- [ ] Seller gets a toast when a new order arrives (polling or Supabase Realtime subscription)

**Impact:** Removes the biggest "incomplete feature" criticism. Completes the buy-side of the platform.

---

## 13. Loading States & Skeleton Everywhere

**Current state:** Mix of `<Skeleton>`, spinner, and raw "Loading..." text.

**Plan:**
- [ ] **Audit all pages** for missing loading states:
  - `Dashboard.tsx`: skeleton for stats cards, product grid, orders table
  - `Storefront.tsx`: skeleton for product grid while fetching
  - `Auth.tsx`: button loading spinner during sign-in/sign-up
- [ ] Create shared `LoadingSkeleton` components:
  - `ProductCardSkeleton.tsx`
  - `StatsCardSkeleton.tsx`
  - `TableSkeleton.tsx`
- [ ] Add `Suspense` + fallback for lazy-loaded routes in `App.tsx`

---

## 14. Security Hardening

**Current state:** Edge function `verify_jwt = false`, no rate limiting, no input sanitization.

**Plan:**
- [ ] **Edge function:** Set `verify_jwt = true` in `supabase/config.toml`. Pass auth token from frontend.
- [ ] **Rate limiting:** Add a simple in-memory rate limiter in the edge function (max 10 requests/minute per IP)
- [ ] **Input validation in edge function:**
  - Validate `imageUrl` is a Supabase Storage URL (not arbitrary external URL)
  - Validate `sellerId` is a valid UUID
- [ ] **File upload constraints:** Enforce file type (image/*) and max file size (5MB) on both client and server
- [ ] **Sanitize AI output:** Strip any HTML/script tags from AI-generated title/description before storing

---

## 15. Responsive & Mobile UX Improvements

**Current state:** Responsive via Tailwind but no dedicated mobile optimizations beyond basic breakpoints.

**Plan:**
- [ ] **Mobile nav:** Bottom tab bar (Home, Upload, Products, Settings) instead of sidebar
- [ ] **Upload on mobile:** Full-screen camera capture support (`capture="environment"` on file input)
- [ ] **Touch gestures:** Swipe-to-delete on product cards (optional)
- [ ] **Storefront mobile:** Sticky WhatsApp button, bottom sheet for filters

---

## 16. CI/CD Pipeline

**Current state:** No automation.

**Plan:**
- [ ] Create `.github/workflows/ci.yml`:
  - Trigger: push to main / PR
  - Steps: checkout → install → lint → typecheck → test (Vitest)
  - (Optional) Deploy to Vercel on main push
- [ ] Create `.github/workflows/e2e.yml`:
  - Trigger: push to main
  - Steps: checkout → install → build → start dev server → run Playwright tests

---

## 17. PostHog Analytics Integration

**Current state:** No product analytics. No insight into how sellers use the platform.

**Plan:**
- [ ] Install `posthog-js`:
  ```bash
  npm install posthog-js
  ```
- [ ] Initialize in `main.tsx`:
  ```tsx
  import posthog from 'posthog-js';
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_POSTHOG_HOST,
    capture_pageview: true,
  });
  ```
- [ ] Track key events:
  - `user_signed_up` — on successful registration
  - `product_uploaded` — when image is uploaded to storage
  - `ai_digitization_complete` — when AI returns product data
  - `storefront_visited` — when someone visits `/store/:slug`
  - `whatsapp_clicked` — when buyer clicks WhatsApp contact
  - `order_placed` — when order is created
  - `language_switched` — track which languages are used
- [ ] Create a lightweight analytics wrapper (`lib/analytics.ts`):
  ```ts
  export const analytics = {
    track: (event: string, properties?: Record<string, unknown>) => {
      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture(event, properties);
      }
    },
  };
  ```
- [ ] Use in components:
  ```tsx
  analytics.track('product_uploaded', { sellerId, fileSize: file.size });
  ```
- [ ] Build a simple "Platform Stats" dashboard in the admin panel using PostHog trends API (optional)

**.env addition:**
```
VITE_POSTHOG_KEY=phc_xxxxx
VITE_POSTHOG_HOST=https://app.posthog.com
```

**Impact:** Gives you real usage data for the "Results" chapter. You can report: "X sellers uploaded Y products in Z days, 70% used Hindi interface." Strong evidence for an internship report.

---

## 18. Mobile App Support (Capacitor)

**Current state:** Web-only. No mobile app.

**Plan:**
- [ ] Install Capacitor:
  ```bash
  npm install @capacitor/core @capacitor/cli
  npx cap init ApnaBazar com.apnabazar.app
  npx cap add android
  npx cap add ios  # macOS only
  ```
- [ ] Configure `capacitor.config.ts`:
  ```ts
  import { CapacitorConfig } from '@capacitor/cli';
  const config: CapacitorConfig = {
    appId: 'com.apnabazar.app',
    appName: 'ApnaBazar',
    webDir: 'dist',
    server: { androidScheme: 'https' },
    plugins: {
      PushNotifications: { presentationOptions: ['badge', 'sound', 'alert'] },
    },
  };
  export default config;
  ```
- [ ] **Camera integration** — replace file input with Capacitor Camera plugin for native camera capture:
  ```bash
  npm install @capacitor/camera
  ```
  ```tsx
  import { Camera, CameraResultType } from '@capacitor/camera';
  const photo = await Camera.getPhoto({ resultType: CameraResultType.Uri });
  ```
- [ ] **Share plugin** — native share sheet for storefront link:
  ```bash
  npm install @capacitor/share
  ```
  ```tsx
  import { Share } from '@capacitor/share';
  await Share.share({ title: 'My Store', url: 'https://apnabazar.app/store/my-store' });
  ```
- [ ] **Push notifications** — notify seller when new order arrives (requires server-side FCM setup):
  ```bash
  npm install @capacitor/push-notifications
  ```
- [ ] **Build pipeline:**
  ```bash
  npm run build          # build web app
  npx cap sync           # copy to native projects
  npx cap open android   # opens Android Studio for APK build
  ```
- [ ] Add "Download our app" banner on the web storefront

**Key advantage over React Native / Flutter:** 100% code reuse. Same React + TypeScript + Tailwind code runs on web, Android, and iOS. No rewrite. Capacitor is just a native wrapper around your existing web app.

**Limitations to document in report:**
- Camera and push notifications need native plugins (not available on web)
- Offline support requires additional service worker work
- Performance depends on WebView (not true native)

**Impact:** Adding a "Cross-Platform Mobile Strategy" subsection to the report (Future Scope or Implementation chapter). If you actually build and deploy an APK, it becomes a "Mobile Deployment" chapter — very strong for internship evaluation.

---

**Plan:**
- [ ] Add indexes:
  ```sql
  CREATE INDEX idx_products_seller_id ON products(seller_id);
  CREATE INDEX idx_products_category ON products(category);
  CREATE INDEX idx_orders_seller_id ON orders(seller_id);
  CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);
  CREATE INDEX idx_sellers_store_slug ON sellers(store_slug); -- for fast storefront lookup
  ```
- [ ] Add `deleted_at` timestamp for soft-delete on products
- [ ] Add `created_at` + `updated_at` triggers for all tables (currently only `created_at` exists)

---

## Prioritization for Report Timeline

| Priority | Item | Why |
|----------|------|-----|
| **P0** | 6. RBAC + Enable Order Flow | Fills biggest functional gaps (buyer flow, admin) |
| **P0** | 7. Stock / Inventory | Without this, the app is a catalog, not a store |
| **P0** | 8-9. Tests (Unit + E2E) | Removes the #1 weakness from evaluation |
| **P0** | 10. AI Accuracy Evaluation | Gives you real numbers for Results chapter |
| **P1** | 11. Performance Benchmarking | Numbers + graphs for Results chapter |
| **P1** | 12. Order Flow Completion | Enable existing dead code |
| **P1** | 2. Network + Upload ETA | Production polish, Performance chapter |
| **P1** | 3. App Tour | Supports "2-minute digitization" thesis |
| **P1** | 5. UI + Backgrounds | Demo quality |
| **P2** | 4. DX | Code quality, low user impact |
| **P2** | 13. Loading States | Polish, not structural |
| **P2** | 14. Security | Important but not visible in demo |
| **P3** | 1. Documentation | Write last after all code changes settle |
| **P3** | 15. Mobile | Nice-to-have |
| **P1** | 17. PostHog Analytics | Real usage data for Results chapter |
| **P2** | 18. Capacitor Mobile | Native app from same codebase — medium effort |
| **P3** | 16. CI/CD | Report mention only, not examinable |
| **P3** | 17. DB Indexes | Performance optimization, low visibility |

---

## What These Changes Enable in Your Report

| Report Section | Without these | With these |
|---------------|---------------|------------|
| **Chapter 3: System Architecture** | Basic component tree | RBAC, inventory subsystem, network resilience, CI/CD pipeline diagrams |
| **Chapter 4: Implementation** | 5 pages, 11 components | 8+ pages, 15+ components, 4 hooks, role guards, stock management, E2E flows |
| **Chapter 5: AI Integration** | "We called Gemini API" | Prompt design decisions, JSON cleaning algorithm, error handling, fallback strategy, accuracy evaluation methodology |
| **Chapter 6: Testing** | "We tested" (no evidence) | Unit test coverage table, E2E test scenarios, CI pipeline screenshot |
| **Chapter 7: Results & Evaluation** | Nothing measurable | AI accuracy %, compression ratio, latency P50/P95, time-to-publish comparison, user satisfaction (if surveyed) |
| **Chapter 8: Future Scope** | Generic bullet list | Specific 16-item roadmap with prioritization |
| **Viva Demonstration** | "Here's the storefront" | "Here's onboarding → upload → AI extraction → inventory → order → admin panel → analytics → PostHog dashboard → mobile APK" |

---

## Final Outcome Checklist — App State Before Report Writing

Use this checklist. **Items marked MUST are non-negotiable** — without them, the report will have critical gaps. Items marked SHOULD are strongly recommended. Items marked COULD are optional but nice.

### MUST (Report Will Be Weak Without These)

- [ ] **RBAC implemented** — Seller + Buyer + Admin roles working end-to-end
- [ ] **Order flow completed** — Buyer can place order, seller can confirm/reject, order status visible to both
- [ ] **Stock/inventory management** — Products have quantity, stock depletes on order, low-stock alerts work
- [ ] **Tests written** — Minimum: unit tests for `compressImage`, `useSeller` (mocked), edge function parsing. E2E: auth flow + upload flow + storefront flow
- [ ] **AI accuracy evaluated** — Test set of 30+ images, accuracy metrics documented (title %, category %, price error)

### SHOULD (Strongly Recommended)

- [ ] **Performance benchmarks** — Compression ratio, upload time, AI latency (P50/P95), time-to-publish vs manual
- [ ] **Loading skeletons** everywhere — No raw "Loading..." text remains
- [ ] **Error boundary** at app root
- [ ] **Single Supabase client** — `lib/supabase.ts` deleted, all imports point to `integrations/supabase/client.ts`
- [ ] **Offline/network status banner** — User knows when they're disconnected
- [ ] **Upload ETA display** — "~X seconds remaining" during upload
- [ ] **Storefront customization** — Seller can set banner + theme color
- [ ] **Edge function JWT verification** — `verify_jwt = true`
- [ ] **App tour** — First-login walkthrough for sellers

### COULD (Nice to Have, Not Critical)

- [ ] CI/CD pipeline (GitHub Actions)
- [ ] PWA + service worker for offline support
- [ ] Semantic search (pgvector)
- [ ] OCR from images (Gemini can already do this — low effort)
- [ ] Responsive mobile nav (bottom tabs)
- [ ] Email notifications for new orders
- [ ] Database indexes + soft-delete
- [ ] Documentation in `docs/` folder

### DO NOT DO (Scope Creep)

- ❌ Payment gateway integration (Razorpay/Stripe) — adds complexity, needs PCI compliance
- ❌ Real-time chat between buyer and seller (beyond WhatsApp bridge)
- ❌ React Native / Flutter rewrite for mobile — whole separate project. Capacitor wrapping (Section 18) is the right approach
- ❌ Multi-tenant marketplace (allow multiple sellers on one storefront) — changes the entire product model
- ❌ Machine learning model training/fine-tuning — out of scope for a frontend internship

---

### Summary: What to Do This Week vs What Goes in Report as "Future Work"

| This week (implement) | Future scope (mention in report) |
|-----------------------|----------------------------------|
| RBAC (seller + buyer + admin) | Payment integration |
| Order flow (enable dead code) | React Native / Flutter app (not needed — use Capacitor) |
| Stock/inventory | Real-time chat |
| Tests (unit + E2E) | ML model fine-tuning |
| AI accuracy evaluation | Multi-tenant marketplace |
| Performance benchmarking | Product recommendation engine |
| Network status + upload ETA | Voice search |
| App tour | A/B testing framework |
| PostHog analytics | PWA advanced offline support |
| Error boundary | Push notifications server setup |
| UI polish + skeletons | |
| Edge function security | |
| Single Supabase client | |
| **Capacitor mobile wrapper** (optional — 2 days) | |

---

## 19. WhatsApp AI Sales Agent — Future Plan

> **Status: Future Scope — Do NOT implement now. Document in report Future Work chapter.**
> This section contains the full plan, architecture, workflow, and implementation details for a WhatsApp AI Sales Agent that would extend ApnaBazar into a fully autonomous conversational commerce platform.

---

### 19.1 What This Feature Is

A fully autonomous AI-powered sales agent that runs on WhatsApp for any seller on ApnaBazar. The agent handles the complete sales lifecycle — product discovery, order taking, price negotiation, language switching, and UPI payment collection — all without any human in the loop.

Each seller on ApnaBazar gets their own WhatsApp Business number. Customers message that number and the AI agent responds as if it were the seller's personal sales assistant, reading directly from that seller's product catalog in the existing Supabase database and writing orders into the existing `orders` table.

The seller never needs to be online. Orders placed via WhatsApp appear directly in their ApnaBazar dashboard Orders tab — indistinguishable from orders placed through the web storefront.

---

### 19.2 Why This Matters — The Market Opportunity

India has **487 million WhatsApp users**. According to Meta's own research, **63% of Indian SMBs already use WhatsApp to take orders manually** — they send product photos, negotiate prices, and collect UPI payments all through WhatsApp chat. This is not a new behavior. It is the existing behavior of the exact sellers ApnaBazar is built for.

The problem: doing this manually means the seller must be online 24/7, respond to every message personally, remember every conversation, and manually track every order. This does not scale.

The WhatsApp AI Agent automates the entire workflow while keeping the interface buyers already know and trust.

**Key report arguments:**
- Zero learning curve for buyers — they already know WhatsApp
- Zero learning curve for sellers — orders appear in their existing ApnaBazar dashboard
- Multilingual by default — Claude detects and matches the customer's language automatically
- Works 24/7 — no seller needs to be online to take orders
- Connects to existing infrastructure — reads from `products` table, writes to `orders` table, no new database needed

---

### 19.3 What the Agent Can Do

| Capability | Description |
|---|---|
| Greet customers | Warm welcome message with store name on first contact |
| Show product catalog | Fetches live products from Supabase, formats for WhatsApp |
| Product recommendations | Suggests products based on occasion, budget, preference |
| Complete order flow | Product → quantity → name → address → delivery date → summary → confirm |
| Multi-language support | Detects customer's language (Hindi, English, Tamil, Telugu, Bengali) and replies in the same language automatically |
| Price objection handling | Politely handles discount requests — can offer up to 5% if customer insists |
| FAQ answering | Delivery areas, timings, allergens, payment methods — all from system prompt |
| Order summary generation | Clean formatted summary before confirmation |
| UPI payment link | Generates `upi://pay?pa=...` deep link directly in chat after order confirmation |
| Conversation memory | Remembers context across messages — knows what was discussed earlier in the conversation |
| Guest ordering | No account needed — buyer just needs WhatsApp |
| Non-text fallback | Politely asks customer to send text if they send images, audio, or stickers |

---

### 19.4 Tech Stack

| Tool | Purpose | Why This Choice |
|---|---|---|
| **Anthropic Claude (claude-opus-4-5)** | AI brain — powers all conversations | Best-in-class instruction following, multilingual, native tool use support |
| **Supabase Edge Functions (Deno)** | Webhook server — receives WhatsApp messages | Already in this repo, no separate server needed, public HTTPS URL included |
| **Meta WhatsApp Cloud API** | Customer-facing interface | Free tier available, official API, works with any verified phone number |
| **Supabase PostgreSQL** | Product catalog + order storage | Already exists — zero new infrastructure |
| **`conversations` table (JSONB)** | Conversation memory per phone number | Replaces in-RAM storage, survives function restarts, queryable |

**Why Supabase Edge Functions instead of a separate Python/Flask server (as described in the original guide):**

The original guide uses Python + Flask + Cloudflare Tunnel. This works but requires:
- A separate server running 24/7
- A separate deployment pipeline
- Cloudflare Tunnel or ngrok to expose localhost
- A separate repository or folder

Using Supabase Edge Functions instead means:
- No separate server — lives inside this repo under `supabase/functions/`
- Deployed with one command: `supabase functions deploy whatsapp-agent`
- Supabase provides the public HTTPS URL automatically — no tunnel needed
- Deno runtime supports the Anthropic TypeScript SDK natively via npm imports
- Scales automatically — no port management, no process management, no uptime monitoring
- Same `supabase db push` workflow already used in this project

---

### 19.5 System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CUSTOMER SIDE                              │
│                                                                     │
│   Customer's Phone                                                  │
│   ┌──────────────┐                                                  │
│   │   WhatsApp   │  "hi, what do you have?"                        │
│   └──────┬───────┘                                                  │
└──────────┼──────────────────────────────────────────────────────────┘
           │ HTTPS POST (message payload)
           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       META CLOUD API                                │
│                                                                     │
│   graph.facebook.com/v25.0/{PHONE_NUMBER_ID}/messages               │
│   Receives message → forwards to registered webhook URL             │
│   Expects HTTP 200 back within 20 seconds                           │
└──────────┬──────────────────────────────────────────────────────────┘
           │ POST /functions/v1/whatsapp-agent
           ▼
┌─────────────────────────────────────────────────────────────────────┐
│           SUPABASE EDGE FUNCTION  (lives in this repo)              │
│       supabase/functions/whatsapp-agent/index.ts                    │
│                                                                     │
│  Step 1: Verify it's a real message (not a status update)           │
│  Step 2: Extract phone number + message text                        │
│  Step 3: Load conversation history from conversations table         │
│  Step 4: Append user message to history                             │
│  Step 5: Run Agentic Loop (see below)                               │
│  Step 6: Save updated history back to conversations table           │
│  Step 7: Send reply via Meta Cloud API                              │
│  Step 8: Return HTTP 200 to Meta (always — prevents duplicate msgs) │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                     AGENTIC LOOP                              │  │
│  │                                                               │  │
│  │   Call Claude with:                                           │  │
│  │   - system prompt (store rules, sales flow, language rules)   │  │
│  │   - tools (get_products, place_order, get_datetime, upi)      │  │
│  │   - full conversation history                                 │  │
│  │                                                               │  │
│  │   Claude response                                             │  │
│  │        │                                                      │  │
│  │        ├── stop_reason = "end_turn"                           │  │
│  │        │       └── Extract text reply → exit loop             │  │
│  │        │                                                      │  │
│  │        └── stop_reason = "tool_use"                           │  │
│  │                └── Process each tool call (DB queries)        │  │
│  │                └── Append tool results to history             │  │
│  │                └── Call Claude again with results             │  │
│  │                └── Repeat until end_turn (max 10 iterations)  │  │
│  └───────────────────────────────────────────────────────────────┘  │
└──────────┬──────────────────────────────────────────────────────────┘
           │ Tool calls read/write Supabase DB
           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  SUPABASE DATABASE  (already exists)                │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐ │
│  │    sellers      │  │    products     │  │       orders        │ │
│  │─────────────────│  │─────────────────│  │─────────────────────│ │
│  │ id              │  │ id              │  │ id                  │ │
│  │ store_name      │  │ title           │  │ seller_id           │ │
│  │ store_slug      │  │ price           │  │ product_id          │ │
│  │ contact_number  │  │ description     │  │ buyer_name          │ │
│  │ phone           │  │ category        │  │ buyer_phone         │ │
│  └─────────────────┘  │ stock           │  │ quantity            │ │
│                       └─────────────────┘  │ status: 'pending'   │ │
│                                            │ buyer_id: NULL      │ │
│  ┌──────────────────────────────────────┐  └─────────────────────┘ │
│  │           conversations  (NEW)       │                          │
│  │──────────────────────────────────────│                          │
│  │ id          UUID                     │                          │
│  │ phone       TEXT  (e.g. +919876...)  │                          │
│  │ store_slug  TEXT  (e.g. priya-shop)  │                          │
│  │ messages    JSONB (array of msgs)    │                          │
│  │ updated_at  TIMESTAMPTZ              │                          │
│  │ UNIQUE (phone, store_slug)           │                          │
│  └──────────────────────────────────────┘                          │
└──────────┬──────────────────────────────────────────────────────────┘
           │ Order written → seller sees it immediately
           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      SELLER DASHBOARD                               │
│                                                                     │
│   ApnaBazar Dashboard → Orders Tab                                  │
│   New WhatsApp order appears in real-time (Supabase Realtime)       │
│   Seller confirms → status: pending → confirmed → completed         │
│   Seller can WhatsApp buyer directly from the order card            │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 19.6 The 4 Tools Claude Can Call

The agent has 4 tools. Claude decides autonomously when to call each one based on the conversation context. The seller never configures these — they work automatically from the existing database.

#### Tool 1: `get_products`

```
Purpose:   Fetch the seller's live product catalog from Supabase
When:      Customer asks "what do you have?", "show me menu", "what's available?",
           or any product-related question
Input:     { store_slug: string }
Output:    Array of products with id, title, price, description, category, stock
DB query:  SELECT id, title, price, description, category, stock
           FROM products
           WHERE seller_id = (SELECT id FROM sellers WHERE store_slug = ?)
           AND stock > 0
           ORDER BY created_at DESC
Key rule:  Claude NEVER makes up products — always calls this tool first
```

#### Tool 2: `place_order`

```
Purpose:   Insert a confirmed order into the orders table
When:      Customer says "YES" or "confirm" after seeing the order summary
Input:     { store_slug, product_id, buyer_name, quantity }
Output:    { success: true, order_id: "uuid" } or { success: false, error: "..." }
DB query:  INSERT INTO orders
           (seller_id, product_id, buyer_phone, buyer_name, quantity, status)
           VALUES (?, ?, ?, ?, ?, 'pending')
Note:      buyer_id is NULL — this is a guest order via WhatsApp, no account needed
           The order appears in the seller's dashboard immediately
```

#### Tool 3: `get_datetime`

```
Purpose:   Get current date and time in IST (Indian Standard Time)
When:      Customer asks about delivery timing, or agent needs to calculate
           "same day" vs "next day" delivery cutoff (2 PM IST)
Input:     {}
Output:    "Monday, 20 January 2026, 02:30 PM"
```

#### Tool 4: `generate_upi_payment`

```
Purpose:   Create a UPI deep link for payment
When:      After place_order succeeds — always the next step
Input:     { amount: number, note: string }
Output:    "upi://pay?pa=seller@upi&am=500&tn=Order%20abc123&cu=INR"
Note:      Customer taps this link → opens any UPI app (GPay, PhonePe, Paytm, BHIM)
           Works on any Android or iOS device with a UPI app installed
```

---

### 19.7 Conversation Memory Design

**The problem:** Supabase Edge Functions are stateless — they spin up fresh for every HTTP request. In-RAM conversation history (like a Python dictionary) is lost between messages. A customer sends "hi", the function handles it and shuts down. When the customer sends "I want the blue saree", the function has no memory of the previous message.

**The solution:** Store conversation history as a JSONB array in a `conversations` table in Supabase.

```sql
CREATE TABLE public.conversations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone      TEXT NOT NULL,
  store_slug TEXT NOT NULL,
  messages   JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (phone, store_slug)
);
```

**Flow for every incoming message:**

```
1. Receive message from phone +919876543210 for store "priya-shop"

2. SELECT messages FROM conversations
   WHERE phone = '+919876543210' AND store_slug = 'priya-shop'
   → Returns existing array (or empty array if first message)

3. Append new user message:
   messages.push({ role: "user", content: "I want the blue saree" })

4. Pass full messages array to Claude as the messages parameter

5. Claude responds (possibly calling tools in between)

6. Append assistant response to messages array

7. UPSERT conversations
   SET messages = trimmed_last_30_messages, updated_at = NOW()
   WHERE phone = '+919876543210' AND store_slug = 'priya-shop'

8. Send reply to customer
```

**Why JSONB:** The messages array contains mixed content types — plain text strings for simple messages, and arrays of content blocks (text + tool_use + tool_result objects) for agentic turns. JSONB handles this natively without any serialization complexity.

**Why last 30 messages:** Claude has a context window limit. Keeping the last 30 messages (typically 15 back-and-forth exchanges) is sufficient for a complete order flow while staying well within token limits. A typical order flow takes 10-15 messages.

---

### 19.8 System Prompt Design

The system prompt is the agent's complete personality, business rules, and behavioral instructions. It is built dynamically per store using the seller's `store_name` and `store_slug`.

**Structure of the system prompt:**

```
1. Role definition
   "You are a friendly AI sales agent for {storeName} on WhatsApp."

2. Responsibilities
   - What the agent can do (show products, take orders, answer FAQs)
   - What the agent cannot do (make up products, change prices arbitrarily)

3. Strict order flow sequence
   Greet → ask what they want → show products (get_products tool) →
   confirm product + quantity → ask name → ask delivery/pickup →
   ask address → ask date/time → show order summary → ask for YES →
   place_order tool → generate_upi_payment tool → thank you

4. Language detection rule
   "Detect the customer's language from their first message.
    Reply in the EXACT same language for the entire conversation.
    If they switch languages, you switch too."

5. Discount policy
   "You can offer up to 5% discount if the customer insists on a lower price.
    Never offer more than 5% without checking with the store."

6. WhatsApp formatting rules (critical)
   - Use *bold* for product names and prices (single asterisk, not double)
   - Use • for bullet lists
   - Keep messages short — max 3-4 lines per message
   - Never use markdown headers (#, ##)
   - Never use triple backticks
   - Emojis are welcome

7. Delivery rules
   "Same day delivery if ordered before 2 PM IST.
    Next day delivery for orders after 2 PM IST."

8. Fallback instruction
   "If you don't know the answer, say:
    'Let me check with the store team and get back to you!'"
```

**Key design decision — products are NOT in the system prompt:**

The product catalog is never hardcoded in the system prompt. Claude is instructed to always call `get_products` when asked about products. This means:
- The catalog is always live — seller adds a product on the dashboard, agent shows it immediately
- No need to redeploy or update the system prompt when products change
- Stock levels are respected — out-of-stock products are excluded from the query

---

### 19.9 Complete Example Conversation

This shows the full order flow from greeting to payment, with language switching:

```
Customer:  "hi"

Agent:     "Welcome to *Priya's Boutique*! 👋
            I'm your AI shopping assistant.
            What are you looking for today?"

Customer:  "saree dikhao"
           [Agent detects Hindi → switches to Hindi for rest of conversation]
           [Agent calls get_products tool → fetches live catalog]

Agent:     "Bilkul! 😊 Yeh hamare sarees hain:
            • *Banarasi Silk Saree* — ₹2,500
            • *Cotton Printed Saree* — ₹850
            • *Georgette Party Saree* — ₹1,800
            Kaunsa pasand aaya?"

Customer:  "banarasi wala, price thoda kam hoga?"

Agent:     "Banarasi Silk Saree ki quality bahut achhi hai! 🌟
            Aapke liye special price ₹2,375 kar sakti hoon (5% off).
            Lena hai?"

Customer:  "theek hai, 1 chahiye"

Agent:     "Aapka naam kya hai?"

Customer:  "Sunita Sharma"

Agent:     "Delivery chahiye ya pickup?"

Customer:  "delivery"

Agent:     "Address batayein please 📍"

Customer:  "123 MG Road, Bangalore 560001"

Agent:     "Kab chahiye? Date aur time batayein"

Customer:  "kal subah 10 baje"
           [Agent calls get_datetime tool → confirms tomorrow's date]

Agent:     "📋 *Order Summary*
            • Product: Banarasi Silk Saree
            • Quantity: 1
            • Price: ₹2,375
            • Name: Sunita Sharma
            • Address: 123 MG Road, Bangalore 560001
            • Delivery: 21 Jan, 10:00 AM

            Confirm karna hai? *YES* likhein ✅"

Customer:  "YES"
           [Agent calls place_order tool → order inserted into orders table]
           [Agent calls generate_upi_payment tool → UPI link generated]

Agent:     "✅ Order confirm ho gaya! Order ID: ORD-abc123

            Payment ke liye yeh link tap karein:
            upi://pay?pa=priya@upi&am=2375&tn=Order%20ORD-abc123&cu=INR

            Payment hone ke baad delivery schedule ho jayegi.
            Kal subah 10 baje delivery hogi! 🚚
            Shukriya Sunita ji! 🙏"
```

At this point, Sunita's order appears in Priya's ApnaBazar dashboard → Orders tab with status "Pending". Priya confirms it, status changes to "Confirmed", and Supabase Realtime fires a toast notification on her dashboard.

---

### 19.10 Integration With Existing ApnaBazar Codebase

This is the key architectural advantage — **zero new infrastructure, zero new UI for the seller**.

| Existing ApnaBazar Component | How the WhatsApp Agent Uses It |
|---|---|
| `sellers` table | Agent reads `store_name`, `store_slug`, `contact_number` to identify the store |
| `products` table | Agent reads live catalog via `get_products` tool — always up to date |
| `orders` table | Agent writes new orders via `place_order` tool — same table as web orders |
| Seller Dashboard → Orders tab | Seller sees WhatsApp orders alongside web orders — no distinction |
| Supabase Realtime on orders | Seller gets toast notification when WhatsApp order arrives (already implemented) |
| `supabase/functions/` directory | Agent lives here as `whatsapp-agent/index.ts` — same pattern as `digitize` function |
| `supabase/config.toml` | Agent registered here with `verify_jwt = false` (Meta sends unauthenticated requests) |

**New additions required:**

| Addition | Details |
|---|---|
| `conversations` table | 1 migration file — stores per-phone message history as JSONB |
| `supabase/functions/whatsapp-agent/index.ts` | The agent itself — ~250 lines of TypeScript |
| 6 Supabase secrets | `ANTHROPIC_API_KEY`, `WHATSAPP_TOKEN`, `PHONE_NUMBER_ID`, `VERIFY_TOKEN`, `UPI_ID`, `STORE_SLUG` |

---

### 19.11 Files to Create (When Ready to Implement)

```
supabase/
├── migrations/
│   └── 20260520000000_add_whatsapp_conversations.sql   ← conversations table
├── functions/
│   ├── digitize/                                        ← existing
│   │   └── index.ts
│   └── whatsapp-agent/                                  ← NEW
│       └── index.ts                                     ← full agent (~250 lines)
└── config.toml                                          ← add [functions.whatsapp-agent]
```

**`conversations` migration:**
```sql
CREATE TABLE public.conversations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone      TEXT NOT NULL,
  store_slug TEXT NOT NULL,
  messages   JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (phone, store_slug)
);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
-- Only service role (edge function) can access this table
```

**`config.toml` addition:**
```toml
[functions.whatsapp-agent]
verify_jwt = false  # Meta sends unauthenticated POST requests
```

---

### 19.12 Deployment Steps (When Ready to Implement)

**Step 1 — Push the migration**
```bash
supabase db push
```

**Step 2 — Set secrets in Supabase dashboard**
```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-your-key
supabase secrets set WHATSAPP_TOKEN=EAAyour-meta-token
supabase secrets set PHONE_NUMBER_ID=your-phone-number-id
supabase secrets set VERIFY_TOKEN=any-secret-string-you-choose
supabase secrets set UPI_ID=seller@upi
supabase secrets set STORE_SLUG=seller-store-slug
```

**Step 3 — Deploy the edge function**
```bash
supabase functions deploy whatsapp-agent
```

**Step 4 — Register webhook on Meta Developer Console**
```
Go to: developers.facebook.com → Your App → WhatsApp → Configuration
Callback URL:  https://pupjskrkmhzesjfltncb.supabase.co/functions/v1/whatsapp-agent
Verify Token:  (same value as VERIFY_TOKEN above)
Click: Verify and Save
Subscribe to:  messages (under Webhook Fields)
```

**Step 5 — Subscribe app to WhatsApp Business Account**
```bash
curl -X POST "https://graph.facebook.com/v25.0/{WABA_ID}/subscribed_apps" \
  -H "Authorization: Bearer {WHATSAPP_TOKEN}"
```

**The webhook URL is permanent** — no Cloudflare tunnel, no ngrok, no local server required. Supabase hosts it at a stable public HTTPS URL.

---

### 19.13 Prerequisites Before Starting Implementation

| Requirement | Where to Get It |
|---|---|
| Meta Developer account | developers.facebook.com → Create account |
| WhatsApp Business API access | Meta Developer Console → Create App → Business type → Add WhatsApp |
| Phone number for WhatsApp Business | Any number not already on personal WhatsApp — verify in Meta console |
| Meta temporary access token | Meta Developer Console → WhatsApp → API Setup → Generate Token |
| WhatsApp Business Account ID (WABA_ID) | Meta Developer Console → WhatsApp → API Setup |
| Phone Number ID | Meta Developer Console → WhatsApp → API Setup |
| Anthropic API key | console.anthropic.com → Create API key |
| Supabase CLI linked to this project | `supabase login` → `supabase link --project-ref pupjskrkmhzesjfltncb` |

> **Important:** The Meta temporary access token expires every 24 hours. For production, set up a System User with a permanent token in Meta Business Manager → System Users → Generate Token.

---

### 19.14 Limitations and Constraints to Document in Report

| Limitation | Explanation | Mitigation Strategy |
|---|---|---|
| One WhatsApp number = one store | Meta requires a separate verified phone number per WhatsApp Business account | For demo: one number, one store. For production: each seller registers their own WhatsApp Business number |
| Meta app review required for production | WhatsApp Business API requires Meta approval to message users who haven't messaged first | Test numbers work without approval during development. Production requires submitting app for review |
| Temporary access token | Meta tokens expire every 24 hours by default | Set up System User with permanent token in Meta Business Manager for production |
| No image or voice support | Agent only handles text messages | Polite fallback message sent for non-text inputs. Future: use Gemini Vision to process product images sent by customers |
| Edge function cold start | First message after a period of inactivity may take 1-2 seconds longer to respond | Acceptable for WhatsApp — users expect a slight delay. Supabase keeps functions warm for active deployments |
| Conversation memory limit | Last 30 messages kept to avoid token overflow | Sufficient for a complete order flow (typically 10-15 messages). Old conversations can be archived |
| Claude API cost | Each conversation costs approximately $0.01-0.05 depending on length and tool calls | Acceptable for demo and small-scale production. Cost monitoring via Anthropic dashboard |
| Single store per deployment | `STORE_SLUG` env var maps one WhatsApp number to one store | For multi-seller production: maintain a `whatsapp_numbers` table mapping `phone_number_id → store_slug` |

---

### 19.15 Estimated Implementation Time

| Task | Estimated Time |
|---|---|
| `conversations` table migration | 30 minutes |
| Edge function — webhook handler + WhatsApp send API | 2 hours |
| Edge function — Claude agentic loop with tool processing | 3 hours |
| Edge function — 4 tools (get_products, place_order, get_datetime, generate_upi) | 2 hours |
| System prompt design and language testing | 2 hours |
| Meta Developer Console setup + webhook registration | 1 hour |
| End-to-end testing (full order flow on real WhatsApp) | 2 hours |
| **Total** | **~12-13 hours (1.5 working days)** |

---

### 19.16 Report Value — What This Adds to Each Chapter

| Report Chapter | What to Write |
|---|---|
| **Future Scope** | Full section on conversational commerce — WhatsApp as the primary commerce interface for India's 487M+ WhatsApp users. Position this as the natural evolution of ApnaBazar from a web platform to an omnichannel commerce platform. |
| **System Architecture** | Extended architecture diagram showing WhatsApp channel alongside web channel, both feeding the same Supabase backend. Highlight the shared `orders` table as the integration point. |
| **AI Integration** | Agentic loop design pattern, tool use architecture, conversation memory strategy using JSONB, multilingual prompt design, why Claude was chosen over GPT-4 for this use case. |
| **Innovation** | "Unlike traditional e-commerce which requires buyers to visit a website and create an account, ApnaBazar's WhatsApp agent meets buyers where they already are — in the messaging app they use 50+ times per day." |
| **Market Fit** | India has 487M WhatsApp users. 63% of Indian SMBs already use WhatsApp for business. This feature directly addresses that existing behavior rather than asking sellers to change how they work. |
| **Scalability Discussion** | Each seller gets their own agent instance via `STORE_SLUG` env var. Horizontal scaling is trivial — deploy one edge function per seller. The stateless edge function + stateful database design means the system scales to any number of concurrent conversations. |
| **Comparison with Alternatives** | Python + Flask + Cloudflare Tunnel (original guide approach) vs Supabase Edge Functions (our approach). Table comparing: deployment complexity, maintenance overhead, cost, scalability, integration with existing codebase. |

---

### 19.17 Future Extensions of the WhatsApp Agent (Write in Report, Don't Implement)

Once the base agent is working, these extensions become possible:

| Extension | Description | Complexity |
|---|---|---|
| **Image-based ordering** | Customer sends a photo of a product they want → Gemini Vision identifies it → agent finds matching product in catalog | Medium |
| **Voice message support** | Customer sends a voice note → Whisper transcribes it → agent processes as text | Medium |
| **Order status updates** | Agent proactively messages customer when seller confirms or ships their order | Low |
| **Multi-seller routing** | One WhatsApp number routes to different stores based on customer's previous interactions | High |
| **Catalog broadcast** | Seller sends new product to agent → agent broadcasts to all previous customers | Medium |
| **Review collection** | After delivery, agent automatically asks customer for a rating | Low |
| **Abandoned cart recovery** | If customer starts an order but doesn't confirm, agent follows up after 2 hours | Medium |
| **Seasonal promotions** | Seller sets a discount period → agent automatically mentions it to all customers | Low |
