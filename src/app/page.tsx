"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";

interface Sugerencia {
  id: string;
  texto: string;
  tipo: string;
  likes: number;
  creadoEn: string;
}

export default function Home() {
  const [reporte, setReporte] = useState("");
  const [tipo, setTipo] = useState("reporte");
  
  const [sugerencias, setSugerencias] = useState<Sugerencia[]>([]);
  const [loadingSugerencias, setLoadingSugerencias] = useState(true);
  const [errorSugerencias, setErrorSugerencias] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const proxyUrl = process.env.NEXT_PUBLIC_PROXY_URL || "http://localhost:3000/api/moderar";
  const proxyBase = proxyUrl.replace("/api/moderar", "");

  const cargarSugerencias = async () => {
    setLoadingSugerencias(true);
    setErrorSugerencias(false);
    try {
      const response = await fetch(`${proxyBase}/api/reportes`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error();
      }

      const data = await response.json();
      setSugerencias(data);
    } catch (err) {
      setErrorSugerencias(true);
    } finally {
      setLoadingSugerencias(false);
    }
  };

  useEffect(() => {
    cargarSugerencias();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reporte.trim() || reporte.trim().length < 5) {
      Swal.fire({
        icon: "warning",
        title: "Texto muy corto",
        text: "Por favor, escribe un reporte o sugerencia con al menos 5 caracteres.",
        confirmButtonColor: "#f59e0b"
      });
      return;
    }

    Swal.fire({
      title: "Evaluando contenido...",
      text: "La inteligencia artificial está revisando el contenido de forma segura.",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const response = await fetch(proxyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ reporte, tipo })
      });

      if (!response.ok) {
        throw new Error("Error en el servidor de moderación.");
      }

      const result = await response.json();

      if (result.aprobado) {
        Swal.fire({
          icon: "success",
          title: tipo === "reporte" ? "¡Reporte Recibido!" : "¡Sugerencia Aprobada!",
          text: result.mensaje || "Tu mensaje ha sido aprobado y almacenado de forma anónima.",
          confirmButtonColor: "#10b981"
        });
        setReporte("");
        if (tipo === "sugerencia") {
          await cargarSugerencias();
        }
      } else {
        Swal.fire({
          icon: "error",
          title: "Mensaje Bloqueado",
          text: result.mensaje || "Se ha detectado lenguaje inapropiado o agresivo. Por favor, sé respetuoso.",
          confirmButtonColor: "#ef4444"
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Error de Conexión",
        text: "No se pudo establecer comunicación con el proxy de moderación.",
        confirmButtonColor: "#ef4444"
      });
    }
  };

  const handleLike = async (id: string) => {
    try {
      const response = await fetch(`${proxyBase}/api/reportes/${id}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error();
      }

      setSugerencias((prev) =>
        prev.map((sug) => (sug.id === id ? { ...sug, likes: sug.likes + 1 } : sug))
      );
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo registrar tu voto.",
        confirmButtonColor: "#ef4444"
      });
    }
  };

  const sugerenciasFiltradas = sugerencias.filter((sug) =>
    sug.texto.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-slate-50 text-slate-800 font-sans p-6 selection:bg-amber-100 selection:text-amber-900">
      
      <header className="text-center mt-6 mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-600 mb-4 animate-bounce">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h1 className="text-4xl font-black bg-gradient-to-r from-amber-500 via-orange-600 to-yellow-600 bg-clip-text text-transparent mb-1">
          BEE
        </h1>
        <p className="text-xs font-bold tracking-widest text-amber-600 uppercase mb-2">
          Buzón Escolar Electrónico
        </p>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          Plataforma anónima de retroalimentación escolar y convivencia inteligente.
        </p>
      </header>

      <main className="w-full max-w-xl space-y-8">
        <section className="bg-white border border-slate-200 shadow-xl rounded-3xl p-8 transition-all duration-300">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setTipo("reporte")}
                className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                  tipo === "reporte"
                    ? "bg-amber-500 text-white shadow-md"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Reporte Privado
              </button>
              <button
                type="button"
                onClick={() => setTipo("sugerencia")}
                className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                  tipo === "sugerencia"
                    ? "bg-amber-500 text-white shadow-md"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Sugerencia Pública
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                {tipo === "reporte" ? "Detalles del Reporte (Anónimo y Privado)" : "Detalles de la Sugerencia (Anónimo y Público)"}
              </label>
              <textarea
                value={reporte}
                onChange={(e) => setReporte(e.target.value)}
                placeholder={
                  tipo === "reporte"
                    ? "Describe de forma respetuosa la situación o reporte..."
                    : "Escribe tu propuesta o idea para mejorar la escuela..."
                }
                rows={5}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all duration-200 resize-none"
              />
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Mínimo 5 caracteres</span>
                <span>{reporte.length} caracteres</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={reporte.trim().length < 5}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-white font-bold hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:hover:scale-100 disabled:pointer-events-none transition-all duration-200 shadow-lg shadow-amber-500/10 cursor-pointer"
            >
              Enviar {tipo === "reporte" ? "Reporte Anónimo" : "Sugerencia Anónima"}
            </button>
          </form>
        </section>

        <section className="bg-white border border-slate-200 shadow-xl rounded-3xl p-8 space-y-6 transition-all duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-800">Muro de Sugerencias</h2>
              <p className="text-xs text-slate-400">Propuestas aprobadas por la comunidad escolar</p>
            </div>
            
            <input
              type="text"
              placeholder="Buscar..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-2xl text-xs bg-slate-50 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 w-full sm:w-44 transition-all duration-200"
            />
          </div>

          {loadingSugerencias ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-24 bg-slate-100 rounded-2xl w-full border border-slate-200" />
              <div className="h-24 bg-slate-100 rounded-2xl w-full border border-slate-200" />
            </div>
          ) : errorSugerencias ? (
            <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-2xl text-sm flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>No se pudo conectar al servidor de moderación. Revisa que el Proxy esté corriendo.</span>
            </div>
          ) : sugerenciasFiltradas.length === 0 ? (
            <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl text-sm">
              {busqueda ? "No hay sugerencias que coincidan con la búsqueda." : "Aún no hay sugerencias públicas aprobadas. ¡Propón la primera!"}
            </div>
          ) : (
            <div className="space-y-4">
              {sugerenciasFiltradas.map((sug) => (
                <div
                  key={sug.id}
                  className="p-5 border border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-200 hover:shadow-md rounded-2xl flex flex-col justify-between gap-4 transition-all duration-200"
                >
                  <p className="text-sm text-slate-700 leading-relaxed font-medium">
                    {sug.texto}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {new Date(sug.creadoEn).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                    </span>

                    <button
                      onClick={() => handleLike(sug.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 hover:border-pink-200 hover:bg-pink-50 hover:text-pink-600 transition-all duration-200 text-slate-500 cursor-pointer"
                    >
                      <svg className="w-4 h-4 fill-current text-pink-500" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                      <span>{sug.likes}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
