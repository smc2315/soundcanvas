import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SoundCanvas - Transform Audio into Visual Art",
  description: "Create stunning visual patterns from your audio files using FFT analysis and artistic rendering. Export, share, and discover amazing audio visualizations.",
  keywords: ["audio visualization", "FFT", "sound art", "music visualization", "audio analysis"],
  authors: [{ name: "SoundCanvas Team" }],
  creator: "SoundCanvas",
  publisher: "SoundCanvas",
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "SoundCanvas - Transform Audio into Visual Art",
    description: "Create stunning visual patterns from your audio files using FFT analysis and artistic rendering.",
    siteName: "SoundCanvas",
  },
  twitter: {
    card: "summary_large_image",
    title: "SoundCanvas - Transform Audio into Visual Art",
    description: "Create stunning visual patterns from your audio files using FFT analysis and artistic rendering.",
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
  },
  themeColor: "#0C0C0C",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
