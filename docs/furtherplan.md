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
