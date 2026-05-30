'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  DollarSign,
  User,
  Clock,
  ArrowLeft,
  Loader2,
  Trash2,
  Edit2,
  Sparkles,
  TrendingUp,
  Briefcase,
  Calendar,
  CheckCircle2,
  Plus,
  FileSpreadsheet,
  PlusCircle,
} from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import ActivityTimeline from '@/components/app/activity-timeline';
import { dealSchema, DealInput } from '@/lib/validations/deal';
import { activitySchema } from '@/lib/validations/activity';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function DealDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const dealId = parseInt(params.id as string, 10);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);

  const currentUser = session?.user as any;
  const isManagerOrAdmin = currentUser?.roleName === 'admin' || currentUser?.roleName === 'manager' || currentUser?.roleId === 1 || currentUser?.roleId === 2;

  // 1. Fetch Deal Details
  const { data: deal, isLoading: isLoadingDeal, error: dealError } = useQuery({
    queryKey: ['deal-detail', dealId],
    queryFn: () => fetch(`/api/deals/${dealId}`).then(async res => {
      if (!res.ok) throw new Error('Deal not found');
      return res.json();
    }),
    enabled: !!dealId && !!session,
  });

  // 2. Fetch Deal Activities
  const { data: activities, isLoading: isLoadingActivities } = useQuery({
    queryKey: ['deal-activities', dealId],
    queryFn: () => fetch(`/api/activities?deal_id=${dealId}`).then(res => res.json()),
    enabled: !!dealId && !!session,
  });

  // 3. Fetch Linked Invoices (Sprint 4)
  const { data: invoices, isLoading: isLoadingInvoices } = useQuery({
    queryKey: ['deal-invoices', dealId],
    queryFn: () => fetch(`/api/invoices?deal_id=${dealId}`).then(res => {
      if (!res.ok) return [];
      return res.json();
    }),
    enabled: !!dealId && !!session,
  });

  // 4. Fetch Team
  const { data: team } = useQuery({
    queryKey: ['team-assigned-dropdown'],
    queryFn: () => fetch('/api/users').then(res => res.json()),
    enabled: !!session,
  });

  // Forms
  const editForm = useForm({
    defaultValues: {
      deal_title: '',
      value: 0,
      stage: 'proposal',
      assigned_to: '',
      expected_close_date: '',
    },
  });

  const activityForm = useForm({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      deal_id: dealId,
      activity_type: 'call',
      summary: '',
    },
  });

  // Mutations
  const updateMutation = useMutation({
    mutationFn: (values: any) =>
      fetch(`/api/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          assigned_to: values.assigned_to === 'unassigned' || !values.assigned_to ? null : parseInt(values.assigned_to, 10),
          value: parseFloat(values.value) || 0,
        }),
      }).then(async res => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Failed to update deal');
        return body;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-detail', dealId] });
      queryClient.invalidateQueries({ queryKey: ['deals-list'] });
      toast.success('Deal details updated.');
      setIsEditOpen(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateStageMutation = useMutation({
    mutationFn: (stage: 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost') =>
      fetch(`/api/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage }),
      }).then(async res => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Failed to update deal stage');
        return body;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-detail', dealId] });
      queryClient.invalidateQueries({ queryKey: ['deals-list'] });
      toast.success('Deal stage updated successfully.');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const logActivityMutation = useMutation({
    mutationFn: (values: any) =>
      fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, deal_id: dealId }),
      }).then(async res => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Failed to log activity');
        return body;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-activities', dealId] });
      toast.success('Activity logged successfully.');
      setIsActivityOpen(false);
      activityForm.reset({
        deal_id: dealId,
        activity_type: 'call',
        summary: '',
      });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/deals/${dealId}`, {
        method: 'DELETE',
      }).then(async res => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Failed to delete deal');
        return body;
      }),
    onSuccess: () => {
      toast.success('Deal deleted.');
      router.push('/dashboard/deals');
    },
    onError: (err: any) => toast.error(err.message),
  });

  React.useEffect(() => {
    if (deal) {
      editForm.reset({
        deal_title: deal.deal_title,
        value: deal.value || 0,
        stage: deal.stage,
        assigned_to: deal.assigned_to?.toString() || 'unassigned',
        expected_close_date: deal.expected_close_date ? new Date(deal.expected_close_date).toISOString().substring(0, 10) : '',
      });
    }
  }, [deal, editForm]);

  if (isLoadingDeal) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 text-[#D4A853] animate-spin" />
      </div>
    );
  }

  if (dealError || !deal) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-[#E8E4DD]">Deal Not Found</h2>
        <p className="text-[#8A8680] mt-2">The deal you are looking for does not exist or has been deleted.</p>
        <Link href="/dashboard/deals" className={cn(buttonVariants({ variant: 'outline' }), 'mt-4 border-[#2A2A2D]')}>
          Back to Deals
        </Link>
      </div>
    );
  }

  // Stepper Stage logic
  const stages: ('proposal' | 'negotiation' | 'closed_won' | 'closed_lost')[] = ['proposal', 'negotiation', 'closed_won'];
  if (deal.stage === 'closed_lost') {
    stages[2] = 'closed_lost';
  }

  const currentStageIndex = stages.indexOf(deal.stage);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2A2A2D] pb-5">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/deals" className="text-[#8A8680] hover:text-[#E8E4DD] p-1 hover:bg-[#1C1C1F] rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#E8E4DD]">{deal.deal_title}</h1>
            <p className="text-xs text-[#8A8680]">Track and manage stage progression, log team actions, and linked invoice items.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsEditOpen(true)}
            variant="outline"
            className="border-[#2A2A2D] text-[#C4C0B8] hover:bg-[#1C1C1F] hover:text-[#E8E4DD] flex items-center gap-2 cursor-pointer"
          >
            <Edit2 className="h-4 w-4" />
            Edit Parameters
          </Button>

          {isManagerOrAdmin && (
            <Button
              onClick={() => {
                if (confirm('Are you sure you want to delete this deal?')) {
                  deleteMutation.mutate();
                }
              }}
              variant="destructive"
              className="bg-red-950/40 text-[#C75B39] hover:bg-red-900 border border-red-900/30 flex items-center gap-2 cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              Delete Deal
            </Button>
          )}
        </div>
      </div>

      {/* Progress Stage Stepper */}
      <Card className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD] shadow-md">
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 max-w-2xl mx-auto">
            {stages.map((stage, idx) => {
              const isCompleted = idx < currentStageIndex;
              const isActive = idx === currentStageIndex;
              
              return (
                <React.Fragment key={stage}>
                  <button
                    onClick={() => updateStageMutation.mutate(stage)}
                    className="flex flex-col items-center gap-2 group cursor-pointer focus:outline-none focus:ring-0"
                  >
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all shadow-md",
                      isCompleted && "bg-[#6B8F71]/10 border-emerald-500 text-[#6B8F71]",
                      isActive && "bg-[#D4A853] border-[#D4A853] text-[#E8E4DD] shadow-[#D4A853]/10",
                      !isActive && !isCompleted && "bg-[#141416] border-[#2A2A2D] text-[#5A5853] group-hover:border-[#2A2A2D]"
                    )}>
                      {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <span>{idx + 1}</span>}
                    </div>
                    <span className={cn(
                      "text-[10px] uppercase font-bold tracking-wider capitalize",
                      isCompleted && "text-[#6B8F71]",
                      isActive && "text-[#E8E4DD]",
                      !isActive && !isCompleted && "text-[#5A5853] group-hover:text-[#8A8680]"
                    )}>
                      {stage.replace('_', ' ')}
                    </span>
                  </button>
                  {idx < stages.length - 1 && (
                    <div className={cn(
                      "hidden sm:block h-[2px] flex-1 bg-[#1C1C1F]",
                      idx < currentStageIndex && "bg-emerald-500/30"
                    )} />
                  )}
                </React.Fragment>
              );
            })}
            
            {/* Conditional Closed Lost Button */}
            {deal.stage !== 'closed_lost' && (
              <React.Fragment>
                <div className="hidden sm:block h-[2px] w-6 bg-[#1C1C1F]" />
                <button
                  onClick={() => updateStageMutation.mutate('closed_lost')}
                  className="flex flex-col items-center gap-2 group cursor-pointer"
                >
                  <div className="h-10 w-10 rounded-full flex items-center justify-center border-2 bg-[#141416] border-[#2A2A2D] text-[#5A5853] group-hover:border-red-900/60 group-hover:text-[#C75B39] transition-all">
                    <span>X</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#5A5853] group-hover:text-[#C75B39]">
                    Lost
                  </span>
                </button>
              </React.Fragment>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deal Parameters Details */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD] shadow-md">
            <CardHeader className="border-b border-[#2A2A2D] pb-4">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-[#8A8680] flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-[#D4A853]" />
                Deal Value & Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <DollarSign className="h-4 w-4 text-[#D4A853]/80" />
                <div>
                  <div className="text-[10px] text-[#5A5853] uppercase tracking-wider">Estimated Valuation</div>
                  <div className="text-[#E8E4DD] text-base font-extrabold font-mono">${(deal.value || 0).toLocaleString()}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-[#D4A853]/80" />
                <div>
                  <div className="text-[10px] text-[#5A5853] uppercase tracking-wider">Assigned Agent</div>
                  <div className="text-[#E8E4DD] font-medium">{deal.assignee_name || 'Unassigned'}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-[#D4A853]/80" />
                <div>
                  <div className="text-[10px] text-[#5A5853] uppercase tracking-wider">Expected Close Date</div>
                  <div className="text-[#E8E4DD] font-medium font-mono">
                    {deal.expected_close_date ? format(new Date(deal.expected_close_date), 'PPP') : 'Not specified'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-[#D4A853]/80" />
                <div>
                  <div className="text-[10px] text-[#5A5853] uppercase tracking-wider">Pipeline Stage</div>
                  <Badge className={cn("uppercase text-[9px] font-bold mt-0.5 border", 
                    deal.stage === 'proposal' && 'bg-[#5B8FB9]/10 text-[#5B8FB9] border-[#5B8FB9]/20',
                    deal.stage === 'negotiation' && 'bg-[#D4A853]/10 text-[#D4A853] border-[#D4A853]/20',
                    deal.stage === 'closed_won' && 'bg-[#6B8F71]/10 text-[#6B8F71] border-[#6B8F71]/20',
                    deal.stage === 'closed_lost' && 'bg-[#C75B39]/10 text-[#C75B39] border-[#C75B39]/20',
                  )}>
                    {deal.stage}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Linked Contact Quick panel */}
          <Card className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD] shadow-md">
            <CardHeader className="border-b border-[#2A2A2D] pb-4">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-[#8A8680] flex items-center gap-2">
                <User className="h-4 w-4 text-[#D4A853]" />
                Linked Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-[#D4A853]/80" />
                <div>
                  <div className="text-[10px] text-[#5A5853] uppercase tracking-wider">Contact Profile</div>
                  <div className="text-[#E8E4DD] font-semibold flex items-center gap-1">
                    {deal.contact_name || 'No contact linked'}
                  </div>
                </div>
              </div>

              {deal.contact_email && (
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-[#D4A853]/80" />
                  <div>
                    <div className="text-[10px] text-[#5A5853] uppercase tracking-wider">Email Address</div>
                    <div className="text-[#E8E4DD] font-medium font-mono">{deal.contact_email}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Linked Invoices (Sprint 4 feature hook) */}
          <Card className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD] shadow-md">
            <CardHeader className="flex flex-row justify-between items-center border-b border-[#2A2A2D] pb-4">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-[#8A8680] flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-[#D4A853]" />
                Linked Invoices
              </CardTitle>
              <Link
                href="/dashboard/invoices"
                className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'text-[#D4A853] hover:text-[#E8E4DD] flex items-center gap-1 text-[11px]')}
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Create
              </Link>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              {isLoadingInvoices ? (
                <div className="flex justify-center py-2">
                  <Loader2 className="h-4 w-4 text-[#D4A853] animate-spin" />
                </div>
              ) : !invoices || invoices.length === 0 ? (
                <div className="text-center py-6 text-xs text-[#5A5853]">No invoices logged.</div>
              ) : (
                <div className="space-y-3">
                  {invoices.map((inv: any) => (
                    <Link
                      key={inv.invoice_id}
                      href={`/dashboard/invoices/${inv.invoice_id}`}
                      className="block p-3 bg-[#111113] border border-[#2A2A2D] hover:border-slate-750 rounded-xl transition-all"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-[#E8E4DD]">Invoice #{inv.invoice_id}</span>
                        <span className="font-mono text-xs text-[#6B8F71] font-bold">${inv.total_amount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-[10px] text-[#5A5853]">Due: {inv.due_date ? format(new Date(inv.due_date), 'MMM d') : '-'}</span>
                        <Badge className="bg-[#D4A853]/10 text-[#D4A853] border border-[#D4A853]/20 uppercase text-[9px] scale-90">
                          {inv.status}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Timeline Log Panel */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD] shadow-md">
            <CardHeader className="flex flex-row justify-between items-center border-b border-[#2A2A2D] pb-4">
              <div>
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-[#8A8680] flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#D4A853]" />
                  Deal Action History & Logged Events
                </CardTitle>
              </div>
              <Button
                onClick={() => setIsActivityOpen(true)}
                size="sm"
                className="bg-[#D4A853] hover:bg-[#E8C87A] text-[#E8E4DD] font-semibold flex items-center gap-1.5 cursor-pointer text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Log Event
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              {isLoadingActivities ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 text-[#D4A853] animate-spin" />
                </div>
              ) : (
                <ActivityTimeline activities={activities || []} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Parameter Edit Sheet Drawer */}
      <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
        <SheetContent className="bg-[#0D0D0F] border-[#2A2A2D] text-[#E8E4DD] w-full sm:max-w-md">
          <SheetHeader className="border-b border-[#2A2A2D] pb-6 mb-6">
            <SheetTitle className="text-[#E8E4DD] flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-[#D4A853]" />
              Edit Deal Details
            </SheetTitle>
            <SheetDescription className="text-[#8A8680]">
              Modify deal valuations and assigned scopes.
            </SheetDescription>
          </SheetHeader>

          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(v => updateMutation.mutate(v))} className="space-y-6">
              <FormField
                control={editForm.control}
                name="deal_title"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#C4C0B8]">Deal Title</FormLabel>
                    <FormControl>
                      <Input className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD]" {...field} />
                    </FormControl>
                    <FormMessage className="text-[#C75B39]" />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="value"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#C4C0B8]">Valuation ($)</FormLabel>
                    <FormControl>
                      <Input type="number" className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD] font-mono" {...field} />
                    </FormControl>
                    <FormMessage className="text-[#C75B39]" />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="assigned_to"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#C4C0B8]">Assigned Team Member</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-[#141416] border-[#2A2A2D] text-[#C4C0B8]">
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#141416] border-[#2A2A2D] text-[#C4C0B8]">
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {team?.map((member: any) => (
                          <SelectItem key={member.user_id} value={member.user_id.toString()}>
                            {member.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[#C75B39]" />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="expected_close_date"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#C4C0B8]">Expected Close Date</FormLabel>
                    <FormControl>
                      <Input type="date" className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD]" {...field} />
                    </FormControl>
                    <FormMessage className="text-[#C75B39]" />
                  </FormItem>
                )}
              />

              <div className="flex gap-4 pt-6 border-t border-[#2A2A2D]">
                <Button type="button" onClick={() => setIsEditOpen(false)} variant="outline" className="border-[#2A2A2D] text-[#C4C0B8] hover:bg-[#1C1C1F] hover:text-[#E8E4DD] cursor-pointer">
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending} className="flex-1 bg-[#D4A853] hover:bg-[#E8C87A] text-[#E8E4DD] font-semibold cursor-pointer">
                  {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Deal'}
                </Button>
              </div>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      {/* Log Activity Sheet Drawer */}
      <Sheet open={isActivityOpen} onOpenChange={setIsActivityOpen}>
        <SheetContent className="bg-[#0D0D0F] border-[#2A2A2D] text-[#E8E4DD] w-full sm:max-w-md">
          <SheetHeader className="border-b border-[#2A2A2D] pb-6 mb-6">
            <SheetTitle className="text-[#E8E4DD] flex items-center gap-2">
              <Plus className="h-5 w-5 text-[#D4A853]" />
              Log Deal Event Note
            </SheetTitle>
            <SheetDescription className="text-[#8A8680]">
              Record telephone updates, negotiations, or client meetings specific to this deal.
            </SheetDescription>
          </SheetHeader>

          <Form {...activityForm}>
            <form onSubmit={activityForm.handleSubmit(v => logActivityMutation.mutate(v))} className="space-y-6">
              <FormField
                control={activityForm.control}
                name="activity_type"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#C4C0B8]">Event Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-[#141416] border-[#2A2A2D] text-[#C4C0B8]">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#141416] border-[#2A2A2D] text-[#C4C0B8]">
                        <SelectItem value="call">Call Log</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="meeting">Personal Meeting</SelectItem>
                        <SelectItem value="note">Internal Note</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[#C75B39]" />
                  </FormItem>
                )}
              />

              <FormField
                control={activityForm.control}
                name="summary"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#C4C0B8]">Event Summary</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Discussed pricing metrics and agreed to redline contract next Monday." className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD] min-h-[100px]" {...field} />
                    </FormControl>
                    <FormMessage className="text-[#C75B39]" />
                  </FormItem>
                )}
              />



              <div className="flex gap-4 pt-6 border-t border-[#2A2A2D]">
                <Button type="button" onClick={() => setIsActivityOpen(false)} variant="outline" className="border-[#2A2A2D] text-[#C4C0B8] hover:bg-[#1C1C1F] hover:text-[#E8E4DD] cursor-pointer">
                  Cancel
                </Button>
                <Button type="submit" disabled={logActivityMutation.isPending} className="flex-1 bg-[#D4A853] hover:bg-[#E8C87A] text-[#E8E4DD] font-semibold cursor-pointer">
                  {logActivityMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Log Event'}
                </Button>
              </div>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
