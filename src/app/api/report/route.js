import { NextResponse } from 'next/server';
import { createReport, getReports, updateReportStatus, getReportStats } from '@/services/reportGenerator';

// POST /api/report — Generate a counterfeit detection report
export async function POST(request) {
  try {
    const body = await request.json();
    const { verificationResult, scanLocation, reported_by, reporter_role } = body;

    if (!verificationResult) {
      return NextResponse.json({ error: 'verificationResult is required' }, { status: 400 });
    }

    const report = await createReport(
      verificationResult,
      scanLocation || {},
      { reported_by, reporter_role }
    );

    return NextResponse.json({
      success: true,
      report: {
        report_id: report.report_id,
        verdict: report.verdict,
        total_score: report.total_score,
        medicine_name: report.medicine_name,
        manufacturer_name: report.manufacturer_name,
        status: report.status,
        created_at: report.createdAt,
      },
      message: `Report ${report.report_id} created successfully`,
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating report:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// GET /api/report — List reports with optional filters
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = {
      status: searchParams.get('status'),
      verdict: searchParams.get('verdict'),
      batch_id: searchParams.get('batch_id'),
      region: searchParams.get('region'),
      limit: parseInt(searchParams.get('limit')) || 50,
    };

    // Remove null filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === null || filters[key] === undefined) delete filters[key];
    });

    const reports = await getReports(filters);
    const stats = await getReportStats();

    return NextResponse.json({
      reports,
      stats,
      total: reports.length,
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/report — Update report status
export async function PATCH(request) {
  try {
    const { report_id, status, notes } = await request.json();

    if (!report_id || !status) {
      return NextResponse.json({ error: 'report_id and status are required' }, { status: 400 });
    }

    const validStatuses = ['open', 'investigating', 'resolved', 'dismissed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
    }

    const report = await updateReportStatus(report_id, status, notes);

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      report_id: report.report_id,
      status: report.status,
      notes: report.notes,
    }, { status: 200 });

  } catch (error) {
    console.error("Error updating report:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
