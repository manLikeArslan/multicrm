'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import {
  DollarSign,
  Plus,
  Loader2,
  MoreHorizontal,
  Edit2,
  Trash2,
  ExternalLink,
  TrendingUp,
  Percent,
  Briefcase,
} from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/shared/data-table';
import { dealSchema, DealInput } from '@/lib/validations/deal';
import { format } from 'date-fns';

interface DealRecord {
  deal_id: number;
  lead_id?: number;
  company_id: number;
  assigned_to?: number;
  deal_title: string;
  value?: number;
  stage: 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  expected_close_date?: string;
  actual_close_date?: string;
  created_at: string;
  contact_name?: string;
  assignee_name?: string;
}

export default function DealsPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<DealRecord | null>(null);

  const currentUser = session?.user as any;
  const isManagerOrAdmin = currentUser?.roleName === 'admin' || currentUser?.roleName === 'manager' || currentUser?.roleId === 1 || currentUser?.roleId === 2;

  // 1. Fetch Deals
  const { data: deals, isLoading: isLoadingDeads } = useQuery<DealRecord[]>({
    queryKey: ['deals-list'],
    queryFn: () => fetch('/api/deals').then(res => res.json()),
    enabled: !!session,
  });

  // 2. Fetch Leads for dropdown selection
  const { data: leads } = useQuery<any[]>({
    queryKey: ['leads-dropdown'],
    queryFn: () => fetch('/api/leads').then(res => res.json()),
    enabled: !!session,
  });

  // 3. Fetch Team Members
  const { data: team } = useQuery<any[]>({
    queryKey: ['team-dropdown'],
    queryFn: () => fetch('/api/users').then(res => res.json()),
    enabled: !!session,
  });

  const form = useForm({
    resolver: zodResolver(dealSchema) as any,
    defaultValues: {
      deal_title: '',
      value: 0,
      stage: 'proposal' as 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost',
      assigned_to: null as number | null,
      lead_id: null as number | null,
      expected_close_date: '',
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (values: DealInput) =>
      fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      }).then(async res => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Failed to create deal');
        return body;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals-list'] });
      toast.success('Deal created successfully.');
      setIsOpen(false);
      form.reset();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (values: DealInput) =>
      fetch(`/api/deals/${editingDeal?.deal_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      }).then(async res => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Failed to update deal');
        return body;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals-list'] });
      toast.success('Deal updated successfully.');
      setIsOpen(false);
      setEditingDeal(null);
      form.reset();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (dealId: number) =>
      fetch(`/api/deals/${dealId}`, {
        method: 'DELETE',
      }).then(async res => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Failed to delete deal');
        return body;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals-list'] });
      toast.success('Deal successfully deleted.');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const onSubmit = (values: any) => {
    if (editingDeal) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };

  const handleEdit = (deal: DealRecord) => {
    setEditingDeal(deal);
    form.reset({
      deal_title: deal.deal_title,
      value: deal.value || 0,
      stage: deal.stage,
      assigned_to: deal.assigned_to || null,
      lead_id: deal.lead_id || null,
      expected_close_date: deal.expected_close_date ? new Date(deal.expected_close_date).toISOString().substring(0, 10) : '',
    });
    setIsOpen(true);
  };

  const handleNew = () => {
    setEditingDeal(null);
    form.reset({
      deal_title: '',
      value: 0,
      stage: 'proposal',
      assigned_to: null,
      lead_id: null,
      expected_close_date: '',
    });
    setIsOpen(true);
  };

  // Pipeline calculations
  const totalPipeline = deals?.reduce((acc, deal) => acc + (deal.value || 0), 0) || 0;
  const activePipeline = deals?.filter(d => d.stage === 'proposal' || d.stage === 'negotiation').reduce((acc, d) => acc + (d.value || 0), 0) || 0;
  const closedWon = deals?.filter(d => d.stage === 'closed_won').reduce((acc, d) => acc + (d.value || 0), 0) || 0;

  const columns: ColumnDef<DealRecord>[] = [
    {
      accessorKey: 'deal_title',
      header: 'Deal Title',
      cell: ({ row }) => (
        <Link 
          href={`/dashboard/deals/${row.original.deal_id}`}
          className="font-semibold text-[#E8E4DD] hover:text-[#D4A853] transition-colors flex items-center gap-1.5"
        >
          {row.original.deal_title}
          <ExternalLink className="h-3 w-3 opacity-40" />
        </Link>
      ),
    },
    {
      accessorKey: 'value',
      header: 'Estimated Value',
      cell: ({ row }) => {
        const val = row.original.value || 0;
        return <span className="font-mono text-[#6B8F71] font-semibold">${val.toLocaleString()}</span>;
      },
    },
    {
      accessorKey: 'stage',
      header: 'Pipeline Stage',
      cell: ({ row }) => {
        const stage = row.original.stage;
        let color = 'bg-[#1C1C1F] text-[#C4C0B8]';
        if (stage === 'proposal') color = 'bg-[#5B8FB9]/10 text-[#5B8FB9] border-[#5B8FB9]/20';
        if (stage === 'negotiation') color = 'bg-[#D4A853]/10 text-[#D4A853] border-[#D4A853]/20';
        if (stage === 'closed_won') color = 'bg-[#6B8F71]/10 text-[#6B8F71] border-[#6B8F71]/20';
        if (stage === 'closed_lost') color = 'bg-[#C75B39]/10 text-[#C75B39] border-[#C75B39]/20';
        return <Badge className={`capitalize text-[10px] border font-semibold ${color}`}>{stage.replace('_', ' ')}</Badge>;
      },
    },
    {
      accessorKey: 'assignee_name',
      header: 'Assigned Agent',
      cell: ({ row }) => row.original.assignee_name || 'Unassigned',
    },
    {
      accessorKey: 'contact_name',
      header: 'Linked Contact',
      cell: ({ row }) => row.original.contact_name || '-',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const deal = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger className="h-8 w-8 text-[#8A8680] hover:text-[#E8E4DD] hover:bg-[#1C1C1F] rounded-md flex items-center justify-center cursor-pointer focus:outline-none">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#141416] border-[#2A2A2D] text-[#C4C0B8]">
              <DropdownMenuItem onClick={() => handleEdit(deal)} className="hover:bg-[#1C1C1F] focus:bg-[#1C1C1F] cursor-pointer flex items-center gap-2">
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit Deal</span>
              </DropdownMenuItem>
              {isManagerOrAdmin && (
                <DropdownMenuItem
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this deal?')) {
                      deleteMutation.mutate(deal.deal_id);
                    }
                  }}
                  className="text-[#C75B39] focus:text-[#C75B39] hover:bg-[#1C1C1F] focus:bg-[#1C1C1F] cursor-pointer flex items-center gap-2"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2A2A2D] pb-5">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight text-[#E8E4DD] flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-[#D4A853]" />
            Deals & Pipeline
          </h1>
          <p className="text-sm text-[#8A8680]">Track and forecast deal valuations, closed contracts, and sales pipelines.</p>
        </div>
        <Button
          onClick={handleNew}
          className="bg-[#D4A853] hover:bg-[#E8C87A] text-[#E8E4DD] font-semibold flex items-center gap-2 py-4 px-4 shadow-lg shadow-[#D4A853]/10 cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" />
          Add Deal
        </Button>
      </div>

      {/* Aggregate KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD] shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs text-[#8A8680] font-semibold uppercase tracking-wider">Active Pipeline</span>
            <TrendingUp className="h-4 w-4 text-[#D4A853]" />
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-extrabold text-[#E8E4DD] font-mono">${activePipeline.toLocaleString()}</span>
            <p className="text-[10px] text-[#5A5853] mt-1">Proposal & Negotiation valuations</p>
          </CardContent>
        </Card>

        <Card className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD] shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs text-[#8A8680] font-semibold uppercase tracking-wider">Closed Won Revenue</span>
            <DollarSign className="h-4 w-4 text-[#6B8F71]" />
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-extrabold text-[#E8E4DD] font-mono">${closedWon.toLocaleString()}</span>
            <p className="text-[10px] text-[#5A5853] mt-1">Contract value closed won</p>
          </CardContent>
        </Card>

        <Card className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD] shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs text-[#8A8680] font-semibold uppercase tracking-wider">Total Evaluated Value</span>
            <Percent className="h-4 w-4 text-[#8A8680]" />
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-extrabold text-[#E8E4DD] font-mono">${totalPipeline.toLocaleString()}</span>
            <p className="text-[10px] text-[#5A5853] mt-1">Gross valuations tracked</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD] shadow-xl">
        <CardContent className="pt-6">
          {isLoadingDeads ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 text-[#D4A853] animate-spin" />
            </div>
          ) : (
            <DataTable columns={columns} data={deals || []} />
          )}
        </CardContent>
      </Card>

      {/* Slideout Drawer Form */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="bg-[#0D0D0F] border-[#2A2A2D] text-[#E8E4DD] w-full sm:max-w-md">
          <SheetHeader className="border-b border-[#2A2A2D] pb-6 mb-6">
            <SheetTitle className="text-[#E8E4DD] flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[#D4A853]" />
              {editingDeal ? 'Edit Deal Parameters' : 'Create Sales Deal'}
            </SheetTitle>
            <SheetDescription className="text-[#8A8680]">
              Configure details, values, stages, and team owners for the contract.
            </SheetDescription>
          </SheetHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="deal_title"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#C4C0B8]">Deal Title</FormLabel>
                    <FormControl>
                      <Input className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD]" placeholder="TechCorp Enterprise Licensing" {...field} />
                    </FormControl>
                    <FormMessage className="text-[#C75B39]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#C4C0B8]">Contract Valuation ($)</FormLabel>
                    <FormControl>
                      <Input type="number" className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD] font-mono" {...field} value={field.value ?? 0} />
                    </FormControl>
                    <FormMessage className="text-[#C75B39]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stage"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#C4C0B8]">Pipeline Stage</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-[#141416] border-[#2A2A2D] text-[#C4C0B8]">
                          <SelectValue placeholder="Select stage" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#141416] border-[#2A2A2D] text-[#C4C0B8]">
                        <SelectItem value="proposal">Proposal Sent</SelectItem>
                        <SelectItem value="negotiation">Contract Negotiation</SelectItem>
                        <SelectItem value="closed_won">Closed Won</SelectItem>
                        <SelectItem value="closed_lost">Closed Lost</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[#C75B39]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assigned_to"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#C4C0B8]">Assigned Team Member</FormLabel>
                    <Select
                      onValueChange={val => (field.onChange as any)(val === 'unassigned' ? null : (val ? parseInt(val, 10) : null))}
                      value={field.value?.toString() || 'unassigned'}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-[#141416] border-[#2A2A2D] text-[#C4C0B8]">
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#141416] border-[#2A2A2D] text-[#C4C0B8]">
                        <SelectItem value="unassigned">Unassigned / Open</SelectItem>
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
                        {leads?.map((l: any) => (
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
                name="expected_close_date"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#C4C0B8]">Expected Close Date</FormLabel>
                    <FormControl>
                      <Input type="date" className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD]" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage className="text-[#C75B39]" />
                  </FormItem>
                )}
              />

              <div className="flex gap-4 pt-6 border-t border-[#2A2A2D]">
                <Button type="button" onClick={() => setIsOpen(false)} variant="outline" className="border-[#2A2A2D] text-[#C4C0B8] hover:bg-[#1C1C1F] hover:text-[#E8E4DD] cursor-pointer">
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 bg-[#D4A853] hover:bg-[#E8C87A] text-[#E8E4DD] font-semibold cursor-pointer">
                  {createMutation.isPending || updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : editingDeal ? 'Save Deal' : 'Create Deal'}
                </Button>
              </div>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
