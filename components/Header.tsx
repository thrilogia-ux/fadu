"use client";

import { useState } from "react";
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

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/buscar?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-black/8 bg-white shadow-sm">
      {/* Barra superior */}
      <div className="bg-[#0f3bff] px-4 py-2 text-center text-sm font-medium text-white">
        Retiras tu compra en el Pickup Point en FADU
      </div>

      {/* Header principal */}
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-center gap-6 py-3">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/fadustore.svg"
              alt="Fadu.store"
              width={140}
              height={28}
              priority
              className="h-8 w-auto"
            />
          </Link>

          {/* Búsqueda */}
          <form onSubmit={handleSearch} className="flex flex-1 max-w-xl">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar productos, marcas..."
              className="w-full rounded-l-md border border-r-0 border-black/20 px-4 py-2.5 text-sm outline-none focus:border-[#0f3bff] focus:ring-1 focus:ring-[#0f3bff]"
            />
            <button
              type="submit"
              className="rounded-r-md bg-[#0f3bff] px-5 text-white hover:bg-[#0d32cc]"
              aria-label="Buscar"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>

          {/* Cuenta */}
          <div className="relative">
            <button
              onClick={() => setShowAccountMenu(!showAccountMenu)}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-black/5"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="hidden md:block">
                {session?.user?.name || "Mi cuenta"}
              </span>
            </button>
            {showAccountMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg border border-black/10 bg-white py-2 shadow-xl">
                {session ? (
                  <>
                    <Link href="/cuenta" className="block px-4 py-2 text-sm hover:bg-black/5">
                      Mi perfil
                    </Link>
                    <Link href="/cuenta/favoritos" className="block px-4 py-2 text-sm hover:bg-black/5">
                      Favoritos
                    </Link>
                    <Link href="/cuenta/pedidos" className="block px-4 py-2 text-sm hover:bg-black/5">
                      Mis pedidos
                    </Link>
                    <hr className="my-2 border-black/10" />
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="block w-full px-4 py-2 text-left text-sm hover:bg-black/5"
                    >
                      Cerrar sesión
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="block px-4 py-2 text-sm hover:bg-black/5">
                      Iniciar sesión
                    </Link>
                    <Link href="/register" className="block px-4 py-2 text-sm hover:bg-black/5">
                      Registrarse
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Carrito */}
          <Link
            href="/carrito"
            className="relative flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-black/5"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#0f3bff] text-xs text-white">
                {itemCount}
              </span>
            )}
          </Link>
        </div>

        {/* Navegación secundaria */}
        <nav className="flex items-center gap-6 border-t border-black/8 py-2 text-sm">
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
              <div className="absolute left-0 mt-2 w-56 rounded-lg border border-black/10 bg-white py-2 shadow-xl">
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
          <Link href="/ofertas" className="hover:underline">
            Ofertas
          </Link>
          <Link href="/cupones" className="hover:underline">
            Cupones
          </Link>
          <Link href="/retiro" className="hover:underline">
            Retiro en FADU
          </Link>
        </nav>
      </div>
    </header>
  );
}
