import type { Metadata } from "next";
import { DM_Sans, IBM_Plex_Sans } from "next/font/google";
import Providers from "@/components/shared/providers";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MultiCRM — Multi-Tenant CRM Platform",
  description: "A production-grade, multi-tenant isolated SaaS CRM system for managing contacts, leads, deals, and revenue pipelines.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${ibmPlexSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-[#0D0D0F] text-[#E8E4DD] flex flex-col grain-overlay" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
