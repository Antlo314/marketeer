import "./globals.css";
import React from "react";
import { Inter, Space_Grotesk } from "next/font/google";
import { AuthProvider } from "@/lib/firebaseContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata = {
  title: "Marketeer - Simple Reselling Photo Studio & Listing Companion",
  description: "Improve product photos, removal backgrounds, suggest pricing, and cross-list with ease.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="font-sans bg-slate-950 text-slate-100 min-h-screen">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
