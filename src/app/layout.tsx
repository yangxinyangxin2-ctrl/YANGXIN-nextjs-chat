import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// create Google Fonts for the project
const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Chatbot',
  description: 'AI Chat Application',
};

// Root Layout, All pages will be wrapped in this layout
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
