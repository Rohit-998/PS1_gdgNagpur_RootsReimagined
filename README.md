<div align="center">

# SafeDose

### Stop Fake Medicine. Save Real Lives.

[![Live Demo](https://img.shields.io/badge/Live_Demo-safedose--rootsreimagined.vercel.app-5B46FF?style=for-the-badge)](https://safedose-rootsreimagined.vercel.app/)
[![Built With](https://img.shields.io/badge/Built_With-Next.js_16-000000?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![AI Powered](https://img.shields.io/badge/AI-Google_Gemini-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![Database](https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)

---

**SafeDose** is an AI-powered pharmaceutical verification platform that detects counterfeit medicines using a **6-layer security engine**, **cryptographic hashing**, and **multilingual voice AI** — all from a single QR code scan.

</div>

---

## The Problem

> **1 in 10 medicines** in low- and middle-income countries is substandard or falsified.
> Counterfeit drugs kill an estimated **1 million people** every year.
>
> — *World Health Organization*

Consumers have **no easy way** to verify if the medicine they purchased is genuine. Pharmacies lack tools to track authenticity, and regulators can't act without real-time data.

## The Solution

**SafeDose** gives every stakeholder — consumers, pharmacies, manufacturers, and regulators — a unified platform to **verify, track, and report** counterfeit medicines instantly.

**Scan → Verify → Trust.**

---

## Key Features

### 6-Layer Verification Engine
Every medicine scan passes through **six independent security layers** before a trust score is generated:

| Layer | What It Checks | Max Score |
|-------|---------------|-----------|
| **Batch Validation** | Verifies the batch ID exists in the manufacturer database | 30 pts |
| **Cryptographic Hash** | Validates the medicine's unique SHA-256 hash signature | 25 pts |
| **Clone Detection** | Flags medicines scanned an abnormal number of times | 20 pts |
| **Geographic Validation** | Checks if the scan location matches the supply chain | 10 pts |
| **Temporal Validation** | Detects scans outside expected time windows | 10 pts |
| **Supply Chain Integrity** | Traces the full journey from factory to pharmacy | 5 pts |

> **Total: 100 points** — Graded **A+ to F** with a final verdict: Verified, Suspicious, or Counterfeit.

---

### AI-Powered Intelligence
- **Gemini Chatbot** — Ask questions about your medicine, dosage, side effects, and interactions in natural language.
- **Drug Interaction Checker** — Cross-references your medicines to flag dangerous combinations.
- **Smart Alerts** — Automated notifications when counterfeit patterns are detected in your area.

### Multilingual Voice AI
- **Voice Verdict** — Hear the verification result in your language using Sarvam AI text-to-speech.
- **Voice Reporting** — Report counterfeit medicines using just your voice.
- **10+ Indian Languages** — Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Odia, and more.

### Role-Based Dashboards
| Role | Capabilities |
|------|-------------|
| **Consumer** | Scan & verify medicines, check interactions, report counterfeits |
| **Pharmacy** | Track verification history, build trust score, manage inventory |
| **Manufacturer** | Register batches, monitor supply chain, view recall alerts |
| **Regulator** | Access analytics, review reports, issue recalls |

### Additional Features
- **Trust Leaderboard** — Ranks pharmacies by verification integrity and report history.
- **Anonymous Reporting** — Submit counterfeit reports securely with OTP verification via Twilio.
- **Supply Chain Timeline** — Visual trace of a medicine's journey from factory to distributor to pharmacy.
- **Scan History** — Complete log of all your past verifications.

---

## Tech Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | Next.js 16, React 19, Framer Motion, GSAP, Three.js |
| **Backend** | Next.js API Routes, Node.js |
| **Database** | MongoDB with Mongoose ODM |
| **AI / Voice** | Google Gemini API, Sarvam AI (TTS), Web Speech API |
| **Auth** | Custom role-based authentication with OTP (Twilio) |
| **Scanning** | jsQR (browser-based QR decoding), qrcode (generation) |
| **Deployment** | Vercel |

---

## Getting Started

### Prerequisites
- **Node.js** 18+ and **npm**
- A **MongoDB** database (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- API keys for **Sarvam AI**, **Google Gemini**, and **Twilio** (optional, for SMS)

### 1. Clone & Install

```bash
git clone https://github.com/Rohit-998/RootsReImagined_HackPrix.git
cd RootsReImagined_HackPrix/mediguard
npm install
```

### 2. Configure Environment

Create a `.env.local` file in the `mediguard/` directory:

```env
MONGODB_URI=your_mongodb_connection_string
MEDIGUARD_SECRET_KEY=mediguard_demo_secret_2024
SARVAM_API_KEY=your_sarvam_api_key
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Seed the Database

Populate the database with demo medicines, pharmacies, and supply chain events:

```bash
node seed.mjs
```

### 4. Run

```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** and start scanning.

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Consumer | `consumer@demo.com` | `demo123` |
| Pharmacy | `pharmacy@demo.com` | `demo123` |
| Manufacturer | `manufacturer@demo.com` | `demo123` |
| Regulator | `regulator@demo.com` | `demo123` |

---

## Project Structure

```
mediguard/
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── api/              # 15+ REST API routes
│   │   │   ├── verify/       # 6-layer verification engine
│   │   │   ├── chat/         # Gemini AI chatbot
│   │   │   ├── voice/        # Sarvam AI voice synthesis
│   │   │   ├── interactions/ # Drug interaction checker
│   │   │   ├── report/       # Anonymous reporting
│   │   │   └── ...
│   │   ├── scan/             # QR code scanner
│   │   ├── results/          # Verification results & verdict
│   │   ├── admin/            # Regulator dashboard
│   │   ├── pharmacies/       # Trust leaderboard
│   │   └── ...
│   ├── components/           # Reusable UI components
│   ├── models/               # MongoDB/Mongoose schemas
│   └── utils/                # Helpers & language configs
├── seed.mjs                  # Database seeder
└── package.json
```

---

## Built for HackPrix

SafeDose was built by **Team RootsReImagined** to tackle the global counterfeit medicine crisis using AI, cryptography, and accessible multilingual interfaces.

> *Because everyone deserves to trust the medicine they take.*

---

<div align="center">

**Star this repo if you found it useful!**

Made with care by Team RootsReImagined

</div>
