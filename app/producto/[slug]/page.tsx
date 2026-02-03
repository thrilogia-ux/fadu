"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useCart } from "@/lib/cart-context";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  category: { name: string; slug: string };
  images: { id: string; url: string; order: number; isPrimary: boolean }[];
  videos: { id: string; url: string | null }[];
}

interface Question {
  id: string;
  question: string;
  answer: string | null;
  answeredAt: string | null;
  createdAt: string;
  user: { name: string | null };
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { name: string | null };
}

interface ReviewSummary {
  average: number;
  total: number;
  distribution: { stars: number; count: number }[];
}

type MediaItem = 
  | { type: "image"; id: string; url: string }
  | { type: "video"; id: string; url: string; embedUrl: string };

// Helper para convertir URL de YouTube/Vimeo a embed URL
function getVideoEmbedUrl(url: string): string {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?#]+)/);
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }
  // URL directa (mp4, etc)
  return url;
}

function getVideoThumbnail(url: string): string {
  // YouTube thumbnail
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?#]+)/);
  if (ytMatch) {
    return `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg`;
  }
  // Para Vimeo y otros, usamos un placeholder
  return "";
}

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { addItem } = useCart();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  
  // Favoritos
  const [isFavorite, setIsFavorite] = useState(false);
  const [loadingFav, setLoadingFav] = useState(false);
  
  // Combinar imágenes y videos en una sola galería
  const mediaItems = useMemo<MediaItem[]>(() => {
    if (!product) return [];
    const items: MediaItem[] = [];
    
    // Agregar imágenes
    product.images.forEach((img) => {
      items.push({ type: "image", id: img.id, url: img.url });
    });
    
    // Agregar videos
    product.videos.forEach((vid) => {
      if (vid.url) {
        items.push({
          type: "video",
          id: vid.id,
          url: vid.url,
          embedUrl: getVideoEmbedUrl(vid.url),
        });
      }
    });
    
    return items;
  }, [product]);
  
  // Preguntas
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [questionError, setQuestionError] = useState("");

  // Opiniones
  const initialReviewSummary: ReviewSummary = {
    average: 0,
    total: 0,
    distribution: [
      { stars: 5, count: 0 },
      { stars: 4, count: 0 },
      { stars: 3, count: 0 },
      { stars: 2, count: 0 },
      { stars: 1, count: 0 },
    ],
  };
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary>(initialReviewSummary);
  const [newRating, setNewRating] = useState(0);
  const [newReview, setNewReview] = useState("");
  const [loadingReview, setLoadingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/products/${params.slug}`).then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
      fetch(`/api/products/${params.slug}/questions`).then((r) => r.json()),
      fetch(`/api/products/${params.slug}/reviews`).then((r) => r.json()),
    ])
      .then(([productData, categoriesData, questionsData, reviewsData]) => {
        if (productData.error) {
          router.push("/");
          return;
        }
        setProduct(productData);
        setCategories(categoriesData);
        setQuestions(Array.isArray(questionsData) ? questionsData : []);
        setReviews(Array.isArray(reviewsData?.reviews) ? reviewsData.reviews : []);
        setReviewSummary(reviewsData?.summary || initialReviewSummary);
        
        // Verificar si está en favoritos
        if (productData.id) {
          fetch(`/api/favorites/check?productId=${productData.id}`)
            .then((r) => r.json())
            .then((data) => setIsFavorite(data.isFavorite));
        }
      })
      .finally(() => setLoading(false));
  }, [params.slug, router]);

  async function toggleFavorite() {
    if (!session) {
      router.push("/login?callbackUrl=" + encodeURIComponent(window.location.pathname));
      return;
    }
    
    setLoadingFav(true);
    try {
      if (isFavorite) {
        await fetch("/api/favorites", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product?.id }),
        });
        setIsFavorite(false);
      } else {
        await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product?.id }),
        });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
    setLoadingFav(false);
  }

  async function submitQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!session) {
      router.push("/login?callbackUrl=" + encodeURIComponent(window.location.pathname));
      return;
    }
    
    if (newQuestion.trim().length < 10) {
      setQuestionError("La pregunta debe tener al menos 10 caracteres");
      return;
    }
    
    setLoadingQuestion(true);
    setQuestionError("");
    
    try {
      const res = await fetch(`/api/products/${params.slug}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: newQuestion }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setQuestionError(data.error || "Error al enviar pregunta");
      } else {
        setQuestions([data, ...questions]);
        setNewQuestion("");
      }
    } catch {
      setQuestionError("Error de conexión");
    }
    setLoadingQuestion(false);
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!session) {
      router.push("/login?callbackUrl=" + encodeURIComponent(window.location.pathname));
      return;
    }

    if (newRating < 1 || newRating > 5) {
      setReviewError("Seleccioná una calificación de 1 a 5");
      return;
    }

    if (newReview.trim().length > 500) {
      setReviewError("El comentario no puede superar los 500 caracteres");
      return;
    }

    setLoadingReview(true);
    setReviewError("");

    try {
      const res = await fetch(`/api/products/${params.slug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: newRating, comment: newReview }),
      });

      const data = await res.json();
      if (!res.ok) {
        setReviewError(data.error || "Error al enviar opinión");
      } else {
        setNewRating(0);
        setNewReview("");
        const latest = await fetch(`/api/products/${params.slug}/reviews`).then((r) => r.json());
        setReviews(Array.isArray(latest?.reviews) ? latest.reviews : []);
        setReviewSummary(latest?.summary || initialReviewSummary);
      }
    } catch {
      setReviewError("Error de conexión");
    }
    setLoadingReview(false);
  }

  function renderStars(rating: number) {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={star <= rating ? "text-[#0f3bff]" : "text-gray-300"}>
            ★
          </span>
        ))}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  if (!product) return null;

  const compareAt = product.compareAtPrice;
  const hasDiscount = compareAt != null && compareAt > product.price;
  const discountPercent =
    hasDiscount && compareAt != null
      ? Math.round(((compareAt - product.price) / compareAt) * 100)
      : 0;

  function handleAddToCart() {
    addItem({
      productId: product!.id,
      name: product!.name,
      price: product!.price,
      quantity,
      image: product!.images[0]?.url,
      slug: product!.slug,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  }

  return (
    <>
      <Header categories={categories} />

      <main className="min-h-screen overflow-x-hidden bg-[#ededed] py-4 md:py-6">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          {/* Breadcrumbs - scroll horizontal en mobile */}
          <nav className="mb-4 flex items-center gap-2 overflow-x-auto pb-1 text-sm text-gray-600 md:overflow-visible">
            <Link href="/" className="flex-shrink-0 hover:text-[#0f3bff]">Inicio</Link>
            <span className="flex-shrink-0 text-gray-400">›</span>
            <Link href={`/categoria/${product.category.slug}`} className="flex-shrink-0 hover:text-[#0f3bff]">
              {product.category.name}
            </Link>
            <span className="flex-shrink-0 text-gray-400">›</span>
            <span className="min-w-0 truncate text-gray-500">{product.name}</span>
          </nav>

          <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
            {/* Columna izquierda: Galería */}
            <div className="min-w-0 lg:col-span-2">
              <div className="w-full min-w-0 overflow-hidden rounded-xl bg-white shadow-sm md:rounded-lg">
                <div className={`p-3 md:p-4 ${mediaItems.length > 1 ? "grid md:grid-cols-[80px_1fr] gap-4" : ""}`}>
                  {/* Thumbnails verticales - desktop */}
                  {mediaItems.length > 1 && (
                    <div className="hidden md:flex flex-col gap-2 max-h-[500px] overflow-y-auto">
                      {mediaItems.map((item, idx) => (
                        <button
                          key={item.id}
                          onClick={() => setSelectedMedia(idx)}
                          className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded border-2 transition ${
                            idx === selectedMedia
                              ? "border-[#0f3bff]"
                              : "border-transparent hover:border-gray-300"
                          }`}
                        >
                          {item.type === "image" ? (
                            <Image src={item.url} alt="" fill className="object-cover" sizes="64px" unoptimized />
                          ) : (
                            <div className="relative h-full w-full bg-gray-900">
                              {getVideoThumbnail(item.url) ? (
                                <Image 
                                  src={getVideoThumbnail(item.url)} 
                                  alt="" 
                                  fill 
                                  className="object-cover opacity-80" 
                                  sizes="64px"
                                  unoptimized 
                                />
                              ) : null}
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-2xl">▶️</span>
                              </div>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Media principal (imagen o video) - centrado y contenido */}
                  <div className="relative w-full overflow-hidden rounded-lg bg-gray-50">
                    <div className="relative aspect-square w-full">
                      {mediaItems[selectedMedia] ? (
                        mediaItems[selectedMedia].type === "image" ? (
                          <Image
                            src={mediaItems[selectedMedia].url}
                            alt={product.name}
                            fill
                            className="object-contain"
                            sizes="(max-width: 768px) 100vw, 60vw"
                            priority
                            unoptimized
                          />
                        ) : (
                          <iframe
                            src={(mediaItems[selectedMedia] as any).embedUrl}
                            className="absolute inset-0 h-full w-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        )
                      ) : (
                        <div className="flex h-full items-center justify-center text-gray-400">
                          Sin imagen
                        </div>
                      )}
                    </div>
                    
                    {/* Badge descuento (solo en imágenes) */}
                    {hasDiscount && mediaItems[selectedMedia]?.type === "image" && (
                      <span className="absolute left-2 top-2 rounded-full bg-green-500 px-2.5 py-1 text-xs font-bold text-white md:left-4 md:top-4 md:px-3 md:py-1 md:text-sm">
                        {discountPercent}% OFF
                      </span>
                    )}
                    
                    {/* Botón favorito - dentro del área visible */}
                    <button
                      onClick={toggleFavorite}
                      disabled={loadingFav}
                      className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition hover:scale-105 active:scale-95 md:right-4 md:top-4 md:h-10 md:w-10"
                    >
                      {isFavorite ? (
                        <span className="text-xl text-red-500">❤️</span>
                      ) : (
                        <span className="text-xl">🤍</span>
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Thumbnails móvil */}
                {mediaItems.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto p-4 pt-0 md:hidden">
                    {mediaItems.map((item, idx) => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedMedia(idx)}
                        className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded border-2 ${
                          idx === selectedMedia ? "border-[#0f3bff]" : "border-gray-200"
                        }`}
                      >
                        {item.type === "image" ? (
                          <Image src={item.url} alt="" fill className="object-cover" sizes="64px" unoptimized />
                        ) : (
                          <div className="relative h-full w-full bg-gray-900">
                            {getVideoThumbnail(item.url) ? (
                              <Image 
                                src={getVideoThumbnail(item.url)} 
                                alt="" 
                                fill 
                                className="object-cover opacity-80" 
                                sizes="64px"
                                unoptimized 
                              />
                            ) : null}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xl">▶️</span>
                            </div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Descripción */}
              {product.description && (
                <div className="mt-4 rounded-lg bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-xl font-semibold text-[#1d1d1b]">Descripción</h2>
                  <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}
            </div>

            {/* Columna derecha: Info y compra */}
            <div className="min-w-0 lg:col-span-1">
              <div className="space-y-4 lg:sticky lg:top-4">
                {/* Card principal */}
                <div className="min-w-0 rounded-xl bg-white p-4 shadow-sm md:rounded-lg md:p-6">
                  {/* Condición */}
                  <p className="mb-2 text-sm text-gray-500">Nuevo | +50 vendidos</p>
                  
                  {/* Título */}
                  <h1 className="mb-4 text-2xl font-semibold text-[#1d1d1b] leading-tight">
                    {product.name}
                  </h1>

                  {/* Precio */}
                  <div className="mb-4">
                    {hasDiscount && (
                      <p className="text-lg text-gray-400 line-through">
                        ${Number(product.compareAtPrice).toLocaleString("es-AR")}
                      </p>
                    )}
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-light text-[#1d1d1b]">
                        ${Number(product.price).toLocaleString("es-AR")}
                      </span>
                      {hasDiscount && (
                        <span className="text-lg font-semibold text-green-600">
                          {discountPercent}% OFF
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      o hasta 12 cuotas sin interés
                    </p>
                  </div>

                  {/* Retiro */}
                  <div className="mb-6 flex items-start gap-3 rounded-lg bg-gray-50 p-4">
                    <span className="text-2xl">📍</span>
                    <div>
                      <p className="font-semibold text-green-600">Retiro en FADU</p>
                      <p className="text-sm text-gray-600">Tu pedido listo en 7 días</p>
                      <p className="mt-1 text-xs text-gray-500">
                        Av. San Juan 350, CABA
                      </p>
                    </div>
                  </div>

                  {/* Stock */}
                  <div className="mb-4">
                    <p className={`text-sm ${product.stock > 5 ? "text-green-600" : "text-orange-600"}`}>
                      {product.stock > 0
                        ? `Stock disponible (${product.stock} unidades)`
                        : "Sin stock"}
                    </p>
                  </div>

                  {/* Cantidad */}
                  <div className="mb-6">
                    <label className="mb-2 block text-sm text-gray-600">Cantidad:</label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 hover:bg-gray-50"
                      >
                        −
                      </button>
                      <span className="w-12 text-center font-semibold">{quantity}</span>
                      <button
                        onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                        className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 hover:bg-gray-50"
                      >
                        +
                      </button>
                      <span className="ml-2 text-sm text-gray-500">
                        ({product.stock} disponibles)
                      </span>
                    </div>
                  </div>

                  {/* Botones */}
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        handleAddToCart();
                        router.push("/carrito");
                      }}
                      disabled={product.stock === 0}
                      className="w-full rounded-lg bg-[#0f3bff] py-3.5 font-semibold text-white transition hover:bg-[#0d32cc] disabled:bg-gray-300"
                    >
                      Comprar ahora
                    </button>
                    <button
                      onClick={handleAddToCart}
                      disabled={product.stock === 0}
                      className="w-full rounded-lg bg-[#e6f0ff] py-3.5 font-semibold text-[#0f3bff] transition hover:bg-[#d9e8ff] disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      {addedToCart ? "✓ Agregado al carrito" : "Agregar al carrito"}
                    </button>
                  </div>
                </div>

                {/* Card vendedor */}
                <div className="rounded-lg bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0f3bff] text-white font-bold">
                      F
                    </div>
                    <div>
                      <p className="font-semibold">Fadu.store</p>
                      <p className="text-xs text-gray-500">Vendedor oficial</p>
                    </div>
                  </div>
                </div>

                {/* Medios de pago */}
                <div className="rounded-lg bg-white p-4 shadow-sm">
                  <h3 className="mb-3 text-sm font-semibold">Medios de pago</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>💳 Tarjetas de crédito y débito</p>
                    <p>🏦 Transferencia bancaria</p>
                    <p>💵 Efectivo en puntos de pago</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Opiniones del producto */}
            <div className="mt-4 rounded-lg bg-white p-6 shadow-sm lg:col-span-3">
              <h2 className="mb-6 text-xl font-semibold text-[#1d1d1b]">
                Opiniones del producto
              </h2>

              {/* Resumen */}
              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <p className="text-5xl font-bold text-[#0f3bff]">
                    {reviewSummary.average.toFixed(1)}
                  </p>
                  <div className="mt-2">{renderStars(Math.round(reviewSummary.average))}</div>
                  <p className="mt-1 text-sm text-gray-500">
                    {reviewSummary.total} calificaciones
                  </p>
                </div>

                <div className="md:col-span-2">
                  <div className="space-y-2">
                    {reviewSummary.distribution.map((item) => {
                      const percent =
                        reviewSummary.total > 0
                          ? Math.round((item.count / reviewSummary.total) * 100)
                          : 0;
                      return (
                        <div key={item.stars} className="flex items-center gap-3">
                          <span className="w-6 text-sm text-gray-500">{item.stars}</span>
                          <div className="flex-1 rounded-full bg-gray-100 h-2">
                            <div
                              className="h-2 rounded-full bg-[#0f3bff]"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="w-10 text-right text-sm text-gray-500">
                            {item.count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {reviewSummary.total === 0 && (
                <div className="mt-6 rounded-lg border border-black/8 bg-gray-50 p-6 text-center text-gray-600">
                  Este producto aún no tiene comentarios. ¡Sé el primero!
                </div>
              )}

              {/* Formulario */}
              <form onSubmit={submitReview} className="mt-6 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm text-gray-600">Tu calificación:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setNewRating(star)}
                        className={`text-2xl ${
                          star <= newRating ? "text-[#0f3bff]" : "text-gray-300"
                        }`}
                        aria-label={`Calificar con ${star} estrellas`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  value={newReview}
                  onChange={(e) => setNewReview(e.target.value)}
                  placeholder="Dejá una reseña breve (opcional)"
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#0f3bff]"
                />
                {reviewError && <p className="text-sm text-red-600">{reviewError}</p>}
                {!session && (
                  <p className="text-sm text-gray-500">
                    <Link href="/login" className="text-[#0f3bff] hover:underline">
                      Iniciá sesión
                    </Link>{" "}
                    para dejar tu opinión
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    Las opiniones se publican luego de ser moderadas.
                  </p>
                  <button
                    type="submit"
                    disabled={loadingReview || newRating === 0}
                    className="rounded-lg bg-[#0f3bff] px-6 py-2 font-semibold text-white hover:bg-[#0d32cc] disabled:bg-gray-300"
                  >
                    {loadingReview ? "Enviando..." : "Enviar opinión"}
                  </button>
                </div>
              </form>

              {/* Lista de reseñas */}
              {reviews.length > 0 && (
                <div className="mt-6 space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0">
                      <div className="flex items-center gap-3">
                        {renderStars(review.rating)}
                        <p className="text-xs text-gray-500">
                          {review.user.name || "Usuario"} ·{" "}
                          {new Date(review.createdAt).toLocaleDateString("es-AR")}
                        </p>
                      </div>
                      {review.comment && (
                        <p className="mt-2 text-gray-700">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Preguntas y respuestas - al final (mobile y desktop) */}
            <div className="mt-4 rounded-lg bg-white p-6 shadow-sm lg:col-span-3">
              <h2 className="mb-6 text-xl font-semibold text-[#1d1d1b]">
                Preguntas y respuestas
              </h2>
              
              {/* Formulario de pregunta */}
              <form onSubmit={submitQuestion} className="mb-6">
                <div className="flex flex-wrap gap-3">
                  <input
                    type="text"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="Escribí tu pregunta..."
                    className="min-w-0 flex-1 rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#0f3bff]"
                  />
                  <button
                    type="submit"
                    disabled={loadingQuestion || newQuestion.trim().length < 10}
                    className="rounded-lg bg-[#0f3bff] px-6 py-3 font-semibold text-white hover:bg-[#0d32cc] disabled:bg-gray-300"
                  >
                    {loadingQuestion ? "..." : "Preguntar"}
                  </button>
                </div>
                {questionError && (
                  <p className="mt-2 text-sm text-red-600">{questionError}</p>
                )}
                {!session && (
                  <p className="mt-2 text-sm text-gray-500">
                    <Link href="/login" className="text-[#0f3bff] hover:underline">
                      Iniciá sesión
                    </Link>{" "}
                    para hacer preguntas
                  </p>
                )}
              </form>
              
              {/* Lista de preguntas */}
              {questions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Nadie hizo preguntas todavía. ¡Sé el primero!
                </p>
              ) : (
                <div className="space-y-4">
                  {questions.map((q) => (
                    <div key={q.id} className="border-b border-gray-100 pb-4 last:border-0">
                      <div className="flex gap-3">
                        <span className="text-xl">💬</span>
                        <div className="flex-1">
                          <p className="text-gray-800">{q.question}</p>
                          <p className="mt-1 text-xs text-gray-500">
                            {q.user.name || "Usuario"} · {new Date(q.createdAt).toLocaleDateString("es-AR")}
                          </p>
                          
                          {q.answer && (
                            <div className="mt-3 rounded-lg bg-gray-50 p-3">
                              <p className="text-gray-700">{q.answer}</p>
                              <p className="mt-1 text-xs text-gray-500">
                                Respuesta del vendedor · {q.answeredAt && new Date(q.answeredAt).toLocaleDateString("es-AR")}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
