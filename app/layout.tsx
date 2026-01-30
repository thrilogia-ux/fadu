import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SessionProvider } from "@/components/SessionProvider";
import { CartProvider } from "@/lib/cart-context";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fadu.store — Diseño y arquitectura",
  description: "E-commerce de productos de diseño, arquitectura e iluminación.",
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
            <div className="min-h-screen bg-[#fafafa] text-[#1d1d1b]">
              {children}
            </div>
          </CartProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
