# SafeDose — Hackathon Pitch Script (3-5 Minutes)

## 1. The Hook (0:00 - 0:30)
*Opening Slide*
**Speaker:** "Good morning everyone. Every year, over 1 million people die globally from counterfeit medicines. Just recently, tragic incidents involving toxic cough syrups claimed the lives of dozens of children. 

The core problem is that our current verification methods are broken. While many medicines have a barcode or QR code, those codes are completely static. If a counterfeiter buys one genuine bottle, they can copy that exact QR code and print it on 10,000 fake bottles. When a consumer scans the fake bottle, the system just says 'Yes, this QR code exists' and marks it as genuine. 

We built **SafeDose** to fix this. SafeDose doesn't just check if a code exists—it checks if the medicine holding that code is actually legitimate."

## 2. The Solution & The 6-Layer Engine (0:30 - 1:30)
*Demo: Open the SafeDose Scan Page and scan a QR code*
**Speaker:** "To solve this, we've built a 6-layer verification engine. When a consumer scans a medicine, they don't just get a simple 'yes or no'. We run a real-time, multi-layered authenticity check that generates a Trust Score out of 100.

Here is exactly how our 6-Layer Verification works:

1. **Batch Validation (30 pts):** First, we check the manufacturer's database. Does this batch ID and serial number actually exist?
2. **Cryptographic Hash (25 pts):** The QR code contains a SHA-256 cryptographic signature. We verify this hash against the manufacturer's public key. If a counterfeiter tampers with the expiry date or batch number in the QR data, the hash breaks instantly.
3. **Clone Detection (20 pts):** This is our most critical layer. If a counterfeiter clones a legitimate QR code 10,000 times, our system detects the scanning anomaly. If a single QR code is scanned by 50 different users across different cities, we instantly flag it as a clone and drop its trust score.
4. **Geographic Validation (10 pts):** Using GPS, we check where the scan is happening. If a batch is only authorized for sale in Maharashtra, but is scanned in Delhi, we flag it as diverted or potentially fake.
5. **Temporal Check (10 pts):** We cross-reference the manufacturing and expiry dates to catch expired medicines that have been relabeled.
6. **Supply Chain Integrity (5 pts):** Finally, we verify that the medicine passed through all authorized checkpoints from the factory to the pharmacy."

## 3. The Ecosystem (1:30 - 2:30)
*Demo: Show Voice Assistant and Reports*
**Speaker:** "But verification is only half the battle. In India, many consumers who are most vulnerable to fake medicines might be illiterate or lack technical knowledge.

That's why we integrated **Sarvam AI**. Users can use our Voice Assistant in 10 different Indian languages. They just tap the microphone, speak the name of the medicine, and the AI speaks back to them in their local language, explaining the safety status and potential side effects in simple, rural-friendly terms.

Furthermore, we've built a complete ecosystem around this:
- **Anonymous Reporting:** If a user scans a fake medicine, they can report the pharmacy instantly using voice commands.
- **Trust Leaderboard:** We track which pharmacies are selling flagged medicines, giving regulators a real-time heatmap of counterfeit hotspots.
- **Gemini AI Integration:** Users can chat with SafeDose AI to get instant answers about dosages and alternatives."

## 4. Technical Implementation (2:30 - 3:00)
*Slide: Tech Stack*
**Speaker:** "Technically, SafeDose is built on a modern, highly scalable stack. We use **Next.js 16** with a **MongoDB** backend. Our cryptographic engine runs SHA-256 and RSA validations in milliseconds. 

For the AI components, we leverage **Google Gemini 2.0 Flash** for fast, contextual pharmaceutical analysis, and **Sarvam AI** for local-language text-to-speech generation. Our real-time supply chain maps are powered by Leaflet and OpenStreetMap."

## 5. Conclusion (3:00 - 3:15)
*Closing Slide*
**Speaker:** "SafeDose isn't just an app; it's a complete infrastructure to restore trust in our healthcare system. By combining cryptography, anomaly detection, and AI, we can stop counterfeiters in their tracks and save lives. 

Thank you, and we'd love to take your questions."
