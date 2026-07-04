import { NextResponse } from 'next/server';
import { detectAnomalies } from '@/services/anomalyDetection';

// GET /api/alerts — Run anomaly detection and return active alerts
export async function GET() {
  try {
    const alerts = await detectAnomalies();

    // Sort by severity (critical > high > medium > low)
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    alerts.sort((a, b) => (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3));

    return NextResponse.json({
      alerts,
      total: alerts.length,
      critical: alerts.filter(a => a.severity === 'critical').length,
      high: alerts.filter(a => a.severity === 'high').length,
      medium: alerts.filter(a => a.severity === 'medium').length,
      generated_at: new Date().toISOString(),
    }, { status: 200 });

  } catch (error) {
    console.error("Error running anomaly detection:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
