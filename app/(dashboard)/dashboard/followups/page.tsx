'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import {
  PhoneCall,
  Plus,
  Loader2,
  Calendar,
  Clock,
  ArrowRight,
  TrendingUp,
  User,
  CheckCircle,
  HelpCircle,
  MoreHorizontal,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DataTable } from '@/components/shared/data-table';
import { followupSchema, FollowupInput } from '@/lib/validations/followup';
import { format } from 'date-fns';

interface FollowupRecord {
  followup_id: number;
  company_id: number;
  contact_id: number;
  lead_id?: number;
  deal_id?: number;
  scheduled_by?: number;
  scheduled_date: string;
  outcome?: 'reached' | 'no_answer' | 'rescheduled' | 'converted';
  next_action?: string;
  created_at: string;
  contact_name: string;
  contact_email?: string;
  deal_title?: string;
  scheduler_name?: string;
}

export default function FollowupsPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);
  const [filterType, setFilterType] = useState<'upcoming' | 'past'>('upcoming');
  const [selectedFollowup, setSelectedFollowup] = useState<FollowupRecord | null>(null);
  const [isOutcomeOpen, setIsOutcomeOpen] = useState(false);

  // Forms
  const form = useForm({
    resolver: zodResolver(followupSchema) as any,
    defaultValues: {
      contact_id: undefined as any,
      lead_id: null as number | null,
      deal_id: null as number | null,
      scheduled_date: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      next_action: '',
    },
  });

  const outcomeForm = useForm({
    defaultValues: {
      outcome: 'reached',
      next_action: '',
    },
  });

  // 1. Fetch Followups
  const { data: followups, isLoading: isLoadingFollowups } = useQuery<FollowupRecord[]>({
    queryKey: ['followups-list', filterType],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filterType === 'upcoming') params.append('upcoming', 'true');
      if (filterType === 'past') params.append('past', 'true');
      return fetch(`/api/followups?${params.toString()}`).then(res => res.json());
    },
    enabled: !!session,
  });

  // 2. Fetch Contacts
  const { data: contacts } = useQuery<any[]>({
    queryKey: ['contacts-followups-dropdown'],
    queryFn: () => fetch('/api/contacts').then(res => res.json()),
    enabled: !!session,
  });

  // 3. Fetch Deals
  const { data: deals } = useQuery<any[]>({
    queryKey: ['deals-followups-dropdown'],
    queryFn: () => fetch('/api/deals').then(res => res.json()),
    enabled: !!session,
  });

  // 4. Fetch Leads
  const { data: leads } = useQuery<any[]>({
    queryKey: ['leads-followups-dropdown'],
    queryFn: () => fetch('/api/leads').then(res => res.json()),
    enabled: !!session,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (values: any) =>
      fetch('/api/followups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      }).then(async res => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Failed to schedule followup');
        return body;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followups-list'] });
      toast.success('Followup scheduled successfully.');
      setIsOpen(false);
      form.reset();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateOutcomeMutation = useMutation({
    mutationFn: (values: { outcome: string; next_action?: string }) =>
      fetch(`/api/followups/${selectedFollowup?.followup_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      }).then(async res => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Failed to update outcome');
        return body;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followups-list'] });
      toast.success('Follow-up outcome confirmed.');
      setIsOutcomeOpen(false);
      setSelectedFollowup(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/followups/${id}`, {
        method: 'DELETE',
      }).then(async res => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Failed to delete followup');
        return body;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followups-list'] });
      toast.success('Follow-up deleted successfully.');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const onSubmit = (values: any) => {
    createMutation.mutate(values);
  };

  const handleOutcomeTrigger = (f: FollowupRecord) => {
    setSelectedFollowup(f);
    outcomeForm.reset({
      outcome: 'reached',
      next_action: f.next_action || '',
    });
    setIsOutcomeOpen(true);
  };

  const columns: ColumnDef<FollowupRecord>[] = [
    {
      accessorKey: 'contact_name',
      header: 'Linked Contact',
      cell: ({ row }) => (
        <Link 
          href={`/dashboard/contacts/${row.original.contact_id}`}
          className="font-semibold text-[#E8E4DD] hover:text-[#D4A853] transition-colors flex items-center gap-1.5"
        >
          {row.original.contact_name}
          <ExternalLink className="h-3 w-3 opacity-40" />
        </Link>
      ),
    },
    {
      accessorKey: 'scheduled_date',
      header: 'Scheduled Timestamp',
      cell: ({ row }) => {
        const date = new Date(row.original.scheduled_date);
        return (
          <span className="font-mono text-xs font-semibold text-[#D4A853] flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {format(date, 'PP p')}
          </span>
        );
      },
    },
    {
      accessorKey: 'next_action',
      header: 'Scheduled Task / Notes',
      cell: ({ row }) => row.original.next_action || '-',
    },
    {
      accessorKey: 'deal_title',
      header: 'Linked Deal',
      cell: ({ row }) => row.original.deal_title || '-',
    },
    {
      accessorKey: 'scheduler_name',
      header: 'Scheduled By',
      cell: ({ row }) => row.original.scheduler_name || 'System',
    },
    {
      accessorKey: 'outcome',
      header: 'Outcome',
      cell: ({ row }) => {
        const outcome = row.original.outcome;
        if (!outcome) {
          return (
            <Button
              onClick={() => handleOutcomeTrigger(row.original)}
              size="sm"
              variant="outline"
              className="border-[#2A2A2D] text-[10px] py-1 px-2.5 h-7 cursor-pointer hover:bg-[#1C1C1F] font-semibold"
            >
              Update Outcome
            </Button>
          );
        }
        let color = 'bg-[#1C1C1F] text-[#C4C0B8]';
        if (outcome === 'reached' || outcome === 'converted') color = 'bg-[#6B8F71]/10 text-[#6B8F71] border-[#6B8F71]/20';
        if (outcome === 'no_answer') color = 'bg-[#C75B39]/10 text-[#C75B39] border-[#C75B39]/20';
        if (outcome === 'rescheduled') color = 'bg-[#5B8FB9]/10 text-[#5B8FB9] border-[#5B8FB9]/20';
        return <Badge className={`capitalize text-[10px] border font-semibold ${color}`}>{outcome}</Badge>;
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger className="h-8 w-8 text-[#8A8680] hover:text-[#E8E4DD] hover:bg-[#1C1C1F] rounded-md flex items-center justify-center cursor-pointer focus:outline-none">
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#141416] border-[#2A2A2D] text-[#C4C0B8]">
            <DropdownMenuItem
              onClick={() => {
                if (confirm('Delete this followup schedule?')) {
                  deleteMutation.mutate(row.original.followup_id);
                }
              }}
              className="text-[#C75B39] focus:text-[#C75B39] hover:bg-[#1C1C1F] focus:bg-[#1C1C1F] cursor-pointer flex items-center gap-2"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Schedule</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2A2A2D] pb-5">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight text-[#E8E4DD] flex items-center gap-2">
            <PhoneCall className="h-6 w-6 text-[#D4A853]" />
            Follow-up Scheduler
          </h1>
          <p className="text-sm text-[#8A8680]">Plan customer call lists and track completed outreach outcomes.</p>
        </div>
        <div className="flex gap-2">
          {/* Toggles */}
          <div className="flex items-center gap-1.5 bg-[#141416] border border-[#2A2A2D] p-1.5 rounded-xl">
            <button
              onClick={() => setFilterType('upcoming')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                filterType === 'upcoming' ? 'bg-[#D4A853] text-[#E8E4DD] shadow' : 'text-[#8A8680] hover:text-[#C4C0B8]'
              }`}
            >
              Upcoming Tasks
            </button>
            <button
              onClick={() => setFilterType('past')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                filterType === 'past' ? 'bg-[#D4A853] text-[#E8E4DD] shadow' : 'text-[#8A8680] hover:text-[#C4C0B8]'
              }`}
            >
              Past Outcomes
            </button>
          </div>

          <Button
            onClick={() => setIsOpen(true)}
            className="bg-[#D4A853] hover:bg-[#E8C87A] text-[#E8E4DD] font-semibold flex items-center gap-2 py-4 px-4 shadow-lg shadow-[#D4A853]/10 cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5" />
            Schedule Followup
          </Button>
        </div>
      </div>

      <Card className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD] shadow-xl">
        <CardContent className="pt-6">
          {isLoadingFollowups ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 text-[#D4A853] animate-spin" />
            </div>
          ) : (
            <DataTable columns={columns} data={followups || []} />
          )}
        </CardContent>
      </Card>

      {/* Outcome Dialog popup */}
      <Dialog open={isOutcomeOpen} onOpenChange={setIsOutcomeOpen}>
        <DialogContent className="bg-[#0D0D0F] border-[#2A2A2D] text-[#E8E4DD] max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#E8E4DD] flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-[#D4A853]" />
              Update Followup Outcome
            </DialogTitle>
            <DialogDescription className="text-[#8A8680]">
              Select outcome and note details to log in your timeline metrics.
            </DialogDescription>
          </DialogHeader>

          <Form {...outcomeForm}>
            <form onSubmit={outcomeForm.handleSubmit(v => updateOutcomeMutation.mutate(v))} className="space-y-4">
              <FormField
                control={outcomeForm.control}
                name="outcome"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-[#C4C0B8]">Call Outcome</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-[#141416] border-[#2A2A2D] text-[#C4C0B8]">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#141416] border-[#2A2A2D] text-[#C4C0B8]">
                        <SelectItem value="reached">Reached Customer</SelectItem>
                        <SelectItem value="no_answer">No Answer / Left Voicemail</SelectItem>
                        <SelectItem value="rescheduled">Rescheduled Call</SelectItem>
                        <SelectItem value="converted">Converted/Deal Progress</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[#C75B39]" />
                  </FormItem>
                )}
              />

              <FormField
                control={outcomeForm.control}
                name="next_action"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-[#C4C0B8]">Outcome Details / Notes</FormLabel>
                    <FormControl>
                      <Input className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD]" {...field} />
                    </FormControl>
                    <FormMessage className="text-[#C75B39]" />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-4 border-t border-[#2A2A2D]">
                <Button type="button" onClick={() => setIsOutcomeOpen(false)} variant="outline" className="border-[#2A2A2D] text-[#C4C0B8] hover:bg-[#1C1C1F] cursor-pointer">
                  Cancel
                </Button>
                <Button type="submit" disabled={updateOutcomeMutation.isPending} className="flex-1 bg-[#D4A853] hover:bg-[#E8C87A] text-[#E8E4DD] font-semibold cursor-pointer">
                  {updateOutcomeMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Confirm Outcome'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Schedule Followup Sheet Drawer */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="bg-[#0D0D0F] border-[#2A2A2D] text-[#E8E4DD] w-full sm:max-w-md">
          <SheetHeader className="border-b border-[#2A2A2D] pb-6 mb-6">
            <SheetTitle className="text-[#E8E4DD] flex items-center gap-2">
              <PhoneCall className="h-5 w-5 text-[#D4A853]" />
              Schedule Followup Task
            </SheetTitle>
            <SheetDescription className="text-[#8A8680]">
              Schedule a task or call and receive reminders in your followups logs.
            </SheetDescription>
          </SheetHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="contact_id"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#C4C0B8]">Contact</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger className="bg-[#141416] border-[#2A2A2D] text-[#C4C0B8]">
                          <SelectValue placeholder="Select contact profile" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#141416] border-[#2A2A2D] text-[#C4C0B8] font-sans">
                        {contacts?.map(c => (
                          <SelectItem key={c.contact_id} value={c.contact_id.toString()}>
                            {c.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[#C75B39]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deal_id"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#C4C0B8]">Linked Pipeline Deal (Optional)</FormLabel>
                    <Select
                      onValueChange={val => (field.onChange as any)(val === 'none' ? null : (val ? parseInt(val, 10) : null))}
                      value={field.value?.toString() || 'none'}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-[#141416] border-[#2A2A2D] text-[#C4C0B8]">
                          <SelectValue placeholder="No Linked Deal" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#141416] border-[#2A2A2D] text-[#C4C0B8] font-sans">
                        <SelectItem value="none">No Linked Deal</SelectItem>
                        {deals?.map(d => (
                          <SelectItem key={d.deal_id} value={d.deal_id.toString()}>
                            {d.deal_title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[#C75B39]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lead_id"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#C4C0B8]">Linked Sales Lead (Optional)</FormLabel>
                    <Select
                      onValueChange={val => (field.onChange as any)(val === 'none' ? null : (val ? parseInt(val, 10) : null))}
                      value={field.value?.toString() || 'none'}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-[#141416] border-[#2A2A2D] text-[#C4C0B8]">
                          <SelectValue placeholder="No Linked Lead" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#141416] border-[#2A2A2D] text-[#C4C0B8] font-sans">
                        <SelectItem value="none">No Linked Lead</SelectItem>
                        {leads?.map(l => (
                          <SelectItem key={l.lead_id} value={l.lead_id.toString()}>
                            Lead #{l.lead_id} — {l.contact_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[#C75B39]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scheduled_date"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#C4C0B8]">Scheduled Date & Time</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD] font-mono" {...field} />
                    </FormControl>
                    <FormMessage className="text-[#C75B39]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="next_action"
                render={({ field }) => {
                  const { value, ...fieldProps } = field;
                  return (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-[#C4C0B8]">Follow-up Task Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Call customer to discuss licensing proposal details" className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD]" {...fieldProps} value={value || ''} />
                      </FormControl>
                      <FormMessage className="text-[#C75B39]" />
                    </FormItem>
                  );
                }}
              />

              <div className="flex gap-4 pt-6 border-t border-[#2A2A2D]">
                <Button type="button" onClick={() => setIsOpen(false)} variant="outline" className="border-[#2A2A2D] text-[#C4C0B8] hover:bg-[#1C1C1F] hover:text-[#E8E4DD] cursor-pointer">
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending} className="flex-1 bg-[#D4A853] hover:bg-[#E8C87A] text-[#E8E4DD] font-semibold cursor-pointer">
                  {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Schedule'}
                </Button>
              </div>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
