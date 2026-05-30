import React from 'react';
import { redirect } from 'next/navigation';
import { SessionProvider } from 'next-auth/react';
import { auth } from '@/auth';
import Header from '@/components/app/header';
import AppSidebar from '@/components/app/sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // If there is no active session, block access and redirect to login
  if (!session) {
    redirect('/login');
  }

  return (
    <SessionProvider session={session}>
      <div className="flex flex-col min-h-screen bg-[#0D0D0F] text-[#E8E4DD] overflow-hidden">
        {/* Top Header Navigation */}
        <Header />
        
        {/* Main Dashboard Panel */}
        <div className="flex flex-1 overflow-hidden">
          {/* Collapsible Left Sidebar */}
          <AppSidebar />
          
          {/* Main Content Area with mesh gradient */}
          <main className="flex-1 overflow-y-auto mesh-bg px-6 py-8 md:px-8">
            <div className="max-w-7xl mx-auto w-full space-y-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SessionProvider>
  );
}
