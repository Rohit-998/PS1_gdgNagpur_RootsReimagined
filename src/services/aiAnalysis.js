/**
 * AI-powered counterfeit analysis using Google Gemini 2.0 Flash
 * Falls back to rule-based analysis if API key not available
 * Also provides rural medicine education via generateRuralEducationText()
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

/**
 * Generate AI analysis of verification results
 * @param {Object} verificationResult - The full verification result from the engine
 * @returns {Object} - { analysis: string, riskFactors: string[], confidence: string }
 */
export async function generateAIAnalysis(verificationResult) {
  const { medicineInfo, results, totalScore, verdict } = verificationResult;

  // Build context for AI
  const context = buildAnalysisContext(medicineInfo, results, totalScore, verdict);

  if (GEMINI_API_KEY) {
    try {
      return await callGeminiAPI(context);
    } catch (error) {
      console.error("Gemini API failed, falling back to rule-based:", error.message);
      return generateRuleBasedAnalysis(results, totalScore, verdict);
    }
  }

  // Fallback: rule-based analysis (no API key needed)
  return generateRuleBasedAnalysis(results, totalScore, verdict);
}

function buildAnalysisContext(medicineInfo, results, totalScore, verdict) {
  let context = `Medicine Verification Analysis Request:\n`;
  context += `Medicine: ${medicineInfo?.name || 'Unknown'}\n`;
  context += `Manufacturer: ${medicineInfo?.manufacturer || 'Unknown'}\n`;
  context += `Batch: ${medicineInfo?.batch_id || 'Unknown'}\n`;
  context += `Overall Score: ${totalScore}/100\n`;
  context += `Verdict: ${verdict}\n\n`;
  context += `Layer Results:\n`;

  if (results.batchCheck) {
    context += `1. Batch Check: ${results.batchCheck.passed ? 'PASS' : 'FAIL'} (${results.batchCheck.score}/30) - ${results.batchCheck.message}\n`;
  }
  if (results.hashCheck) {
    context += `2. Hash Validation: ${results.hashCheck.passed ? 'PASS' : 'FAIL'} (${results.hashCheck.score}/25) - ${results.hashCheck.message}\n`;
  }
  if (results.scanFrequency) {
    context += `3. Scan Frequency: ${results.scanFrequency.passed ? 'PASS' : 'FAIL'} (${results.scanFrequency.score}/20) - Scanned ${results.scanFrequency.scanCount} times - ${results.scanFrequency.message}\n`;
  }
  if (results.geoCheck) {
    context += `4. Geographic Check: ${results.geoCheck.passed ? 'PASS' : 'FAIL'} (${results.geoCheck.score}/10) - ${results.geoCheck.message}\n`;
  }
  if (results.temporalCheck) {
    context += `5. Temporal Check: ${results.temporalCheck.passed ? 'PASS' : 'FAIL'} (${results.temporalCheck.score}/10) - ${results.temporalCheck.message}\n`;
  }
  if (results.supplyChain) {
    context += `6. Supply Chain: ${results.supplyChain.passed ? 'PASS' : 'FAIL'} (${results.supplyChain.score}/5) - ${results.supplyChain.message}\n`;
  }
  if (results.recallCheck) {
    context += `7. Recall Check: ${results.recallCheck.passed ? 'PASS' : 'FAIL'} - ${results.recallCheck.message}\n`;
  }

  return context;
}

async function callGeminiAPI(context) {
  const prompt = `You are SafeDose AI, a pharmaceutical verification assistant. Analyze the following medicine verification results and provide:
1. A clear, concise analysis (2-3 sentences) explaining the verification outcome in plain language that a non-technical person can understand.
2. List specific risk factors identified.
3. A confidence assessment (high/medium/low) for your analysis.

${context}

Respond in this exact JSON format only, no markdown:
{"analysis": "your analysis here", "riskFactors": ["factor1", "factor2"], "confidence": "high|medium|low", "recommendation": "what the user should do"}`;

  const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 500,
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) throw new Error("Empty response from Gemini");

  // Parse JSON from response (handle potential markdown wrapping)
  const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const parsed = JSON.parse(jsonStr);

  return {
    analysis: parsed.analysis,
    riskFactors: parsed.riskFactors || [],
    confidence: parsed.confidence || 'medium',
    recommendation: parsed.recommendation || '',
    source: 'gemini-ai'
  };
}

/**
 * Rule-based fallback analysis when no AI API key is available
 */
function generateRuleBasedAnalysis(results, totalScore, verdict) {
  const riskFactors = [];
  let analysis = '';

  // Collect all failed layers
  if (!results.batchCheck?.passed) {
    riskFactors.push("Batch number not found in any manufacturer database");
  }
  if (!results.hashCheck?.passed) {
    riskFactors.push("Cryptographic signature verification failed — data may be tampered");
  }
  if (!results.scanFrequency?.passed) {
    const count = results.scanFrequency?.scanCount || 0;
    riskFactors.push(`QR code scanned ${count} times — indicates potential cloning`);
  }
  if (!results.geoCheck?.passed) {
    riskFactors.push("Medicine being sold outside authorized distribution region");
  }
  if (!results.temporalCheck?.passed) {
    riskFactors.push("Date anomaly detected — medicine may be expired or relabeled");
  }
  if (!results.supplyChain?.passed) {
    riskFactors.push("Supply chain integrity compromised — missing or tampered nodes");
  }
  if (results.recallCheck && !results.recallCheck.passed) {
    riskFactors.push(`Batch has been recalled: ${results.recallCheck.recall_reason}`);
  }

  // Generate analysis text
  if (verdict === 'verified') {
    analysis = `This medicine has passed all verification layers with a trust score of ${totalScore}/100. All cryptographic signatures match, the supply chain is intact, and the medicine is being sold in its authorized region. This medicine is safe for consumption.`;
  } else if (verdict === 'suspicious') {
    analysis = `This medicine shows some anomalies with a trust score of ${totalScore}/100. While the batch exists in the database, ${riskFactors.length} verification layer(s) raised concerns. We recommend verifying with the pharmacy or manufacturer before use.`;
  } else {
    analysis = `WARNING: This medicine has failed critical verification checks with a trust score of only ${totalScore}/100. ${riskFactors.length} out of the verification layers indicate this may be counterfeit. Do NOT consume this medicine and report it to your local drug regulatory authority.`;
  }

  const recommendation = verdict === 'verified'
    ? 'Safe to use as directed by your healthcare provider.'
    : verdict === 'suspicious'
    ? 'Verify with the pharmacy or manufacturer before use. Consider contacting drug authorities.'
    : 'Do NOT consume. Report to drug regulatory authorities immediately.';

  return {
    analysis,
    riskFactors,
    confidence: verdict === 'verified' ? 'high' : 'medium',
    recommendation,
    source: 'rule-based'
  };
}

// ── Rural Medicine Education (new) ───────────────────────────────────────
// Uses same GEMINI_API_KEY — no new credentials needed.

/**
 * Generate a simple, rural-friendly medicine explanation via Gemini.
 * Falls back to a rule-based explanation if Gemini is unavailable.
 * @param {Object} medicineInfo - medicine document fields
 * @returns {{ educationText: string, source: string }}
 */
export async function generateRuralEducationText(medicineInfo) {
  if (!GEMINI_API_KEY) return ruralFallback(medicineInfo);

  const prompt = `You are a friendly village health worker explaining medicine to a rural user with no medical background. Explain the following medicine simply and clearly in 3-4 sentences.

Medicine: ${medicineInfo?.name || 'Unknown'}
Category: ${medicineInfo?.category || 'Not specified'}
Dosage: ${medicineInfo?.dosage || 'As directed by doctor'}
Instructions: ${medicineInfo?.instructions || 'Follow doctor\'s advice'}
Common side effects: ${(medicineInfo?.side_effects || []).join(', ') || 'None listed'}

Cover ONLY: 1) What is it for? 2) When/how to take it? 3) What side effects to watch for?
Use simple everyday language. No medical jargon. Be friendly and reassuring. Max 80 words.

Respond ONLY with this JSON:
{"educationText": "your explanation here"}`;

  try {
    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 200 },
      }),
    });

    if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(jsonStr);
    return { educationText: parsed.educationText, source: 'gemini-ai' };
  } catch (err) {
    console.error('Rural education Gemini call failed:', err.message);
    return ruralFallback(medicineInfo);
  }
}

/**
 * Rule-based fallback for rural education (no AI needed)
 */
function ruralFallback(medicineInfo) {
  const name = medicineInfo?.name || 'This medicine';
  const instructions = medicineInfo?.instructions
    ? `${medicineInfo.instructions}.`
    : 'Take as your doctor has told you.';
  const sideEffects = (medicineInfo?.side_effects || []).slice(0, 2).join(' and ');
  const sideNote = sideEffects
    ? ` Watch out for ${sideEffects}. If you feel unwell, tell a health worker.`
    : ' If you feel unwell after taking it, tell a health worker right away.';

  return {
    educationText: `${name} is used to help treat your condition. ${instructions}${sideNote}`,
    source: 'rule-based',
  };
}
