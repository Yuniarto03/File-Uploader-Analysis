
import type { Metadata } from 'next';
import { Roboto, Orbitron } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

const roboto = Roboto({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-roboto',
});

const orbitron = Orbitron({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-orbitron',
});

export const metadata: Metadata = {
  title: 'masyunAInalysis - Quantum Data Analysis',
  description: 'Quantum MasYunAI Insights Analytics. Analyze and visualize your data with AI-powered insights.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${roboto.variable} ${orbitron.variable} font-sans antialiased grid-bg`}>
        <main className="container mx-auto py-8 px-4 min-h-screen">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
