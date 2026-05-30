'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  FileSpreadsheet,
  Clock,
  User,
  ArrowLeft,
  Loader2,
  Trash2,
  Edit2,
  DollarSign,
  Sparkles,
  CreditCard,
  PlusCircle,
  TrendingUp,
  Mail,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { paymentSchema } from '@/lib/validations/payment';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function InvoiceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const invoiceId = parseInt(params.id as string, 10);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  // 1. Fetch Invoice Details
  const { data: invoice, isLoading: isLoadingInvoice, error: invoiceError } = useQuery({
    queryKey: ['invoice-detail', invoiceId],
    queryFn: () => fetch(`/api/invoices/${invoiceId}`).then(async res => {
      if (!res.ok) throw new Error('Invoice not found');
      return res.json();
    }),
    enabled: !!invoiceId && !!session,
  });

  // 2. Fetch Payments ledger for this specific invoice
  const { data: payments, isLoading: isLoadingPayments } = useQuery({
    queryKey: ['invoice-payments', invoiceId],
    queryFn: () => fetch(`/api/payments?invoice_id=${invoiceId}`).then(res => res.json()),
    enabled: !!invoiceId && !!session,
  });

  // Forms
  const editForm = useForm({
    defaultValues: {
      total_amount: 0,
      status: 'draft',
      due_date: '',
    },
  });

  const paymentForm = useForm({
    resolver: zodResolver(paymentSchema) as any,
    defaultValues: {
      invoice_id: invoiceId,
      amount_paid: 0,
      payment_date: new Date().toISOString().substring(0, 10),
      payment_method: 'bank_transfer' as any,
      notes: '',
    },
  });

  // Mutations
  const updateMutation = useMutation({
    mutationFn: (values: any) =>
      fetch(`/api/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          total_amount: parseFloat(values.total_amount) || 0,
        }),
      }).then(async res => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Failed to update invoice');
        return body;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-detail', invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['invoices-list'] });
      toast.success('Invoice details updated.');
      setIsEditOpen(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const recordPaymentMutation = useMutation({
    mutationFn: (values: any) =>
      fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, invoice_id: invoiceId }),
      }).then(async res => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Failed to record payment');
        return body;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-detail', invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['invoice-payments', invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['payments-list'] });
      toast.success('Collection transaction logged successfully!');
      setIsPaymentOpen(false);
      paymentForm.reset({
        invoice_id: invoiceId,
        amount_paid: 0,
        payment_date: new Date().toISOString().substring(0, 10),
        payment_method: 'bank_transfer',
        notes: '',
      });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
      }).then(async res => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Failed to delete invoice');
        return body;
      }),
    onSuccess: () => {
      toast.success('Invoice deleted.');
      router.push('/dashboard/invoices');
    },
    onError: (err: any) => toast.error(err.message),
  });

  React.useEffect(() => {
    if (invoice) {
      editForm.reset({
        total_amount: invoice.total_amount || 0,
        status: invoice.status,
        due_date: invoice.due_date ? new Date(invoice.due_date).toISOString().substring(0, 10) : '',
      });
      paymentForm.reset({
        invoice_id: invoiceId,
        amount_paid: invoice.total_amount || 0,
        payment_date: new Date().toISOString().substring(0, 10),
        payment_method: 'bank_transfer',
        notes: `Full payment collected for invoice INV-${invoiceId}`,
      });
    }
  }, [invoice, editForm, paymentForm]);

  if (isLoadingInvoice) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 text-[#D4A853] animate-spin" />
      </div>
    );
  }

  if (invoiceError || !invoice) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-[#E8E4DD]">Invoice Not Found</h2>
        <p className="text-[#8A8680] mt-2">The invoice you are looking for does not exist or has been deleted.</p>
        <Link href="/dashboard/invoices" className={cn(buttonVariants({ variant: 'outline' }), 'mt-4 border-[#2A2A2D]')}>
          Back to Invoices
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2A2A2D] pb-5">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/invoices" className="text-[#8A8680] hover:text-[#E8E4DD] p-1 hover:bg-[#1C1C1F] rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#E8E4DD] flex items-center gap-2">
              Invoice INV-{invoice.invoice_id}
            </h1>
            <p className="text-xs text-[#8A8680]">Record payments, print invoices, and track outstanding overdue balances.</p>
          </div>
        </div>
        <div className="flex gap-2">
          {invoice.status !== 'paid' && (
            <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
              <DialogTrigger className={cn(buttonVariants({ variant: 'default' }), "bg-emerald-600 hover:bg-emerald-500 text-[#E8E4DD] font-semibold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/25")}>
                <CreditCard className="h-4.5 w-4.5" />
                Record Payment
              </DialogTrigger>
              <DialogContent className="bg-[#0D0D0F] border-[#2A2A2D] text-[#E8E4DD] max-w-sm">
                <DialogHeader>
                  <DialogTitle className="text-[#E8E4DD] flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[#6B8F71]" />
                    Record Client Payment
                  </DialogTitle>
                  <DialogDescription className="text-[#8A8680]">
                    Record a received payment. This atomically flags this Invoice status as paid.
                  </DialogDescription>
                </DialogHeader>

                <Form {...paymentForm}>
                  <form onSubmit={paymentForm.handleSubmit(v => recordPaymentMutation.mutate(v))} className="space-y-4">
                    <FormField
                      control={paymentForm.control}
                      name="amount_paid"
                      render={({ field }) => {
                        const { value, ...fieldProps } = field;
                        return (
                          <FormItem className="space-y-1">
                            <FormLabel className="text-[#C4C0B8]">Amount Paid ($)</FormLabel>
                            <FormControl>
                              <Input type="number" className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD] font-mono" {...fieldProps} value={value ?? 0} />
                            </FormControl>
                            <FormMessage className="text-[#C75B39]" />
                          </FormItem>
                        );
                      }}
                    />

                    <FormField
                      control={paymentForm.control}
                      name="payment_method"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-[#C4C0B8]">Payment Method</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-[#141416] border-[#2A2A2D] text-[#C4C0B8]">
                                <SelectValue placeholder="Select method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-[#141416] border-[#2A2A2D] text-[#C4C0B8]">
                              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                              <SelectItem value="card">Credit/Debit Card</SelectItem>
                              <SelectItem value="cash">Cash Payment</SelectItem>
                              <SelectItem value="cheque">Cheque</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-[#C75B39]" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={paymentForm.control}
                      name="payment_date"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-[#C4C0B8]">Payment Date</FormLabel>
                          <FormControl>
                            <Input type="date" className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD]" {...field} />
                          </FormControl>
                          <FormMessage className="text-[#C75B39]" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={paymentForm.control}
                      name="notes"
                      render={({ field }) => {
                        const { value, ...fieldProps } = field;
                        return (
                          <FormItem className="space-y-1">
                            <FormLabel className="text-[#C4C0B8]">Transaction Notes (Optional)</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Receipt reference numbers, comments..." className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD] min-h-[60px]" {...fieldProps} value={value || ''} />
                            </FormControl>
                            <FormMessage className="text-[#C75B39]" />
                          </FormItem>
                        );
                      }}
                    />

                    <div className="flex gap-3 pt-4 border-t border-[#2A2A2D]">
                      <Button type="button" onClick={() => setIsPaymentOpen(false)} variant="outline" className="border-[#2A2A2D] text-[#C4C0B8] hover:bg-[#1C1C1F] cursor-pointer">
                        Cancel
                      </Button>
                      <Button type="submit" disabled={recordPaymentMutation.isPending} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-[#E8E4DD] font-semibold cursor-pointer">
                        {recordPaymentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Payment'}
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
            Edit Params
          </Button>

          <Button
            onClick={() => {
              if (confirm('Are you sure you want to delete this invoice?')) {
                deleteMutation.mutate();
              }
            }}
            variant="destructive"
            className="bg-red-950/40 text-[#C75B39] hover:bg-red-900 border border-red-900/30 flex items-center gap-2 cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice Metadata Panel */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD] shadow-md">
            <CardHeader className="border-b border-[#2A2A2D] pb-4">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-[#8A8680] flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-[#D4A853]" />
                Invoice Billing Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-5 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-4 w-4 text-[#D4A853]/80" />
                    <div>
                      <div className="text-[10px] text-[#5A5853] uppercase tracking-wider">Total Amount Billed</div>
                      <div className="text-[#E8E4DD] text-base font-extrabold font-mono">${(invoice.total_amount || 0).toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-[#D4A853]/80" />
                    <div>
                      <div className="text-[10px] text-[#5A5853] uppercase tracking-wider">Status</div>
                      <Badge className={cn("uppercase text-[10px] font-bold mt-0.5 border border-[#2A2A2D]/30", 
                        invoice.status === 'draft' && 'bg-[#1C1C1F] text-[#8A8680]',
                        invoice.status === 'sent' && 'bg-[#5B8FB9]/10 text-[#5B8FB9] border-[#5B8FB9]/20',
                        invoice.status === 'paid' && 'bg-[#6B8F71]/10 text-[#6B8F71] border-[#6B8F71]/20',
                        invoice.status === 'overdue' && 'bg-[#C75B39]/10 text-[#C75B39] border-[#C75B39]/20',
                      )}>
                        {invoice.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-[#D4A853]/80" />
                    <div>
                      <div className="text-[10px] text-[#5A5853] uppercase tracking-wider">Payment Due Date</div>
                      <div className="text-[#E8E4DD] font-medium font-mono">
                        {invoice.due_date ? format(new Date(invoice.due_date), 'PPP') : 'Not specified'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-[#D4A853]/80" />
                    <div>
                      <div className="text-[10px] text-[#5A5853] uppercase tracking-wider">Issued By Agent</div>
                      <div className="text-[#E8E4DD] font-medium">{invoice.issuer_name || 'System / Admin'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payments Transaction ledger list */}
          <Card className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD] shadow-md">
            <CardHeader className="border-b border-[#2A2A2D] pb-4">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-[#8A8680] flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-[#D4A853]" />
                Payments Ledger Transactions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {isLoadingPayments ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 text-[#D4A853] animate-spin" />
                </div>
              ) : !payments || payments.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#5A5853]">No payment records logged for this invoice yet.</div>
              ) : (
                <div className="space-y-4">
                  {payments.map((p: any) => (
                    <div key={p.payment_id} className="p-4 bg-[#111113] border border-[#2A2A2D] rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-[#1C1C1F] text-[#C4C0B8] border border-[#2A2A2D] capitalize text-[9px] font-bold">
                            {p.payment_method.replace('_', ' ')}
                          </Badge>
                          <span className="text-[10px] text-[#5A5853] font-mono">{format(new Date(p.payment_date), 'PPP')}</span>
                        </div>
                        <p className="text-xs text-[#C4C0B8] mt-1.5">{p.notes || 'No description notes.'}</p>
                      </div>
                      <span className="font-mono text-base font-extrabold text-[#6B8F71]">+${p.amount_paid.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD] shadow-md">
            <CardHeader className="border-b border-[#2A2A2D] pb-4">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-[#8A8680] flex items-center gap-2">
                <User className="h-4 w-4 text-[#D4A853]" />
                Client Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-[#D4A853]/80" />
                <div>
                  <div className="text-[10px] text-[#5A5853] uppercase tracking-wider">Client Name</div>
                  <div className="text-[#E8E4DD] font-semibold">{invoice.contact_name || 'No client linked'}</div>
                </div>
              </div>

              {invoice.contact_email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-[#D4A853]/80" />
                  <div>
                    <div className="text-[10px] text-[#5A5853] uppercase tracking-wider">Billing Email</div>
                    <div className="text-[#E8E4DD] font-medium font-mono">{invoice.contact_email}</div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2 border-t border-[#2A2A2D]">
                <TrendingUp className="h-4 w-4 text-[#D4A853]/80" />
                <div>
                  <div className="text-[10px] text-[#5A5853] uppercase tracking-wider">Billed Pipeline Deal</div>
                  <div className="text-[#E8E4DD] font-medium">{invoice.deal_title}</div>
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
              <FileSpreadsheet className="h-5 w-5 text-[#D4A853]" />
              Edit Invoice details
            </SheetTitle>
            <SheetDescription className="text-[#8A8680]">
              Modify outstanding bills, due dates, or status values.
            </SheetDescription>
          </SheetHeader>

          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(v => updateMutation.mutate(v))} className="space-y-6">
              <FormField
                control={editForm.control}
                name="total_amount"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#C4C0B8]">Total Billed Amount ($)</FormLabel>
                    <FormControl>
                      <Input type="number" className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD] font-mono" {...field} />
                    </FormControl>
                    <FormMessage className="text-[#C75B39]" />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
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
                control={editForm.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[#C4C0B8]">Payment Due Date</FormLabel>
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
                  {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Invoice'}
                </Button>
              </div>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
