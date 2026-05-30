import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function Forbidden() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 space-y-6">
      <div className="p-4 bg-red-500/10 text-red-500 rounded-full border border-red-500/25 shadow-lg shadow-red-500/5 animate-pulse">
        <ShieldAlert className="h-12 w-12" />
      </div>
      
      <div className="space-y-2 max-w-md">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#E8E4DD]">
          Access Restricted
        </h1>
        <p className="text-sm text-[#8A8680] leading-relaxed">
          Your current organization role does not have the authorization required to view or modify this directory module.
        </p>
      </div>

      <div className="flex gap-4">
        <Link
          href="/dashboard"
          className={cn(
            buttonVariants({ variant: 'outline' }),
            "border-[#2A2A2D] text-[#C4C0B8] hover:bg-[#1C1C1F] hover:text-[#E8E4DD] flex items-center gap-2"
          )}
        >
          <Home className="h-4 w-4" />
          Go to Home
        </Link>
      </div>
    </div>
  );
}
