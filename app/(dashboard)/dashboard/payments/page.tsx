'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import {
  CreditCard,
  Plus,
  Loader2,
  MoreHorizontal,
  ExternalLink,
  DollarSign,
  Briefcase,
  Calendar,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DataTable } from '@/components/shared/data-table';
import { paymentSchema, PaymentInput } from '@/lib/validations/payment';
import { format } from 'date-fns';

interface PaymentRecord {
  payment_id: number;
  invoice_id: number;
  company_id: number;
  amount_paid: number;
  payment_date: string;
  payment_method: 'bank_transfer' | 'card' | 'cash' | 'cheque';
  notes?: string;
  invoice_amount: number;
  deal_title: string;
}

export default function PaymentsPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);

  // 1. Fetch Payments Ledger
  const { data: payments, isLoading: isLoadingPayments } = useQuery<PaymentRecord[]>({
    queryKey: ['payments-list'],
    queryFn: () => fetch('/api/payments').then(res => res.json()),
    enabled: !!session,
  });

  // 2. Fetch Invoices for payment selection dropdown
  const { data: invoices } = useQuery<any[]>({
    queryKey: ['invoices-payment-dropdown'],
    queryFn: () => fetch('/api/invoices').then(res => res.json()),
    enabled: !!session,
  });

  const form = useForm({
    resolver: zodResolver(paymentSchema) as any,
    defaultValues: {
      invoice_id: undefined as any,
      amount_paid: 0,
      payment_date: new Date().toISOString().substring(0, 10),
      payment_method: 'bank_transfer' as 'bank_transfer' | 'card' | 'cash' | 'cheque',
      notes: '',
    },
  });

  const recordMutation = useMutation({
    mutationFn: (values: any) =>
      fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      }).then(async res => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Failed to record payment');
        return body;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments-list'] });
      queryClient.invalidateQueries({ queryKey: ['invoices-list'] });
      toast.success('Collection recorded successfully.');
      setIsOpen(false);
      form.reset();
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Automatically update the payment amount when invoice is selected
  const selectedInvoiceId = form.watch('invoice_id');
  React.useEffect(() => {
    if (selectedInvoiceId && invoices) {
      const match = invoices.find(i => i.invoice_id === parseInt(selectedInvoiceId as any, 10));
      if (match) {
        form.setValue('amount_paid', match.total_amount);
        form.setValue('notes', `Collected full payment for Invoice INV-${match.invoice_id}`);
      }
    }
  }, [selectedInvoiceId, invoices, form]);

  const columns: ColumnDef<PaymentRecord>[] = [
    {
      accessorKey: 'payment_id',
      header: 'Receipt ID',
      cell: ({ row }) => <span className="font-mono text-xs font-semibold text-[#8A8680]">REC-{row.original.payment_id}</span>,
    },
    {
      accessorKey: 'invoice_id',
      header: 'Invoice Reference',
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
      header: 'Linked Deal',
      cell: ({ row }) => row.original.deal_title,
    },
    {
      accessorKey: 'amount_paid',
      header: 'Amount Collected',
      cell: ({ row }) => <span className="font-mono text-[#6B8F71] font-extrabold">+${row.original.amount_paid.toLocaleString()}</span>,
    },
    {
      accessorKey: 'payment_method',
      header: 'Payment Method',
      cell: ({ row }) => {
        const method = row.original.payment_method;
        return <Badge className="bg-[#1C1C1F] text-[#D4A853] border border-slate-700/60 uppercase text-[9px] font-bold">{method.replace('_', ' ')}</Badge>;
      },
    },
    {
      accessorKey: 'payment_date',
      header: 'Collection Date',
      cell: ({ row }) => format(new Date(row.original.payment_date), 'PP'),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2A2A2D] pb-5">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight text-[#E8E4DD] flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-[#D4A853]" />
            Payments Ledger
          </h1>
          <p className="text-sm text-[#8A8680]">View received transaction collections and manage physical/digital cash flow histories.</p>
        </div>
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-[#D4A853] hover:bg-[#E8C87A] text-[#E8E4DD] font-semibold flex items-center gap-2 py-4 px-4 shadow-lg shadow-[#D4A853]/10 cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" />
          Record Collection
        </Button>
      </div>

      <Card className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD] shadow-xl">
        <CardContent className="pt-6">
          {isLoadingPayments ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 text-[#D4A853] animate-spin" />
            </div>
          ) : (
            <DataTable columns={columns} data={payments || []} />
          )}
        </CardContent>
      </Card>

      {/* Slideout Record Collection Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="bg-[#0D0D0F] border-[#2A2A2D] text-[#E8E4DD] w-full sm:max-w-md">
          <SheetHeader className="border-b border-[#2A2A2D] pb-6 mb-6">
            <SheetTitle className="text-[#E8E4DD] flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[#D4A853]" />
              Record Payment Collection
            </SheetTitle>
            <SheetDescription className="text-[#8A8680]">
              Confirm bank transfers, card, cheque, or cash payments.
            </SheetDescription>
          </SheetHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(v => recordMutation.mutate(v))} className="space-y-6">
              <FormField
                control={form.control}
                name="invoice_id"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#C4C0B8]">Select Invoice Reference</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger className="bg-[#141416] border-[#2A2A2D] text-[#C4C0B8]">
                          <SelectValue placeholder="Select outstanding invoice" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#141416] border-[#2A2A2D] text-[#C4C0B8]">
                        {invoices?.filter(i => i.status !== 'paid').map(i => (
                          <SelectItem key={i.invoice_id} value={i.invoice_id.toString()}>
                            INV-{i.invoice_id} — {i.contact_name || 'Client'} (${i.total_amount.toLocaleString()})
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
                name="amount_paid"
                render={({ field }) => {
                  const { value, ...fieldProps } = field;
                  return (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-[#C4C0B8]">Amount Collected ($)</FormLabel>
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
                name="payment_method"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#C4C0B8]">Payment Channel</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-[#141416] border-[#2A2A2D] text-[#C4C0B8]">
                          <SelectValue placeholder="Select payment channel" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#141416] border-[#2A2A2D] text-[#C4C0B8]">
                        <SelectItem value="bank_transfer">Bank Transfer / ACH</SelectItem>
                        <SelectItem value="card">Credit / Debit Card</SelectItem>
                        <SelectItem value="cash">Physical Cash</SelectItem>
                        <SelectItem value="cheque">Cheque Payment</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[#C75B39]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_date"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#C4C0B8]">Collection Date</FormLabel>
                    <FormControl>
                      <Input type="date" className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD]" {...field} />
                    </FormControl>
                    <FormMessage className="text-[#C75B39]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => {
                  const { value, ...fieldProps } = field;
                  return (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-[#C4C0B8]">Receipt Notes / Reference</FormLabel>
                      <FormControl>
                        <Textarea placeholder="ACH reference numbers, cash confirm receipts..." className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD] min-h-[80px]" {...fieldProps} value={value || ''} />
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
                <Button type="submit" disabled={recordMutation.isPending} className="flex-1 bg-[#D4A853] hover:bg-[#E8C87A] text-[#E8E4DD] font-semibold cursor-pointer">
                  {recordMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Record Collection'}
                </Button>
              </div>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
