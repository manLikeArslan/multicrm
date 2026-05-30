'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import {
  History,
  Plus,
  Loader2,
  Phone,
  Mail,
  Users,
  FileText,
  Calendar,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import ActivityTimeline from '@/components/app/activity-timeline';
import { activitySchema } from '@/lib/validations/activity';

export default function ActivitiesPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('');

  // 1. Fetch activities
  const { data: activities, isLoading: isLoadingActivities } = useQuery({
    queryKey: ['activities-list', filterType],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filterType) params.append('type', filterType);
      return fetch(`/api/activities?${params.toString()}`).then(res => res.json());
    },
    enabled: !!session,
  });

  // 2. Fetch contacts for log dropdown selection
  const { data: contacts } = useQuery<any[]>({
    queryKey: ['contacts-activities-dropdown'],
    queryFn: () => fetch('/api/contacts').then(res => res.json()),
    enabled: !!session,
  });

  // 3. Fetch deals
  const { data: deals } = useQuery<any[]>({
    queryKey: ['deals-activities-dropdown'],
    queryFn: () => fetch('/api/deals').then(res => res.json()),
    enabled: !!session,
  });

  const form = useForm({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      activity_type: 'call',
      summary: '',
      contact_id: undefined as any,
      deal_id: undefined as any,
    },
  });

  const createMutation = useMutation({
    mutationFn: (values: any) =>
      fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          contact_id: values.contact_id === 'none' ? null : parseInt(values.contact_id, 10),
          deal_id: values.deal_id === 'none' ? null : parseInt(values.deal_id, 10),
        }),
      }).then(async res => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Failed to log activity');
        return body;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities-list'] });
      toast.success('Activity logged successfully.');
      setIsOpen(false);
      form.reset();
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2A2A2D] pb-5">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight text-[#E8E4DD] flex items-center gap-2">
            <History className="h-6 w-6 text-[#D4A853]" />
            Activity & Event Logs
          </h1>
          <p className="text-sm text-[#8A8680]">View a unified feed of logged customer calls, meetings, emails, and custom notes.</p>
        </div>
        <div className="flex gap-2">
          {/* filter tabs */}
          <div className="flex items-center gap-1.5 bg-[#141416] border border-[#2A2A2D] p-1.5 rounded-xl">
            {[
              { id: '', label: 'All Logs' },
              { id: 'call', label: 'Calls' },
              { id: 'email', label: 'Emails' },
              { id: 'meeting', label: 'Meetings' },
              { id: 'note', label: 'Notes' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setFilterType(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  filterType === t.id
                    ? 'bg-[#D4A853] text-[#E8E4DD] shadow'
                    : 'text-[#8A8680] hover:text-[#C4C0B8]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <Button
            onClick={() => setIsOpen(true)}
            className="bg-[#D4A853] hover:bg-[#E8C87A] text-[#E8E4DD] font-semibold flex items-center gap-2 py-4 px-4 shadow-lg shadow-[#D4A853]/10 cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5" />
            Log Activity
          </Button>
        </div>
      </div>

      <Card className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD] shadow-xl max-w-4xl mx-auto">
        <CardContent className="pt-8">
          {isLoadingActivities ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 text-[#D4A853] animate-spin" />
            </div>
          ) : (
            <ActivityTimeline activities={activities || []} />
          )}
        </CardContent>
      </Card>

      {/* Log Activity Sheet Drawer */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="bg-[#0D0D0F] border-[#2A2A2D] text-[#E8E4DD] w-full sm:max-w-md">
          <SheetHeader className="border-b border-[#2A2A2D] pb-6 mb-6">
            <SheetTitle className="text-[#E8E4DD] flex items-center gap-2">
              <Plus className="h-5 w-5 text-[#D4A853]" />
              Log Customer Interaction
            </SheetTitle>
            <SheetDescription className="text-[#8A8680]">
              Record a call, meeting, email, or internal CRM update.
            </SheetDescription>
          </SheetHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(v => createMutation.mutate(v))} className="space-y-6">
              <FormField
                control={form.control}
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
                control={form.control}
                name="contact_id"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#C4C0B8]">Link Contact Profile</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value?.toString() || 'none'}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-[#141416] border-[#2A2A2D] text-[#C4C0B8]">
                          <SelectValue placeholder="No contact profile linked" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#141416] border-[#2A2A2D] text-[#C4C0B8]">
                        <SelectItem value="none">No contact profile linked</SelectItem>
                        {contacts?.map((c: any) => (
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
                    <FormLabel className="text-[#C4C0B8]">Link Pipeline Deal</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value?.toString() || 'none'}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-[#141416] border-[#2A2A2D] text-[#C4C0B8]">
                          <SelectValue placeholder="No pipeline deal linked" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#141416] border-[#2A2A2D] text-[#C4C0B8]">
                        <SelectItem value="none">No pipeline deal linked</SelectItem>
                        {deals?.map((d: any) => (
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
                name="summary"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#C4C0B8]">Event Description / Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Discussed deal pipeline requirements and set onboarding follow-ups..." className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD] min-h-[100px]" {...field} />
                    </FormControl>
                    <FormMessage className="text-[#C75B39]" />
                  </FormItem>
                )}
              />



              <div className="flex gap-4 pt-6 border-t border-[#2A2A2D]">
                <Button type="button" onClick={() => setIsOpen(false)} variant="outline" className="border-[#2A2A2D] text-[#C4C0B8] hover:bg-[#1C1C1F] hover:text-[#E8E4DD] cursor-pointer">
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending} className="flex-1 bg-[#D4A853] hover:bg-[#E8C87A] text-[#E8E4DD] font-semibold cursor-pointer">
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Log Activity'}
                </Button>
              </div>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
