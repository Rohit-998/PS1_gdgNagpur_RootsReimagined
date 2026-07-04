# MediGuard — MLH Hackathon Implementation Plan (Refactored)
> **2-person team · 24–36 hour sprint · Completion probability: >90%**

---

## MLH Judging Alignment

| MLH Criterion | How MediGuard Addresses It |
|---|---|
| **Technical Implementation** | 6-layer cryptographic verification engine, hash-chain tamper detection, MongoDB Atlas cloud DB |
| **Design** | Sleek light enterprise UI, animated trust score, step-by-step supply chain timeline |
| **Completion** | 4 focused pages, no scope creep, every feature directly serves medicine verification |
| **Real-World Impact** | WHO estimates 1 in 10 medicines in developing countries is fake — this is a live, working solution |
| **Wow Factor** | Side-by-side demo catches a fake in seconds; animated 6-layer breakdown is visually compelling |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router) |
| Styling | Vanilla CSS (light theme, clean enterprise) |
| Database | MongoDB Atlas (via Mongoose) |
| API Layer | Next.js Route Handlers (`app/api/`) |
| QR Scanning | html5-qrcode |
| QR Generation | qrcode.js (for demo QR codes) |
| Hashing | Node.js `crypto` module (SHA-256) |
| Icons | Lucide React |

> **Removed from stack:** Recharts (no dashboard), Sarvam AI (moved to Future scope), React Router (Next.js App Router handles routing natively).
> Voice verification can be added in hours 30–36 **only if** core MVP is fully stable.

---

## Folder Structure

```
mediguard/
├── public/
│   └── demo-qr/                    # Printed QR images for demo table
├── src/
│   ├── app/                         # Next.js App Router root
│   │   ├── layout.js                # Root layout (Navbar, global CSS)
│   │   ├── page.js                  # HomePage — / route
│   │   ├── globals.css              # Full design system + all component styles
│   │   ├── scan/
│   │   │   └── page.js              # ScanPage — /scan
│   │   ├── results/
│   │   │   └── page.js              # ResultsPage — /results?batch=...&serial=...
│   │   ├── demo/
│   │   │   └── page.js              # DemoPage — /demo
│   │   └── api/                     # Next.js Route Handlers (server-side)
│   │       ├── verify/
│   │       │   └── route.js         # POST /api/verify — runs 6-layer engine
│   │       ├── scan-logs/
│   │       │   └── route.js         # POST /api/scan-logs — write scan record
│   │       └── recent-scans/
│   │           └── route.js         # GET /api/recent-scans — last 5 scans
│   ├── components/
│   │   ├── layout/
│   │   │   └── Navbar.jsx
│   │   ├── scanner/
│   │   │   ├── QRScanner.jsx        # Camera-based QR scanner (client component)
│   │   │   └── ManualEntry.jsx      # Type batch number manually
│   │   ├── verification/
│   │   │   ├── TrustScore.jsx       # Animated circular score (0-100)
│   │   │   ├── LayerResults.jsx     # 6 verification layer cards
│   │   │   └── SupplyChain.jsx      # Animated supply chain timeline
│   │   ├── demo/
│   │   │   └── SideBySide.jsx       # Current system vs MediGuard
│   │   └── ui/
│   │       ├── Button.jsx
│   │       ├── Card.jsx
│   │       └── StatusBadge.jsx      # Genuine / Suspicious / Counterfeit
│   ├── lib/
│   │   ├── mongodb.js               # MongoDB Atlas connection (Mongoose)
│   │   ├── models/
│   │   │   ├── Manufacturer.js      # Mongoose schema
│   │   │   ├── Medicine.js
│   │   │   ├── SupplyChainEvent.js
│   │   │   └── ScanLog.js
│   │   ├── verification.js          # 6-layer engine (runs in API route)
│   │   ├── hashChain.js             # Hash-chain simulation
│   │   └── qrGenerator.js           # Generate demo QR codes
│   ├── data/
│   │   ├── medicines.js             # 10 sample medicines (seed source)
│   │   └── supplyChains.js          # Supply chain event journeys
│   └── utils/
│       ├── crypto.js                # SHA-256 hash functions
│       ├── scoring.js               # Trust score calculator
│       └── geoCheck.js              # Location/region verification
├── scripts/
│   └── seedData.js                  # Seed MongoDB with demo medicines
├── .env.local
├── .env.example
├── next.config.mjs
├── package.json
└── README.md
```

**Key Next.js conventions:**
- All pages are `page.js` files inside `app/` subdirectories
- Verification logic runs **server-side** in `app/api/` route handlers — secrets never reach the browser
- QR scanner and animated components marked `'use client'` where browser APIs are needed
- `lib/mongodb.js` uses a cached connection to avoid exhausting Atlas connections in dev

**Removed:** `components/dashboard/`, `components/voice/`, `services/sarvamAI.js`, `data/scanHistory.js`

---

## Database Schema (MongoDB Atlas)

> Collections use Mongoose schemas. All `_id` fields are MongoDB `ObjectId` unless noted.

### Collection: `manufacturers`
| Field | Type | Description |
|---|---|---|
| _id | ObjectId | Auto-generated primary key |
| name | String | "Sun Pharma", "Cipla", etc. |
| country | String | Country of origin |
| verified | Boolean | Is this a real manufacturer? |
| secret_key | String | Used for hash generation (server-side only) |

### Collection: `medicines`
| Field | Type | Description |
|---|---|---|
| _id | ObjectId | Auto-generated primary key |
| name | String | "Paracetamol 500mg" |
| manufacturer_id | ObjectId | Ref → manufacturers |
| batch_id | String | "BATCH-2024-SP-4821" (indexed, unique) |
| serial_number | String | Unique per box (indexed, unique) |
| hash | String | SHA-256(batch_id + serial_number + secret_key) |
| mfg_date | Date | Manufacturing date |
| exp_date | Date | Expiry date |
| is_genuine | Boolean | For demo: true/false |
| authorized_region | String | "India-Maharashtra" |

### Collection: `supply_chain_events`
| Field | Type | Description |
|---|---|---|
| _id | ObjectId | Auto-generated primary key |
| medicine_id | ObjectId | Ref → medicines |
| event_type | String | "manufactured", "qa_passed", "shipped", "received" |
| location | String | "Hyderabad Factory" |
| timestamp | Date | When this event occurred |
| prev_hash | String | Hash of previous event (hash-chain link) |
| event_hash | String | SHA-256 of this event + prev_hash |

### Collection: `scan_logs`
| Field | Type | Description |
|---|---|---|
| _id | ObjectId | Auto-generated primary key |
| medicine_id | ObjectId | Ref → medicines |
| scanned_at | Date | When scanned (default: Date.now) |
| location_lat | Number | Scanner's latitude |
| location_lng | Number | Scanner's longitude |
| location_city | String | Approximate city |
| result_score | Number | Trust score given (0–100) |

> **Removed collection:** `pharmacies` — no leaderboard, no pharmacy trust scoring in MVP.
> **Atlas config:** Free M0 cluster is sufficient for the hackathon. Enable IP whitelist for `0.0.0.0/0` during demo.

---

## Pages

### Page 1: HomePage — Landing + Hero
- Hero: bold headline + WHO statistic ("1 in 10 medicines is fake")
- How it works: 3-step visual (Scan → Verify → Know)
- Feature highlights: 6-layer verification, hash-chain tamper detection, instant verdict
- CTAs: **"Scan Medicine"** / **"View Demo"**

### Page 2: ScanPage — QR Scanner + Manual Entry
- Live camera feed with QR overlay animation
- Tab toggle: **Camera Scan** / **Manual Entry**
- Manual entry: batch ID + serial number fields
- Recent scans list (last 5 fetched from `GET /api/recent-scans`)
- On success → `router.push('/results?batch=...&serial=...')` via Next.js router

### Page 3: ResultsPage — Verification Results
- Animated trust score circle (0–100, color-coded green/yellow/red)
- Verdict badge: **GENUINE** / **SUSPICIOUS** / **COUNTERFEIT**
- Medicine info card (name, manufacturer, batch, dates)
- 6 verification layer cards (icon + pass/fail + score + explanation)
- Animated supply chain timeline (node-by-node reveal)
- Actions: **"Scan Another"** / **"Report Issue"**

### Page 4: DemoPage — Side-by-Side Comparison *(Demo Weapon)*
- Split screen: **Left = Old System** / **Right = MediGuard**
- Left: barcode scan → "✅ Verified" (wrong — shows the problem)
- Right: QR scan → 6 layers run → "🚨 Counterfeit Detected"
- Animated step-by-step comparison
- Scenario selector: A (Fake Batch) / B (Cloned QR) / C (Diverted) / D (Expired)

> **Removed:** `DashboardPage` — analytics, leaderboards, hotspot maps → Future scope.

---

## Core Logic: Verification Engine

```javascript
// lib/verification.js — runs server-side in app/api/verify/route.js
// Uses Node.js crypto (not Web Crypto API) since this is a Next.js API route

async function verifyMedicine(qrData) {
  const results = {};
  let totalScore = 0;

  // Layer 1: Batch Existence Check (30 pts)
  const medicine = await lookupBatch(qrData.batch_id);
  results.batchCheck = {
    passed: !!medicine,
    score: medicine ? 30 : 0,
    message: medicine
      ? "Batch found in manufacturer database"
      : "Batch number not found — likely counterfeit"
  };
  totalScore += results.batchCheck.score;

  // Layer 2: Cryptographic Hash Validation (25 pts)
  if (medicine) {
    const expectedHash = await computeHash(
      qrData.batch_id, qrData.serial, medicine.secret_key
    );
    const hashValid = expectedHash === qrData.hash;
    results.hashCheck = {
      passed: hashValid,
      score: hashValid ? 25 : 0,
      message: hashValid
        ? "Cryptographic signature verified — data unaltered"
        : "Hash mismatch — QR code has been tampered with"
    };
    totalScore += results.hashCheck.score;
  }

  // Layer 3: Scan Frequency Detection (20 pts)
  const scanCount = await getScanCount(qrData.serial);
  const scanScore = scanCount <= 2 ? 20 : scanCount <= 5 ? 10 : scanCount <= 50 ? 5 : 0;
  results.scanFrequency = {
    passed: scanCount <= 2,
    score: scanScore,
    scanCount,
    message: scanCount <= 2
      ? `Scanned ${scanCount} time(s) — normal usage`
      : `Scanned ${scanCount} times — likely cloned QR code`
  };
  totalScore += scanScore;

  // Layer 4: Geographic Validation (10 pts)
  const userLocation = await getUserLocation();
  const geoMatch = checkGeoMatch(userLocation, medicine?.authorized_region);
  results.geoCheck = {
    passed: geoMatch,
    score: geoMatch ? 10 : 0,
    message: geoMatch
      ? "Location matches authorized distribution region"
      : `Batch authorized for ${medicine?.authorized_region} — scanned outside region`
  };
  totalScore += results.geoCheck.score;

  // Layer 5: Temporal Validation (10 pts)
  const datesValid = validateDates(medicine?.mfg_date, medicine?.exp_date);
  results.temporalCheck = {
    passed: datesValid,
    score: datesValid ? 10 : 0,
    message: datesValid
      ? "Manufacturing and expiry dates are valid"
      : "Date anomaly detected — possibly relabeled"
  };
  totalScore += results.temporalCheck.score;

  // Layer 6: Supply Chain Hash-Chain Validation (5 pts)
  const chain = await getSupplyChainEvents(medicine?.id);
  const chainIntact = validateHashChain(chain);
  results.supplyChain = {
    passed: chainIntact,
    score: chainIntact ? 5 : 0,
    chain,
    message: chainIntact
      ? "Supply chain complete — all nodes cryptographically verified"
      : "Supply chain integrity broken — event tampering detected"
  };
  totalScore += results.supplyChain.score;

  await logScan(medicine?.id, totalScore, userLocation);

  return {
    medicine,
    results,
    totalScore,
    verdict: totalScore >= 80 ? "genuine" : totalScore >= 40 ? "suspicious" : "counterfeit"
  };
}
```

### Hash-Chain Simulation

```javascript
// services/hashChain.js
async function validateHashChain(events) {
  for (let i = 1; i < events.length; i++) {
    const expectedPrevHash = events[i - 1].event_hash;
    if (events[i].prev_hash !== expectedPrevHash) return false;
    const recomputed = await computeEventHash(events[i], events[i].prev_hash);
    if (recomputed !== events[i].event_hash) return false;
  }
  return true;
}
```

---

## Sample Medicine Data

### Genuine Medicines ✅
| Name | Batch | Manufacturer | Score |
|---|---|---|---|
| Paracetamol 500mg | BATCH-SUN-2024-001 | Sun Pharma | 100 — Genuine |
| Amoxicillin 250mg | BATCH-CIP-2024-015 | Cipla | 95 — Genuine |
| Metformin 500mg | BATCH-DRL-2024-008 | Dr. Reddy's | 90 — Genuine |

### Counterfeit Scenarios 🚨
| # | Scenario | What's Wrong | Caught By | Score |
|---|---|---|---|---|
| A | Fake Paracetamol | Batch doesn't exist | Layer 1 — Batch Check | 0 |
| B | Cloned Amoxicillin | Same QR scanned 847 times | Layer 3 — Scan Frequency | 15 |
| C | Diverted Insulin | Shipped to Nigeria, sold in India | Layer 4 — Geo Check | 65 |
| D | Expired Cough Syrup | Expired, relabeled with future date | Layer 5 — Temporal | 70 |

Each scenario has a pre-printed QR in `public/demo-qr/` for live demo use.

---

## Team Task Allocation (2-Person · 24–36 Hours)

### Person A — Frontend & UI
| Task | Hours | Priority |
|---|---|---|
| Project setup (Next.js App Router + MongoDB connection) | 0–1 | 🔴 |
| Design system (CSS variables, light theme, clean borders) | 1–3 | 🔴 |
| HomePage (hero, stats, 3-step how-it-works, CTAs) | 3–6 | 🔴 |
| ScanPage (QR scanner + manual entry tabs) | 6–10 | 🔴 |
| ResultsPage (trust score circle, layer cards, supply chain) | 10–17 | 🔴 |
| DemoPage (split screen, 4 scenario selector) | 17–22 | 🔴 |
| Polish: animations, transitions, mobile layout | 22–24 | 🟡 |
| Integration testing + bug fixes | 24–30 | 🔴 |
| Demo prep: QR printouts, rehearsal | 30–36 | 🔴 |

### Person B — Backend & Verification Engine
| Task | Hours | Priority |
|---|---|---|
| MongoDB collections & schemas creation | 0–2 | 🔴 |
| Seed script: 3 genuine + 4 counterfeit + supply chains | 2–4 | 🔴 |
| Verification engine (all 6 layers) | 4–10 | 🔴 |
| Hash-chain simulation + supply chain validator | 10–14 | 🔴 |
| QR code generation for all demo medicines | 14–16 | 🔴 |
| Scan logging to MongoDB | 16–18 | 🔴 |
| Wire frontend ↔ MongoDB end-to-end | 18–24 | 🔴 |
| Integration testing + bug fixes | 24–30 | 🔴 |
| Demo prep + README | 30–36 | 🔴 |

### Bonus (Hours 30–36, only if core is stable)
| Task | Who |
|---|---|
| VoicePage — Sarvam AI STT/TTS (Hindi/Tamil/Telugu) | B (API) + A (UI) |
| Animated scan history on ScanPage | A |

> ⚠️ **Rule:** Do NOT start bonus tasks until all 4 core pages are working end-to-end.

---

## Build Order

```
HOUR  0– 2  │ Setup: Next.js project, MongoDB schema, sample data seeded
HOUR  2– 4  │ Core logic: verification.js + crypto.js unit-tested in isolation
HOUR  4–10  │ ScanPage + ResultsPage wired to real MongoDB API routes
HOUR 10–16  │ HomePage (hero, polish) + DemoPage (split screen)
HOUR 16–22  │ Supply chain timeline animation + layer card animations
HOUR 22–24  │ End-to-end: scan a real QR → see full results in browser
HOUR 24–30  │ Bug fixes, edge cases, mobile layout check
HOUR 30–36  │ Demo rehearsal, README, screenshots, optional Voice page
```

---

## Environment Variables (.env.local)

```
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/mediguard?retryWrites=true&w=majority
MEDIGUARD_SECRET_KEY=mediguard_demo_secret_2026
```

> - `MONGODB_URI` — never exposed to the browser; only used in `lib/mongodb.js` and API routes
> - `MEDIGUARD_SECRET_KEY` — used server-side only for hash computation in the verification engine
> - **No `NEXT_PUBLIC_` prefix** on sensitive vars — they stay server-side
> - **Deferred:** `SARVAM_API_KEY` — not in MVP core. Add server-side only (no `NEXT_PUBLIC_` prefix) when building the bonus Voice page.

---

## MVP Feature Checklist

| Feature | Status |
|---|---|
| Landing Page | ✅ In scope |
| QR Scanner (camera) | ✅ In scope |
| Manual Batch Entry | ✅ In scope |
| MongoDB Atlas Database | ✅ In scope |
| Medicine Dataset (10 entries) | ✅ In scope |
| Verification Engine (6 layers) | ✅ In scope |
| Trust Score System (0–100) | ✅ In scope |
| Results Page | ✅ In scope |
| Demo Comparison Page | ✅ In scope |
| Supply Chain Visualization | ✅ In scope (hash-chain simulation) |
| Scan Logging | ✅ In scope |
| Real Blockchain | ❌ Removed — hash-chain simulation instead |
| Dashboard / Analytics | ❌ Removed — Future scope |
| Lives Saved Counter | ❌ Removed |
| Pharmacy Leaderboards | ❌ Removed |
| Pharmacy Trust Scores | ❌ Removed |
| Counterfeit Hotspot Maps | ❌ Removed |

---

## Future Implementation

> Mention these in the pitch as "Phase 2" — they add vision without scope risk.

| Feature | Why Deferred |
|---|---|
| Voice Verification (Sarvam AI) | API risk at demo time; bonus if stable |
| Multilingual Voice Assistant | Depends on Voice working first |
| AI Counterfeit Risk Prediction | Needs training data; pitch as ML roadmap |
| Pharmacy Trust Network | Requires pharmacy onboarding |
| Regional Counterfeit Analytics | Needs sustained scan volume |
| Counterfeit Hotspot Mapping | Depends on analytics |
| Manufacturer Portal | Separate B2B product surface |
| Government Regulatory Dashboard | Compliance/regulatory scope |
| Real Manufacturer API Integrations | Requires signed pharma agreements |
| National Drug Registry Integration | Government data access required |

---

## Demo Flow (What Judges Will Experience)

```
Step 1 — LANDING PAGE (30 sec)
  "1 in 10 medicines is counterfeit" — real problem, real stakes

Step 2 — DEMO PAGE (lead with this, 2 min)
  Left (Old System):  barcode scan → ✅ "Verified"  ← WRONG
  Right (MediGuard):  QR scan → 6 layers → 🚨 "COUNTERFEIT — Cloned QR Detected"
  The problem is visible. The solution is immediate.

Step 3 — LIVE SCAN: Genuine medicine (1 min)
  QR scan → animated score builds to 100/100 → GENUINE ✅
  Works live, in front of the judges.

Step 4 — LIVE SCAN: Counterfeit, Scenario B — cloned QR (1 min)
  QR scan → score drops to 15/100 → COUNTERFEIT 🚨
  Layer 3 card: "Scanned 847 times — QR code has been cloned"
  Judges see exactly HOW it caught the fake.

Step 5 — SUPPLY CHAIN TIMELINE (30 sec)
  Hyderabad Factory → QA Check → Mumbai Distributor → Delhi Pharmacy
  Each node has a verified hash link — transparent, tamper-evident.

Step 6 — PITCH CLOSE
  "We built a working, real-time counterfeit detection system using
   cryptographic verification, hash-chain integrity, and 6-layer analysis
   — all in 24 hours. Next: voice verification in 8 Indian languages."
```

---

## What Was Cut and Why

| Cut Feature | Reason |
|---|---|
| DashboardPage | Empty charts from zero real data hurt credibility |
| Pharmacy Leaderboards | Requires pharmacies to use the app — impossible in 24h |
| Lives Saved Counter | Vanity metric; judges see through it |
| Real Blockchain | High implementation risk; hash-chain achieves same demo value |
| Sarvam AI (core) | API failures at demo time are catastrophic; moved to bonus |
| Recharts | No dashboard = no charts needed |
| Person C tasks | 2-person team; all tasks redistributed with clear ownership |
