import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, ShieldCheck, Zap, Award, Layers, Users, TrendingUp, DollarSign, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex-1 flex flex-col min-h-screen relative overflow-hidden bg-[#08080A] text-[#F4EFE6] font-sans grain-overlay">
      {/* Decorative gradient glowing spheres */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#C95A32]/5 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#C95A32]/5 blur-[130px] pointer-events-none" />

      {/* Top navbar */}
      <header className="sticky top-0 z-40 bg-[#08080A] px-6 lg:px-16 py-4 flex items-center justify-between skeuo-line-horizontal shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-2.5">
          <div className="bg-[#C95A32] text-[#FAF7F2] p-2 rounded-lg shadow-md shadow-[#C95A32]/10">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <span className="font-heading font-bold text-xl tracking-tight text-[#F4EFE6]">
            Multi<span className="text-[#C95A32]">CRM</span>
          </span>
        </div>
        <div className="flex items-center gap-5">
          <Link
            href="/login"
            className="text-sm font-medium text-[#AFA897] hover:text-[#F4EFE6] transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="text-xs font-semibold skeuo-btn-rust px-4 py-2 rounded-xl transition-all shadow-md shadow-[#C95A32]/10"
          >
            Register Company
          </Link>
        </div>
      </header>

      {/* Hero section */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 lg:px-16 py-16 lg:py-24 flex flex-col items-center justify-center text-center space-y-12 z-10">
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#C95A32]/10 border border-[#C95A32]/25 text-[#C95A32] text-xs font-semibold mb-2 shadow-[0_2px_8px_rgba(201,90,50,0.05)]">
            <SparklesIcon className="h-3.5 w-3.5" />
            Built for SMBs & Scale Teams
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#F4EFE6] leading-tight font-heading">
            Multi-Tenant CRM SaaS <br />
            <span className="bg-gradient-to-r from-[#E27E5A] via-[#C95A32] to-[#9A3E1D] bg-clip-text text-transparent">
              Isolated & Performance Optimized
            </span>
          </h1>
          <p className="text-lg text-[#AFA897] max-w-2xl mx-auto leading-relaxed">
            Manage your full business lifecycle from lead generation, deal pipeline supervision, internally assigned tasks, up to invoices generation and payments recording.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-md">
          <Link
            href="/register"
            className="flex-1 skeuo-btn-rust font-semibold py-4 px-6 rounded-xl transition-all shadow-xl shadow-[#C95A32]/15 text-center flex items-center justify-center gap-2"
          >
            Get Started Free
            <ArrowRight className="h-4 w-4 animate-pulse" />
          </Link>
          <Link
            href="/login"
            className="flex-1 skeuo-btn-parchment font-semibold py-4 px-6 rounded-xl transition-all text-center shadow-md"
          >
            Sign In to Account
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full pt-12 stagger-children">
          <div className="p-6 rounded-2xl text-left transition-all duration-200 group card-hover-lift sticking-out-card">
            <div className="p-3 bg-[#C95A32]/10 rounded-xl text-[#C95A32] w-fit mb-4">
              <Layers className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-[#F4EFE6] mb-2 group-hover:text-[#C95A32] transition-colors font-heading">
              Strict Tenant Isolation
            </h3>
            <p className="text-sm text-[#AFA897] leading-relaxed">
              Enforced via backend `company_id` propagation across all 12 tables. Never share or bleed tenant data.
            </p>
          </div>

          <div className="p-6 rounded-2xl text-left transition-all duration-200 group card-hover-lift sticking-out-card">
            <div className="p-3 bg-[#C9AF85]/10 rounded-xl text-[#C9AF85] w-fit mb-4">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-[#F4EFE6] mb-2 group-hover:text-[#C9AF85] transition-colors font-heading">
              Role-Based Controls
            </h3>
            <p className="text-sm text-[#AFA897] leading-relaxed">
              Granular credentials for Admins, Managers, and Sales Representatives mapping module view access natively.
            </p>
          </div>

          <div className="p-6 rounded-2xl text-left transition-all duration-200 group card-hover-lift sticking-out-card">
            <div className="p-3 bg-[#6E8E75]/10 rounded-xl text-[#6E8E75] w-fit mb-4">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-[#F4EFE6] mb-2 group-hover:text-[#6E8E75] transition-colors font-heading">
              Full Operations Lifecycle
            </h3>
            <p className="text-sm text-[#AFA897] leading-relaxed">
              Covering the complete journey: from contact collection and pipeline nurturing, to invoicing and payment processing.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#08080A] py-8 px-6 text-center text-xs text-[#AFA897]/50 skeuo-line-horizontal">
        © 2026 MultiCRM SaaS. Engineered with Next.js 16, Tailwind CSS, & Neon Serverless Postgres.
      </footer>
    </div>
  );
}

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5 5 3Z" />
      <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5Z" />
    </svg>
  );
}
