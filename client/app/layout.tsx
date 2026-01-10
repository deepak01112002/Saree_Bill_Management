import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Get base URL from environment or use default
const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace('/api', '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
};

export const metadata: Metadata = {
  title: "Saree Retail Management System",
  description: "Modern billing and inventory management for saree retail outlets",
  // Next.js App Router automatically uses app/icon.png for favicon
  // and app/opengraph-image.png for OG images, so no explicit icons needed
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
  openGraph: {
    title: "La Patola - Saree Retail Management System",
    description: "Modern billing and inventory management for saree retail outlets - The Art of Royal Weaves",
    type: "website",
    siteName: "La Patola",
    // Next.js automatically uses app/opengraph-image.png, but we can reference it explicitly
    images: [
      {
        url: `${getBaseUrl()}/opengraph-image.png`,
        width: 1280,
        height: 1280,
        alt: 'La Patola - The Art of Royal Weaves',
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "La Patola - Saree Retail Management System",
    description: "Modern billing and inventory management for saree retail outlets - The Art of Royal Weaves",
    images: [`${getBaseUrl()}/opengraph-image.png`],
  },
  metadataBase: new URL(getBaseUrl()),
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
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#fff',
              color: '#333',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
