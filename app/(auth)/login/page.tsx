'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { LayoutDashboard, Lock, Mail, Loader2, Sparkles } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      const result = await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('Invalid email or password. Please try again.');
        setIsLoading(false);
      } else {
        toast.success('Successfully logged in! Redirecting...');
        router.refresh();
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 relative overflow-hidden bg-gradient-to-br from-[#08080A] via-[#0E0E12] to-[#08080A]">
      {/* Background visual graphics */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-[#C95A32]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-[#C95A32]/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10 transition-all duration-300 transform">
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
            <CardTitle className="text-2xl font-semibold tracking-tight text-[#F4EFE6] flex items-center gap-2">
              Welcome back
            </CardTitle>
            <CardDescription className="text-[#AFA897]">
              Sign in to manage your multi-tenant organization.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                   control={form.control}
                   name="email"
                   render={({ field }) => (
                     <FormItem className="space-y-2">
                       <FormLabel className="text-[#FAF7F2]">Work Email</FormLabel>
                       <div className="relative">
                         <Mail className="absolute left-3 top-3 h-4 w-4 text-[#AFA897]/50 pointer-events-none" />
                         <FormControl>
                           <Input
                             placeholder="name@nexusdata.io"
                             type="email"
                             className="pl-10 bg-[#08080A]/50 border-border focus:border-[#C95A32] text-[#F4EFE6] placeholder-[#AFA897]/30 transition-all"
                             {...field}
                           />
                         </FormControl>
                       </div>
                       <FormMessage className="text-[#C84630]" />
                     </FormItem>
                   )}
                />

                <FormField
                   control={form.control}
                   name="password"
                   render={({ field }) => (
                     <FormItem className="space-y-2">
                       <div className="flex items-center justify-between">
                         <FormLabel className="text-[#FAF7F2]">Password</FormLabel>
                       </div>
                       <div className="relative">
                         <Lock className="absolute left-3 top-3 h-4 w-4 text-[#AFA897]/50 pointer-events-none" />
                         <FormControl>
                           <Input
                             placeholder="••••••••"
                             type="password"
                             className="pl-10 bg-[#08080A]/50 border-border focus:border-[#C95A32] text-[#F4EFE6] placeholder-[#AFA897]/30 transition-all"
                             {...field}
                           />
                         </FormControl>
                       </div>
                       <FormMessage className="text-[#C84630]" />
                     </FormItem>
                   )}
                />

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-5 skeuo-btn-rust shadow-lg shadow-[#C95A32]/10"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-0 pb-8 text-center text-sm text-[#AFA897]">
            <div className="text-xs flex items-center justify-center gap-1.5 bg-[#08080A]/30 border border-border/50 px-3 py-1.5 rounded-full text-[#C95A32] max-w-fit mx-auto font-medium">
              <Sparkles className="h-3 w-3" />
              Demo: admin@nexusdata.io / Admin1234!
            </div>
            <div>
              Don't have an account?{' '}
              <Link href="/register" className="text-[#C95A32] hover:text-[#E27E5A] font-medium transition-colors">
                Register company
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
