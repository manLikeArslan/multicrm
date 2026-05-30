import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { tq } from '@/lib/db/tenant';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = session.user.companyId;

    // 1. Fetch KPI Counts
    const kpiResult = await tq<any[]>(
      session,
      `SELECT
         (SELECT COUNT(*) FROM leads WHERE company_id = $1) as total_leads,
         (SELECT COUNT(*) FROM deals WHERE company_id = $1 AND stage IN ('proposal', 'negotiation')) as active_deals,
         (SELECT COALESCE(SUM(value), 0) FROM deals WHERE company_id = $1 AND stage = 'closed_won') as total_revenue,
         (SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE company_id = $1 AND status = 'overdue') as overdue_revenue
      `,
      [companyId]
    );
    const kpi = kpiResult[0] || { total_leads: 0, active_deals: 0, total_revenue: 0, overdue_revenue: 0 };

    // 2. Fetch Lead Funnel Status Counts
    const leadFunnel = await tq<any[]>(
      session,
      `SELECT status, COUNT(*) as count
       FROM leads
       WHERE company_id = $1
       GROUP BY status`,
      [companyId]
    );

    // 3. Fetch Deal Stages counts
    const dealStages = await tq<any[]>(
      session,
      `SELECT stage, COUNT(*) as count, COALESCE(SUM(value), 0) as total_val
       FROM deals
       WHERE company_id = $1
       GROUP BY stage`,
      [companyId]
    );

    // 4. Fetch Monthly Closed Won Revenue trend
    const monthlyTrend = await tq<any[]>(
      session,
      `SELECT
         TO_CHAR(COALESCE(actual_close_date, created_at), 'YYYY-MM') as month,
         SUM(value) as revenue
       FROM deals
       WHERE company_id = $1 AND stage = 'closed_won'
       GROUP BY month
       ORDER BY month ASC
       LIMIT 6`,
      [companyId]
    );

    return NextResponse.json({
      kpi: {
        totalLeads: parseInt(kpi.total_leads, 10),
        activeDeals: parseInt(kpi.active_deals, 10),
        totalRevenue: parseFloat(kpi.total_revenue),
        overdueRevenue: parseFloat(kpi.overdue_revenue),
      },
      leadFunnel: leadFunnel.map(f => ({ name: f.status, value: parseInt(f.count, 10) })),
      dealStages: dealStages.map(s => ({ name: s.stage, value: parseInt(s.count, 10), amount: parseFloat(s.total_val) })),
      monthlyTrend: monthlyTrend.map(t => ({ month: t.month, revenue: parseFloat(t.revenue) })),
    });
  } catch (error) {
    console.error('GET /api/stats/dashboard Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
