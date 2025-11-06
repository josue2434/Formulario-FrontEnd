// src/pages/docente/VisualizarActividad.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MarkdownPreview from "@uiw/react-markdown-preview";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import "katex/dist/katex.min.css";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

/* ==================== Utils ==================== */
const safeJson = async (res) => {
  try {
    return await res.clone().json();
  } catch {
    return null;
  }
};
const pickNum = (...vals) => {
  for (const v of vals) {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
};
const shuffleIfNeeded = (arr, should) => {
  if (!should) return arr;
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor((Math.sin(i * 9301 + 49297) * 233280) % (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const uniqueBy = (arr, keyFn) => {
  const seen = new Set();
  const out = [];
  for (const x of arr) {
    const k = keyFn(x);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(x);
    }
  }
  return out;
};
const decodeHtml = (str) => {
  try {
    const txt = document.createElement("textarea");
    txt.innerHTML = str ?? "";
    return txt.value;
  } catch {
    return str ?? "";
  }
};

/* ==================== Fetch helpers ==================== */
/** Devuelve { actividad, preguntaIds: [{id,orden}], aleatorizar_preguntas, aleatorizar_opciones, tiempo_limite } */
async function fetchActividadYMapeo(tipo, id, headers) {
  const out = {
    actividad: null,
    preguntaIds: [],
    aleatorizar_preguntas: false,
    aleatorizar_opciones: false,
    tiempo_limite: null,
  };

  if (tipo === "examen") {
    const r = await fetch(`${API}/actividad-examenes/${id}`, { headers });
    if (r.ok) {
      const j = await safeJson(r);
      const a = j?.actividad || j?.data || j || null;
      if (a) {
        out.actividad = a;
        out.aleatorizar_preguntas = !!(a?.aleatorizar_preguntas ?? a?.config?.aleatorizar_preguntas);
        out.aleatorizar_opciones = !!(a?.aleatorizar_opciones ?? a?.config?.aleatorizar_opciones);
        out.tiempo_limite = pickNum(a?.tiempo_limite, a?.config?.tiempo_limite);

        const rel = a?.preguntas || a?.data?.preguntas || a?.preguntas_rel || [];
        if (Array.isArray(rel) && rel.length) {
          out.preguntaIds = rel
            .map((p, idx) => ({
              id: pickNum(p?.id, p?.id_pregunta),
              orden: pickNum(p?.pivot?.orden, p?.orden, idx + 1) || idx + 1,
            }))
            .filter((x) => Number.isFinite(x.id));
        }
      }
    }

    // Si no vino el mapeo en el show, intenta por relación
    if (!out.preguntaIds.length) {
      let rp = await fetch(`${API}/pregunta-actividad-examenes?actividad=${id}`, { headers });
      if (!rp.ok) rp = await fetch(`${API}/pregunta-actividad-examenes`, { headers });
      if (rp.ok) {
        const jj = await safeJson(rp);
        const list = Array.isArray(jj) ? jj : jj?.data || jj?.preguntas || [];
        const filtered = list.filter((row) => {
          const aid = pickNum(
            row?.id_actividad_examen,
            row?.id_actividad,
            row?.actividad_examen_id,
            row?.actividad_id
          );
          return Number(aid) === Number(id);
        });
        out.preguntaIds = filtered
          .map((row, idx) => ({
            id: pickNum(row?.id_pregunta, row?.pregunta_id, row?.id),
            orden: pickNum(row?.orden, row?.pivot?.orden, idx + 1) || idx + 1,
          }))
          .filter((x) => Number.isFinite(x.id));
      }
    }
  } else {
    // práctica
    const r = await fetch(`${API}/actividad/practica/${id}`, { headers });
    if (r.ok) {
      const j = await safeJson(r);
      const a = j?.actividad || j?.data || j || null;
      if (a) {
        out.actividad = a;
        out.aleatorizar_preguntas = !!(a?.aleatorizar_preguntas ?? a?.config?.aleatorizar_preguntas);
        out.aleatorizar_opciones = !!(a?.aleatorizar_opciones ?? a?.config?.aleatorizar_opciones);
        out.tiempo_limite = pickNum(a?.tiempo_limite, a?.config?.tiempo_limite);

        const rel = a?.preguntas || a?.data?.preguntas || a?.preguntas_rel || [];
        if (Array.isArray(rel) && rel.length) {
          out.preguntaIds = rel
            .map((p, idx) => ({
              id: pickNum(p?.id, p?.id_pregunta),
              orden: pickNum(p?.pivot?.orden, p?.orden, idx + 1) || idx + 1,
            }))
            .filter((x) => Number.isFinite(x.id));
        }
      }
    }

    if (!out.preguntaIds.length) {
      let rp = await fetch(`${API}/preguntas/actividad-practica?actividad=${id}`, { headers });
      if (!rp.ok) rp = await fetch(`${API}/preguntas/actividad-practica`, { headers });
      if (rp.ok) {
        const jj = await safeJson(rp);
        const list = Array.isArray(jj) ? jj : jj?.data || jj?.preguntas || [];
        const filtered = list.filter((row) => {
          const aid = pickNum(
            row?.id_actividad_practica,
            row?.id_actividad,
            row?.actividad_practica_id,
            row?.actividad_id
          );
          return Number(aid) === Number(id);
        });
        out.preguntaIds = filtered
          .map((row, idx) => ({
            id: pickNum(row?.id_pregunta, row?.pregunta_id, row?.id),
            orden: pickNum(row?.orden, row?.pivot?.orden, idx + 1) || idx + 1,
          }))
          .filter((x) => Number.isFinite(x.id));
      }
    }
  }

  out.preguntaIds = uniqueBy(out.preguntaIds, (x) => x.id).sort(
    (a, b) => (a.orden || 0) - (b.orden || 0)
  );
  return out;
}

/** Devuelve pregunta con opciones filtradas por id_pregunta */
async function fetchPreguntaConOpciones(pid, headers) {
  // Pregunta
  const rp = await fetch(`${API}/preguntas/${pid}`, { headers });
  if (!rp.ok) return null;
  const j = await safeJson(rp);
  const p = j?.pregunta || j?.data?.pregunta || j?.data || j || null;
  if (!p) return null;

  p.texto = decodeHtml(
    p?.texto_pregunta ?? p?.texto ?? p?.enunciado ?? p?.contenido ?? ""
  );

  // Opciones
  try {
    let ro = await fetch(`${API}/opcion-respuestas?pregunta=${pid}`, { headers });
    if (!ro.ok) ro = await fetch(`${API}/preguntas/${pid}/opciones`, { headers });
    if (!ro.ok) ro = await fetch(`${API}/opcion-respuestas`, { headers });

    if (ro.ok) {
      const jo = await safeJson(ro);
      const listRaw = Array.isArray(jo) ? jo : jo?.data || jo?.opciones || [];
      const list = Array.isArray(listRaw) ? listRaw : [];

      const filtered = list.filter((op) => {
        const opPid = pickNum(op?.id_pregunta, op?.pregunta_id);
        return Number(opPid) === Number(pid);
      });

      p.opciones = filtered.map((op, idx) => ({
        id: pickNum(op?.id, op?.opcion_id) ?? `${pid}-op-${idx}`,
        id_pregunta: pickNum(op?.id_pregunta, op?.pregunta_id),
        texto_opcion: op?.texto_opcion ?? op?.texto ?? "",
        es_correcta: op?.es_correcta == 1 || op?.es_correcta === true,
      }));
    } else {
      p.opciones = [];
    }
  } catch {
    p.opciones = [];
  }

  return p;
}

/* ==================== Componente ==================== */
export default function VisualizarActividad() {
  const { tipo, id } = useParams(); // 'examen' | 'practica'
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const headers = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  const [loading, setLoading] = useState(true);
  const [actividad, setActividad] = useState(null);
  const [preguntas, setPreguntas] = useState([]);
  const [error, setError] = useState(null);

  // Timer
  const [secondsLeft, setSecondsLeft] = useState(null);
  const timerRef = useRef(null);

  // Respuestas seleccionadas: { [idPregunta]: idOpcion }
  const [respuestas, setRespuestas] = useState({});

  // Cargar actividad + preguntas exactas
  useEffect(() => {
    let cancel = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const meta = await fetchActividadYMapeo(tipo, id, headers);

        // Sin mapeo: dejar en 0 preguntas pero respetar timer
        if (!meta?.preguntaIds?.length) {
          setActividad(meta.actividad);
          setPreguntas([]);
          const tl = pickNum(meta.tiempo_limite);
          if (Number.isFinite(tl) && tl > 0) setSecondsLeft(tl * 60);
          return;
        }

        // Cargar preguntas con opciones
        const loaded = [];
        for (const row of meta.preguntaIds) {
          const p = await fetchPreguntaConOpciones(row.id, headers);
          if (p) {
            loaded.push({
              ...p,
              id: pickNum(p?.id) ?? row.id,
              orden: pickNum(p?.pivot?.orden, row.orden),
            });
          }
        }

        // Orden + aleatorizar
        let ordered = loaded
          .filter((x) => Number.isFinite(x.id))
          .sort((a, b) => {
            const oa = pickNum(a.orden, a?.pivot?.orden, 9999);
            const ob = pickNum(b.orden, b?.pivot?.orden, 9999);
            if (oa !== ob) return oa - ob;
            return a.id - b.id;
          });

        ordered = shuffleIfNeeded(ordered, !!meta.aleatorizar_preguntas);
        ordered = ordered.map((q) => {
          const ops = Array.isArray(q.opciones) ? q.opciones : [];
          const cleanOps = uniqueBy(
            ops.filter((op) => Number(op?.id_pregunta) === Number(q.id)),
            (op) => op.id ?? `${q.id}-${op.texto_opcion}`
          );
          const finalOps = shuffleIfNeeded(cleanOps, !!meta.aleatorizar_opciones);
          return { ...q, opciones: finalOps };
        });

        if (!cancel) {
          setActividad(meta.actividad);
          setPreguntas(ordered);
          const tl = pickNum(meta.tiempo_limite);
          setSecondsLeft(Number.isFinite(tl) && tl > 0 ? tl * 60 : null);
        }
      } catch (e) {
        if (!cancel) setError(e?.message || "Error al cargar la actividad");
      } finally {
        if (!cancel) setLoading(false);
      }
    }

    load();
    return () => {
      cancel = true;
    };
  }, [tipo, id, headers]);

  // Countdown
  useEffect(() => {
    if (!secondsLeft && secondsLeft !== 0) return;
    if (secondsLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s === null) return null;
        if (s <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [secondsLeft]);

  const mmss = useMemo(() => {
    if (!Number.isFinite(secondsLeft)) return null;
    const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
    const ss = String(secondsLeft % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }, [secondsLeft]);

  // Derivar preguntas visibles:
  // 1) Ignorar la primera
  // 2) Filtrar “abiertas” (sin opciones)
  const visibles = useMemo(() => {
    const sinPrimera = preguntas.slice(1);
    return sinPrimera.filter((q) => Array.isArray(q.opciones) && q.opciones.length > 0);
  }, [preguntas]);

  const onSelect = (idPregunta, idOpcion) => {
    if (secondsLeft === 0) return; // bloqueado si ya terminó el tiempo
    setRespuestas((prev) => ({ ...prev, [idPregunta]: idOpcion }));
  };

  /* ==================== Render ==================== */
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="animate-pulse p-6 bg-white border rounded-2xl">Cargando…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="p-6 bg-red-50 text-red-700 border border-red-200 rounded-2xl">
          {error}
        </div>
      </div>
    );
  }

  const titulo = actividad?.nombre || `Actividad ${tipo} #${id}`;
  const sub = actividad?.descripcion || actividad?.curso?.nombre || "";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{titulo}</h1>
          {sub && <p className="text-gray-600 mt-1">{sub}</p>}
          <p className="text-xs text-gray-500 mt-1">
            Tipo: <span className="font-medium">{tipo}</span> • ID: {id}
          </p>
        </div>
        {Number.isFinite(secondsLeft) && (
          <div
            className={`px-4 py-2 rounded-xl border text-sm font-semibold ${
              secondsLeft > 0
                ? "bg-amber-50 border-amber-200 text-amber-700"
                : "bg-gray-100 border-gray-200 text-gray-700"
            }`}
          >
            {secondsLeft > 0 ? `Tiempo restante: ${mmss}` : "Tiempo agotado"}
          </div>
        )}
      </div>

      {/* Preguntas */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        {visibles.length === 0 ? (
          <div className="text-gray-600">
            No hay preguntas de opción múltiple para mostrar (la primera se omite).
          </div>
        ) : (
          <ol className="space-y-6" data-color-mode="light">
            {visibles.map((q, idx) => (
              <li key={`q-${q.id}-${idx}`} className="border rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-semibold">
                    {idx + 1}
                  </div>
                  <div className="flex-1 prose prose-slate max-w-none prose-p:leading-relaxed">
                    <MarkdownPreview
                      source={q.texto || ""}
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[
                        [rehypeKatex, { output: "html" }],
                        rehypeSlug,
                        [rehypeAutolinkHeadings, { behavior: "wrap" }],
                      ]}
                    />

                    {/* Opciones (seleccionables) */}
                    <ul className="mt-4 space-y-2">
                      {q.opciones.map((op, i) => {
                        const checked = respuestas[q.id] === op.id;
                        const disabled = secondsLeft === 0;
                        return (
                          <li key={`op-${op.id ?? `${q.id}-${i}`}`}>
                            <label
                              className={`flex items-center gap-3 border rounded-xl px-4 py-2 cursor-pointer ${
                                checked
                                  ? "border-indigo-400 bg-indigo-50"
                                  : "border-gray-200 hover:bg-gray-50"
                              } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
                            >
                              <input
                                type="radio"
                                name={`q-${q.id}`}
                                value={op.id}
                                className="w-4 h-4"
                                checked={checked || false}
                                disabled={disabled}
                                onChange={() => onSelect(q.id, op.id)}
                              />
                              <span className="text-gray-800">{op.texto_opcion}</span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Botón Guardar (abajo) */}
      <div className="flex justify-end">
        <button
          disabled={secondsLeft === 0}
          onClick={() => {
            // Demo local. Si quieres enviar al backend, puedo armarte el fetch.
            console.log("Respuestas seleccionadas:", respuestas);
            alert("Respuestas guardadas (demo).");
          }}
          className={`h-10 px-6 rounded-xl text-white ${
            secondsLeft === 0 ? "bg-gray-400" : "bg-emerald-600 hover:bg-emerald-700"
          }`}
        >
          Guardar respuestas
        </button>
      </div>

      {/* Volver */}
      <div className="flex">
        <button
          onClick={() => navigate(-1)}
          className="h-10 px-4 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Volver
        </button>
      </div>
    </div>
  );
}
