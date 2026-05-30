'use client';

import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Settings2, Building, Sparkles } from 'lucide-react';
import Forbidden from '@/components/shared/forbidden';
import { useSession } from 'next-auth/react';

const companySchema = z.object({
  company_name: z.string().min(2, 'Company name must be at least 2 characters').max(100),
  industry: z.string().min(1, 'Industry is required').max(100),
  email: z.string().email('Please enter a valid company email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});

type CompanyFormValues = z.infer<typeof companySchema>;

export default function CompaniesPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const user = session?.user as any;
  const isAdmin = user?.roleName === 'admin' || user?.roleId === 1;

  // Fetch company details
  const { data: company, isLoading } = useQuery({
    queryKey: ['company-settings'],
    queryFn: () => fetch('/api/companies/me').then(res => res.json()),
    enabled: !!session,
  });

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      company_name: '',
      industry: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      country: '',
    },
  });

  // Populate form with fetched company data
  useEffect(() => {
    if (company) {
      form.reset({
        company_name: company.company_name || '',
        industry: company.industry || '',
        email: company.email || '',
        phone: company.phone || '',
        address: company.address || '',
        city: company.city || '',
        country: company.country || '',
      });
    }
  }, [company, form]);

  const updateMutation = useMutation({
    mutationFn: (values: CompanyFormValues) =>
      fetch('/api/companies/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      }).then(res => {
        if (!res.ok) throw new Error('Failed to update company settings');
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
      queryClient.invalidateQueries({ queryKey: ['company-me'] });
      toast.success('Company settings successfully updated!');
    },
    onError: (err) => {
      console.error(err);
      toast.error('Failed to update company settings. Please try again.');
    },
  });

  const onSubmit = (values: CompanyFormValues) => {
    updateMutation.mutate(values);
  };

  if (!session) return null;
  if (!isAdmin) return <Forbidden />;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 text-[#D4A853] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="border-b border-[#2A2A2D] pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-[#E8E4DD] flex items-center gap-2">
          <Settings2 className="h-6 w-6 text-[#D4A853]" />
          Company Settings
        </h1>
        <p className="text-sm text-[#8A8680]">Configure your multi-tenant organization metadata and credentials.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form Panel */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD] shadow-xl">
            <CardHeader className="border-b border-[#2A2A2D]/50 pb-6">
              <CardTitle className="text-[#E8E4DD] text-lg flex items-center gap-2">
                <Building className="h-5 w-5 text-[#D4A853]" />
                Organization Details
              </CardTitle>
              <CardDescription className="text-[#8A8680]">
                Primary identifier metadata scoped across all database tables.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="company_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#C4C0B8]">Company Legal Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Nexus Data Corp"
                              className="bg-[#0D0D0F] border-[#2A2A2D] text-[#E8E4DD] placeholder-[#3A3A3D] focus:border-[#D4A853]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-[#C75B39]" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="industry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#C4C0B8]">Core Industry</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Software & Technology"
                              className="bg-[#0D0D0F] border-[#2A2A2D] text-[#E8E4DD] placeholder-[#3A3A3D] focus:border-[#D4A853]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-[#C75B39]" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#C4C0B8]">Company Contact Email</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="billing@nexusdata.io"
                              type="email"
                              className="bg-[#0D0D0F] border-[#2A2A2D] text-[#E8E4DD] placeholder-[#3A3A3D] focus:border-[#D4A853]"
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
                        <FormItem>
                          <FormLabel className="text-[#C4C0B8]">Main Office Phone</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="+1 (555) 0199"
                              className="bg-[#0D0D0F] border-[#2A2A2D] text-[#E8E4DD] placeholder-[#3A3A3D] focus:border-[#D4A853]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-[#C75B39]" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#C4C0B8]">Street Address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="100 Innovation Way, Suite 400"
                            className="bg-[#0D0D0F] border-[#2A2A2D] text-[#E8E4DD] placeholder-[#3A3A3D] focus:border-[#D4A853]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[#C75B39]" />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#C4C0B8]">City</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="San Francisco"
                              className="bg-[#0D0D0F] border-[#2A2A2D] text-[#E8E4DD] placeholder-[#3A3A3D] focus:border-[#D4A853]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-[#C75B39]" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#C4C0B8]">Country</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="United States"
                              className="bg-[#0D0D0F] border-[#2A2A2D] text-[#E8E4DD] placeholder-[#3A3A3D] focus:border-[#D4A853]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-[#C75B39]" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end pt-4 border-t border-[#2A2A2D]">
                    <Button
                      type="submit"
                      disabled={updateMutation.isPending}
                      className="bg-[#D4A853] hover:bg-[#E8C87A] text-[#E8E4DD] font-semibold shadow-lg shadow-[#D4A853]/10 px-6 py-5 cursor-pointer"
                    >
                      {updateMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving changes...
                        </>
                      ) : (
                        'Save Configuration'
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Right Info Panel */}
        <div className="space-y-6">
          <Card className="bg-[#141416] border-[#2A2A2D] text-[#E8E4DD] shadow-xl overflow-hidden relative">
            <div className="absolute right-0 top-0 w-24 h-24 bg-[#D4A853]/5 blur-xl rounded-full" />
            <CardHeader className="border-b border-[#2A2A2D]/50 pb-6">
              <CardTitle className="text-[#E8E4DD] text-base">Active Subscription</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#8A8680]">Current Plan Tier</span>
                <Badge className="bg-[#D4A853] text-[#E8E4DD] hover:bg-[#D4A853] py-0.5 px-2">
                  {company?.plan_name || 'Free'}
                </Badge>
              </div>

              <div className="border-t border-[#2A2A2D]/50 my-2" />

              <div className="space-y-1">
                <span className="text-[10px] text-[#5A5853] font-mono uppercase">Database Identifiers</span>
                <div className="p-3 bg-[#111113] border border-[#2A2A2D] rounded-lg flex items-center justify-between">
                  <span className="text-xs text-[#8A8680]">Tenant company_id</span>
                  <span className="text-xs font-semibold text-[#D4A853] font-mono">{company?.company_id}</span>
                </div>
              </div>

              <div className="p-4 bg-[#D4A853]/5 border border-[#D4A853]/10 rounded-xl space-y-2 mt-4">
                <div className="flex items-center gap-2 text-[#D4A853] font-semibold text-xs">
                  <Sparkles className="h-4 w-4" />
                  Tenancy Guarantee
                </div>
                <p className="text-[11px] text-[#8A8680] leading-relaxed">
                  Every SQL query initiated from this tenant dashboard automatically appends the target company identifier restriction.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
