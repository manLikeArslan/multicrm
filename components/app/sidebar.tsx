'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Users,
  Target,
  DollarSign,
  History,
  CheckSquare,
  FileSpreadsheet,
  CreditCard,
  PhoneCall,
  Shield,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Hexagon,
  LogOut,
} from 'lucide-react';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  roles: ('admin' | 'manager' | 'sales_rep')[];
  group: 'crm' | 'finance' | 'settings';
}

const sidebarItems: SidebarItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'sales_rep'], group: 'crm' },
  { name: 'Contacts', href: '/dashboard/contacts', icon: Users, roles: ['admin', 'manager', 'sales_rep'], group: 'crm' },
  { name: 'Leads', href: '/dashboard/leads', icon: Target, roles: ['admin', 'manager', 'sales_rep'], group: 'crm' },
  { name: 'Deals', href: '/dashboard/deals', icon: DollarSign, roles: ['admin', 'manager', 'sales_rep'], group: 'crm' },
  { name: 'Activities', href: '/dashboard/activities', icon: History, roles: ['admin', 'manager', 'sales_rep'], group: 'crm' },
  { name: 'Tasks', href: '/dashboard/tasks', icon: CheckSquare, roles: ['admin', 'manager', 'sales_rep'], group: 'crm' },
  { name: 'Follow-ups', href: '/dashboard/followups', icon: PhoneCall, roles: ['admin', 'manager', 'sales_rep'], group: 'crm' },
  { name: 'Invoices', href: '/dashboard/invoices', icon: FileSpreadsheet, roles: ['admin', 'manager'], group: 'finance' },
  { name: 'Payments', href: '/dashboard/payments', icon: CreditCard, roles: ['admin', 'manager'], group: 'finance' },
  { name: 'Plans & Billing', href: '/dashboard/plans', icon: Sparkles, roles: ['admin'], group: 'settings' },
  { name: 'Company Settings', href: '/dashboard/companies', icon: Settings, roles: ['admin'], group: 'settings' },
  { name: 'Team Members', href: '/dashboard/users', icon: Shield, roles: ['admin'], group: 'settings' },
];

const groupLabels: Record<string, string> = {
  crm: 'Pipeline',
  finance: 'Finance',
  settings: 'Settings',
};

export default function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const user = session?.user as any;
  const roleName = (user?.roleName?.toLowerCase() || 'sales_rep') as 'admin' | 'manager' | 'sales_rep';

  // Filter items based on user role
  const allowedItems = sidebarItems.filter(item => item.roles.includes(roleName));

  // Group items
  const groupedItems = allowedItems.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, SidebarItem[]>);

  const groups = Object.entries(groupedItems);

  return (
    <aside
      className={`h-full border-r border-[#1E1E26] bg-[#050506] text-[#AFA897] flex flex-col justify-between transition-all duration-300 ease-in-out relative ${
        isCollapsed ? 'w-[4.5rem]' : 'w-[15.5rem]'
      }`}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-5 -right-3 skeuo-btn-rust text-[#FAF7F2] rounded-full p-1 border border-[#822F11] cursor-pointer hidden md:flex items-center justify-center z-50 hover:scale-110 active:scale-90"
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" strokeWidth={2.5} /> : <ChevronLeft className="h-3 w-3" strokeWidth={2.5} />}
      </button>

      {/* Nav List */}
      <div className="flex-1 py-5 px-3 space-y-5 overflow-y-auto">
        {groups.map(([group, items], groupIndex) => (
          <div key={group}>
            {/* Group label */}
            {!isCollapsed && (
              <div className="px-3 mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#AFA897]/50">
                  {groupLabels[group] || group}
                </span>
              </div>
            )}
            {isCollapsed && groupIndex > 0 && (
              <div className="mx-3 mb-3 border-t border-[#1E1E26]" />
            )}

            <div className="space-y-0.5">
              {items.map(item => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    title={isCollapsed ? item.name : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-[13px] transition-all duration-200 group relative ${
                      isActive
                        ? 'neumorphic-inset text-[#C95A32]'
                        : 'hover:bg-[#16161C] text-[#AFA897] hover:text-[#F4EFE6]'
                    }`}
                  >
                    {/* Rust left accent bar for active */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#C95A32] rounded-r-full shadow-[0_0_8px_rgba(201,90,50,0.6)]" />
                    )}
                    <Icon className={`h-[18px] w-[18px] flex-shrink-0 transition-colors duration-200 ${
                      isActive ? 'text-[#C95A32]' : 'text-[#AFA897]/50 group-hover:text-[#AFA897]'
                    }`} />
                    <span className={`transition-all duration-200 overflow-hidden whitespace-nowrap ${
                      isCollapsed ? 'md:hidden opacity-0 w-0' : 'opacity-100 w-auto'
                    }`}>
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-[#1E1E26]/60 bg-[#050506]/50 flex flex-col gap-2">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className={`flex items-center gap-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 cursor-pointer text-[#C84630] hover:bg-red-950/20 hover:text-red-400 w-full ${
            isCollapsed ? 'justify-center px-0' : 'px-3 justify-start'
          }`}
          title={isCollapsed ? "Log out" : undefined}
        >
          <LogOut className="h-[18px] w-[18px] flex-shrink-0" />
          {!isCollapsed && <span>Log out</span>}
        </button>

        {!isCollapsed && (
          <div className="flex items-center justify-center gap-2 py-1 border-t border-[#1E1E26]/30 mt-1">
            <Hexagon className="h-3.5 w-3.5 text-[#C95A32]/40" />
            <span className="text-[10px] text-[#AFA897]/50 font-medium tracking-wider select-none">
              MULTICRM v1.0
            </span>
          </div>
        )}
        {isCollapsed && (
          <div className="flex justify-center border-t border-[#1E1E26]/30 pt-2 mt-1">
            <Hexagon className="h-3.5 w-3.5 text-[#C95A32]/40" />
          </div>
        )}
      </div>
    </aside>
  );
}
