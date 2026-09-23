import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AK Saarthi AI — Financial Advisor Operating System",
  description:
    "AI-powered financial advisor platform for managing clients, policies, investments, commissions, and business analytics. Built for real financial advisors.",
  keywords: [
    "financial advisor",
    "insurance management",
    "investment portfolio",
    "CRM",
    "AI assistant",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
