# Time Estimation — Pre-Report Implementation Plan

All estimates assume **1 developer working full-time (8 hrs/day)** on a codebase they are already familiar with.

---

## P0 — Must Have (report is incomplete without these)

| # | Item | Days | Details |
|---|------|------|---------|
| 1 | **RBAC** (profiles table, role picker, route guards, RLS updates, admin dashboard) | **3** | New migration, modify Auth.tsx registration flow, create ProtectedRoute.tsx, create Admin.tsx page, update 10+ RLS policies |
| 2 | **Enable Order Flow** (wire up existing dead code) | **1.5** | Enable `placeOrder()` in Storefront.tsx, connect BuyerAuthModal → order insert → OrderConfirmation, test full buyer→seller order lifecycle |
| 3 | **Stock/Inventory Management** | **2** | Migration (stock + low_stock_threshold), UploadZone stock field, bulk inventory editor UI, storefront stock badge, order→decrement logic, low stock toast alert |
| 4 | **Unit Tests (Vitest)** | **2** | `compressImage` test (mock canvas), `useSeller` tests (mock Supabase client), edge function JSON parsing test, i18n key coverage test, setup test config |
| 5 | **E2E Tests (Playwright)** | **1.5** | Auth spec (signup→login→logout), Upload spec (select file → AI → product appears), Storefront spec (visit slug → see products → WhatsApp link), i18n spec (language switch + persistence) |
| 6 | **AI Accuracy Evaluation** | **2** | Collect 30-50 labeled clothing product images, write evaluation script (call edge function → compare output → compute metrics), document results in report-ready format (tables + charts) |
| | **Total P0** | **12 days** | |

---

## P1 — Strongly Recommended (elevates report quality)

| # | Item | Days | Details |
|---|------|------|---------|
| 7 | **Performance Benchmarking** | **1** | Write `scripts/benchmark.ts`: measure compression ratio, upload latency, AI response time (P50/P95/P99), manual vs AI-assisted time-to-publish comparison |
| 8 | **Network Status + Upload ETA** | **1.5** | `useNetworkStatus` hook (online/offline, connection type), upload speed tracking → time estimation display in UploadZone |
| 9 | **App Tour (Onboarding)** | **1** | Install react-joyride or build custom overlay, 4-step walkthrough, persist completion flag |
| 10 | **UI Polish** (skeletons, backgrounds, hero) | **2** | Replace all "Loading..." text with Skeleton components, add landing page hero background, add store banner + theme color customization |
| | **Total P0 + P1** | **17.5 days** | |

---

## P2 — Good to Have (code quality)

| # | Item | Days | Details |
|---|------|------|---------|
| 11 | **DX Improvements** | **1** | Error Boundary, delete `lib/supabase.ts` (consolidate to typed client), add `lib/logger.ts`, add `npm run validate` script, remove `bun.lock` |
| 12 | **Security Hardening** | **1** | Set `verify_jwt = true` in edge function, add rate limiter, validate imageUrl domain + sellerId UUID in edge function |
| | **Total P0 + P1 + P2** | **19.5 days** | |

---

## P3 — Report Content Only (don't implement, mention in Future Scope)

| # | Item | Days |
|---|------|------|
| 13 | **PostHog Analytics** | **0.5** (install + init + 6 track calls in existing components) |
| 14 | **Capacitor Mobile Wrapper** | **2** (install, camera plugin, share plugin, test APK build) |
| 15 | Documentation (`docs/` folder) | 1 (write last) |
| 16 | CI/CD (GitHub Actions) | 0.5 |
| 17 | Responsive mobile nav (bottom tabs) | 1 |
| 18 | Database indexes + soft-delete | 0.5 |

---

## Recommended Paths

| Scenario | Items | Timeline | Verdict |
|----------|-------|----------|---------|
| **Minimum viable** | P0 only | **12 days** | Report-ready. No critical gaps. |
| **Strong report** | P0 + P1 | **17.5 days** | Benchmarked + polished. Excellent viva defense. |
| **Strong report + analytics** | P0 + P1 + PostHog | **18 days** | Real usage data for Results chapter |
| **Full scope + mobile** | P0 + P1 + P2 + PostHog + Capacitor | **22 days** | Everything including mobile APK |

**If you have ≤2 weeks:** Do P0 only (12 days). Write the report alongside.
**If you have 3 weeks:** Do P0 + P1 + PostHog (18 days). You'll have a benchmarked, analytics-powered app.
**If you have 4 weeks:** Do full scope (22 days) including Capacitor mobile APK — max academic impact.

---

## Report Writing Overlap

You don't need to finish all items before starting the report. You can write in parallel:

| Report Section | When to Write | Depends On |
|----------------|---------------|------------|
| Chapter 1: Introduction | Start Day 1 | Nothing |
| Chapter 2: Literature Review | Start Day 1 | Nothing |
| Chapter 3: System Architecture | Day 5+ | RBAC design decisions |
| Chapter 4: Implementation | Day 10+ | Code changes mostly done |
| Chapter 5: Testing | Day 14+ | Tests written |
| Chapter 6: Results | Day 16+ | AI eval + benchmarks done |
| Chapter 7: Future Scope | Day 18+ | All decisions finalized |
