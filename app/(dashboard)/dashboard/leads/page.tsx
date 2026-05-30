'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import {
  Target,
  Plus,
  Loader2,
  MoreHorizontal,
  Edit2,
  Trash2,
  ExternalLink,
  KanbanSquare,
  TableProperties,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DataTable } from '@/components/shared/data-table';
import { leadSchema, LeadInput } from '@/lib/validations/lead';
import { format } from 'date-fns';

interface LeadRecord {
  lead_id: number;
  contact_id: number;
  company_id: number;
  assigned_to?: number;
  status: 'new' | 'contacted' | 'qualified' | 'lost';
  notes?: string;
  created_at: string;
  contact_name: string;
  contact_email?: string;
  contact_phone?: string;
  assignee_name?: string;
}

const STATUS_COLORS: Record<string, { text: string; dot: string; badge: string }> = {
  new: { text: 'text-[#5A7A8E]', dot: 'bg-[#5A7A8E]', badge: 'bg-[#5A7A8E]/10 text-[#5A7A8E] border-[#5A7A8E]/20' },
  contacted: { text: 'text-[#C95A32]', dot: 'bg-[#C95A32]', badge: 'bg-[#C95A32]/10 text-[#C95A32] border-[#C95A32]/20' },
  qualified: { text: 'text-[#6E8E75]', dot: 'bg-[#6E8E75]', badge: 'bg-[#6E8E75]/10 text-[#6E8E75] border-[#6E8E75]/20' },
  lost: { text: 'text-[#C84630]', dot: 'bg-[#C84630]', badge: 'bg-[#C84630]/10 text-[#C84630] border-[#C84630]/20' },
};

export default function LeadsPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [isOpen, setIsOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<LeadRecord | null>(null);

  const currentUser = session?.user as any;
  const isManagerOrAdmin = currentUser?.roleName === 'admin' || currentUser?.roleName === 'manager' || currentUser?.roleId === 1 || currentUser?.roleId === 2;

  const { data: leads, isLoading: isLoadingLeads } = useQuery<LeadRecord[]>({
    queryKey: ['leads-list'],
    queryFn: () => fetch('/api/leads').then(res => res.json()),
    enabled: !!session,
  });

  const { data: contacts } = useQuery<any[]>({
    queryKey: ['contacts-dropdown'],
    queryFn: () => fetch('/api/contacts').then(res => res.json()),
    enabled: !!session,
  });

  const { data: team } = useQuery<any[]>({
    queryKey: ['team-dropdown'],
    queryFn: () => fetch('/api/users').then(res => res.json()),
    enabled: !!session,
  });

  const form = useForm({
    resolver: zodResolver(leadSchema) as any,
    defaultValues: {
      contact_id: undefined as any,
      assigned_to: null as number | null,
      status: 'new' as 'new' | 'contacted' | 'qualified' | 'lost',
      notes: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (values: any) =>
      fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) })
        .then(async res => { const body = await res.json(); if (!res.ok) throw new Error(body.error || 'Failed'); return body; }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['leads-list'] }); toast.success('Lead created.'); setIsOpen(false); form.reset(); },
    onError: (err: any) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (values: any) =>
      fetch(`/api/leads/${editingLead?.lead_id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) })
        .then(async res => { const body = await res.json(); if (!res.ok) throw new Error(body.error || 'Failed'); return body; }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['leads-list'] }); toast.success('Lead updated.'); setIsOpen(false); setEditingLead(null); form.reset(); },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (leadId: number) =>
      fetch(`/api/leads/${leadId}`, { method: 'DELETE' }).then(async res => { const body = await res.json(); if (!res.ok) throw new Error(body.error); return body; }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['leads-list'] }); toast.success('Lead deleted.'); },
    onError: (err: any) => toast.error(err.message),
  });

  const onSubmit = (values: any) => { if (editingLead) updateMutation.mutate(values); else createMutation.mutate(values); };

  const handleEdit = (lead: LeadRecord) => {
    setEditingLead(lead);
    form.reset({ contact_id: lead.contact_id, assigned_to: lead.assigned_to || null, status: lead.status, notes: lead.notes || '' });
    setIsOpen(true);
  };

  const handleNew = () => {
    setEditingLead(null);
    form.reset({ contact_id: undefined as any, assigned_to: null, status: 'new', notes: '' });
    setIsOpen(true);
  };

  const columns: ColumnDef<LeadRecord>[] = [
    {
      accessorKey: 'contact_name',
      header: 'Contact',
      cell: ({ row }) => (
        <Link href={`/dashboard/leads/${row.original.lead_id}`} className="font-semibold text-[#F4EFE6] hover:text-[#C95A32] transition-colors flex items-center gap-1.5">
          {row.original.contact_name}
          <ExternalLink className="h-3 w-3 opacity-30" />
        </Link>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const s = row.original.status;
        const c = STATUS_COLORS[s] || STATUS_COLORS.new;
        return <Badge className={`capitalize text-[10px] border font-semibold ${c.badge}`}>{s}</Badge>;
      },
    },
    { accessorKey: 'assignee_name', header: 'Assigned To', cell: ({ row }) => <span className="text-[#AFA897]">{row.original.assignee_name || 'Unassigned'}</span> },
    { accessorKey: 'created_at', header: 'Created', cell: ({ row }) => <span className="text-[#AFA897]/50">{format(new Date(row.original.created_at), 'PPP')}</span> },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const lead = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger className="h-8 w-8 text-[#AFA897]/50 hover:text-[#F4EFE6] hover:bg-[#16161C] rounded-lg flex items-center justify-center cursor-pointer focus:outline-none">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#15151A] border-[#1E1E26] text-[#AFA897]">
              <DropdownMenuItem onClick={() => handleEdit(lead)} className="hover:bg-[#1C1C24] focus:bg-[#1C1C24] cursor-pointer flex items-center gap-2">
                <Edit2 className="h-3.5 w-3.5" /><span>Edit</span>
              </DropdownMenuItem>
              {isManagerOrAdmin && (
                <DropdownMenuItem onClick={() => { if (confirm('Delete this lead?')) deleteMutation.mutate(lead.lead_id); }} className="text-[#C84630] focus:text-[#C84630] hover:bg-[#1C1C24] focus:bg-[#1C1C24] cursor-pointer flex items-center gap-2">
                  <Trash2 className="h-3.5 w-3.5" /><span>Delete</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const kanbanColumns: ('new' | 'contacted' | 'qualified' | 'lost')[] = ['new', 'contacted', 'qualified', 'lost'];
  const leadsByStatus = (status: string) => leads?.filter(l => l.status === status) || [];

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight text-[#F4EFE6] flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#C95A32]/10">
              <Target className="h-5 w-5 text-[#C95A32]" />
            </div>
            Sales Leads
          </h1>
          <p className="text-sm text-[#AFA897]/50 mt-1">Nurture potential sales opportunities in your pipeline.</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1 bg-[#050506] border border-[#1E1E26] p-1 rounded-lg shadow-[inset_1px_1px_3px_rgba(0,0,0,0.6)]">
            <button onClick={() => setViewMode('kanban')} className={`p-2 rounded-md cursor-pointer transition-all duration-150 ${viewMode === 'kanban' ? 'skeuo-btn-rust text-[#FAF7F2] shadow-md' : 'text-[#AFA897]/50 hover:text-[#F4EFE6]'}`}>
              <KanbanSquare className="h-4 w-4" />
            </button>
            <button onClick={() => setViewMode('table')} className={`p-2 rounded-md cursor-pointer transition-all duration-150 ${viewMode === 'table' ? 'skeuo-btn-rust text-[#FAF7F2] shadow-md' : 'text-[#AFA897]/50 hover:text-[#F4EFE6]'}`}>
              <TableProperties className="h-4 w-4" />
            </button>
          </div>
          <Button onClick={handleNew} className="flex items-center gap-2">
            <Plus className="h-4 w-4 animate-pulse" />
            Add Lead
          </Button>
        </div>
      </div>

      {isLoadingLeads ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 text-[#C95A32] animate-spin" /></div>
      ) : viewMode === 'table' ? (
        <Card className="text-[#F4EFE6]">
          <CardContent className="pt-6"><DataTable columns={columns} data={leads || []} /></CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
          {kanbanColumns.map(col => {
            const list = leadsByStatus(col);
            const colors = STATUS_COLORS[col];
            return (
              <div key={col} className="bg-[#050506]/60 border border-[#1E1E26] p-4 rounded-xl min-h-[420px] flex flex-col shadow-[inset_1px_1px_4px_rgba(0,0,0,0.8)]">
                <div className="flex justify-between items-center pb-3 border-b border-[#1E1E26] mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${colors.dot}`} />
                    <span className={`font-bold capitalize text-[11px] tracking-wider ${colors.text}`}>{col}</span>
                  </div>
                  <Badge className="bg-[#16161C] text-[#AFA897]/50 border border-[#1E1E26] text-[10px]">{list.length}</Badge>
                </div>
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {list.length === 0 ? (
                    <div className="text-center py-8 text-[11px] text-[#AFA897]/30 select-none">No leads yet</div>
                  ) : (
                    list.map(lead => (
                      <div key={lead.lead_id} className="bg-[#0E0E12] p-3.5 border border-[#1E1E26] rounded-lg space-y-2.5 hover:border-[#C95A32]/30 transition-all cursor-pointer group card-hover-lift shadow-[0_4px_12px_rgba(0,0,0,0.5),inset_0_1px_0px_rgba(255,255,255,0.03)]">
                        <div className="flex justify-between items-start">
                          <Link href={`/dashboard/leads/${lead.lead_id}`} className="font-semibold text-[#F4EFE6] hover:text-[#C95A32] text-[12px] flex items-center gap-1">
                            {lead.contact_name}
                            <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-[#C95A32]" />
                          </Link>
                        </div>
                        {lead.notes && <p className="text-[11px] text-[#AFA897]/50 leading-relaxed line-clamp-2">{lead.notes}</p>}
                        <div className="flex justify-between items-center text-[10px] text-[#AFA897]/30 pt-2 border-t border-[#1E1E26]">
                          <span>{lead.assignee_name || 'Unassigned'}</span>
                          <span className="font-mono text-[9px]">{format(new Date(lead.created_at), 'MMM d')}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Drawer Form */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="bg-popover border-border text-[#F4EFE6] w-full sm:max-w-md">
          <SheetHeader className="border-b border-border pb-6 mb-6">
            <SheetTitle className="text-[#F4EFE6] flex items-center gap-2">
              <Target className="h-5 w-5 text-[#C95A32]" />
              {editingLead ? 'Modify Lead' : 'Create Lead'}
            </SheetTitle>
            <SheetDescription className="text-[#AFA897]/50">Link contacts to the lead pipeline.</SheetDescription>
          </SheetHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField control={form.control} name="contact_id" render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-[#AFA897]">Contact</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value?.toString()}>
                    <FormControl><SelectTrigger className="bg-background border-border text-[#FAF7F2]"><SelectValue placeholder="Select contact" /></SelectTrigger></FormControl>
                    <SelectContent className="bg-popover border-border text-[#FAF7F2]">
                      {contacts?.map(c => <SelectItem key={c.contact_id} value={c.contact_id.toString()}>{c.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-[#C84630]" />
                </FormItem>
              )} />

              <FormField control={form.control} name="assigned_to" render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-[#AFA897]">Assigned To (Optional)</FormLabel>
                  <Select onValueChange={val => field.onChange(val ? parseInt(val, 10) : null)} value={field.value?.toString() || ''}>
                    <FormControl><SelectTrigger className="bg-background border-border text-[#FAF7F2]"><SelectValue placeholder="Unassigned" /></SelectTrigger></FormControl>
                    <SelectContent className="bg-popover border-border text-[#FAF7F2]">
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {team?.map(m => <SelectItem key={m.user_id} value={m.user_id.toString()}>{m.full_name} ({m.role_name})</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-[#C84630]" />
                </FormItem>
              )} />

              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-[#AFA897]">Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger className="bg-background border-border text-[#FAF7F2]"><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                    <SelectContent className="bg-popover border-border text-[#FAF7F2]">
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-[#C84630]" />
                </FormItem>
              )} />

              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-[#AFA897]">Notes</FormLabel>
                  <FormControl><Textarea placeholder="Pipeline context..." className="bg-background border-border text-[#F4EFE6] min-h-[100px] placeholder-[#AFA897]/30" {...field} /></FormControl>
                  <FormMessage className="text-[#C84630]" />
                </FormItem>
              )} />

              <div className="flex gap-3 pt-5 border-t border-border">
                <Button type="button" onClick={() => setIsOpen(false)} variant="outline">Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1">
                  {createMutation.isPending || updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : editingLead ? 'Save Changes' : 'Create Lead'}
                </Button>
              </div>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
