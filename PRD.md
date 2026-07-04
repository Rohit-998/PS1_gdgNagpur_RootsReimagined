# SafeDose — Product Requirements Document

## Problem Statement
Counterfeit medicines are a $200B+ global problem, causing ~1 million deaths annually. In India alone, 25% of medicines sold are estimated to be substandard or falsified. Consumers have no reliable way to verify medicine authenticity at the point of purchase.

## Solution
SafeDose is a **multi-layer pharmaceutical verification platform** that enables consumers, pharmacies, and manufacturers to verify medicine authenticity in real-time using QR code scanning, cryptographic validation, and AI-powered analysis.

---

## Target Users

| User Type | Need |
|-----------|------|
| **Consumer** | Scan medicine QR → instant authenticity verdict |
| **Pharmacy** | Inventory verification, supply chain tracking |
| **Manufacturer** | Batch registration, QR generation, recall management |
| **Regulator** | Counterfeit reports, geographic heatmaps |

---

## Core Features

### 1. QR Code Verification (MVP)
- Scan medicine QR code via camera or image upload
- Manual entry fallback (batch ID + serial number)
- Six-layer verification with real-time progress animation
- Trust score (0–100) with verdict: Verified / Suspicious / Counterfeit

### 2. Six-Layer Verification Engine
| Layer | Points | What It Checks |
|-------|--------|----------------|
| Batch Validation | 30 | Does the batch exist in manufacturer records? |
| Cryptographic Hash | 25 | SHA-256 hash match or RSA signature verification |
| Clone Detection | 20 | Has this QR been scanned by multiple different users? |
| Geographic Validation | 10 | Is the medicine in its authorized distribution region? |
| Temporal Validation | 10 | Is the medicine expired or future-dated? |
| Supply Chain Integrity | 5 | Are all supply chain checkpoints verified? |

### 3. AI Analysis (Gemini 2.0 Flash)
- Contextual analysis of verification results
- Risk factor identification
- Plain-language explanation for non-technical users
- Fallback to rule-based analysis if API unavailable

### 4. Voice Assistant (Sarvam AI)
- Speak medicine name → voice verification result
- Multi-language support (12 Indian languages)
- Auto-detect language from user's geographic location
- Rural Education Mode: AI explains medicine in simple terms

### 5. Counterfeit Reporting
- Manual form with pharmacy details
- Voice-guided reporting (AI asks questions, user speaks)
- Multi-language voice prompts
- OTP verification for report authenticity

### 6. Supply Chain Tracking
- Real-time shipment tracking with map visualization
- Checkpoint-by-checkpoint progress
- Delay detection and behind-schedule alerts
- Create/advance/cancel shipments

### 7. Role-Based Dashboards
- **Consumer**: Scan history, stats, quick actions
- **Company**: Batch management, QR generation, analytics
- **Pharmacy**: Inventory verification, supply chain monitoring

### 8. ChatBot (Gemini AI)
- Context-aware pharmaceutical Q&A
- Knows about the medicine being viewed
- Supports Hindi and English
- Floating widget on all pages

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | JavaScript (ES modules) |
| Styling | Vanilla CSS (CSS modules + global vars) |
| Database | MongoDB Atlas (Mongoose ODM) |
| AI/LLM | Google Gemini 2.0 Flash |
| Voice TTS/STT | Sarvam AI API |
| Auth | Custom JWT + Google OAuth |
| Maps | Leaflet + React-Leaflet |
| 3D | Three.js + React Three Fiber |
| Animations | Framer Motion + GSAP |
| QR Scanning | jsQR (client-side) |
| QR Generation | qrcode (server-side) |
| Icons | Lucide React |
| SMS/OTP | Twilio |

---

## API Routes

### Authentication
- `POST /api/auth/register` — Create account
- `POST /api/auth/login` — Email/password login
- `POST /api/auth/google` — Google OAuth
- `GET /api/user/role` — Get user role

### Verification
- `POST /api/verify` — Core QR verification endpoint
- `GET /api/medicine/[batchId]` — Lookup medicine by batch

### Reporting
- `POST /api/report` — Generate counterfeit report
- `POST /api/report/submit` — Submit user report
- `POST /api/report/send-otp` — Send OTP for verification
- `POST /api/report/verify-otp` — Verify OTP

### Voice
- `POST /api/voice/synthesize` — Text-to-speech (Sarvam AI)
- `POST /api/voice/transcribe` — Speech-to-text
- `POST /api/voice/educate` — Rural education mode

### Supply Chain
- `GET/POST /api/supply-chain` — List/create shipments
- `GET/DELETE /api/supply-chain/[id]` — Get/cancel shipment
- `POST /api/supply-chain/[id]/advance` — Advance checkpoint
- `GET /api/supply-chain/stats` — Supply chain analytics

### Dashboard
- `GET /api/dashboard/stats` — Role-specific stats
- `POST /api/dashboard/generate-qr` — Generate medicine QR codes

### Other
- `GET /api/stats` — Homepage statistics
- `GET /api/scan-logs` — Scan log history
- `GET /api/recent-scans` — Recent scans
- `GET /api/pharmacies` — Pharmacy list
- `POST /api/chat` — Gemini chatbot
- `POST /api/alerts` — Alert notifications
- `GET /api/recall` — Recall management
- `POST /api/webhooks` — Webhook management
- `POST /api/manufacturer/register` — Register manufacturer
- `GET /api/manufacturer/batches` — List manufacturer batches

---

## Database Models

| Model | Purpose |
|-------|---------|
| `User` | Authentication, roles (consumer/pharmacy/company) |
| `Medicine` | Batch records, hashes, expiry, authorized regions |
| `Manufacturer` | Company info, public keys for RSA verification |
| `ScanLog` | Every scan recorded with location, user, verdict |
| `Report` | Counterfeit reports with status tracking |
| `Pharmacy` | Pharmacy locations and trust scores |
| `Shipment` | Supply chain shipments with checkpoints |
| `SupplyChainEvent` | Individual supply chain events |
| `Webhook` | External notification endpoints |

---

## Page Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page with hero, features, trust engine |
| `/scan` | QR scanner with camera, upload, manual entry |
| `/results` | Verification results with 6-layer breakdown |
| `/report` | Counterfeit reporting (form + voice) |
| `/voice` | Voice verification assistant |
| `/history` | Scan history |
| `/pharmacies` | Pharmacy directory |
| `/login` | Login page |
| `/signup` | Registration page |
| `/forgot-password` | Password reset |
| `/onboarding` | New user onboarding |
| `/dashboard/consumer` | Consumer dashboard |
| `/dashboard/company` | Company dashboard |
| `/dashboard/pharmacy` | Pharmacy dashboard |
| `/admin` | Admin panel |
| `/demo` | Demo/showcase page |
| `/pitch` | Pitch presentation |

---

## Security Considerations
- JWT tokens with expiry for session management
- HMAC-SHA256 and RSA-SHA256 for QR code cryptographic validation
- OTP verification for counterfeit reports
- Device fingerprinting for clone detection
- Pharmacy role bypass for inventory scans (prevents false clone flags)

---

## Environment Variables Required
```
MONGODB_URI=<MongoDB Atlas connection string>
MEDIGUARD_SECRET_KEY=<JWT signing secret>
GEMINI_API_KEY=<Google Gemini API key>
SARVAM_API_KEY=<Sarvam AI API key>
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<Google OAuth client ID>
TWILIO_ACCOUNT_SID=<Twilio account SID>
TWILIO_AUTH_TOKEN=<Twilio auth token>
TWILIO_PHONE_NUMBER=<Twilio phone number>
```
