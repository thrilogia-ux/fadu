"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Question {
  id: string;
  question: string;
  answer: string | null;
  answeredAt: string | null;
  createdAt: string;
  user: { name: string | null; email: string };
  product: { name: string; slug: string };
}

export default function AdminPreguntasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "answered" | "all">("pending");
  const [answerText, setAnswerText] = useState("");
  const [answeringId, setAnsweringId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/admin/preguntas");
    } else if (session && (session.user as any).role !== "admin") {
      router.push("/");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session && (session.user as any).role === "admin") {
      loadQuestions();
    }
  }, [session]);

  async function loadQuestions() {
    try {
      const res = await fetch("/api/admin/questions");
      if (res.ok) {
        setQuestions(await res.json());
      }
    } catch (error) {
      console.error("Error:", error);
    }
    setLoading(false);
  }

  async function submitAnswer(questionId: string) {
    if (!answerText.trim()) return;

    try {
      const res = await fetch(`/api/admin/questions/${questionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: answerText }),
      });

      if (res.ok) {
        setAnsweringId(null);
        setAnswerText("");
        loadQuestions();
      } else {
        alert("Error al responder");
      }
    } catch {
      alert("Error de conexión");
    }
  }

  async function deleteQuestion(id: string) {
    if (!confirm("¿Eliminar esta pregunta?")) return;

    try {
      const res = await fetch(`/api/admin/questions/${id}`, { method: "DELETE" });
      if (res.ok) {
        setQuestions(questions.filter((q) => q.id !== id));
      }
    } catch {
      alert("Error al eliminar");
    }
  }

  if (status === "loading" || loading) {
    return <div className="flex min-h-screen items-center justify-center">Cargando...</div>;
  }

  if (!session || (session.user as any).role !== "admin") {
    return null;
  }

  const filteredQuestions = questions.filter((q) => {
    if (filter === "pending") return !q.answer;
    if (filter === "answered") return !!q.answer;
    return true;
  });

  const pendingCount = questions.filter((q) => !q.answer).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-black/8 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Preguntas</h1>
              {pendingCount > 0 && (
                <span className="rounded-full bg-red-500 px-3 py-1 text-sm font-bold text-white">
                  {pendingCount} sin responder
                </span>
              )}
            </div>
            <Link href="/admin" className="text-sm text-[#0f3bff] hover:underline">
              ← Volver al panel
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Filtros */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setFilter("pending")}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              filter === "pending" ? "bg-[#0f3bff] text-white" : "bg-white text-gray-700"
            }`}
          >
            Pendientes ({pendingCount})
          </button>
          <button
            onClick={() => setFilter("answered")}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              filter === "answered" ? "bg-[#0f3bff] text-white" : "bg-white text-gray-700"
            }`}
          >
            Respondidas ({questions.length - pendingCount})
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              filter === "all" ? "bg-[#0f3bff] text-white" : "bg-white text-gray-700"
            }`}
          >
            Todas ({questions.length})
          </button>
        </div>

        {/* Lista */}
        {filteredQuestions.length === 0 ? (
          <div className="rounded-lg border border-black/8 bg-white p-12 text-center text-gray-600">
            {filter === "pending" ? "No hay preguntas pendientes 🎉" : "No hay preguntas"}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQuestions.map((q) => (
              <div key={q.id} className="rounded-lg border border-black/8 bg-white p-6">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <Link
                      href={`/producto/${q.product.slug}`}
                      className="text-sm font-semibold text-[#0f3bff] hover:underline"
                    >
                      {q.product.name}
                    </Link>
                    <p className="text-xs text-gray-500">
                      {q.user.name || q.user.email} ·{" "}
                      {new Date(q.createdAt).toLocaleDateString("es-AR")}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteQuestion(q.id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Eliminar
                  </button>
                </div>

                <p className="mb-4 text-gray-800">{q.question}</p>

                {q.answer ? (
                  <div className="rounded-lg bg-green-50 p-4">
                    <p className="text-gray-700">{q.answer}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Respondido el {q.answeredAt && new Date(q.answeredAt).toLocaleDateString("es-AR")}
                    </p>
                  </div>
                ) : answeringId === q.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      placeholder="Escribí tu respuesta..."
                      rows={3}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#0f3bff]"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => submitAnswer(q.id)}
                        disabled={!answerText.trim()}
                        className="rounded-lg bg-[#0f3bff] px-4 py-2 font-semibold text-white hover:bg-[#0d32cc] disabled:bg-gray-300"
                      >
                        Enviar respuesta
                      </button>
                      <button
                        onClick={() => {
                          setAnsweringId(null);
                          setAnswerText("");
                        }}
                        className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setAnsweringId(q.id);
                      setAnswerText("");
                    }}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                  >
                    Responder
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
