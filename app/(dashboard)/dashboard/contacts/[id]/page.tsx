'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  Clock,
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Target,
  Sparkles,
  PhoneCall,
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
import ActivityTimeline from '@/components/app/activity-timeline';
import { contactSchema, ContactInput } from '@/lib/validations/contact';
import { activitySchema } from '@/lib/validations/activity';
import { followupSchema } from '@/lib/validations/followup';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function ContactDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const contactId = parseInt(params.id as string, 10);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [isFollowupOpen, setIsFollowupOpen] = useState(false);

  const currentUser = session?.user as any;
  const isManagerOrAdmin = currentUser?.roleName === 'admin' || currentUser?.roleName === 'manager' || currentUser?.roleId === 1 || currentUser?.roleId === 2;

  // 1. Fetch Contact Details
  const { data: contact, isLoading: isLoadingContact, error: contactError } = useQuery({
    queryKey: ['contact-detail', contactId],
    queryFn: () => fetch(`/api/contacts/${contactId}`).then(async res => {
      if (!res.ok) throw new Error('Contact not found');
      return res.json();
    }),
    enabled: !!contactId && !!session,
  });

  // 2. Fetch Contact's Activities
  const { data: activities, isLoading: isLoadingActivities } = useQuery({
    queryKey: ['contact-activities', contactId],
    queryFn: () => fetch(`/api/activities?contact_id=${contactId}`).then(res => res.json()),
    enabled: !!contactId && !!session,
  });

  // 3. Fetch Contact's Leads
  const { data: leads, isLoading: isLoadingLeads } = useQuery({
    queryKey: ['contact-leads', contactId],
    queryFn: () => fetch(`/api/leads?contact_id=${contactId}`).then(res => res.json()),
    enabled: !!contactId && !!session,
  });

  // 4. Fetch Contact's Follow-ups
  const { data: followups, isLoading: isLoadingFollowups } = useQuery({
    queryKey: ['contact-followups', contactId],
    queryFn: () => fetch(`/api/followups?contact_id=${contactId}`).then(res => res.json()),
    enabled: !!contactId && !!session,
  });

  // Forms
  const editForm = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      job_title: '',
      source: 'web',
    },
  });

  const activityForm = useForm({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      contact_id: contactId,
      activity_type: 'call',
      summary: '',
    },
  });

  const followupForm = useForm({
    resolver: zodResolver(followupSchema),
    defaultValues: {
      contact_id: contactId,
      scheduled_date: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      next_action: '',
    },
  });

  // Mutations
  const updateMutation = useMutation({
    mutationFn: (values: ContactInput) =>
      fetch(`/api/contacts/${contactId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      }).then(async res => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Failed to update contact');
        return body;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-detail', contactId] });
      queryClient.invalidateQueries({ queryKey: ['contacts-list'] });
      toast.success('Contact details updated.');
      setIsEditOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/contacts/${contactId}`, {
        method: 'DELETE',
      }).then(async res => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Failed to delete contact');
        return body;
      }),
    onSuccess: () => {
      toast.success('Contact deleted.');
      router.push('/dashboard/contacts');
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const logActivityMutation = useMutation({
    mutationFn: (values: any) =>
      fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, contact_id: contactId }),
      }).then(async res => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Failed to log activity');
        return body;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-activities', contactId] });
      toast.success('Activity logged successfully.');
      setIsActivityOpen(false);
      activityForm.reset({
        contact_id: contactId,
        activity_type: 'call',
        summary: '',
      });
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const scheduleFollowupMutation = useMutation({
    mutationFn: (values: any) =>
      fetch('/api/followups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, contact_id: contactId }),
      }).then(async res => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Failed to schedule followup');
        return body;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-followups', contactId] });
      toast.success('Follow-up scheduled.');
      setIsFollowupOpen(false);
      followupForm.reset({
        contact_id: contactId,
        scheduled_date: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
        next_action: '',
      });
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  React.useEffect(() => {
    if (contact) {
      editForm.reset({
        full_name: contact.full_name,
        email: contact.email || '',
        phone: contact.phone || '',
        job_title: contact.job_title || '',
        source: contact.source,
      });
    }
  }, [contact, editForm]);

  if (isLoadingContact) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 text-[#D4A853] animate-spin" />
      </div>
    );
  }

  if (contactError || !contact) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-[#E8E4DD]">Contact Not Found</h2>
        <p className="text-[#8A8680] mt-2">The contact you are looking for does not exist or has been deleted.</p>
        <Link href="/dashboard/contacts" className={cn(buttonVariants({ variant: 'outline' }), 'mt-4 border-[#2A2A2D]')}>
          Back to Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Back Button Header */}
      <div className="flex items-center justify-between border-b border-[#2A2A2D] pb-5">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/contacts" className="text-[#8A8680] hover:text-[#E8E4DD] p-1 hover:bg-[#1C1C1F] rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#E8E4DD]">{contact.full_name}</h1>
            <p className="text-xs text-[#8A8680]">Manage contact details, leads, and customer interaction history.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsEditOpen(true)}
            variant="outline"
            className="border-[#2A2A2D] text-[#C4C0B8] hover:bg-[#1C1C1F] hover:text-[#E8E4DD] flex items-center gap-2 cursor-pointer"
          >
            <Edit2 className="h-4 w-4" />
            Edit Info
          </Button>
          {isManagerOrAdmin && (
            <Button
              onClick={() => {
                if (confirm('Are you sure you want to delete this contact and all its related timeline entities?')) {
                  deleteMutation.mutate();
                }
              }}
              variant="destructive"
              className="bg-red-950/40 text-[#C75B39] hover:bg-red-900 border border-red-900/30 flex items-center gap-2 cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              Delete Contact
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Cards Panel */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD] shadow-md">
            <CardHeader className="border-b border-[#2A2A2D] pb-4">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-[#8A8680] flex items-center gap-2">
                <User className="h-4 w-4 text-[#D4A853]" />
                Contact Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <Briefcase className="h-4 w-4 text-[#D4A853]/80" />
                <div>
                  <div className="text-[10px] text-[#5A5853] uppercase tracking-wider">Job Title</div>
                  <div className="text-[#E8E4DD] font-medium">{contact.job_title || 'Not Specified'}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-[#D4A853]/80" />
                <div>
                  <div className="text-[10px] text-[#5A5853] uppercase tracking-wider">Email Address</div>
                  <div className="text-[#E8E4DD] font-medium font-mono">{contact.email || 'None'}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-[#D4A853]/80" />
                <div>
                  <div className="text-[10px] text-[#5A5853] uppercase tracking-wider">Phone Number</div>
                  <div className="text-[#E8E4DD] font-medium font-mono">{contact.phone || 'None'}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Sparkles className="h-4 w-4 text-[#D4A853]/80" />
                <div>
                  <div className="text-[10px] text-[#5A5853] uppercase tracking-wider">Source</div>
                  <Badge className="bg-[#1C1C1F] text-[#D4A853] border border-slate-700 uppercase text-[9px] font-bold mt-0.5">
                    {contact.source}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Related Leads */}
          <Card className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD] shadow-md">
            <CardHeader className="border-b border-[#2A2A2D] pb-4">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-[#8A8680] flex items-center gap-2">
                <Target className="h-4 w-4 text-[#D4A853]" />
                Active Leads
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {isLoadingLeads ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 text-[#D4A853] animate-spin" />
                </div>
              ) : !leads || leads.length === 0 ? (
                <div className="text-center py-6 text-xs text-[#5A5853]">No leads linked to this contact.</div>
              ) : (
                <div className="space-y-3">
                  {leads.map((lead: any) => (
                    <Link
                      key={lead.lead_id}
                      href={`/dashboard/leads/${lead.lead_id}`}
                      className="block p-3 bg-[#111113] border border-[#2A2A2D] hover:border-slate-750 rounded-xl transition-all"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs font-semibold text-[#E8E4DD]">Lead #{lead.lead_id}</span>
                        <Badge className="bg-indigo-900/20 text-[#D4A853] border border-indigo-900/30 uppercase text-[9px]">
                          {lead.status}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-[#8A8680] mt-1 line-clamp-1">{lead.notes || 'No custom notes'}</p>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Timeline and Follow-ups details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Follow-ups Panel */}
          <Card className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD] shadow-md">
            <CardHeader className="flex flex-row justify-between items-center border-b border-[#2A2A2D] pb-4">
              <div>
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-[#8A8680] flex items-center gap-2">
                  <PhoneCall className="h-4 w-4 text-[#D4A853]" />
                  Upcoming & Scheduled Follow-ups
                </CardTitle>
              </div>
              <Button
                onClick={() => setIsFollowupOpen(true)}
                size="sm"
                className="bg-[#D4A853] hover:bg-[#E8C87A] text-[#E8E4DD] font-semibold flex items-center gap-1.5 cursor-pointer text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Schedule
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              {isLoadingFollowups ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 text-[#D4A853] animate-spin" />
                </div>
              ) : !followups || followups.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#5A5853] flex flex-col items-center gap-1.5">
                  <Clock className="h-6 w-6 opacity-30 text-[#8A8680]" />
                  <span>No scheduled followups yet.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {followups.map((f: any) => (
                    <div key={f.followup_id} className="p-4 bg-[#111113] border border-[#2A2A2D] rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-[#D4A853] font-mono font-semibold flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(f.scheduled_date), 'PP p')}
                        </span>
                        {f.outcome && (
                          <Badge className="bg-[#1C1C1F] text-[#C4C0B8] border border-slate-700 capitalize text-[9px]">
                            {f.outcome}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-[#C4C0B8]">{f.next_action || 'No action outcome detailed'}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Logs Panel */}
          <Card className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD] shadow-md">
            <CardHeader className="flex flex-row justify-between items-center border-b border-[#2A2A2D] pb-4">
              <div>
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-[#8A8680] flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#D4A853]" />
                  Interaction Logs & History
                </CardTitle>
              </div>
              <Button
                onClick={() => setIsActivityOpen(true)}
                size="sm"
                className="bg-[#D4A853] hover:bg-[#E8C87A] text-[#E8E4DD] font-semibold flex items-center gap-1.5 cursor-pointer text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Log Activity
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

      {/* Edit Drawer */}
      <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
        <SheetContent className="bg-[#0D0D0F] border-[#2A2A2D] text-[#E8E4DD] w-full sm:max-w-md">
          <SheetHeader className="border-b border-[#2A2A2D] pb-6 mb-6">
            <SheetTitle className="text-[#E8E4DD] flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-[#D4A853]" />
              Edit Contact
            </SheetTitle>
            <SheetDescription className="text-[#8A8680]">
              Modify contact profile details and metadata.
            </SheetDescription>
          </SheetHeader>

          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(v => updateMutation.mutate(v))} className="space-y-6">
              <FormField
                control={editForm.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#C4C0B8]">Full Name</FormLabel>
                    <FormControl>
                      <Input className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD]" {...field} />
                    </FormControl>
                    <FormMessage className="text-[#C75B39]" />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#C4C0B8]">Email Address (Optional)</FormLabel>
                    <FormControl>
                      <Input type="email" className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD]" {...field} />
                    </FormControl>
                    <FormMessage className="text-[#C75B39]" />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#C4C0B8]">Phone Number (Optional)</FormLabel>
                    <FormControl>
                      <Input className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD]" {...field} />
                    </FormControl>
                    <FormMessage className="text-[#C75B39]" />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="job_title"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#C4C0B8]">Job Title (Optional)</FormLabel>
                    <FormControl>
                      <Input className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD]" {...field} />
                    </FormControl>
                    <FormMessage className="text-[#C75B39]" />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="source"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#C4C0B8]">Acquisition Source</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-[#141416] border-[#2A2A2D] text-[#C4C0B8]">
                          <SelectValue placeholder="Select contact source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#141416] border-[#2A2A2D] text-[#C4C0B8]">
                        <SelectItem value="web">Web Form</SelectItem>
                        <SelectItem value="referral">Referral</SelectItem>
                        <SelectItem value="cold_outreach">Cold Outreach</SelectItem>
                        <SelectItem value="social">Social Media</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[#C75B39]" />
                  </FormItem>
                )}
              />

              <div className="flex gap-4 pt-6 border-t border-[#2A2A2D]">
                <Button type="button" onClick={() => setIsEditOpen(false)} variant="outline" className="border-[#2A2A2D] text-[#C4C0B8] hover:bg-[#1C1C1F] hover:text-[#E8E4DD] cursor-pointer">
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending} className="flex-1 bg-[#D4A853] hover:bg-[#E8C87A] text-[#E8E4DD] font-semibold cursor-pointer">
                  {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      {/* Log Activity Drawer */}
      <Sheet open={isActivityOpen} onOpenChange={setIsActivityOpen}>
        <SheetContent className="bg-[#0D0D0F] border-[#2A2A2D] text-[#E8E4DD] w-full sm:max-w-md">
          <SheetHeader className="border-b border-[#2A2A2D] pb-6 mb-6">
            <SheetTitle className="text-[#E8E4DD] flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#D4A853]" />
              Log Customer Activity
            </SheetTitle>
            <SheetDescription className="text-[#8A8680]">
              Record a call, meeting, email, or internal system notes with summary logs.
            </SheetDescription>
          </SheetHeader>

          <Form {...activityForm}>
            <form onSubmit={activityForm.handleSubmit(v => logActivityMutation.mutate(v))} className="space-y-6">
              <FormField
                control={activityForm.control}
                name="activity_type"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#C4C0B8]">Interaction Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-[#141416] border-[#2A2A2D] text-[#C4C0B8]">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#141416] border-[#2A2A2D] text-[#C4C0B8]">
                        <SelectItem value="call">Phone Call</SelectItem>
                        <SelectItem value="email">Email Sent/Received</SelectItem>
                        <SelectItem value="meeting">Personal Meeting</SelectItem>
                        <SelectItem value="note">Internal CRM Note</SelectItem>
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
                    <FormLabel className="text-[#C4C0B8]">Log Summary / Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Discussed deal pipelines and product onboarding." className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD] min-h-[100px]" {...field} />
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
                  {logActivityMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Log Activity'}
                </Button>
              </div>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      {/* Schedule Followup Drawer */}
      <Sheet open={isFollowupOpen} onOpenChange={setIsFollowupOpen}>
        <SheetContent className="bg-[#0D0D0F] border-[#2A2A2D] text-[#E8E4DD] w-full sm:max-w-md">
          <SheetHeader className="border-b border-[#2A2A2D] pb-6 mb-6">
            <SheetTitle className="text-[#E8E4DD] flex items-center gap-2">
              <PhoneCall className="h-5 w-5 text-[#D4A853]" />
              Schedule Follow-up Task
            </SheetTitle>
            <SheetDescription className="text-[#8A8680]">
              Schedule a task or call and receive reminders in your followups workspace logs.
            </SheetDescription>
          </SheetHeader>

          <Form {...followupForm}>
            <form onSubmit={followupForm.handleSubmit(v => scheduleFollowupMutation.mutate(v))} className="space-y-6">
              <FormField
                control={followupForm.control}
                name="scheduled_date"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#C4C0B8]">Scheduled Date & Time</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD]" {...field} />
                    </FormControl>
                    <FormMessage className="text-[#C75B39]" />
                  </FormItem>
                )}
              />

              <FormField
                control={followupForm.control}
                name="next_action"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#C4C0B8]">Next Action Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Call John to discuss invoice proposal details" className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD]" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage className="text-[#C75B39]" />
                  </FormItem>
                )}
              />

              <div className="flex gap-4 pt-6 border-t border-[#2A2A2D]">
                <Button type="button" onClick={() => setIsFollowupOpen(false)} variant="outline" className="border-[#2A2A2D] text-[#C4C0B8] hover:bg-[#1C1C1F] hover:text-[#E8E4DD] cursor-pointer">
                  Cancel
                </Button>
                <Button type="submit" disabled={scheduleFollowupMutation.isPending} className="flex-1 bg-[#D4A853] hover:bg-[#E8C87A] text-[#E8E4DD] font-semibold cursor-pointer">
                  {scheduleFollowupMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Schedule'}
                </Button>
              </div>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
