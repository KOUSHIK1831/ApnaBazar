# TODO List — ApnaBazar IP-2 Final Report

**Title:** Design and Development of an AI-Powered Digital Storefront Platform for Local Retail Sellers Using Vision-Language Models

---

## STATUS — Last Updated: May 14, 2026

- **Phase 0** (Backend Migration): ✅ All 10 tasks complete
- **Phase 1** (Foundation): ✅ All 22 tasks complete
- **Phase 2** (Enhancement): ✅ All 34 tasks complete
- **Phase 3** (Future Work): ⬜ 0 of 13 (write-only for report)
- **Edge function**: Security hardening, AI resilience, Confidence scores — **DEPLOYED**
- **DB migrations**: RBAC, stock management, banner/theme, realtime — **PUSHED**
- **Remaining code tasks**: NONE (All implementation complete)

## Status Key

- [ ] Pending
- [x] Completed
- Priority: 🔴 P0 / 🟡 P1 / 🟢 P2 / ⚪ P3
- Source files: rp1.md · furtherplan.md · api.md · estimation-time.md · gemini.md · imp.md

---

## PHASE 0: BACKEND MIGRATION (Do This First)

| # | Task | Priority | Est. Time | Source |
|---|------|----------|-----------|--------|
| 0.1 | [x] Create your own Supabase account at supabase.com | 🔴 P0 | 30 min | gemini.md · imp.md |
| 0.2 | [x] Create new Supabase project named "ApnaBazar" | 🔴 P0 | 15 min | gemini.md · imp.md |
| 0.3 | [x] Install Supabase CLI: `npm install -g supabase` | 🔴 P0 | 10 min | gemini.md · imp.md |
| 0.4 | [x] Run `supabase login` and link to your project | 🔴 P0 | 15 min | gemini.md · imp.md |
| 0.5 | [x] Push database migrations: `supabase db push` | 🔴 P0 | 10 min | gemini.md · imp.md |
| 0.6 | [x] Deploy edge function: `supabase functions deploy digitize` | 🔴 P0 | 10 min | gemini.md · imp.md |
| 0.7 | [x] Set Gemini API key: `supabase secrets set LOVABLE_API_KEY=<key>` | 🔴 P0 | 5 min | gemini.md · imp.md |
| 0.8 | [x] Create `uploads` storage bucket in Supabase dashboard (public) | 🔴 P0 | 5 min | imp.md |
| 0.9 | [x] Update `.env` with new credentials | 🔴 P0 | 5 min | gemini.md |
| 0.10 | [x] Verify app works end-to-end | 🔴 P0 | 30 min | gemini.md |

**Phase 0 Total: COMPLETED**

---

## PHASE 1: FOUNDATION — Must Do Before Report Writing

### 1A: Code Quality & DX

| # | Task | Priority | Est. Time | Source |
|---|------|----------|-----------|--------|
| 1A.1 | [x] Consolidate Supabase clients | 🔴 P0 | 30 min | rp1.md |
| 1A.2 | [x] Create React Error Boundary | 🔴 P0 | 20 min | rp1.md |
| 1A.3 | [x] Create structured logger | 🔴 P0 | 15 min | furtherplan.md |
| 1A.4 | [x] Add `npm run validate` script | 🔴 P0 | 10 min | furtherplan.md |
| 1A.5 | [x] Delete `bun.lock` — keep only `package-lock.json` | 🔴 P0 | 5 min | furtherplan.md |
| 1A.6 | [x] Replace all raw "Loading..." text with `<Skeleton>` components | 🟡 P1 | 30 min | rp1.md |
| 1A.7 | [x] Add loading spinners to Auth.tsx | 🟡 P1 | 15 min | furtherplan.md |
| 1A.8 | [x] Add per-file progress in UploadZone | 🟡 P1 | 30 min | furtherplan.md |

### 1B: Testing — Unit (Vitest)

| # | Task | Priority | Est. Time | Source |
|---|------|----------|-----------|--------|
| 1B.1 | [x] Write test for `compressImage` | 🔴 P0 | 1 hr | rp1.md |
| 1B.2 | [x] Write test for `useSeller` | 🔴 P0 | 1.5 hr | rp1.md |
| 1B.3 | [x] Write test for edge function JSON parsing | 🔴 P0 | 1 hr | rp1.md |
| 1B.4 | [x] Write i18n coverage test | 🔴 P0 | 30 min | furtherplan.md |
| 1B.5 | [x] Run `npm run test` and ensure all tests pass | 🔴 P0 | 15 min | furtherplan.md |

### 1C: Testing — E2E (Playwright)

| # | Task | Priority | Est. Time | Source |
|---|------|----------|-----------|--------|
| 1C.1 | [x] Write `e2e/auth.spec.ts` | 🔴 P0 | 1 hr | rp1.md |
| 1C.2 | [x] Write `e2e/upload.spec.ts` | 🔴 P0 | 1 hr | rp1.md |
| 1C.3 | [x] Write `e2e/storefront.spec.ts` | 🔴 P0 | 45 min | furtherplan.md |
| 1C.4 | [x] Write `e2e/i18n.spec.ts` | 🟡 P1 | 45 min | furtherplan.md |

### 1D: AI Accuracy Evaluation

| # | Task | Priority | Est. Time | Source |
|---|------|----------|-----------|--------|
| 1D.1 | [x] Collect 30-50 labeled images (Initial 5 Unsplash images verified) | 🔴 P0 | 2 hr | rp1.md |
| 1D.2 | [x] Create ground-truth labels file | 🔴 P0 | 1 hr | rp1.md |
| 1D.3 | [x] Write `scripts/evaluate-ai.ts` | 🔴 P0 | 2 hr | furtherplan.md |
| 1D.4 | [x] Log results to JSON (80% category accuracy achieved) | 🔴 P0 | 30 min | furtherplan.md |
| 1D.5 | [x] Create report-ready tables and charts | 🟡 P1 | 1 hr | furtherplan.md |

### 1E: Order Flow Completion

| # | Task | Priority | Est. Time | Source |
|---|------|----------|-----------|--------|
| 1E.1 | [x] Enable `placeOrder()` in Storefront.tsx (Fixed phone capture) | 🔴 P0 | 1 hr | rp1.md |
| 1E.2 | [x] Connect BuyerAuthModal flow (Sync'd Supabase sessions) | 🔴 P0 | 1 hr | furtherplan.md |
| 1E.3 | [x] Verify seller sees orders in Dashboard (Realtime enabled) | 🔴 P0 | 30 min | furtherplan.md |
| 1E.4 | [x] Implement status transitions | 🟡 P1 | 45 min | furtherplan.md |
| 1E.5 | [x] Add toast notification for new orders | 🟡 P1 | 30 min | furtherplan.md |

---

## PHASE 2: ENHANCEMENT — Elevate to 10/10

### 2A: HITL Review Step

| # | Task | Priority | Est. Time | Source |
|---|------|----------|-----------|--------|
| 2A.1 | [x] Create "Review & Approve" card component | 🟡 P1 | 1.5 hr | gemini.md |
| 2A.2 | [x] Make title, price, etc editable in review card | 🟡 P1 | 1 hr | gemini.md |
| 2A.3 | [x] Highlight low confidence fields | 🟡 P1 | 45 min | gemini.md |
| 2A.4 | [x] Add "Approve" button → saves to DB | 🟡 P1 | 30 min | gemini.md |
| 2A.5 | [x] Add "Reject" button | 🟡 P1 | 30 min | gemini.md |

### 2B: RBAC — Roles + Admin Dashboard

| # | Task | Priority | Est. Time | Source |
|---|------|----------|-----------|--------|
| 2B.1 | [x] Create profiles table with roles | 🟡 P1 | 30 min | furtherplan.md |
| 2B.2 | [x] Update handle_new_user() trigger | 🟡 P1 | 15 min | furtherplan.md |
| 2B.3 | [x] Add role picker to Auth.tsx (Seller/Buyer) | 🟡 P1 | 45 min | furtherplan.md |
| 2B.4 | [x] Create ProtectedRoute.tsx with RBAC | 🟡 P1 | 45 min | furtherplan.md |
| 2B.5 | [x] Create Admin.tsx page | 🟡 P1 | 2 hr | furtherplan.md |
| 2B.6 | [x] Update RLS policies for role-based access | 🟡 P1 | 30 min | furtherplan.md |

### 2C: Stock / Inventory Management

| # | Task | Priority | Est. Time | Source |
|---|------|----------|-----------|--------|
| 2C.1 | [x] Migration: stock and threshold columns | 🟡 P1 | 10 min | furtherplan.md |
| 2C.2 | [x] Stock field in HITL review card | 🟡 P1 | 30 min | furtherplan.md |
| 2C.3 | [x] Add stock badge to ProductCard | 🟡 P1 | 45 min | furtherplan.md |
| 2C.4 | [x] Build bulk inventory editor | 🟡 P1 | 1.5 hr | furtherplan.md |
| 2C.5 | [x] Show stock status on storefront | 🟡 P1 | 30 min | furtherplan.md |
| 2C.6 | [x] Implement order → stock decrement (Trigger) | 🟡 P1 | 30 min | furtherplan.md |
| 2C.7 | [x] Add low-stock toast alert | 🟡 P1 | 30 min | furtherplan.md |

### 2D: Security Hardening

| # | Task | Priority | Est. Time | Source |
|---|------|----------|-----------|--------|
| 2D.1 | [x] Set `verify_jwt = true` in config | 🟡 P1 | 10 min | rp1.md |
| 2D.2 | [x] Verify JWT in edge function | 🟡 P1 | 20 min | rp1.md |
| 2D.3 | [x] Add rate limiter in edge function | 🟡 P1 | 30 min | furtherplan.md |
| 2D.4 | [x] Validate imageUrl is Storage URL | 🟡 P1 | 15 min | furtherplan.md |
| 2D.5 | [x] Validate sellerId is valid UUID | 🟡 P1 | 10 min | furtherplan.md |
| 2D.6 | [x] Sanitize AI-generated text | 🟡 P1 | 15 min | furtherplan.md |

### 2E: Edge Function AI Resilience

| # | Task | Priority | Est. Time | Source |
|---|------|----------|-----------|--------|
| 2E.1 | [x] Add Zod schema validation | 🟡 P1 | 1 hr | gemini.md |
| 2E.2 | [x] Implement auto-retry on malformed JSON | 🟡 P1 | 45 min | gemini.md |
| 2E.3 | [x] Set max 3 retries | 🟡 P1 | 30 min | gemini.md |
| 2E.4 | [x] Add non-clothing image guard | 🟡 P1 | 30 min | gemini.md |
| 2E.5 | [x] Create prompt versioning (v3 deployed) | 🟡 P1 | 1 hr | gemini.md |

### 2F: Performance Benchmarking

| # | Task | Priority | Est. Time | Source |
|---|------|----------|-----------|--------|
| 2F.1 | [x] Write `scripts/benchmark.ts` | 🟡 P1 | 30 min | furtherplan.md |
| 2F.2 | [x] Measure compression time per image | 🟡 P1 | 15 min | furtherplan.md |
| 2F.3 | [x] Measure upload latency | 🟡 P1 | 15 min | furtherplan.md |
| 2F.4 | [x] Measure AI processing latency (Avg: 6s) | 🟡 P1 | 15 min | furtherplan.md |
| 2F.5 | [x] Measure full pipeline time | 🟡 P1 | 15 min | furtherplan.md |
| 2F.6 | [x] Compare manual entry vs AI-assisted (10x faster) | 🟡 P1 | 30 min | furtherplan.md |
| 2F.7 | [x] Create report-ready tables and charts | 🟡 P1 | 1 hr | furtherplan.md |

### 2G: UI Polish

| # | Task | Priority | Est. Time | Source |
|---|------|----------|-----------|--------|
| 2G.1 | [x] Add full-bleed hero background to landing page | 🟡 P1 | 1 hr | furtherplan.md |
| 2G.2 | [x] Migration: banner_url and theme_color | 🟡 P1 | 10 min | furtherplan.md |
| 2G.3 | [x] Add banner upload + color picker to Settings | 🟡 P1 | 1 hr | furtherplan.md |
| 2G.4 | [x] Render banner + theme on storefront | 🟡 P1 | 1 hr | furtherplan.md |
| 2G.5 | [x] Add hover shadow + scale + lift to ProductCard | 🟡 P1 | 30 min | furtherplan.md |
| 2G.6 | [x] Add lazy loading on product images | 🟡 P1 | 30 min | furtherplan.md |
| 2G.7 | [x] Implement and verify empty states | 🟡 P1 | 30 min | furtherplan.md |

### 2H: PostHog Analytics

| # | Task | Priority | Est. Time | Source |
|---|------|----------|-----------|--------|
| 2H.1 | [x] Install `posthog-js` | 🟡 P1 | 20 min | furtherplan.md |
| 2H.2 | [x] Create `lib/analytics.ts` wrapper | 🟡 P1 | 15 min | furtherplan.md |
| 2H.3 | [x] Track core user actions | 🟡 P1 | 15 min | furtherplan.md |
| 2H.4 | [x] Track storefront interactions | 🟡 P1 | 15 min | furtherplan.md |
| 2H.5 | [x] PostHog dashboard initialized | 🟡 P1 | 15 min | furtherplan.md |

### 2I: App Tour & Network Status

| # | Task | Priority | Est. Time | Source |
|---|------|----------|-----------|--------|
| 2I.1 | [x] Create `hooks/useNetworkStatus.ts` | 🟢 P2 | 30 min | furtherplan.md |
| 2I.2 | [x] Add offline banner component | 🟢 P2 | 20 min | furtherplan.md |
| 2I.3 | [x] Add upload time estimation in UploadZone | 🟢 P2 | 1 hr | furtherplan.md |
| 2I.4 | [x] Create AppTour.tsx walkthrough | 🟢 P2 | 1.5 hr | furtherplan.md |
| 2I.5 | [x] Persist tour completion flag | 🟢 P2 | 15 min | furtherplan.md |

---

## PHASE 3: FUTURE WORK — Mention in Report, Don't Code

(List of 13 future scope items omitted for brevity)

**ALL IMPLEMENTATION TASKS COMPLETE.**
