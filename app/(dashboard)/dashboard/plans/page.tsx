'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import Forbidden from '@/components/shared/forbidden';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface Plan {
  plan_id: number;
  plan_name: string;
  price_per_month: string;
  max_users: number;
  max_contacts: number;
  features: string;
}

export default function PlansPage() {
  const { data: session } = useSession();

  // Role Gate: Only Admin can access billing & plans page
  const user = session?.user as any;
  const isAdmin = user?.roleName === 'admin' || user?.roleId === 1;

  // Fetch own company profile
  const { data: company, isLoading: isLoadingCompany } = useQuery({
    queryKey: ['company-me'],
    queryFn: () => fetch('/api/companies/me').then(res => res.json()),
    enabled: !!session,
  });

  // Fetch all subscription plans
  const { data: plans, isLoading: isLoadingPlans } = useQuery<Plan[]>({
    queryKey: ['plans-list'],
    queryFn: () => fetch('/api/plans').then(res => res.json()),
  });

  if (!session) return null;
  if (!isAdmin) return <Forbidden />;

  const isLoading = isLoadingCompany || isLoadingPlans;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 text-[#D4A853] animate-spin" />
      </div>
    );
  }

  const currentPlanId = company?.plan_id || 1; // Default to free if not found

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#2A2A2D] pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#E8E4DD]">Subscription Plans</h1>
          <p className="text-sm text-[#8A8680]">View your active package limits and explore upgrade tiers.</p>
        </div>
        <div className="flex items-center gap-2 bg-[#141416] border border-[#2A2A2D] px-4 py-2.5 rounded-xl">
          <ShieldCheck className="h-4.5 w-4.5 text-[#6B8F71]" />
          <span className="text-xs text-[#8A8680]">Billing account managed by: <span className="font-semibold text-[#E8E4DD]">{company?.email}</span></span>
        </div>
      </div>

      {/* Main card showing usage statistics */}
      <Card className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD] shadow-xl overflow-hidden relative">
        <div className="absolute right-0 top-0 w-24 h-24 bg-[#D4A853]/5 blur-xl rounded-full" />
        <CardHeader>
          <div className="flex items-center gap-2 text-[#D4A853]">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Usage Thresholds</span>
          </div>
          <CardTitle className="text-[#E8E4DD] text-xl">Active Subscription Usage</CardTitle>
          <CardDescription className="text-[#8A8680]">Your current plan limits as defined in DBMS core.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-[#111113] rounded-xl border border-[#2A2A2D] flex flex-col justify-between">
            <span className="text-xs text-[#5A5853] font-medium">User Capacity Limit</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-[#E8E4DD]">
                {company?.max_users === 9999 ? 'Unlimited' : company?.max_users}
              </span>
              <span className="text-xs text-[#8A8680]">max registered accounts</span>
            </div>
            <p className="text-[11px] text-[#8A8680] mt-3 border-t border-[#2A2A2D]/50 pt-2">
              Defines the maximum team members that can operate on this tenant.
            </p>
          </div>

          <div className="p-4 bg-[#111113] rounded-xl border border-[#2A2A2D] flex flex-col justify-between">
            <span className="text-xs text-[#5A5853] font-medium">Contact Directory Limit</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-[#E8E4DD]">
                {company?.max_contacts === 99999 ? 'Unlimited' : company?.max_contacts}
              </span>
              <span className="text-xs text-[#8A8680]">max contacts storage</span>
            </div>
            <p className="text-[11px] text-[#8A8680] mt-3 border-t border-[#2A2A2D]/50 pt-2">
              The aggregate amount of active leads and contact cards your team can maintain.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Grid of pricing cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans?.map((plan) => {
          const isCurrent = plan.plan_id === currentPlanId;
          const price = parseFloat(plan.price_per_month);

          return (
            <Card
              key={plan.plan_id}
              className={`flex flex-col justify-between border-[#2A2A2D] text-[#E8E4DD] shadow-lg relative overflow-hidden transition-all duration-300 ${
                isCurrent
                  ? 'bg-[#141416] border-[#D4A853]/50 ring-1 ring-indigo-500/30'
                  : 'bg-[#141416] hover:border-[#D4A853]/20'
              }`}
            >
              {isCurrent && (
                <div className="absolute top-0 right-0">
                  <Badge className="rounded-none rounded-bl-lg bg-[#D4A853] hover:bg-[#D4A853] text-[#E8E4DD] font-semibold text-[10px] px-2.5 py-1">
                    Active Plan
                  </Badge>
                </div>
              )}
              <CardHeader>
                <span className="text-xs font-semibold tracking-wider text-[#5A5853] uppercase">
                  {plan.plan_name}
                </span>
                <div className="flex items-baseline gap-1 mt-1.5">
                  <span className="text-3xl font-extrabold text-[#E8E4DD]">${price.toFixed(0)}</span>
                  <span className="text-xs text-[#8A8680] font-medium">/ month</span>
                </div>
                <CardDescription className="text-[#8A8680] text-xs mt-1">
                  Scope limitations and relational capacity bounds.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 flex-1">
                <div className="border-t border-[#2A2A2D] my-2" />
                <ul className="space-y-2.5 text-xs text-[#C4C0B8]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#D4A853] flex-shrink-0" />
                    <span>Up to <strong>{plan.max_users === 9999 ? 'Unlimited' : plan.max_users}</strong> users</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#D4A853] flex-shrink-0" />
                    <span>Up to <strong>{plan.max_contacts === 99999 ? 'Unlimited' : plan.max_contacts}</strong> contacts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#D4A853] flex-shrink-0 mt-0.5" />
                    <span>{plan.features}</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="pt-4 border-t border-[#2A2A2D]/50">
                {isCurrent ? (
                  <Button className="w-full bg-[#1C1C1F] hover:bg-[#1C1C1F] text-[#C4C0B8] cursor-default" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Button
                    className="w-full bg-[#D4A853] hover:bg-[#E8C87A] text-[#E8E4DD] font-semibold transition-all"
                    onClick={() => toast.info('Upgrade request sent to billing operations! An representative will contact you soon.')}
                  >
                    Upgrade Tier
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
