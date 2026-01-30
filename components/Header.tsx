"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";

interface Category {
  id: string;
  name: string;
  slug: string;
}

export function Header({ categories }: { categories: Category[] }) {
  const { data: session } = useSession();
  const router = useRouter();
  const { itemCount } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCategoriesMenu, setShowCategoriesMenu] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // Cerrar menú al hacer click fuera o cambiar ruta
  useEffect(() => {
    if (showMobileMenu) {
      const handleClose = () => setShowMobileMenu(false);
      document.body.style.overflow = "hidden";
      window.addEventListener("resize", handleClose);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("resize", handleClose);
      };
    }
  }, [showMobileMenu]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowMobileSearch(false);
      setShowMobileMenu(false);
      router.push(`/buscar?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  function closeMenus() {
    setShowMobileMenu(false);
    setShowMobileSearch(false);
    setShowCategoriesMenu(false);
    setShowAccountMenu(false);
  }

  const SearchForm = () => (
    <form onSubmit={handleSearch} className="flex w-full gap-1">
      <input
        type="search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Buscar productos..."
        className="flex-1 rounded-xl border border-black/15 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-[#0f3bff] focus:bg-white focus:ring-2 focus:ring-[#0f3bff]/20"
        autoFocus={showMobileSearch}
      />
      <button
        type="submit"
        className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#0f3bff] text-white transition hover:bg-[#0d32cc]"
        aria-label="Buscar"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
    </form>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-black/8 bg-white shadow-sm">
      {/* Barra superior */}
      <div className="bg-[#0f3bff] px-4 py-2 text-center text-sm font-medium text-white">
        Retiras tu compra en el Pickup Point en FADU
      </div>

      {/* Header principal */}
      <div className="mx-auto max-w-7xl px-4">
        {/* Fila: Logo, Búsqueda (desktop), Acciones */}
        <div className="flex items-center gap-3 py-3 md:gap-6">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0" onClick={closeMenus}>
            <Image
              src="/fadustore.svg"
              alt="Fadu.store"
              width={120}
              height={24}
              priority
              className="h-7 w-auto md:h-8 md:w-[140px]"
            />
          </Link>

          {/* Búsqueda - Desktop */}
          <form onSubmit={handleSearch} className="hidden flex-1 max-w-xl md:flex">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar productos, marcas..."
              className="w-full rounded-xl border border-black/15 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-[#0f3bff] focus:bg-white focus:ring-2 focus:ring-[#0f3bff]/20"
            />
            <button
              type="submit"
              className="ml-2 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#0f3bff] text-white transition hover:bg-[#0d32cc]"
              aria-label="Buscar"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>

          {/* Espaciador en mobile */}
          <div className="flex-1 md:hidden" />

          {/* Carrito - siempre visible */}
          <Link
            href="/carrito"
            className="relative flex items-center justify-center rounded-lg p-2 hover:bg-black/5"
            onClick={closeMenus}
            aria-label="Carrito"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#0f3bff] text-xs font-medium text-white">
                {itemCount}
              </span>
            )}
          </Link>

          {/* Mobile: botón búsqueda */}
          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="rounded-lg p-2 hover:bg-black/5 md:hidden"
            aria-label="Buscar"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {/* Mobile: menú hamburguesa */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="rounded-lg p-2 hover:bg-black/5 md:hidden"
            aria-label="Menú"
          >
            {showMobileMenu ? (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          {/* Desktop: Cuenta */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setShowAccountMenu(!showAccountMenu)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-black/5"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>{session?.user?.name || "Mi cuenta"}</span>
            </button>
            {showAccountMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-black/10 bg-white py-2 shadow-xl">
                {session ? (
                  <>
                    <Link href="/cuenta" className="block px-4 py-2 text-sm hover:bg-black/5" onClick={() => setShowAccountMenu(false)}>
                      Mi perfil
                    </Link>
                    <Link href="/cuenta/favoritos" className="block px-4 py-2 text-sm hover:bg-black/5" onClick={() => setShowAccountMenu(false)}>
                      Favoritos
                    </Link>
                    <Link href="/cuenta/pedidos" className="block px-4 py-2 text-sm hover:bg-black/5" onClick={() => setShowAccountMenu(false)}>
                      Mis pedidos
                    </Link>
                    <hr className="my-2 border-black/10" />
                    <button onClick={() => signOut({ callbackUrl: "/" })} className="block w-full px-4 py-2 text-left text-sm hover:bg-black/5">
                      Cerrar sesión
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="block px-4 py-2 text-sm hover:bg-black/5" onClick={() => setShowAccountMenu(false)}>
                      Iniciar sesión
                    </Link>
                    <Link href="/register" className="block px-4 py-2 text-sm hover:bg-black/5" onClick={() => setShowAccountMenu(false)}>
                      Registrarse
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Búsqueda expandida - Mobile */}
        {showMobileSearch && (
          <div className="border-t border-black/8 pb-3 pt-2 md:hidden">
            <SearchForm />
          </div>
        )}

        {/* Navegación - Solo desktop */}
        <nav className="hidden items-center gap-6 border-t border-black/8 py-2 text-sm md:flex">
          <div className="relative">
            <button
              onClick={() => setShowCategoriesMenu(!showCategoriesMenu)}
              className="flex items-center gap-1 font-medium text-[#0f3bff] hover:underline"
            >
              Categorías
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showCategoriesMenu && (
              <div className="absolute left-0 mt-2 w-56 rounded-xl border border-black/10 bg-white py-2 shadow-xl">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/categoria/${cat.slug}`}
                    className="block px-4 py-2 text-sm hover:bg-black/5"
                    onClick={() => setShowCategoriesMenu(false)}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Link href="/ofertas" className="hover:underline">Ofertas</Link>
          <Link href="/cupones" className="hover:underline">Cupones</Link>
          <Link href="/retiro" className="hover:underline">Retiro en FADU</Link>
        </nav>
      </div>

      {/* Menú lateral mobile */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={closeMenus} aria-hidden="true">
          <div
            className="h-full w-[280px] max-w-[85vw] bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col p-4">
              <div className="mb-4">
                <SearchForm />
              </div>

              {/* Cuenta */}
              <div className="border-b border-black/10 pb-4">
                <p className="mb-2 text-xs font-medium text-gray-500">Cuenta</p>
                {session ? (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[#1d1d1b]">{session.user?.name || session.user?.email}</p>
                    <Link href="/cuenta" className="block py-2 text-sm text-[#0f3bff]" onClick={closeMenus}>Mi perfil</Link>
                    <Link href="/cuenta/favoritos" className="block py-2 text-sm text-[#0f3bff]" onClick={closeMenus}>Favoritos</Link>
                    <Link href="/cuenta/pedidos" className="block py-2 text-sm text-[#0f3bff]" onClick={closeMenus}>Mis pedidos</Link>
                    <button onClick={() => signOut({ callbackUrl: "/" })} className="block py-2 text-left text-sm text-red-600">Cerrar sesión</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Link href="/login" className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium" onClick={closeMenus}>Entrar</Link>
                    <Link href="/register" className="rounded-lg bg-[#0f3bff] px-4 py-2 text-sm font-medium text-white" onClick={closeMenus}>Registrarse</Link>
                  </div>
                )}
              </div>

              {/* Categorías - solo links */}
              <div className="border-b border-black/10 py-4">
                <p className="mb-2 text-xs font-medium text-gray-500">Categorías</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/categoria/${cat.slug}`}
                      className="rounded-lg bg-gray-100 px-3 py-2 text-sm"
                      onClick={closeMenus}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Links */}
              <div className="space-y-2 pt-4">
                <Link href="/ofertas" className="block py-2 text-sm font-medium" onClick={closeMenus}>Ofertas</Link>
                <Link href="/cupones" className="block py-2 text-sm font-medium" onClick={closeMenus}>Cupones</Link>
                <Link href="/retiro" className="block py-2 text-sm font-medium" onClick={closeMenus}>Retiro en FADU</Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
