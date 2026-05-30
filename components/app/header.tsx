'use client';

import React from 'react';
import { useSession, signOut } from 'next-auth/react';
import TenantBadge from './tenant-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User, Settings, Hexagon, Bell } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  const { data: session } = useSession();

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  const user = session?.user as any;
  const fullName = user?.fullName || 'User Profile';
  const email = user?.email || '';
  const initial = fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase();

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between bg-[#08080A] px-6 shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
        {/* Left side: Brand Logo */}
        <div className="flex items-center gap-5">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="relative">
              <Hexagon className="h-7 w-7 text-[#C95A32] transition-transform duration-300 group-hover:rotate-[30deg]" strokeWidth={1.5} />
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-[#C95A32]">M</span>
            </div>
            <span className="font-heading font-bold text-[#F4EFE6] text-[15px] tracking-tight leading-none">
              Multi<span className="text-[#C95A32]">CRM</span>
            </span>
          </Link>
          <div className="hidden md:block h-5 w-px bg-[#1E1E26]" />
          <TenantBadge />
        </div>

        {/* Right side: Notifications + User navigation dropdown */}
        <div className="flex items-center gap-3">
          {/* Notification bell placeholder */}
          <button className="relative p-2 rounded-lg text-[#AFA897]/50 hover:text-[#F4EFE6] hover:bg-[#16161C] transition-colors duration-200 cursor-pointer">
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-[#C95A32] rounded-full border-2 border-[#08080A]" />
          </button>

          <div className="h-5 w-px bg-[#1E1E26]" />

          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none cursor-pointer">
              <div className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-[#F4EFE6] tracking-wide">{fullName}</span>
                  <span className="text-[10px] text-[#AFA897]/50 leading-none">{email}</span>
                </div>
                <Avatar className="h-8 w-8 border border-[#C95A32]/20 bg-[#C95A32]/5 text-[#C95A32] font-semibold ring-2 ring-[#C95A32]/10">
                  <AvatarImage src="" />
                  <AvatarFallback className="text-[10px] bg-[#C95A32]/10 text-[#C95A32] font-bold">
                    {initial}
                  </AvatarFallback>
                </Avatar>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-[#15151A] border-[#1E1E26] text-[#F4EFE6]">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold text-[#F4EFE6] leading-none">{fullName}</p>
                  <p className="text-xs text-[#AFA897]/50 leading-none">{email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#1E1E26]" />
              <DropdownMenuItem className="hover:bg-[#1C1C24] focus:bg-[#1C1C24] cursor-pointer p-0">
                <Link href="/dashboard/companies" className="flex w-full items-center gap-2 px-2 py-1.5">
                  <Building2Icon className="h-4 w-4 text-[#AFA897]/50" />
                  <span>Company Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-[#1C1C24] focus:bg-[#1C1C24] cursor-pointer p-0">
                <Link href="/dashboard/users" className="flex w-full items-center gap-2 px-2 py-1.5">
                  <User className="h-4 w-4 text-[#AFA897]/50" />
                  <span>User Management</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#1E1E26]" />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-[#C84630] focus:text-[#C84630] hover:bg-[#1C1C24] focus:bg-[#1C1C24] cursor-pointer flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <div className="skeuo-line-horizontal sticky top-14 z-40 w-full" />
    </>
  );
}

function Building2Icon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18" />
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
      <path d="M10 6h4" />
      <path d="M10 10h4" />
      <path d="M10 14h4" />
      <path d="M10 18h4" />
    </svg>
  );
}
