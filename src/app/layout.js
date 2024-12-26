import localFont from "next/font/local";
import "./globals.css";
import Navbar from "@/components/navbar";
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/context/AuthContext";
import Link from "next/link";
import Image from "next/image";
import { Code } from "lucide-react";
import { Pin } from "lucide-react";
import { User } from "lucide-react";
import { BriefcaseBusiness } from "lucide-react";
import { ToastProvider } from "@/components/ui/toast";
import { ToastViewport } from "@/components/ui/toast";
import Footer from "./footer";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Head } from 'next/head';
import { useState, useEffect } from 'react';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "junera 🌳",
  description: "junera, a new job search experience",
};

export default function RootLayout({ children }) {
  const [theme, setTheme] = useState('system');

  useEffect(() => {
    // Update theme-color meta tag when theme changes
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      const isDark = document.documentElement.classList.contains('dark');
      metaThemeColor.setAttribute('content', isDark ? '#000000' : '#ffffff');
    }

    // Watch for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isDark = document.documentElement.classList.contains('dark');
          metaThemeColor.setAttribute('content', isDark ? '#000000' : '#ffffff');
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <html lang="en">

      <link rel="manifest" href="/manifest.json" />
      <meta name="theme-color" content="#ffffff" />
      <meta name="description" content="Your App Description" />
      <link rel="apple-touch-icon" href="/icon-192x192.png" />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-w-full root`}
      >
        <ToastProvider>
          <AuthProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <Navbar />
              <main className="mt-24">
                {children}
              </main>
              <ToastViewport />
              <Footer />
            </ThemeProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}