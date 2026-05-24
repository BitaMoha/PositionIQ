import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import Sidebar from "@/app/components/Sidebar";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "PositionIQ",
  description: "Adyen competitive intelligence for Stripe's PMM team",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body className="bg-white font-[var(--font-dm-sans)] antialiased">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="ml-60 flex min-h-screen flex-1 flex-col bg-white">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
