'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import {
  FileSpreadsheet,
  Plus,
  Loader2,
  MoreHorizontal,
  Edit2,
  Trash2,
  ExternalLink,
  DollarSign,
  TrendingUp,
  Clock,
  Layers,
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
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/shared/data-table';
import { invoiceSchema, InvoiceInput } from '@/lib/validations/invoice';
import { format } from 'date-fns';

interface InvoiceRecord {
  invoice_id: number;
  deal_id: number;
  company_id: number;
  issued_by?: number;
  total_amount: number;
  due_date?: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  created_at: string;
  deal_title: string;
  issuer_name?: string;
  contact_name?: string;
}

export default function InvoicesPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceRecord | null>(null);

  // 1. Fetch Invoices
  const { data: invoices, isLoading: isLoadingInvoices } = useQuery<InvoiceRecord[]>({
    queryKey: ['invoices-list'],
    queryFn: () => fetch('/api/invoices').then(res => res.json()),
    enabled: !!session,
  });

  // 2. Fetch Deals for linkage dropdown
  const { data: deals } = useQuery<any[]>({
    queryKey: ['deals-invoice-dropdown'],
    queryFn: () => fetch('/api/deals').then(res => res.json()),
    enabled: !!session,
  });

  const form = useForm({
    resolver: zodResolver(invoiceSchema) as any,
    defaultValues: {
      deal_id: undefined as any,
      total_amount: 0,
      status: 'draft' as 'draft' | 'sent' | 'paid' | 'overdue',
      due_date: '',
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (values: any) =>
      fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      }).then(async res => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Failed to create invoice');
        return body;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices-list'] });
      toast.success('Invoice drafted successfully.');
      setIsOpen(false);
      form.reset();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (values: any) =>
      fetch(`/api/invoices/${editingInvoice?.invoice_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      }).then(async res => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Failed to update invoice');
        return body;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices-list'] });
      toast.success('Invoice updated successfully.');
      setIsOpen(false);
      setEditingInvoice(null);
      form.reset();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (invoiceId: number) =>
      fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
      }).then(async res => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Failed to delete invoice');
        return body;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices-list'] });
      toast.success('Invoice successfully deleted.');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const onSubmit = (values: any) => {
    if (editingInvoice) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };

  const handleEdit = (inv: InvoiceRecord) => {
    setEditingInvoice(inv);
    form.reset({
      deal_id: inv.deal_id,
      total_amount: inv.total_amount,
      status: inv.status,
      due_date: inv.due_date ? new Date(inv.due_date).toISOString().substring(0, 10) : '',
    });
    setIsOpen(true);
  };

  const handleNew = () => {
    setEditingInvoice(null);
    form.reset({
      deal_id: undefined as any,
      total_amount: 0,
      status: 'draft',
      due_date: '',
    });
    setIsOpen(true);
  };

  // Metrics calculations
  const totalAmount = invoices?.reduce((acc, inv) => acc + inv.total_amount, 0) || 0;
  const outstandingOverdue = invoices?.filter(i => i.status === 'overdue').reduce((acc, i) => acc + i.total_amount, 0) || 0;
  const closedPaid = invoices?.filter(i => i.status === 'paid').reduce((acc, i) => acc + i.total_amount, 0) || 0;

  const columns: ColumnDef<InvoiceRecord>[] = [
    {
      accessorKey: 'invoice_id',
      header: 'Invoice Code',
      cell: ({ row }) => (
        <Link 
          href={`/dashboard/invoices/${row.original.invoice_id}`}
          className="font-mono font-bold text-[#E8E4DD] hover:text-[#D4A853] transition-colors flex items-center gap-1.5"
        >
          INV-{row.original.invoice_id}
          <ExternalLink className="h-3 w-3 opacity-40" />
        </Link>
      ),
    },
    {
      accessorKey: 'deal_title',
      header: 'Pipeline Deal',
      cell: ({ row }) => row.original.deal_title,
    },
    {
      accessorKey: 'contact_name',
      header: 'Client / Contact',
      cell: ({ row }) => row.original.contact_name || '-',
    },
    {
      accessorKey: 'total_amount',
      header: 'Total Amount',
      cell: ({ row }) => {
        const val = row.original.total_amount || 0;
        return <span className="font-mono text-[#6B8F71] font-semibold">${val.toLocaleString()}</span>;
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const stage = row.original.status;
        let color = 'bg-[#1C1C1F] text-[#C4C0B8]';
        if (stage === 'draft') color = 'bg-[#1C1C1F]/80 text-[#8A8680] border-slate-700/30';
        if (stage === 'sent') color = 'bg-[#5B8FB9]/10 text-[#5B8FB9] border-[#5B8FB9]/20';
        if (stage === 'paid') color = 'bg-[#6B8F71]/10 text-[#6B8F71] border-[#6B8F71]/20';
        if (stage === 'overdue') color = 'bg-[#C75B39]/10 text-[#C75B39] border-[#C75B39]/20';
        return <Badge className={`capitalize text-[10px] border font-semibold ${color}`}>{stage}</Badge>;
      },
    },
    {
      accessorKey: 'due_date',
      header: 'Due Date',
      cell: ({ row }) => row.original.due_date ? format(new Date(row.original.due_date), 'PP') : '-',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const inv = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger className="h-8 w-8 text-[#8A8680] hover:text-[#E8E4DD] hover:bg-[#1C1C1F] rounded-md flex items-center justify-center cursor-pointer focus:outline-none">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#141416] border-[#2A2A2D] text-[#C4C0B8]">
              <DropdownMenuItem onClick={() => handleEdit(inv)} className="hover:bg-[#1C1C1F] focus:bg-[#1C1C1F] cursor-pointer flex items-center gap-2">
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit Invoice</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  if (confirm('Delete this invoice?')) {
                    deleteMutation.mutate(inv.invoice_id);
                  }
                }}
                className="text-[#C75B39] focus:text-[#C75B39] hover:bg-[#1C1C1F] focus:bg-[#1C1C1F] cursor-pointer flex items-center gap-2"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </DropdownMenuItem>
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
            <FileSpreadsheet className="h-6 w-6 text-[#D4A853]" />
            Invoices & Billing
          </h1>
          <p className="text-sm text-[#8A8680]">Record issued financial invoices, collect credit payments, and track accounting statuses.</p>
        </div>
        <Button
          onClick={handleNew}
          className="bg-[#D4A853] hover:bg-[#E8C87A] text-[#E8E4DD] font-semibold flex items-center gap-2 py-4 px-4 shadow-lg shadow-[#D4A853]/10 cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" />
          Create Invoice
        </Button>
      </div>

      {/* Financial Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD] shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs text-[#8A8680] font-semibold uppercase tracking-wider">Gross Outstanding</span>
            <Layers className="h-4 w-4 text-[#D4A853]" />
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-extrabold text-[#E8E4DD] font-mono">${totalAmount.toLocaleString()}</span>
            <p className="text-[10px] text-[#5A5853] mt-1">Total billing transactions tracked</p>
          </CardContent>
        </Card>

        <Card className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD] shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs text-[#8A8680] font-semibold uppercase tracking-wider">Overdue Invoices</span>
            <Clock className="h-4 w-4 text-[#C75B39]" />
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-extrabold text-[#E8E4DD] font-mono">${outstandingOverdue.toLocaleString()}</span>
            <p className="text-[10px] text-[#5A5853] mt-1">Outstanding overdue collections</p>
          </CardContent>
        </Card>

        <Card className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD] shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs text-[#8A8680] font-semibold uppercase tracking-wider">Collected Revenue</span>
            <DollarSign className="h-4 w-4 text-[#6B8F71]" />
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-extrabold text-[#E8E4DD] font-mono">${closedPaid.toLocaleString()}</span>
            <p className="text-[10px] text-[#5A5853] mt-1">Total cash payments confirmed</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD] shadow-xl">
        <CardContent className="pt-6">
          {isLoadingInvoices ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 text-[#D4A853] animate-spin" />
            </div>
          ) : (
            <DataTable columns={columns} data={invoices || []} />
          )}
        </CardContent>
      </Card>

      {/* Form Drawer Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="bg-[#0D0D0F] border-[#2A2A2D] text-[#E8E4DD] w-full sm:max-w-md">
          <SheetHeader className="border-b border-[#2A2A2D] pb-6 mb-6">
            <SheetTitle className="text-[#E8E4DD] flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-[#D4A853]" />
              {editingInvoice ? 'Edit Invoice Parameters' : 'Create Billing Invoice'}
            </SheetTitle>
            <SheetDescription className="text-[#8A8680]">
              Configure details, prices, link active pipeline deals, and due dates.
            </SheetDescription>
          </SheetHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="deal_id"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#C4C0B8]">Link Active Pipeline Deal</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger className="bg-[#141416] border-[#2A2A2D] text-[#C4C0B8]">
                          <SelectValue placeholder="Select deal to invoice" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#141416] border-[#2A2A2D] text-[#C4C0B8]">
                        {deals?.map(d => (
                          <SelectItem key={d.deal_id} value={d.deal_id.toString()}>
                            {d.deal_title} (${(d.value || 0).toLocaleString()})
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
                name="total_amount"
                render={({ field }) => {
                  const { value, ...fieldProps } = field;
                  return (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-[#C4C0B8]">Total Billed Amount ($)</FormLabel>
                      <FormControl>
                        <Input type="number" className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD] font-mono" {...fieldProps} value={value ?? 0} />
                      </FormControl>
                      <FormMessage className="text-[#C75B39]" />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#C4C0B8]">Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-[#141416] border-[#2A2A2D] text-[#C4C0B8]">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#141416] border-[#2A2A2D] text-[#C4C0B8]">
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="sent">Sent to Client</SelectItem>
                        <SelectItem value="paid">Paid / Collected</SelectItem>
                        <SelectItem value="overdue">Overdue Outstanding</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[#C75B39]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#C4C0B8]">Payment Due Date</FormLabel>
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
                  {createMutation.isPending || updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : editingInvoice ? 'Save Invoice' : 'Create Invoice'}
                </Button>
              </div>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
