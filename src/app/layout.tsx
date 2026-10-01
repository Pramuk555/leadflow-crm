import type { Metadata, Viewport } from 'next';
import { Inter, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { InstallPrompt } from '@/components/pwa/install-prompt';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });

export const metadata: Metadata = {
  title: 'LeadFlow CRM',
  description: 'Lead tracking for web dev agencies',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'LeadFlow',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  themeColor: '#2563eb',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${geistMono.variable} font-sans antialiased min-h-screen bg-[#050810]`}>
        {children}
        <InstallPrompt />
        <Toaster position="top-right" theme="dark" />
      </body>
    </html>
  );
}
