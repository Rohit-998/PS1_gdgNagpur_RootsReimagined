import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import mongoose from 'mongoose';
import crypto from 'crypto';

// Note: Ensure your .env.local or .env has MONGODB_URI and MEDIGUARD_SECRET_KEY
const MONGODB_URI = process.env.MONGODB_URI;
const SECRET_KEY = process.env.MEDIGUARD_SECRET_KEY || "mediguard_demo_secret_2024";

if (!MONGODB_URI) {
  console.error("Please set MONGODB_URI in your environment");
  process.exit(1);
}

// Schemas
const manufacturerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  country: { type: String, required: true },
  verified: { type: Boolean, default: false },
  secret_key: { type: String, required: true },
}, { timestamps: true });

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  manufacturer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Manufacturer', required: true },
  batch_id: { type: String, required: true },
  serial_number: { type: String, required: true },
  hash: { type: String, required: true },
  mfg_date: { type: Date, required: true },
  exp_date: { type: Date, required: true },
  is_genuine: { type: Boolean, default: true },
  authorized_region: { type: String, required: true },
  recalled: { type: Boolean, default: false },
  recall_reason: { type: String },
  recall_date: { type: Date },
  category: { type: String },
  strength: { type: String },
  dosage: { type: String },
  side_effects: [{ type: String }],
  instructions: { type: String },
  alternatives: [{ type: String }],
  drug_interactions: [{ type: String }],
}, { timestamps: true });

const supplyChainEventSchema = new mongoose.Schema({
  medicine_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
  event_type: { type: String, required: true },
  location: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  prev_hash: { type: String },
  event_hash: { type: String, required: true },
}, { timestamps: true });

const scanLogSchema = new mongoose.Schema({
    medicine_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' },
    scanned_at: { type: Date, default: Date.now },
    location_lat: { type: Number },
    location_lng: { type: Number },
    location_city: { type: String },
    result_score: { type: Number },
    scanned_batch_id: { type: String },
    scanned_serial_number: { type: String },
}, { timestamps: true });

const drugInteractionSchema = new mongoose.Schema({
  drug_a: { type: String, required: true },
  drug_b: { type: String, required: true },
  severity: { type: String, enum: ['mild', 'moderate', 'severe', 'contraindicated'], required: true },
  description: { type: String, required: true },
  recommendation: { type: String, required: true },
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ['consumer', 'pharmacy', 'manufacturer', 'regulator'], default: 'consumer' },
  organization: { type: String },
  api_key: { type: String, unique: true, sparse: true },
  manufacturer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Manufacturer' },
  active: { type: Boolean, default: true },
}, { timestamps: true });

const Manufacturer = mongoose.models.Manufacturer || mongoose.model('Manufacturer', manufacturerSchema);
const Medicine = mongoose.models.Medicine || mongoose.model('Medicine', medicineSchema);
const SupplyChainEvent = mongoose.models.SupplyChainEvent || mongoose.model('SupplyChainEvent', supplyChainEventSchema);
const ScanLog = mongoose.models.ScanLog || mongoose.model('ScanLog', scanLogSchema);
const DrugInteraction = mongoose.models.DrugInteraction || mongoose.model('DrugInteraction', drugInteractionSchema);
const User = mongoose.models.User || mongoose.model('User', userSchema);

const pharmacySchema = new mongoose.Schema({
  name: { type: String, required: true },
  city: { type: String, required: true },
  trust_score: { type: Number, default: 100 },
  total_scans: { type: Number, default: 0 },
  flagged_count: { type: Number, default: 0 },
}, { timestamps: true });

const Pharmacy = mongoose.models.Pharmacy || mongoose.model('Pharmacy', pharmacySchema);

function generateHash(batchId, serialNumber) {
  const data = `${batchId}:${serialNumber}:${SECRET_KEY}`;
  return crypto.createHash("sha256").update(data).digest("hex");
}

function generateEventHash(prevHash, eventData) {
  const data = `${prevHash}:${JSON.stringify(eventData)}`;
  return crypto.createHash("sha256").update(data).digest("hex");
}

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");

  // Clear existing
  await Manufacturer.deleteMany({});
  await Medicine.deleteMany({});
  await SupplyChainEvent.deleteMany({});
  await ScanLog.deleteMany({});
  await DrugInteraction.deleteMany({});
  await User.deleteMany({});
  await Pharmacy.deleteMany({});
  console.log("Cleared existing data.");

  // 0. Seed Pharmacies
  console.log("Seeding pharmacies...");
  await Pharmacy.insertMany([
    { name: 'Apollo Pharmacy',           city: 'Mumbai, Maharashtra',       trust_score: 97, total_scans: 1240, flagged_count: 0 },
    { name: 'MedPlus Health',            city: 'Hyderabad, Telangana',      trust_score: 94, total_scans: 890,  flagged_count: 1 },
    { name: 'Netmeds Store',             city: 'Chennai, Tamil Nadu',       trust_score: 91, total_scans: 720,  flagged_count: 0 },
    { name: 'PharmEasy Outlet',          city: 'Bengaluru, Karnataka',      trust_score: 88, total_scans: 650,  flagged_count: 2 },
    { name: 'Wellness Forever',          city: 'Pune, Maharashtra',         trust_score: 85, total_scans: 530,  flagged_count: 1 },
    { name: 'Jan Aushadhi Kendra',       city: 'Delhi, NCR',               trust_score: 82, total_scans: 410,  flagged_count: 3 },
    { name: 'Guardian Pharmacy',         city: 'Kolkata, West Bengal',      trust_score: 76, total_scans: 380,  flagged_count: 4 },
    { name: 'LifeCare Medical Store',    city: 'Lucknow, Uttar Pradesh',   trust_score: 62, total_scans: 290,  flagged_count: 8 },
    { name: 'Singh Medical Hall',        city: 'Jaipur, Rajasthan',        trust_score: 45, total_scans: 180,  flagged_count: 14 },
    { name: 'Gupta Pharma & Surgical',   city: 'Patna, Bihar',             trust_score: 28, total_scans: 95,   flagged_count: 22 },
  ]);

  // 1. Create Manufacturers
  const sunPharma = await Manufacturer.create({
    name: "Sun Pharma",
    country: "India",
    verified: true,
    secret_key: SECRET_KEY
  });
  
  const cipla = await Manufacturer.create({
    name: "Cipla",
    country: "India",
    verified: true,
    secret_key: SECRET_KEY
  });

  const novartis = await Manufacturer.create({
    name: "Novartis",
    country: "Switzerland",
    verified: true,
    secret_key: SECRET_KEY
  });

  const indoco = await Manufacturer.create({
    name: "Indoco Remedies",
    country: "India",
    verified: true,
    secret_key: SECRET_KEY
  });

  // 2. Create Genuine Medicines
  const realPara = await Medicine.create({
    name: "Paracetamol 500mg",
    manufacturer_id: sunPharma._id,
    batch_id: "BATCH-SUN-2024-001",
    serial_number: "SN-0001",
    hash: generateHash("BATCH-SUN-2024-001", "SN-0001"),
    mfg_date: new Date("2024-01-10"),
    exp_date: new Date("2027-01-10"),
    is_genuine: true,
    authorized_region: "India-Maharashtra",
    category: "analgesic",
    strength: "500mg",
    dosage: "1-2 tablets every 4-6 hours as needed. Maximum 8 tablets in 24 hours.",
    side_effects: ["Nausea", "Allergic skin reactions", "Liver damage (overdose)", "Blood disorders (rare)"],
    instructions: "Take with water. Do not exceed recommended dose. Avoid alcohol. Consult doctor if symptoms persist beyond 3 days.",
    alternatives: ["Ibuprofen 400mg", "Aspirin 500mg", "Naproxen 250mg"],
    drug_interactions: ["Warfarin", "Methotrexate", "Carbamazepine"],
  });

  const realAmox = await Medicine.create({
    name: "Amoxicillin 250mg",
    manufacturer_id: cipla._id,
    batch_id: "BATCH-CIP-2024-015",
    serial_number: "SN-0002",
    hash: generateHash("BATCH-CIP-2024-015", "SN-0002"),
    mfg_date: new Date("2024-02-15"),
    exp_date: new Date("2027-02-15"),
    is_genuine: true,
    authorized_region: "India-Gujarat",
    category: "antibiotic",
    strength: "250mg",
    dosage: "1 capsule every 8 hours for 7-10 days. Complete the full course.",
    side_effects: ["Diarrhea", "Nausea", "Skin rash", "Vomiting", "Allergic reactions"],
    instructions: "Take with or without food. Complete full course even if feeling better. Report any allergic reactions immediately.",
    alternatives: ["Azithromycin 500mg", "Cephalexin 500mg", "Erythromycin 250mg"],
    drug_interactions: ["Methotrexate", "Warfarin", "Oral contraceptives"],
  });

  // Diverted Medicine (Real, but will be scanned in wrong region during demo)
  const divertedInsulin = await Medicine.create({
    name: "Insulin Novolin R",
    manufacturer_id: novartis._id,
    batch_id: "BATCH-NOV-2024-003",
    serial_number: "SN-0003",
    hash: generateHash("BATCH-NOV-2024-003", "SN-0003"),
    mfg_date: new Date("2024-03-01"),
    exp_date: new Date("2027-03-01"),
    is_genuine: true,
    authorized_region: "Nigeria-Lagos",
    category: "antidiabetic",
    strength: "100 IU/mL",
    dosage: "As directed by physician. Inject subcutaneously 30 minutes before meals.",
    side_effects: ["Hypoglycemia", "Injection site reactions", "Weight gain", "Allergic reactions"],
    instructions: "Store in refrigerator (2-8°C). Do not freeze. Rotate injection sites. Monitor blood sugar regularly.",
    alternatives: ["Insulin Glargine", "Insulin Lispro", "Metformin 500mg"],
    drug_interactions: ["Beta-blockers", "ACE inhibitors", "Thiazolidinediones"],
  });

  // Expired Relabeled
  const expiredSyrup = await Medicine.create({
    name: "Cough Syrup",
    manufacturer_id: cipla._id,
    batch_id: "BATCH-CIP-2023-012",
    serial_number: "SN-0004",
    hash: generateHash("BATCH-CIP-2023-012", "SN-0004"),
    mfg_date: new Date("2021-01-01"),
    exp_date: new Date("2023-01-01"), // Already expired
    is_genuine: true,
    authorized_region: "India-Delhi",
    category: "antitussive",
    strength: "100ml",
    dosage: "10ml every 6-8 hours. Do not exceed 40ml in 24 hours.",
    side_effects: ["Drowsiness", "Dizziness", "Nausea", "Constipation"],
    instructions: "Shake well before use. Use measuring cup provided. May cause drowsiness — avoid driving.",
    alternatives: ["Honey and lemon", "Dextromethorphan syrup", "Guaifenesin syrup"],
    drug_interactions: ["MAO inhibitors", "Sedatives", "Antihistamines"],
  });

  // ★ DEMO MEDICINE — Cyclopam (real medicine for live demo)
  const realCyclopam = await Medicine.create({
    name: "Cyclopam (Paracetamol 500mg + Dicyclomine 20mg)",
    manufacturer_id: indoco._id,
    batch_id: "70454",
    serial_number: "SN-CYC-001",
    hash: generateHash("70454", "SN-CYC-001"),
    mfg_date: new Date("2025-10-01"),
    exp_date: new Date("2027-09-30"),
    is_genuine: true,
    authorized_region: "India-Maharashtra",
    category: "antispasmodic",
    strength: "500mg + 20mg",
    dosage: "1 tablet 3 times a day, or as directed by physician.",
    side_effects: ["Dry mouth", "Drowsiness", "Dizziness", "Blurred vision", "Nausea"],
    instructions: "Take with or after food. Avoid driving or operating machinery. Do not exceed recommended dose.",
    alternatives: ["Meftal Spas", "Drotin Plus", "Spasmo Proxyvon"],
    drug_interactions: ["Antihistamines", "MAO inhibitors", "Warfarin", "Alcohol"],
  });

  // Supply chain for Cyclopam
  let prevHashCyc = "GENESIS";
  const cycEvents = [
    { type: "manufactured", loc: "Indoco Remedies, Goa Plant", time: "2025-10-01T08:00:00Z" },
    { type: "qa_passed", loc: "Goa QC Lab", time: "2025-10-02T14:00:00Z" },
    { type: "shipped", loc: "Central Distribution, Mumbai", time: "2025-10-05T10:00:00Z" },
    { type: "received", loc: "Apollo Pharmacy, Nagpur", time: "2025-10-12T11:30:00Z" }
  ];

  for (const ev of cycEvents) {
    const evData = { type: ev.type, location: ev.loc, timestamp: new Date(ev.time) };
    const eventHash = generateEventHash(prevHashCyc, evData);
    await SupplyChainEvent.create({
      medicine_id: realCyclopam._id,
      event_type: ev.type,
      location: ev.loc,
      timestamp: evData.timestamp,
      prev_hash: prevHashCyc,
      event_hash: eventHash
    });
    prevHashCyc = eventHash;
  }

  // 3. Create Supply Chain for realPara
  let prevHash = "GENESIS";
  const events = [
    { type: "manufactured", loc: "Hyderabad Factory", time: "2024-01-10T10:00:00Z" },
    { type: "qa_passed", loc: "Hyderabad QC Lab", time: "2024-01-11T14:30:00Z" },
    { type: "shipped", loc: "Central Warehouse, Mumbai", time: "2024-01-15T09:00:00Z" },
    { type: "received", loc: "Licensed Pharmacy, Nagpur", time: "2024-01-22T11:00:00Z" }
  ];

  for (const ev of events) {
    const evData = { type: ev.type, location: ev.loc, timestamp: new Date(ev.time) };
    const eventHash = generateEventHash(prevHash, evData);
    await SupplyChainEvent.create({
      medicine_id: realPara._id,
      event_type: ev.type,
      location: ev.loc,
      timestamp: evData.timestamp,
      prev_hash: prevHash,
      event_hash: eventHash
    });
    prevHash = eventHash;
  }

  // 4. Cloned QR Simulation
  // For SN-0002 (Amoxicillin), we pretend it was scanned 847 times
  const cloneLogs = Array.from({ length: 50 }).map((_, i) => ({
    medicine_id: realAmox._id,
    scanned_batch_id: realAmox.batch_id,
    scanned_serial_number: realAmox.serial_number,
    location_city: `City ${i}`,
    result_score: 100
  }));
  await ScanLog.insertMany(cloneLogs);

  // 5. Add Metformin (3rd genuine medicine from plan)
  const drReddys = await Manufacturer.create({
    name: "Dr. Reddy's",
    country: "India",
    verified: true,
    secret_key: SECRET_KEY
  });

  const realMetformin = await Medicine.create({
    name: "Metformin 500mg",
    manufacturer_id: drReddys._id,
    batch_id: "BATCH-DRL-2024-008",
    serial_number: "SN-0005",
    hash: generateHash("BATCH-DRL-2024-008", "SN-0005"),
    mfg_date: new Date("2024-04-01"),
    exp_date: new Date("2027-04-01"),
    is_genuine: true,
    authorized_region: "India-Telangana",
    category: "antidiabetic",
    strength: "500mg",
    dosage: "1 tablet twice daily with meals. May be increased to 1000mg twice daily.",
    side_effects: ["Nausea", "Diarrhea", "Stomach pain", "Metallic taste", "Lactic acidosis (rare)"],
    instructions: "Take with food to reduce stomach upset. Do not crush or chew extended-release tablets. Monitor blood sugar regularly.",
    alternatives: ["Glimepiride 1mg", "Sitagliptin 100mg", "Gliclazide 80mg"],
    drug_interactions: ["Insulin", "ACE inhibitors", "Alcohol", "Contrast dye"],
  });

  // Supply chain for Metformin
  let prevHash2 = "GENESIS";
  const metEvents = [
    { type: "manufactured", loc: "Hyderabad Plant", time: "2024-04-01T08:00:00Z" },
    { type: "qa_passed", loc: "Hyderabad QC Lab", time: "2024-04-02T11:00:00Z" },
    { type: "shipped", loc: "Secunderabad Warehouse", time: "2024-04-05T10:00:00Z" },
    { type: "received", loc: "City Pharmacy, Hyderabad", time: "2024-04-10T14:00:00Z" }
  ];

  for (const ev of metEvents) {
    const evData = { type: ev.type, location: ev.loc, timestamp: new Date(ev.time) };
    const eventHash = generateEventHash(prevHash2, evData);
    await SupplyChainEvent.create({
      medicine_id: realMetformin._id,
      event_type: ev.type,
      location: ev.loc,
      timestamp: evData.timestamp,
      prev_hash: prevHash2,
      event_hash: eventHash
    });
    prevHash2 = eventHash;
  }

  // Supply chain for Amoxicillin
  let prevHash3 = "GENESIS";
  const amoxEvents = [
    { type: "manufactured", loc: "Cipla Mumbai Factory", time: "2024-02-15T09:00:00Z" },
    { type: "qa_passed", loc: "Mumbai QC Lab", time: "2024-02-16T12:00:00Z" },
    { type: "shipped", loc: "Ahmedabad Distributor", time: "2024-02-20T08:00:00Z" },
    { type: "received", loc: "Gujarat Medical Store", time: "2024-02-25T16:00:00Z" }
  ];

  for (const ev of amoxEvents) {
    const evData = { type: ev.type, location: ev.loc, timestamp: new Date(ev.time) };
    const eventHash = generateEventHash(prevHash3, evData);
    await SupplyChainEvent.create({
      medicine_id: realAmox._id,
      event_type: ev.type,
      location: ev.loc,
      timestamp: evData.timestamp,
      prev_hash: prevHash3,
      event_hash: eventHash
    });
    prevHash3 = eventHash;
  }

  // 7. Seed Drug Interactions
  console.log("Seeding drug interactions...");
  await DrugInteraction.insertMany([
    {
      drug_a: "Paracetamol 500mg",
      drug_b: "Warfarin",
      severity: "moderate",
      description: "Paracetamol may enhance the anticoagulant effect of warfarin, increasing bleeding risk.",
      recommendation: "Monitor INR closely. Limit paracetamol to less than 2g/day when on warfarin."
    },
    {
      drug_a: "Paracetamol 500mg",
      drug_b: "Metformin 500mg",
      severity: "mild",
      description: "No significant direct interaction, but both are metabolized by the liver.",
      recommendation: "Generally safe to take together. Monitor liver function if used long-term."
    },
    {
      drug_a: "Amoxicillin 250mg",
      drug_b: "Methotrexate",
      severity: "severe",
      description: "Amoxicillin can reduce renal clearance of methotrexate, leading to toxic levels.",
      recommendation: "Avoid combination. If necessary, monitor methotrexate levels and renal function closely."
    },
    {
      drug_a: "Amoxicillin 250mg",
      drug_b: "Warfarin",
      severity: "moderate",
      description: "Amoxicillin may increase INR and risk of bleeding when combined with warfarin.",
      recommendation: "Monitor INR more frequently during and after amoxicillin course."
    },
    {
      drug_a: "Metformin 500mg",
      drug_b: "Insulin Novolin R",
      severity: "moderate",
      description: "Combined use increases the risk of hypoglycemia. Both lower blood sugar.",
      recommendation: "Monitor blood glucose closely. Dose adjustment may be needed."
    },
    {
      drug_a: "Metformin 500mg",
      drug_b: "Contrast dye",
      severity: "severe",
      description: "Iodinated contrast media with metformin can cause lactic acidosis, a life-threatening condition.",
      recommendation: "Stop metformin 48 hours before contrast procedure. Resume only after kidney function confirmed normal."
    },
    {
      drug_a: "Cough Syrup",
      drug_b: "Sedatives",
      severity: "severe",
      description: "Combined CNS depressant effects can cause excessive drowsiness, respiratory depression.",
      recommendation: "Avoid combination. If necessary, use lowest effective doses and monitor closely."
    },
    {
      drug_a: "Insulin Novolin R",
      drug_b: "Beta-blockers",
      severity: "moderate",
      description: "Beta-blockers can mask symptoms of hypoglycemia and may alter glucose metabolism.",
      recommendation: "Monitor blood sugar more frequently. Be aware that typical warning signs of low sugar may be absent."
    },
  ]);

  // 8. Seed Demo Users
  console.log("Seeding demo users...");
  const salt1 = crypto.randomBytes(16).toString('hex');
  const hash1 = crypto.pbkdf2Sync('demo123', salt1, 1000, 64, 'sha512').toString('hex');
  const demoPassword = `${salt1}:${hash1}`;

  await User.insertMany([
    {
      email: 'consumer@demo.com',
      name: 'Demo Consumer',
      password_hash: demoPassword,
      role: 'consumer',
      active: true,
    },
    {
      email: 'pharmacy@demo.com',
      name: 'City Pharmacy',
      password_hash: demoPassword,
      role: 'pharmacy',
      organization: 'City Pharmacy, Mumbai',
      api_key: 'mg_demo_pharmacy_key_123',
      active: true,
    },
    {
      email: 'manufacturer@demo.com',
      name: 'Sun Pharma Admin',
      password_hash: demoPassword,
      role: 'manufacturer',
      organization: 'Sun Pharmaceutical Industries',
      api_key: 'mg_demo_manufacturer_key_456',
      manufacturer_id: sunPharma._id,
      active: true,
    },
    {
      email: 'regulator@demo.com',
      name: 'CDSCO Inspector',
      password_hash: demoPassword,
      role: 'regulator',
      organization: 'Central Drugs Standard Control Organisation',
      api_key: 'mg_demo_regulator_key_789',
      active: true,
    },
  ]);

  // 9. Print demo QR data for reference
  console.log("\n--- DEMO QR DATA ---");
  console.log("Scenario A (Fake - batch doesn't exist): { batch_id: 'BATCH-FAKE-9999', serial_number: 'SN-FAKE', hash: 'fakehash123' }");
  console.log(`Scenario B (Cloned QR): { batch_id: '${realAmox.batch_id}', serial_number: '${realAmox.serial_number}', hash: '${realAmox.hash}' }`);
  console.log(`Scenario C (Diverted): { batch_id: '${divertedInsulin.batch_id}', serial_number: '${divertedInsulin.serial_number}', hash: '${divertedInsulin.hash}' }`);
  console.log(`Scenario D (Expired): { batch_id: '${expiredSyrup.batch_id}', serial_number: '${expiredSyrup.serial_number}', hash: '${expiredSyrup.hash}' }`);
  console.log(`Genuine Paracetamol: { batch_id: '${realPara.batch_id}', serial_number: '${realPara.serial_number}', hash: '${realPara.hash}' }`);
  console.log(`Genuine Metformin: { batch_id: '${realMetformin.batch_id}', serial_number: '${realMetformin.serial_number}', hash: '${realMetformin.hash}' }`);
  console.log(`★ DEMO Cyclopam: { batch_id: '${realCyclopam.batch_id}', serial_number: '${realCyclopam.serial_number}', hash: '${realCyclopam.hash}' }`);
  console.log("\n--- DEMO USERS (password: demo123 for all) ---");
  console.log("Consumer:     consumer@demo.com");
  console.log("Pharmacy:     pharmacy@demo.com     | API Key: mg_demo_pharmacy_key_123");
  console.log("Manufacturer: manufacturer@demo.com  | API Key: mg_demo_manufacturer_key_456");
  console.log("Regulator:    regulator@demo.com     | API Key: mg_demo_regulator_key_789");
  console.log("--- END ---\n");

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch(err => {
  console.error("Error seeding data:", err);
  process.exit(1);
});
