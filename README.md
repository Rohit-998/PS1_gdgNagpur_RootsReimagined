# SafeDose

**Live Demo:** [https://ps-1-gdg-nagpur-roots-reimagined.vercel.app/](https://ps-1-gdg-nagpur-roots-reimagined.vercel.app/)

SafeDose is a pharmaceutical verification platform designed to detect counterfeit medicines. It utilizes a 6-layer security engine, cryptographic hashing, and multilingual voice synthesis to authenticate medications via QR code scanning.

## Architecture & Verification Engine

The core verification mechanism processes each scan through six independent layers:

1. Batch Validation: Verifies the existence of the batch ID within the manufacturer database.
2. Cryptographic Hash: Validates the medicine's unique SHA-256 hash signature.
3. Clone Detection: Identifies medicines scanned an anomalous number of times.
4. Geographic Validation: Correlates the scan location with the authorized supply chain trajectory.
5. Temporal Validation: Detects scans occurring outside expected expiration or distribution time windows.
6. Supply Chain Integrity: Traces the chain of custody from the manufacturer to the retail pharmacy.

Based on these parameters, a final confidence score is generated, classifying the scan as Verified, Suspicious, or Counterfeit.

## Features

- Technical Chat Assistant: Provides structured information regarding medication dosage, side effects, and drug interactions.
- Multilingual Voice Synthesis: Delivers verification results via text-to-speech across multiple regional languages.
- Role-Based Access Control: Specialized dashboards and functionalities for Consumers, Pharmacies, Manufacturers, and Regulators.
- Trust Analytics: Tracks pharmacy verification integrity and reports history.
- Anomaly Reporting: Secure submission of counterfeit reports.
- Supply Chain Tracking: Visual and data-driven tracing of a medicine's distribution lifecycle.

## Technical Stack

- Frontend: Next.js 16, React 19, Framer Motion, GSAP, Three.js
- Backend: Next.js API Routes, Node.js
- Database: MongoDB, Mongoose ODM
- External Integrations: Google Gemini API, Sarvam AI (TTS), Web Speech API, Twilio (OTP)
- Client-Side Processing: jsQR (browser-based QR decoding)

## Setup and Installation

### Prerequisites
- Node.js 18+ and npm
- MongoDB database
- API keys for Sarvam AI, Google Gemini, and Twilio (optional)

### Installation

1. Clone the repository and navigate to the project directory:
   ```bash
   git clone https://github.com/Rohit-998/PS1_gdgNagpur_RootsReimagined.git
   cd PS1_gdgNagpur_RootsReimagined/mediguard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables. Create a `.env.local` file in the `mediguard/` directory:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   MEDIGUARD_SECRET_KEY=your_secret_key
   SARVAM_API_KEY=your_sarvam_api_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. Seed the database with test data:
   ```bash
   node seed.mjs
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

The application will be accessible at http://localhost:3000.

## Demo Credentials

The following accounts can be used to test role-specific functionalities:

| Role | Email | Password |
|------|-------|----------|
| Consumer | consumer@demo.com | demo123 |
| Pharmacy | pharmacy@demo.com | demo123 |
| Manufacturer | manufacturer@demo.com | demo123 |
| Regulator | regulator@demo.com | demo123 |

## Directory Structure

```text
mediguard/
├── src/
│   ├── app/                  # Next.js App Router and Pages
│   │   ├── api/              # REST API endpoints
│   │   ├── scan/             # QR code scanning module
│   │   ├── results/          # Verification results module
│   │   ├── admin/            # Regulator dashboard
│   │   └── pharmacies/       # Trust analytics
│   ├── components/           # Reusable React components
│   ├── models/               # MongoDB/Mongoose schemas
│   └── utils/                # Utility functions and configurations
├── seed.mjs                  # Database initialization script
└── package.json              # Project dependencies and scripts
```
