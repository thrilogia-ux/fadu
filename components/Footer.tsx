"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      // Aquí se integraría con un servicio de newsletter
      console.log("Suscribir:", email);
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer className="border-t border-black/8 bg-white">
      {/* Sección principal del footer */}
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Logo y Newsletter */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-6">
              <Image
                src="/fadustoregris.svg"
                alt="Fadu.store"
                width={140}
                height={26}
                className="h-7 w-auto opacity-90"
              />
            </Link>
            
            {/* Newsletter */}
            <div className="mt-4">
              <h3 className="mb-3 font-semibold text-[#1d1d1b]">
                Suscribite a nuestro Newsletter
              </h3>
              <p className="text-sm text-[#1d1d1b]/60 mb-3">
                Recibí novedades y ofertas exclusivas
              </p>
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Tu email"
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-[#0f3bff] focus:outline-none focus:ring-1 focus:ring-[#0f3bff]"
                  required
                />
                <button
                  type="submit"
                  className="rounded-lg bg-[#0f3bff] px-4 py-2 text-sm font-medium text-white hover:bg-[#0f3bff]/90 transition-colors"
                >
                  Enviar
                </button>
              </form>
              {subscribed && (
                <p className="mt-2 text-sm text-green-600">
                  ¡Gracias por suscribirte!
                </p>
              )}
            </div>
          </div>

          {/* Ayuda */}
          <div>
            <h3 className="mb-4 font-semibold text-[#1d1d1b]">Ayuda</h3>
            <ul className="space-y-2 text-sm text-[#1d1d1b]/70">
              <li>
                <Link href="/ayuda" className="hover:underline">
                  Preguntas frecuentes
                </Link>
              </li>
              <li>
                <Link href="/ayuda/comprar" className="hover:underline">
                  Cómo comprar
                </Link>
              </li>
              <li>
                <Link href="/ayuda/devoluciones" className="hover:underline">
                  Devoluciones
                </Link>
              </li>
            </ul>
          </div>

          {/* Información */}
          <div>
            <h3 className="mb-4 font-semibold text-[#1d1d1b]">Información</h3>
            <ul className="space-y-2 text-sm text-[#1d1d1b]/70">
              <li>
                <Link href="/medios-de-pago" className="hover:underline">
                  Medios de pago
                </Link>
              </li>
              <li>
                <Link href="/retiro" className="hover:underline">
                  Retiro en FADU
                </Link>
              </li>
              <li>
                <Link href="/terminos" className="hover:underline">
                  Términos y condiciones
                </Link>
              </li>
              <li>
                <Link href="/privacidad" className="hover:underline">
                  Privacidad
                </Link>
              </li>
            </ul>
          </div>

          {/* Redes */}
          <div>
            <h3 className="mb-4 font-semibold text-[#1d1d1b]">Seguinos</h3>
            <div className="flex gap-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1d1d1b]/70 hover:text-[#0f3bff]"
                aria-label="Instagram"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1d1d1b]/70 hover:text-[#0f3bff]"
                aria-label="Facebook"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Medios de Pago */}
        <div className="mt-10 pt-8 border-t border-black/8">
          <h3 className="mb-5 text-center text-sm font-semibold text-[#1d1d1b]">
            Medios de Pago
          </h3>
          <div className="flex flex-wrap justify-center items-center gap-3 md:gap-4">
            {/* Mercado Pago - Logo principal más grande */}
            <Image
              src="/tarjetas/mercadopago.png"
              alt="Mercado Pago"
              width={100}
              height={32}
              className="h-8 w-auto object-contain"
              unoptimized
            />
            
            {/* Tarjetas de crédito */}
            <Image
              src="/tarjetas/visa@2x.png"
              alt="Visa"
              width={50}
              height={32}
              className="h-7 w-auto object-contain"
              unoptimized
            />
            <Image
              src="/tarjetas/mastercard@2x.png"
              alt="Mastercard"
              width={50}
              height={32}
              className="h-7 w-auto object-contain"
              unoptimized
            />
            <Image
              src="/tarjetas/amex@2x.png"
              alt="American Express"
              width={50}
              height={32}
              className="h-7 w-auto object-contain"
              unoptimized
            />
            <Image
              src="/tarjetas/diners@2x.png"
              alt="Diners Club"
              width={50}
              height={32}
              className="h-7 w-auto object-contain"
              unoptimized
            />
            <Image
              src="/tarjetas/tarjeta-naranja@2x.png"
              alt="Tarjeta Naranja"
              width={50}
              height={32}
              className="h-7 w-auto object-contain"
              unoptimized
            />
            <Image
              src="/tarjetas/cabal@2x.png"
              alt="Cabal"
              width={50}
              height={32}
              className="h-7 w-auto object-contain"
              unoptimized
            />
            <Image
              src="/tarjetas/nativa@2x.png"
              alt="Nativa"
              width={50}
              height={32}
              className="h-7 w-auto object-contain"
              unoptimized
            />
            <Image
              src="/tarjetas/cencosud@2x.png"
              alt="Cencosud"
              width={50}
              height={32}
              className="h-7 w-auto object-contain"
              unoptimized
            />
            <Image
              src="/tarjetas/argencard@2x.png"
              alt="Argencard"
              width={50}
              height={32}
              className="h-7 w-auto object-contain"
              unoptimized
            />
            
            {/* Tarjetas de débito */}
            <Image
              src="/tarjetas/visadebit@2x.png"
              alt="Visa Débito"
              width={50}
              height={32}
              className="h-7 w-auto object-contain"
              unoptimized
            />
            <Image
              src="/tarjetas/maestro@2x.png"
              alt="Maestro"
              width={50}
              height={32}
              className="h-7 w-auto object-contain"
              unoptimized
            />
            <Image
              src="/tarjetas/cabaldebit@2x.png"
              alt="Cabal Débito"
              width={50}
              height={32}
              className="h-7 w-auto object-contain"
              unoptimized
            />
            
            {/* Redes de débito */}
            <Image
              src="/tarjetas/banelco@2x.png"
              alt="Banelco"
              width={50}
              height={32}
              className="h-7 w-auto object-contain"
              unoptimized
            />
            <Image
              src="/tarjetas/link@2x.png"
              alt="Link"
              width={50}
              height={32}
              className="h-7 w-auto object-contain"
              unoptimized
            />
            
            {/* Pagos en efectivo */}
            <Image
              src="/tarjetas/pagofacil@2x.png"
              alt="Pago Fácil"
              width={50}
              height={32}
              className="h-7 w-auto object-contain"
              unoptimized
            />
            <Image
              src="/tarjetas/rapipago@2x.png"
              alt="Rapipago"
              width={50}
              height={32}
              className="h-7 w-auto object-contain"
              unoptimized
            />
            <Image
              src="/tarjetas/provincianet@2x.png"
              alt="Provincia NET"
              width={50}
              height={32}
              className="h-7 w-auto object-contain"
              unoptimized
            />
          </div>
        </div>
      </div>

      {/* Copyright footer */}
      <div className="border-t border-black/8 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-center gap-2 text-sm text-[#1d1d1b]/60">
            <span>© 2026 FADU.Store — La tienda de FADU</span>
            <span className="hidden md:inline">|</span>
            <Image
              src="/Powered by OVNI.svg"
              alt="Powered by OVNI agency"
              width={120}
              height={18}
              className="h-4 w-auto opacity-70"
              unoptimized
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
