import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SessionProvider } from "@/components/SessionProvider";
import { CartProvider } from "@/lib/cart-context";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ToastProvider } from "@/components/ToastProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

import { STORE_NAME, STORE_TAGLINE } from "@/lib/brand";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.ubafadu.shop"),
  title: `${STORE_NAME} — ${STORE_TAGLINE}`,
  description: "E-commerce de productos de diseño, arquitectura e iluminación. Retiro en FADU.",
  icons: {
    icon: "/ubafadushop-logo.svg",
    apple: "/ubafadushop-logo.svg",
  },
  openGraph: {
    title: `${STORE_NAME} — ${STORE_TAGLINE}`,
    description: "Productos de diseño y arquitectura. Retirá tu compra en el Pickup Point FADU.",
    siteName: STORE_NAME,
    locale: "es_AR",
    type: "website",
    images: [{ url: "/ubafadushop-logo.svg", alt: STORE_NAME }],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover" as const,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} font-sans antialiased`}>
        <SessionProvider>
          <CartProvider>
            <div className="min-h-screen overflow-x-hidden bg-[#fafafa] text-[#1d1d1b]">
              {children}
            </div>
            <WhatsAppButton />
            <ToastProvider />
          </CartProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
