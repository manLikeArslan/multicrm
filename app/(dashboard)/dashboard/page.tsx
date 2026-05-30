'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import SetupChecklist from '@/components/app/setup-checklist';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, DollarSign, Layers, Loader2, TrendingUp, Users } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const CHART_COLORS = ['#C95A32', '#6E8E75', '#C9AF85', '#C84630', '#8A7D6C'];

export default function DashboardHome() {
  const { data: session } = useSession();

  const user = session?.user as any;
  const companyName = user?.companyName || 'Nexus Data Corp';
  const roleName = user?.roleName || 'Admin';
  const fullName = user?.fullName || 'User Profile';

  // Fetch Dashboard Stats
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => fetch('/api/stats/dashboard').then(res => res.json()),
    enabled: !!session,
  });

  const kpi = stats?.kpi || { totalLeads: 0, activeDeals: 0, totalRevenue: 0, overdueRevenue: 0 };
  const leadFunnel = stats?.leadFunnel || [];
  const dealStages = stats?.dealStages || [];
  const monthlyTrend = stats?.monthlyTrend || [];

  // Time-of-day greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-7 animate-fade-up">
      {/* Top Header Greetings */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-heading font-bold tracking-tight text-[#F4EFE6]">
            {greeting}, {fullName.split(' ')[0]}
          </h1>
          <p className="text-sm text-[#AFA897]">
            Here&apos;s what&apos;s happening at <span className="font-medium text-[#C95A32]">{companyName}</span> today.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-[#AFA897]/50 font-medium">
          <div className="h-1.5 w-1.5 rounded-full bg-[#6E8E75] animate-pulse" />
          Live dashboard
        </div>
      </div>

      {/* Progressive Setup Checklist */}
      <SetupChecklist />

      {/* KPI Cards Grid — Asymmetric layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {/* Hero KPI: Total Leads */}
        <Card className="text-[#F4EFE6] card-hover-lift">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-[10px] text-[#AFA897]/50 font-semibold uppercase tracking-[0.12em]">Total Leads</span>
            <div className="p-1.5 rounded-lg bg-[#C95A32]/10">
              <Target className="h-3.5 w-3.5 text-[#C95A32]" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Loader2 className="h-5 w-5 text-[#C95A32] animate-spin" />
            ) : (
              <span className="text-3xl font-heading font-bold text-[#F4EFE6] animate-counter-up block">{kpi.totalLeads}</span>
            )}
            <p className="text-[11px] text-[#AFA897]/50 mt-1.5">Across all pipeline stages</p>
          </CardContent>
        </Card>

        {/* Active Deals */}
        <Card className="text-[#F4EFE6] card-hover-lift">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-[10px] text-[#AFA897]/50 font-semibold uppercase tracking-[0.12em]">Active Deals</span>
            <div className="p-1.5 rounded-lg bg-[#6E8E75]/10">
              <Users className="h-3.5 w-3.5 text-[#6E8E75]" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Loader2 className="h-5 w-5 text-[#C95A32] animate-spin" />
            ) : (
              <span className="text-3xl font-heading font-bold text-[#F4EFE6] animate-counter-up block">{kpi.activeDeals}</span>
            )}
            <p className="text-[11px] text-[#AFA897]/50 mt-1.5">In negotiation pipeline</p>
          </CardContent>
        </Card>

        {/* Revenue Won */}
        <Card className="text-[#F4EFE6] card-hover-lift">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-[10px] text-[#AFA897]/50 font-semibold uppercase tracking-[0.12em]">Revenue Won</span>
            <div className="p-1.5 rounded-lg bg-[#C95A32]/10">
              <DollarSign className="h-3.5 w-3.5 text-[#C95A32]" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Loader2 className="h-5 w-5 text-[#C95A32] animate-spin" />
            ) : (
              <span className="text-3xl font-heading font-bold text-[#F4EFE6] animate-counter-up block">
                ${kpi.totalRevenue.toLocaleString()}
              </span>
            )}
            <p className="text-[11px] text-[#AFA897]/50 mt-1.5">Closed-won transactions</p>
          </CardContent>
        </Card>

        {/* Overdue Invoices */}
        <Card className="text-[#F4EFE6] card-hover-lift">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-[10px] text-[#AFA897]/50 font-semibold uppercase tracking-[0.12em]">Overdue</span>
            <div className="p-1.5 rounded-lg bg-[#C84630]/10">
              <Layers className="h-3.5 w-3.5 text-[#C84630]" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Loader2 className="h-5 w-5 text-[#C95A32] animate-spin" />
            ) : (
              <span className="text-3xl font-heading font-bold text-[#F4EFE6] animate-counter-up block">
                ${kpi.overdueRevenue.toLocaleString()}
              </span>
            )}
            <p className="text-[11px] text-[#C84630]/60 mt-1.5">Outstanding invoices</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Pipeline Trend Chart */}
        <Card className="text-[#F4EFE6] lg:col-span-2 min-h-[350px] flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#C95A32]" />
              <CardTitle className="text-[#F4EFE6] text-base font-heading">Pipeline Revenue</CardTitle>
            </div>
            <CardDescription className="text-[#AFA897]/50">Monthly closed-won transaction totals</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 text-[#AFA897] min-h-[250px] pt-4">
            {isLoadingStats ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-6 w-6 text-[#C95A32] animate-spin" />
              </div>
            ) : monthlyTrend.length === 0 ? (
              <div className="flex items-center justify-center h-full text-[#AFA897]/50 text-sm">
                No monthly trend data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={monthlyTrend}>
                  <XAxis dataKey="month" stroke="#AFA897" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#AFA897" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: '#15151A', 
                      borderColor: '#1E1E26', 
                      color: '#F4EFE6',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    labelStyle={{ color: '#AFA897', fontSize: 11 }}
                    cursor={{ fill: 'rgba(201, 90, 50, 0.05)' }}
                  />
                  <Bar dataKey="revenue" fill="#C95A32" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Funnel Distribution Chart */}
        <Card className="text-[#F4EFE6] min-h-[350px] flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-[#F4EFE6] text-base font-heading">Lead Funnel</CardTitle>
            <CardDescription className="text-[#AFA897]/50">Distribution by status</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 text-[#AFA897] min-h-[250px] flex items-center justify-center">
            {isLoadingStats ? (
              <Loader2 className="h-6 w-6 text-[#C95A32] animate-spin" />
            ) : leadFunnel.length === 0 ? (
              <div className="text-[#AFA897]/50 text-sm">
                No funnel data yet
              </div>
            ) : (
              <div className="relative w-full h-[240px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={leadFunnel}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={78}
                      paddingAngle={4}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {leadFunnel.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: '#15151A', 
                        borderColor: '#1E1E26', 
                        color: '#F4EFE6',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div className="absolute bottom-0 flex flex-wrap justify-center gap-x-3 gap-y-1.5 max-w-[200px] text-[10px] font-medium text-[#AFA897]">
                  {leadFunnel.map((entry: any, index: number) => (
                    <span key={entry.name} className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                      {entry.name} ({entry.value})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
