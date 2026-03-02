import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/contexts/WalletContext";
import { ThemeContextProvider } from "@/contexts/ThemeContext";
import LenisScroll from "@/components/Lenis";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kudos - Transparent Fund Management",
  description: "Blockchain-based grant and fund tracking system for student projects",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeContextProvider>
          <LenisScroll />
          <WalletProvider>
            {children}
          </WalletProvider>
        </ThemeContextProvider>
      </body>
    </html>
  );
}
