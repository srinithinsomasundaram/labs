import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { SocketProvider } from "@/components/socket-provider";
import { NewYearBanner } from "@/components/new-year-banner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Conversion Engineering Lab",
  description: "AI-powered conversion optimization for your landing pages",
  icons: {
    icon: "/generated-image%20(2).png",
    shortcut: "/generated-image%20(2).png",
    apple: "/generated-image%20(2).png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <SocketProvider>
            <NewYearBanner />
            {children}
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
