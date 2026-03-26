"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { TopBannerMarquee } from "@/components/TopBannerMarquee";

interface Category {
  id: string;
  name: string;
  slug: string;
}

const ALLOWED_CATEGORY_SLUGS = ["iluminacion", "escritorio", "decoracion", "diseno", "accesorios"];

const tapIcon =
  "inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[#1d1d1b] transition hover:bg-black/5 active:bg-black/10";

export function Header({ categories }: { categories: Category[] }) {
  const safeCategories = Array.isArray(categories) ? categories : [];
  const curated = safeCategories
    .filter((c) => ALLOWED_CATEGORY_SLUGS.includes(c.slug))
    .sort((a, b) => ALLOWED_CATEGORY_SLUGS.indexOf(a.slug) - ALLOWED_CATEGORY_SLUGS.indexOf(b.slug));
  /* Sin coincidencias con la lista fija (slugs distintos en producción): usar todas las categorías recibidas */
  const menuCategories =
    curated.length > 0 ? curated : [...safeCategories].sort((a, b) => a.name.localeCompare(b.name, "es"));
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
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

  useEffect(() => {
    setShowMobileMenu(false);
    setShowMobileSearch(false);
    setShowCategoriesMenu(false);
    setShowAccountMenu(false);
  }, [pathname]);

  useEffect(() => {
    if (!showMobileMenu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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
        className="min-h-[44px] flex-1 rounded-xl border border-black/15 bg-gray-50 px-4 py-3 text-base outline-none transition focus:border-[#0f3bff] focus:bg-white focus:ring-2 focus:ring-[#0f3bff]/25 sm:text-sm"
        autoFocus={showMobileSearch}
      />
      <button
        type="submit"
        className="flex h-12 min-w-[48px] flex-shrink-0 items-center justify-center rounded-xl bg-[#0f3bff] text-white transition hover:bg-[#0d32cc] active:bg-[#0a28a8]"
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
      <div className="bg-[#0f3bff] px-4 py-2 text-sm font-medium text-white">
        <TopBannerMarquee />
      </div>

      {/* Header principal */}
      <div className="mx-auto max-w-7xl px-4">
        {/* Fila: Logo, Búsqueda (desktop), Acciones */}
        <div className="flex items-center gap-3 py-3 md:gap-5 md:py-4">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0" onClick={closeMenus}>
            <Image
              src="/fadustore2.svg"
              alt="Fadu.store"
              width={240}
              height={48}
              priority
              className="h-14 w-auto md:h-16 md:max-w-[300px]"
            />
          </Link>

          {/* Búsqueda - Desktop (un poco más corta para compensar logo grande) */}
          <form onSubmit={handleSearch} className="hidden min-w-0 flex-1 max-w-md md:flex lg:max-w-lg">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar productos, marcas..."
              className="min-h-[44px] w-full rounded-xl border border-black/15 bg-gray-50 px-4 py-2.5 text-base outline-none transition focus:border-[#0f3bff] focus:bg-white focus:ring-2 focus:ring-[#0f3bff]/25 sm:text-sm"
            />
            <button
              type="submit"
              className="ml-2 flex h-10 min-w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#0f3bff] text-white transition hover:bg-[#0d32cc] active:bg-[#0a28a8]"
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
            className={`relative ${tapIcon}`}
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
            type="button"
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className={`${tapIcon} md:hidden`}
            aria-label="Buscar"
            aria-expanded={showMobileSearch}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {/* Mobile: menú hamburguesa */}
          <button
            type="button"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className={`${tapIcon} md:hidden`}
            aria-label={showMobileMenu ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={showMobileMenu}
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
              type="button"
              onClick={() => setShowAccountMenu(!showAccountMenu)}
              className="flex min-h-[44px] items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-black/5 active:bg-black/10"
              aria-expanded={showAccountMenu}
              aria-haspopup="true"
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
                    <button
                      type="button"
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="block w-full px-4 py-2 text-left text-sm hover:bg-black/5"
                    >
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
              type="button"
              onClick={() => setShowCategoriesMenu(!showCategoriesMenu)}
              className="flex min-h-[40px] items-center gap-1 rounded-md px-1 font-medium text-[#0f3bff] hover:underline hover:bg-[#0f3bff]/5"
              aria-expanded={showCategoriesMenu}
              aria-haspopup="true"
            >
              Categorías
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showCategoriesMenu && (
              <div className="absolute left-0 mt-2 w-56 rounded-xl border border-black/10 bg-white py-2 shadow-xl">
                {menuCategories.map((cat) => (
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
        </nav>
      </div>

      {/* Menú lateral mobile */}
      {showMobileMenu && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={closeMenus}
          aria-hidden="true"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
            className="h-full w-[300px] max-w-[90vw] bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col p-4">
              <div className="mb-4 flex items-center justify-between gap-2 border-b border-black/10 pb-3">
                <span className="text-sm font-semibold text-[#1d1d1b]">Menú</span>
                <button
                  type="button"
                  onClick={closeMenus}
                  className={`${tapIcon} text-gray-600`}
                  aria-label="Cerrar menú"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
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
                    <button
                      type="button"
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="block py-2 text-left text-sm text-red-600 hover:underline"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Link
                      href="/login"
                      className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-gray-100 px-4 text-sm font-medium transition hover:bg-gray-200 active:bg-gray-300"
                      onClick={closeMenus}
                    >
                      Entrar
                    </Link>
                    <Link
                      href="/register"
                      className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#0f3bff] px-4 text-sm font-medium text-white transition hover:bg-[#0d32cc] active:bg-[#0a28a8]"
                      onClick={closeMenus}
                    >
                      Registrarse
                    </Link>
                  </div>
                )}
              </div>

              {/* Categorías - solo links */}
              <div className="border-b border-black/10 py-4">
                <p className="mb-2 text-xs font-medium text-gray-500">Categorías</p>
                <ul className="flex flex-col gap-1">
                  {menuCategories.map((cat) => (
                    <li key={cat.id}>
                      <Link
                        href={`/categoria/${cat.slug}`}
                        className="flex min-h-[44px] items-center rounded-lg px-3 py-2 text-sm font-medium text-[#1d1d1b] transition hover:bg-gray-100 active:bg-gray-200"
                        onClick={closeMenus}
                      >
                        {cat.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Links */}
              <div className="pt-4" />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
