'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryState } from 'nuqs';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import {
  Users,
  UserPlus,
  Loader2,
  Search,
  MoreHorizontal,
  Edit2,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { DataTable } from '@/components/shared/data-table';
import { contactSchema, ContactInput } from '@/lib/validations/contact';

interface ContactRecord {
  contact_id: number;
  company_id: number;
  full_name: string;
  email?: string;
  phone?: string;
  job_title?: string;
  source: 'referral' | 'web' | 'cold_outreach' | 'social';
  creator_name?: string;
  created_at: string;
}

export default function ContactsPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  
  // nuqs persisted search query
  const [search, setSearch] = useQueryState('search', { defaultValue: '' });
  const [source, setSource] = useQueryState('source', { defaultValue: '' });
  
  const [isOpen, setIsOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactRecord | null>(null);

  const currentUser = session?.user as any;
  const isManagerOrAdmin = currentUser?.roleName === 'admin' || currentUser?.roleName === 'manager' || currentUser?.roleId === 1 || currentUser?.roleId === 2;

  // Fetch Contacts
  const { data: contacts, isLoading: isLoadingContacts } = useQuery<ContactRecord[]>({
    queryKey: ['contacts-list', search, source],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (source) params.append('source', source);
      return fetch(`/api/contacts?${params.toString()}`).then(res => res.json());
    },
    enabled: !!session,
  });

  const form = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      job_title: '',
      source: 'web',
    },
  });

  // Create Contact Mutation
  const createMutation = useMutation({
    mutationFn: (values: ContactInput) =>
      fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      }).then(async res => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Failed to create contact');
        return body;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts-list'] });
      toast.success('Contact successfully added!');
      setIsOpen(false);
      form.reset();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to add contact.');
    },
  });

  // Update Contact Mutation
  const updateMutation = useMutation({
    mutationFn: (values: ContactInput) =>
      fetch(`/api/contacts/${editingContact?.contact_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      }).then(async res => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Failed to update contact');
        return body;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts-list'] });
      toast.success('Contact successfully updated!');
      setIsOpen(false);
      setEditingContact(null);
      form.reset();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update contact.');
    },
  });

  // Delete Contact Mutation
  const deleteMutation = useMutation({
    mutationFn: (contactId: number) =>
      fetch(`/api/contacts/${contactId}`, {
        method: 'DELETE',
      }).then(async res => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Failed to delete contact');
        return body;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts-list'] });
      toast.success('Contact successfully deleted.');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete contact.');
    },
  });

  const onSubmit = (values: ContactInput) => {
    if (editingContact) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };

  const handleEdit = (contact: ContactRecord) => {
    setEditingContact(contact);
    form.reset({
      full_name: contact.full_name,
      email: contact.email || '',
      phone: contact.phone || '',
      job_title: contact.job_title || '',
      source: contact.source,
    });
    setIsOpen(true);
  };

  const handleNew = () => {
    setEditingContact(null);
    form.reset({
      full_name: '',
      email: '',
      phone: '',
      job_title: '',
      source: 'web',
    });
    setIsOpen(true);
  };

  const columns: ColumnDef<ContactRecord>[] = [
    {
      accessorKey: 'full_name',
      header: 'Name',
      cell: ({ row }) => (
        <Link 
          href={`/dashboard/contacts/${row.original.contact_id}`}
          className="font-semibold text-[#E8E4DD] hover:text-[#D4A853] transition-colors flex items-center gap-1.5"
        >
          <span className="h-6 w-6 rounded-full bg-[#D4A853]/10 text-[#D4A853] text-[10px] font-bold flex items-center justify-center flex-shrink-0">
            {row.original.full_name.charAt(0).toUpperCase()}
          </span>
          {row.original.full_name}
          <ExternalLink className="h-3 w-3 opacity-30" />
        </Link>
      ),
    },
    {
      accessorKey: 'job_title',
      header: 'Job Title',
      cell: ({ row }) => <span className="text-[#8A8680]">{row.original.job_title || '—'}</span>,
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => <span className="text-[#8A8680]">{row.original.email || '—'}</span>,
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => <span className="text-[#8A8680]">{row.original.phone || '—'}</span>,
    },
    {
      accessorKey: 'source',
      header: 'Source',
      cell: ({ row }) => {
        const src = row.original.source;
        let color = 'bg-[#1C1C1F] text-[#8A8680] border-[#2A2A2D]';
        if (src === 'referral') color = 'bg-[#6B8F71]/10 text-[#6B8F71] border-[#6B8F71]/20';
        if (src === 'social') color = 'bg-[#5B8FB9]/10 text-[#5B8FB9] border-[#5B8FB9]/20';
        if (src === 'web') color = 'bg-[#D4A853]/10 text-[#D4A853] border-[#D4A853]/20';
        if (src === 'cold_outreach') color = 'bg-[#9B7CB9]/10 text-[#9B7CB9] border-[#9B7CB9]/20';
        return <Badge className={`capitalize text-[10px] border font-semibold ${color}`}>{src.replace('_', ' ')}</Badge>;
      },
    },
    {
      accessorKey: 'creator_name',
      header: 'Created By',
      cell: ({ row }) => <span className="text-[#5A5853]">{row.original.creator_name || 'System'}</span>,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const contact = row.original;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger className="h-8 w-8 text-[#5A5853] hover:text-[#E8E4DD] hover:bg-[#1C1C1F] rounded-lg flex items-center justify-center cursor-pointer focus:outline-none">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#1C1C1F] border-[#2A2A2D] text-[#C4C0B8]">
              <DropdownMenuItem onClick={() => handleEdit(contact)} className="hover:bg-[#222225] focus:bg-[#222225] cursor-pointer flex items-center gap-2">
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit Contact</span>
              </DropdownMenuItem>
              {isManagerOrAdmin && (
                <DropdownMenuItem
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete ${contact.full_name}?`)) {
                      deleteMutation.mutate(contact.contact_id);
                    }
                  }}
                  className="text-[#C75B39] focus:text-[#C75B39] hover:bg-[#222225] focus:bg-[#222225] cursor-pointer flex items-center gap-2"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight text-[#E8E4DD] flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#D4A853]/10">
              <Users className="h-5 w-5 text-[#D4A853]" />
            </div>
            Contacts
          </h1>
          <p className="text-sm text-[#5A5853] mt-1">Manage people associated with your organization.</p>
        </div>
        <Button
          onClick={handleNew}
          className="bg-[#D4A853] hover:bg-[#E8C87A] text-[#0D0D0F] font-semibold flex items-center gap-2 py-4 px-4 shadow-lg shadow-[#D4A853]/10 cursor-pointer"
        >
          <UserPlus className="h-4.5 w-4.5" />
          Add Contact
        </Button>
      </div>

      {/* Filter and search panel */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#141416] p-4 border border-[#2A2A2D] rounded-xl">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-3 h-4 w-4 text-[#5A5853] pointer-events-none" />
          <Input
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-[#0D0D0F] border-[#2A2A2D] text-[#E8E4DD] placeholder-[#5A5853] focus:border-[#D4A853]"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
          {[
            { id: '', label: 'All Sources' },
            { id: 'web', label: 'Web' },
            { id: 'referral', label: 'Referral' },
            { id: 'cold_outreach', label: 'Outreach' },
            { id: 'social', label: 'Social' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSource(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                source === tab.id
                  ? 'bg-[#D4A853] text-[#0D0D0F] shadow-md'
                  : 'bg-[#0D0D0F] border border-[#2A2A2D] text-[#8A8680] hover:text-[#E8E4DD]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <Card className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD] shadow-xl">
        <CardContent className="pt-6">
          {isLoadingContacts ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 text-[#D4A853] animate-spin" />
            </div>
          ) : (
            <DataTable columns={columns} data={contacts || []} />
          )}
        </CardContent>
      </Card>

      {/* Slideout Sheet Drawer */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="bg-[#111113] border-[#2A2A2D] text-[#E8E4DD] w-full sm:max-w-md">
          <SheetHeader className="border-b border-[#2A2A2D] pb-6 mb-6">
            <SheetTitle className="text-[#E8E4DD] flex items-center gap-2">
              <Users className="h-5 w-5 text-[#D4A853]" />
              {editingContact ? 'Edit Contact' : 'Create Contact'}
            </SheetTitle>
            <SheetDescription className="text-[#5A5853]">
              {editingContact ? 'Modify details of an existing contact.' : 'Enter details to record a new contact.'}
            </SheetDescription>
          </SheetHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#8A8680]">Full Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
                        className="bg-[#0D0D0F] border-[#2A2A2D] text-[#E8E4DD] focus:border-[#D4A853] placeholder-[#3A3A3D]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-[#C75B39]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#8A8680]">Email (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="john@company.com"
                        type="email"
                        className="bg-[#0D0D0F] border-[#2A2A2D] text-[#E8E4DD] focus:border-[#D4A853] placeholder-[#3A3A3D]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-[#C75B39]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#8A8680]">Phone (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+1 (555) 1111"
                        className="bg-[#0D0D0F] border-[#2A2A2D] text-[#E8E4DD] focus:border-[#D4A853] placeholder-[#3A3A3D]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-[#C75B39]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="job_title"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#8A8680]">Job Title (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Engineering Director"
                        className="bg-[#0D0D0F] border-[#2A2A2D] text-[#E8E4DD] focus:border-[#D4A853] placeholder-[#3A3A3D]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-[#C75B39]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#8A8680]">Acquisition Source</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-[#0D0D0F] border-[#2A2A2D] text-[#C4C0B8] focus:border-[#D4A853]">
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#1C1C1F] border-[#2A2A2D] text-[#C4C0B8]">
                        <SelectItem value="web" className="hover:bg-[#222225] focus:bg-[#222225]">Web Form</SelectItem>
                        <SelectItem value="referral" className="hover:bg-[#222225] focus:bg-[#222225]">Referral</SelectItem>
                        <SelectItem value="cold_outreach" className="hover:bg-[#222225] focus:bg-[#222225]">Cold Outreach</SelectItem>
                        <SelectItem value="social" className="hover:bg-[#222225] focus:bg-[#222225]">Social Media</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[#C75B39]" />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-5 border-t border-[#2A2A2D]">
                <Button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  variant="outline"
                  className="border-[#2A2A2D] text-[#8A8680] hover:bg-[#1C1C1F] hover:text-[#E8E4DD] cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 bg-[#D4A853] hover:bg-[#E8C87A] text-[#0D0D0F] font-semibold shadow-lg shadow-[#D4A853]/10 cursor-pointer"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : editingContact ? (
                    'Save Changes'
                  ) : (
                    'Create Contact'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
