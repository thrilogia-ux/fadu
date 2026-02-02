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
          <h3 className="mb-4 text-center text-sm font-semibold text-[#1d1d1b]">
            Medios de Pago
          </h3>
          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6">
            {/* Mercado Pago */}
            <div className="h-8 w-auto flex items-center" title="Mercado Pago">
              <svg viewBox="0 0 120 32" className="h-6 w-auto" fill="none">
                <rect width="120" height="32" rx="4" fill="#00B1EA"/>
                <path d="M20 8c-3.3 0-6 2.7-6 6v4c0 3.3 2.7 6 6 6s6-2.7 6-6v-4c0-3.3-2.7-6-6-6zm2 10c0 1.1-.9 2-2 2s-2-.9-2-2v-4c0-1.1.9-2 2-2s2 .9 2 2v4z" fill="white"/>
                <text x="32" y="21" fill="white" fontSize="12" fontWeight="600" fontFamily="Arial">mercadopago</text>
              </svg>
            </div>
            
            {/* Visa */}
            <div className="h-8 w-auto flex items-center" title="Visa">
              <svg viewBox="0 0 48 32" className="h-7 w-auto">
                <rect width="48" height="32" rx="4" fill="#1A1F71"/>
                <path d="M19.5 21h-2.7l1.7-10.5h2.7L19.5 21zm11.2-10.2c-.5-.2-1.3-.4-2.4-.4-2.6 0-4.5 1.4-4.5 3.4 0 1.5 1.3 2.3 2.3 2.8 1 .5 1.4.8 1.4 1.3 0 .7-.8 1-1.6 1-.9 0-1.8-.2-2.7-.6l-.4-.2-.4 2.5c.7.3 2 .6 3.3.6 2.8 0 4.6-1.4 4.6-3.5 0-1.2-.7-2.1-2.2-2.8-.9-.5-1.5-.8-1.5-1.3 0-.4.5-.9 1.5-.9.9 0 1.5.2 2 .4l.2.1.4-2.4zm6.8-.3h-2c-.6 0-1.1.2-1.4.8l-4 9.7h2.8l.6-1.6h3.4l.3 1.6h2.5l-2.2-10.5zm-3.3 6.8l1-3c0-.1.2-.7.4-1.1l.2 1 .6 3.1h-2.2zM15.5 10.5l-2.6 7.2-.3-1.4c-.5-1.6-2-3.3-3.6-4.2l2.4 9h2.8l4.2-10.5h-2.9z" fill="white"/>
                <path d="M10.3 10.5H6l-.1.3c3.3.9 5.5 2.9 6.4 5.4l-.9-4.7c-.2-.7-.7-.9-1.1-1z" fill="#F9A533"/>
              </svg>
            </div>
            
            {/* Mastercard */}
            <div className="h-8 w-auto flex items-center" title="Mastercard">
              <svg viewBox="0 0 48 32" className="h-7 w-auto">
                <rect width="48" height="32" rx="4" fill="#fff" stroke="#ddd"/>
                <circle cx="18" cy="16" r="8" fill="#EB001B"/>
                <circle cx="30" cy="16" r="8" fill="#F79E1B"/>
                <path d="M24 10.3c1.8 1.4 3 3.5 3 5.7s-1.2 4.3-3 5.7c-1.8-1.4-3-3.5-3-5.7s1.2-4.3 3-5.7z" fill="#FF5F00"/>
              </svg>
            </div>
            
            {/* American Express */}
            <div className="h-8 w-auto flex items-center" title="American Express">
              <svg viewBox="0 0 48 32" className="h-7 w-auto">
                <rect width="48" height="32" rx="4" fill="#006FCF"/>
                <path d="M10 14l-2 5h2.5l.3-1h1.4l.3 1H15l-2-5h-3zm1.5 1.2l.4 1.3h-.8l.4-1.3zM16 14v5h2v-2l1.5 2H22l-2-2.5 2-2.5h-2.5L18 16v-2h-2zm6 0v5h4.5v-1.2H24v-.8h2.5v-1.2H24v-.6h2.5V14H22zm9.8 0l-1.3 2-1.3-2H27l2 2.5-2 2.5h2.2l1.3-2 1.3 2H34l-2-2.5 2-2.5h-2.2z" fill="white"/>
              </svg>
            </div>
            
            {/* Diners Club */}
            <div className="h-8 w-auto flex items-center" title="Diners Club">
              <svg viewBox="0 0 48 32" className="h-7 w-auto">
                <rect width="48" height="32" rx="4" fill="#fff" stroke="#ddd"/>
                <circle cx="24" cy="16" r="10" fill="none" stroke="#004C97" strokeWidth="2"/>
                <path d="M18 12v8c0 0 2-2 6-2s6 2 6 2v-8" fill="none" stroke="#004C97" strokeWidth="1.5"/>
                <text x="24" y="18" textAnchor="middle" fill="#004C97" fontSize="5" fontWeight="bold">DINERS</text>
              </svg>
            </div>
            
            {/* Cabal */}
            <div className="h-8 w-auto flex items-center" title="Cabal">
              <svg viewBox="0 0 48 32" className="h-7 w-auto">
                <rect width="48" height="32" rx="4" fill="#00529B"/>
                <text x="24" y="19" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">CABAL</text>
              </svg>
            </div>
            
            {/* Naranja */}
            <div className="h-8 w-auto flex items-center" title="Naranja">
              <svg viewBox="0 0 48 32" className="h-7 w-auto">
                <rect width="48" height="32" rx="4" fill="#FF6600"/>
                <text x="24" y="19" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">NARANJA</text>
              </svg>
            </div>
            
            {/* Maestro */}
            <div className="h-8 w-auto flex items-center" title="Maestro">
              <svg viewBox="0 0 48 32" className="h-7 w-auto">
                <rect width="48" height="32" rx="4" fill="#fff" stroke="#ddd"/>
                <circle cx="18" cy="16" r="7" fill="#0099DF"/>
                <circle cx="30" cy="16" r="7" fill="#EB001B"/>
                <path d="M24 10.5c1.5 1.3 2.5 3.2 2.5 5.5s-1 4.2-2.5 5.5c-1.5-1.3-2.5-3.2-2.5-5.5s1-4.2 2.5-5.5z" fill="#6C6BBD"/>
              </svg>
            </div>
            
            {/* Banelco / Link */}
            <div className="h-8 w-auto flex items-center" title="Link / Banelco">
              <svg viewBox="0 0 48 32" className="h-7 w-auto">
                <rect width="48" height="32" rx="4" fill="#00A859"/>
                <text x="24" y="19" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">LINK</text>
              </svg>
            </div>
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
