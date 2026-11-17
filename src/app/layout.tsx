import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// next/font downloads Inter at build time and serves it from our own site.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Momentum",
  description: "Turn an assignment brief into steps and work through them one at a time.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
