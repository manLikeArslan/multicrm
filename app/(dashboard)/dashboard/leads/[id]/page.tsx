'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Target,
  User,
  Clock,
  ArrowLeft,
  Loader2,
  Trash2,
  Edit2,
  Sparkles,
  DollarSign,
  TrendingUp,
  Briefcase,
  Phone,
  Mail,
  UserCheck,
  FileText,
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function LeadDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const leadId = parseInt(params.id as string, 10);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);

  const currentUser = session?.user as any;
  const isManagerOrAdmin = currentUser?.roleName === 'admin' || currentUser?.roleName === 'manager' || currentUser?.roleId === 1 || currentUser?.roleId === 2;

  // 1. Fetch Lead Details
  const { data: lead, isLoading: isLoadingLead, error: leadError } = useQuery({
    queryKey: ['lead-detail', leadId],
    queryFn: () => fetch(`/api/leads/${leadId}`).then(async res => {
      if (!res.ok) throw new Error('Lead not found');
      return res.json();
    }),
    enabled: !!leadId && !!session,
  });

  // 2. Fetch Team for Assignee dropdown
  const { data: team } = useQuery({
    queryKey: ['team-members-dropdown'],
    queryFn: () => fetch('/api/users').then(res => res.json()),
    enabled: !!session,
  });

  // Forms
  const editForm = useForm({
    defaultValues: {
      assigned_to: '',
      status: 'new',
      notes: '',
    },
  });

  const convertForm = useForm({
    defaultValues: {
      deal_title: '',
      value: '0',
    },
  });

  // Mutations
  const updateMutation = useMutation({
    mutationFn: (values: any) =>
      fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          assigned_to: values.assigned_to === 'unassigned' || !values.assigned_to ? null : parseInt(values.assigned_to, 10),
        }),
      }).then(async res => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Failed to update lead');
        return body;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-detail', leadId] });
      queryClient.invalidateQueries({ queryKey: ['leads-list'] });
      toast.success('Lead updated successfully.');
      setIsEditOpen(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const convertMutation = useMutation({
    mutationFn: (values: any) =>
      fetch(`/api/leads/${leadId}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      }).then(async res => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Failed to convert lead');
        return body;
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leads-list'] });
      toast.success('Lead converted to deal successfully!');
      setIsConvertOpen(false);
      if (data.deal?.deal_id) {
        router.push(`/dashboard/deals/${data.deal.deal_id}`);
      } else {
        router.push('/dashboard/deals');
      }
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/leads/${leadId}`, {
        method: 'DELETE',
      }).then(async res => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Failed to delete lead');
        return body;
      }),
    onSuccess: () => {
      toast.success('Lead deleted.');
      router.push('/dashboard/leads');
    },
    onError: (err: any) => toast.error(err.message),
  });

  React.useEffect(() => {
    if (lead) {
      editForm.reset({
        assigned_to: lead.assigned_to?.toString() || 'unassigned',
        status: lead.status,
        notes: lead.notes || '',
      });
      convertForm.reset({
        deal_title: `Deal for ${lead.contact_name}`,
        value: '1000',
      });
    }
  }, [lead, editForm, convertForm]);

  if (isLoadingLead) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 text-[#D4A853] animate-spin" />
      </div>
    );
  }

  if (leadError || !lead) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-[#E8E4DD]">Lead Not Found</h2>
        <p className="text-[#8A8680] mt-2">The lead you are looking for does not exist or has been deleted.</p>
        <Link href="/dashboard/leads" className={cn(buttonVariants({ variant: 'outline' }), 'mt-4 border-[#2A2A2D]')}>
          Back to Leads
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2A2A2D] pb-5">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/leads" className="text-[#8A8680] hover:text-[#E8E4DD] p-1 hover:bg-[#1C1C1F] rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#E8E4DD] flex items-center gap-2">
              Lead for {lead.contact_name}
            </h1>
            <p className="text-xs text-[#8A8680]">Scoped lead pipeline tracking and pipeline progression.</p>
          </div>
        </div>
        <div className="flex gap-2">
          {lead.status !== 'qualified' && (
            <Dialog open={isConvertOpen} onOpenChange={setIsConvertOpen}>
              <DialogTrigger className={cn(buttonVariants({ variant: 'default' }), "bg-emerald-600 hover:bg-emerald-500 text-[#E8E4DD] font-semibold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/25")}>
                <TrendingUp className="h-4.5 w-4.5" />
                Convert to Deal
              </DialogTrigger>
              <DialogContent className="bg-[#0D0D0F] border-[#2A2A2D] text-[#E8E4DD] max-w-sm">
                <DialogHeader>
                  <DialogTitle className="text-[#E8E4DD] flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[#6B8F71]" />
                    Convert Lead to Deal
                  </DialogTitle>
                  <DialogDescription className="text-[#8A8680]">
                    This creates an active pipeline Deal and updates this Lead's status to 'qualified'.
                  </DialogDescription>
                </DialogHeader>

                <Form {...convertForm}>
                  <form onSubmit={convertForm.handleSubmit(v => convertMutation.mutate(v))} className="space-y-4">
                    <FormField
                      control={convertForm.control}
                      name="deal_title"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-[#C4C0B8]">Deal Title</FormLabel>
                          <FormControl>
                            <Input className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD]" {...field} />
                          </FormControl>
                          <FormMessage className="text-[#C75B39]" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={convertForm.control}
                      name="value"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-[#C4C0B8]">Estimated Deal Value ($)</FormLabel>
                          <FormControl>
                            <Input type="number" className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD] font-mono" {...field} />
                          </FormControl>
                          <FormMessage className="text-[#C75B39]" />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-3 pt-4 border-t border-[#2A2A2D]">
                      <Button type="button" onClick={() => setIsConvertOpen(false)} variant="outline" className="border-[#2A2A2D] text-[#C4C0B8] hover:bg-[#1C1C1F] cursor-pointer">
                        Cancel
                      </Button>
                      <Button type="submit" disabled={convertMutation.isPending} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-[#E8E4DD] font-semibold cursor-pointer">
                        {convertMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Convert Now'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}

          <Button
            onClick={() => setIsEditOpen(true)}
            variant="outline"
            className="border-[#2A2A2D] text-[#C4C0B8] hover:bg-[#1C1C1F] hover:text-[#E8E4DD] flex items-center gap-2 cursor-pointer"
          >
            <Edit2 className="h-4 w-4" />
            Update Status
          </Button>

          {isManagerOrAdmin && (
            <Button
              onClick={() => {
                if (confirm('Are you sure you want to delete this lead?')) {
                  deleteMutation.mutate();
                }
              }}
              variant="destructive"
              className="bg-red-950/40 text-[#C75B39] hover:bg-red-900 border border-red-900/30 flex items-center gap-2 cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              Delete Lead
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info panel */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD] shadow-md">
            <CardHeader className="border-b border-[#2A2A2D] pb-4">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-[#8A8680] flex items-center gap-2">
                <Target className="h-4 w-4 text-[#D4A853]" />
                Pipeline Tracking Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <UserCheck className="h-4 w-4 text-[#D4A853]/80" />
                    <div>
                      <div className="text-[10px] text-[#5A5853] uppercase tracking-wider">Assigned Agent</div>
                      <div className="text-[#E8E4DD] font-medium">{lead.assignee_name || 'Unassigned'}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Sparkles className="h-4 w-4 text-[#D4A853]/80" />
                    <div>
                      <div className="text-[10px] text-[#5A5853] uppercase tracking-wider">Current Pipeline Status</div>
                      <Badge className={cn("uppercase text-[10px] font-bold mt-0.5 border", 
                        lead.status === 'new' && 'bg-[#5B8FB9]/10 text-[#5B8FB9] border-[#5B8FB9]/20',
                        lead.status === 'contacted' && 'bg-[#D4A853]/10 text-[#D4A853] border-[#D4A853]/20',
                        lead.status === 'qualified' && 'bg-[#6B8F71]/10 text-[#6B8F71] border-[#6B8F71]/20',
                        lead.status === 'lost' && 'bg-[#C75B39]/10 text-[#C75B39] border-[#C75B39]/20',
                      )}>
                        {lead.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-[#D4A853]/80" />
                    <div>
                      <div className="text-[10px] text-[#5A5853] uppercase tracking-wider">Date Scoped</div>
                      <div className="text-[#E8E4DD] font-medium">{format(new Date(lead.created_at), 'PPP p')}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#2A2A2D]">
                <div className="text-[10px] text-[#5A5853] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  Notes & Discussion Context
                </div>
                <div className="p-4 bg-[#111113] border border-[#2A2A2D] rounded-xl text-[#C4C0B8] leading-relaxed text-xs whitespace-pre-wrap">
                  {lead.notes || 'No notes currently detailed.'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Quick Details Panel */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD] shadow-md">
            <CardHeader className="border-b border-[#2A2A2D] pb-4">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-[#8A8680] flex items-center gap-2">
                <User className="h-4 w-4 text-[#D4A853]" />
                Contact Profile Detail
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-[#D4A853]/80" />
                <div>
                  <div className="text-[10px] text-[#5A5853] uppercase tracking-wider">Full Name</div>
                  <Link href={`/dashboard/contacts/${lead.contact_id}`} className="text-[#E8E4DD] hover:text-[#D4A853] font-semibold flex items-center gap-1">
                    {lead.contact_name}
                  </Link>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-[#D4A853]/80" />
                <div>
                  <div className="text-[10px] text-[#5A5853] uppercase tracking-wider">Email</div>
                  <div className="text-[#E8E4DD] font-medium font-mono">{lead.contact_email || 'Not specified'}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-[#D4A853]/80" />
                <div>
                  <div className="text-[10px] text-[#5A5853] uppercase tracking-wider">Phone</div>
                  <div className="text-[#E8E4DD] font-medium font-mono">{lead.contact_phone || 'Not specified'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Drawer Sheet */}
      <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
        <SheetContent className="bg-[#0D0D0F] border-[#2A2A2D] text-[#E8E4DD] w-full sm:max-w-md">
          <SheetHeader className="border-b border-[#2A2A2D] pb-6 mb-6">
            <SheetTitle className="text-[#E8E4DD] flex items-center gap-2">
              <Target className="h-5 w-5 text-[#D4A853]" />
              Update Lead Status
            </SheetTitle>
            <SheetDescription className="text-[#8A8680]">
              Configure status updates and pipeline details.
            </SheetDescription>
          </SheetHeader>

          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(v => updateMutation.mutate(v))} className="space-y-6">
              <FormField
                control={editForm.control}
                name="assigned_to"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#C4C0B8]">Assign To Team Member</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                control={editForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#C4C0B8]">Lead Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-[#141416] border-[#2A2A2D] text-[#C4C0B8]">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#141416] border-[#2A2A2D] text-[#C4C0B8]">
                        <SelectItem value="new">New Opportunity</SelectItem>
                        <SelectItem value="contacted">In Contact</SelectItem>
                        <SelectItem value="qualified">Qualified</SelectItem>
                        <SelectItem value="lost">Lost Lead</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[#C75B39]" />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#C4C0B8]">Pipeline Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Details on this opportunity..." className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD] min-h-[120px]" {...field} />
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
                  {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Status'}
                </Button>
              </div>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
