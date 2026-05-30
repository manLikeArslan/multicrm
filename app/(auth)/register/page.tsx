'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { registerSchema, RegisterInput } from '@/lib/validations/register';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { LayoutDashboard, Building2, User, KeyRound, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      company_name: '',
      industry: '',
      company_email: '',
      phone: '',
      country: '',
      full_name: '',
      work_email: '',
      password: '',
      confirm_password: '',
    },
    mode: 'onTouched',
  });

  const nextStep = async () => {
    // Validate Step 1 fields before proceeding
    const step1Fields: Array<keyof RegisterInput> = [
      'company_name',
      'industry',
      'company_email',
      'phone',
      'country',
    ];
    const isValid = await form.trigger(step1Fields);
    if (isValid) {
      setStep(2);
    }
  };

  const prevStep = () => {
    setStep(1);
  };

  const onSubmit = async (values: RegisterInput) => {
    setIsLoading(true);
    setTimeout(() => {
      toast.error('Company registration is currently closed or restricted in production. Please contact support.');
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 relative overflow-hidden bg-gradient-to-br from-[#08080A] via-[#0E0E12] to-[#08080A] min-h-screen py-12">
      {/* Background visual graphics */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-[#C95A32]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-[#C95A32]/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg z-10">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="bg-[#C95A32] text-[#FAF7F2] p-2.5 rounded-xl shadow-lg shadow-[#C95A32]/20">
            <LayoutDashboard className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-[#F4EFE6]">
            Multi<span className="text-[#C95A32]">CRM</span>
          </span>
        </div>

        <Card className="border-border bg-card shadow-2xl text-slate-100">
          <CardHeader className="space-y-1.5 pb-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-semibold tracking-tight text-[#F4EFE6] flex items-center gap-2">
                Register Company
              </CardTitle>
              <div className="flex items-center gap-1.5">
                <span className={`h-2.5 w-8 rounded-full transition-all duration-300 ${step === 1 ? 'bg-[#C95A32]' : 'bg-slate-800'}`} />
                <span className={`h-2.5 w-8 rounded-full transition-all duration-300 ${step === 2 ? 'bg-[#C95A32]' : 'bg-slate-800'}`} />
              </div>
            </div>
            <CardDescription className="text-[#AFA897]">
              {step === 1
                ? 'Step 1: Set up your company organization details.'
                : 'Step 2: Create the primary administrator account.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {step === 1 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <FormField
                      control={form.control}
                      name="company_name"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-[#FAF7F2]">Company Name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Building2 className="absolute left-3 top-3 h-4 w-4 text-[#AFA897]/50 pointer-events-none" />
                              <Input
                                placeholder="Nexus Data Corp"
                                className="pl-10 bg-[#08080A]/50 border-border focus:border-[#C95A32] text-[#F4EFE6] placeholder-[#AFA897]/30"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage className="text-[#C84630]" />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="industry"
                        render={({ field }) => (
                          <FormItem className="space-y-1.5">
                            <FormLabel className="text-[#FAF7F2]">Industry</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Technology"
                                className="bg-[#08080A]/50 border-border focus:border-[#C95A32] text-[#F4EFE6] placeholder-[#AFA897]/30"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-[#C84630]" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem className="space-y-1.5">
                            <FormLabel className="text-[#FAF7F2]">Country</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="United States"
                                className="bg-[#08080A]/50 border-border focus:border-[#C95A32] text-[#F4EFE6] placeholder-[#AFA897]/30"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-[#C84630]" />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="company_email"
                        render={({ field }) => (
                          <FormItem className="space-y-1.5">
                            <FormLabel className="text-[#FAF7F2]">Company Email</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="info@nexusdata.io"
                                type="email"
                                className="bg-[#08080A]/50 border-border focus:border-[#C95A32] text-[#F4EFE6] placeholder-[#AFA897]/30"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-[#C84630]" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem className="space-y-1.5">
                            <FormLabel className="text-[#FAF7F2]">Phone (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="+1 (555) 0199"
                                className="bg-[#08080A]/50 border-border focus:border-[#C95A32] text-[#F4EFE6] placeholder-[#AFA897]/30"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-[#C84630]" />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button
                      type="button"
                      onClick={nextStep}
                      className="w-full skeuo-btn-rust py-5 mt-4 flex items-center justify-center gap-2"
                    >
                      Continue to Admin Details
                      <ArrowRight className="h-4 w-4 animate-pulse" />
                    </Button>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                    <FormField
                      control={form.control}
                      name="full_name"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-[#FAF7F2]">Administrator Full Name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-3 h-4 w-4 text-[#AFA897]/50 pointer-events-none" />
                              <Input
                                placeholder="Sarah Jenkins"
                                className="pl-10 bg-[#08080A]/50 border-border focus:border-[#C95A32] text-[#F4EFE6] placeholder-[#AFA897]/30"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage className="text-[#C84630]" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="work_email"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-[#FAF7F2]">Admin Work Email</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="sarah.j@nexusdata.io"
                              type="email"
                              className="bg-[#08080A]/50 border-border focus:border-[#C95A32] text-[#F4EFE6] placeholder-[#AFA897]/30"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-[#C84630]" />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem className="space-y-1.5">
                            <FormLabel className="text-[#FAF7F2]">Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <KeyRound className="absolute left-3 top-3 h-4 w-4 text-[#AFA897]/50 pointer-events-none" />
                                <Input
                                  placeholder="••••••••"
                                  type="password"
                                  className="pl-10 bg-[#08080A]/50 border-border focus:border-[#C95A32] text-[#F4EFE6] placeholder-[#AFA897]/30"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="text-[#C84630]" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="confirm_password"
                        render={({ field }) => (
                          <FormItem className="space-y-1.5">
                            <FormLabel className="text-[#FAF7F2]">Confirm Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <KeyRound className="absolute left-3 top-3 h-4 w-4 text-[#AFA897]/50 pointer-events-none" />
                                <Input
                                  placeholder="••••••••"
                                  type="password"
                                  className="pl-10 bg-[#08080A]/50 border-border focus:border-[#C95A32] text-[#F4EFE6] placeholder-[#AFA897]/30"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="text-[#C84630]" />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex gap-4 mt-6">
                      <Button
                        type="button"
                        onClick={prevStep}
                        variant="outline"
                        className="py-5 px-5 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                      </Button>
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 skeuo-btn-rust py-5 shadow-lg shadow-[#C95A32]/10 flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Provisioning...
                          </>
                        ) : (
                          'Complete & Register'
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-0 pb-8 text-center text-sm text-[#AFA897]">
            <div>
              Already have a registered company?{' '}
              <Link href="/login" className="text-[#C95A32] hover:text-[#E27E5A] font-medium transition-colors">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
