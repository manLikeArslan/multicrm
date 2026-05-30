'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { Badge } from '@/components/ui/badge';
import { Building2, ShieldCheck, Zap, Award } from 'lucide-react';

export default function TenantBadge() {
  const { data: session } = useSession();

  if (!session?.user) return null;

  const { companyName, roleName } = session.user as any;

  // Render different icons and colors based on role
  const getRoleBadge = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return (
          <Badge className="bg-[#6E8E75]/15 text-[#6E8E75] hover:bg-[#6E8E75]/20 border-[#6E8E75]/30 gap-1 text-[11px]">
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin
          </Badge>
        );
      case 'manager':
        return (
          <Badge className="bg-[#C9AF85]/15 text-[#C9AF85] hover:bg-[#C9AF85]/20 border-[#C9AF85]/30 gap-1 text-[11px]">
            <Zap className="h-3.5 w-3.5" />
            Manager
          </Badge>
        );
      default:
        return (
          <Badge className="bg-[#AFA897]/15 text-[#AFA897] hover:bg-[#AFA897]/20 border-[#AFA897]/30 gap-1 text-[11px]">
            <Award className="h-3.5 w-3.5" />
            Sales Rep
          </Badge>
        );
    }
  };

  return (
    <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-card border border-border shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
      <div className="p-1 rounded-md bg-[#C95A32]/10 text-[#C95A32]">
        <Building2 className="h-3.5 w-3.5" />
      </div>
      <div className="flex flex-col text-left">
        <span className="text-[12px] font-semibold text-[#F4EFE6] tracking-wide leading-tight">
          {companyName || 'Nexus Data Corp'}
        </span>
      </div>
      <div className="flex items-center gap-1.5 ml-1">
        {getRoleBadge(roleName)}
      </div>
    </div>
  );
}
