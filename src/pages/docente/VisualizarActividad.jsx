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

/* Utils*/
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
    const j = Math.floor(Math.random() * (i + 1));
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

/* Helpers de evaluación y Bloom  */
const getRetroMode = (actividad) => {
  return (
    actividad?.retroalimentacion ??
    actividad?.config?.retroalimentacion ??
    "al_final"
  );
};

const getBloomLabel = (q) => {
  const raw =
    q?.nivel_bloom?.nombre ??
    q?.nivel_bloom ??
    q?.bloom?.nombre ??
    q?.bloom ??
    q?.nivel?.nombre ??
    q?.nivel ??
    q?.categoria_bloom ??
    q?.nombre_nivel ??
    q?.id_nivel_bloom ??
    "Sin nivel";
  return String(raw).trim() || "Sin nivel";
};

const gradeAttempt = (preguntas = [], respuestas = {}) => {
  const arr = Array.isArray(preguntas) ? preguntas.filter(Boolean) : [];

  let correctas = 0;
  let incorrectas = 0;
  let omitidas = 0;

  const detalle = [];

  for (const q of arr) {
    if (!q) {
      omitidas++;
      continue;
    }

    const sel = respuestas[q.id];
    const opciones = Array.isArray(q?.opciones) ? q.opciones : [];
    const correcta = opciones.find((o) => o?.es_correcta);
    const esCorrecta =
      sel != null && correcta && String(sel) === String(correcta.id);

    if (sel == null) {
      omitidas++;
    } else if (esCorrecta) {
      correctas++;
    } else {
      incorrectas++;
    }

    detalle.push({
      id: q.id,
      bloom: getBloomLabel(q),
      seleccion: sel ?? null,
      correctaId: correcta?.id ?? null,
      correctaTexto: correcta?.texto_opcion ?? "",
      esCorrecta,
      retro: q?.retroalimentacion ?? q?.explicacion ?? q?.feedback ?? null,
      texto: q?.texto ?? "",
      opciones,
    });
  }

  const total = arr.length;
  const puntaje = total > 0 ? Math.round((correctas / total) * 100) : 0;

  const porBloom = {};
  for (const d of detalle) {
    const key = d.bloom || "Sin nivel";
    if (!porBloom[key]) {
      porBloom[key] = {
        total: 0,
        correctas: 0,
        incorrectas: 0,
        omitidas: 0,
      };
    }
    porBloom[key].total++;
    if (d.seleccion == null) porBloom[key].omitidas++;
    else if (d.esCorrecta) porBloom[key].correctas++;
    else porBloom[key].incorrectas++;
  }

  return { puntaje, total, correctas, incorrectas, omitidas, detalle, porBloom };
};

/* Fetch helpers  */
async function fetchActividadYMapeo(tipo, id, headers) {
  const out = {
    actividad: null,
    preguntaIds: [],
    aleatorizar_preguntas: false,
    aleatorizar_opciones: false,
    tiempo_limite: null,
    preguntasPreCargadas: [],
  };

  if (tipo === "examen") {
    const r = await fetch(`${API}/actividad-examenes/${id}`, { headers });
    if (r.ok) {
      const j = await safeJson(r);
      const a = j?.actividad || j?.data || j || null;

      if (a) {
        out.actividad = a;
        out.aleatorizar_preguntas = !!(
          a?.aleatorizar_preguntas ?? a?.config?.aleatorizar_preguntas
        );
        out.aleatorizar_opciones = !!(
          a?.aleatorizar_opciones ?? a?.config?.aleatorizar_opciones
        );
        out.tiempo_limite = pickNum(a?.tiempo_limite, a?.config?.tiempo_limite);

        const rel = a?.preguntas || a?.data?.preguntas || a?.preguntas_rel || [];
        if (Array.isArray(rel) && rel.length) {
          // Guardamos preguntas con opciones ya cargadas desde el backend
          out.preguntasPreCargadas = rel;

          out.preguntaIds = rel
            .map((p, idx) => ({
              id: pickNum(p?.id_pregunta, p?.pregunta_id, p?.id),
              orden: pickNum(p?.pivot?.orden, p?.orden, idx + 1) || idx + 1,
            }))
            .filter((x) => Number.isFinite(x.id));
        }
      }
    }

    // Fallback a tabla pivote si por alguna razón no trae preguntas
    if (!out.preguntaIds.length) {
      let rp = await fetch(
        `${API}/pregunta-actividad-examenes?actividad=${id}`,
        { headers }
      );
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
            id: pickNum(row?.id_pregunta, row?.pregunta_id),
            orden: pickNum(row?.orden, row?.pivot?.orden, idx + 1) || idx + 1,
          }))
          .filter((x) => Number.isFinite(x.id));
      }
    }
  } else {
    // PRACTICA
    const r = await fetch(`${API}/actividad/practica/${id}`, { headers });
    if (r.ok) {
      const j = await safeJson(r);
      const a = j?.actividad || j?.data || j || null;

      if (a) {
        out.actividad = a;
        out.aleatorizar_preguntas = !!(
          a?.aleatorizar_preguntas ?? a?.config?.aleatorizar_preguntas
        );
        out.aleatorizar_opciones = !!(
          a?.aleatorizar_opciones ?? a?.config?.aleatorizar_opciones
        );
        out.tiempo_limite = pickNum(a?.tiempo_limite, a?.config?.tiempo_limite);

        const rel = a?.preguntas || a?.data?.preguntas || a?.preguntas_rel || [];
        if (Array.isArray(rel) && rel.length) {
          out.preguntaIds = rel
            .map((p, idx) => ({
              id: pickNum(p?.id_pregunta, p?.pregunta_id, p?.id),
              orden: pickNum(p?.pivot?.orden, p?.orden, idx + 1) || idx + 1,
            }))
            .filter((x) => Number.isFinite(x.id));
        }
      }
    }

    if (!out.preguntaIds.length) {
      let rp = await fetch(
        `${API}/preguntas/actividad-practica?actividad=${id}`,
        { headers }
      );
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
            id: pickNum(row?.id_pregunta, row?.pregunta_id),
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
  const rp = await fetch(`${API}/preguntas/${pid}`, { headers });
  if (!rp.ok) return null;

  const j = await safeJson(rp);
  const p = j?.pregunta || j?.data?.pregunta || j?.data || j || null;
  if (!p) return null;

  p.texto = decodeHtml(
    p?.texto_pregunta ?? p?.texto ?? p?.enunciado ?? p?.contenido ?? ""
  );

  try {
    let ro = await fetch(`${API}/opcion-respuestas?pregunta=${pid}`, {
      headers,
    });
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

  if (!Array.isArray(p.opciones)) p.opciones = [];

  return p;
}

/*  Componente */
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

  const [secondsLeft, setSecondsLeft] = useState(null);
  const timerRef = useRef(null);

  const [respuestas, setRespuestas] = useState({});
  const [graded, setGraded] = useState(false);
  const [resultado, setResultado] = useState(null);

  // Cargar actividad + preguntas exactas
  useEffect(() => {
    let cancel = false;

    async function load() {
      setLoading(true);
      setError(null);
      setGraded(false);
      setResultado(null);
      setRespuestas({});

      try {
        const meta = await fetchActividadYMapeo(tipo, id, headers);

        // Camino rápido: si el backend YA mandó preguntas con opciones (examen)
        if (
          Array.isArray(meta.preguntasPreCargadas) &&
          meta.preguntasPreCargadas.length
        ) {
          let ordered = meta.preguntasPreCargadas.map((p, idx) => {
            const baseOps = Array.isArray(p.opciones) ? p.opciones : [];
            const opciones = baseOps.map((op, j) => ({
              id: pickNum(op.id, op.opcion_id) ?? `${p.id}-op-${j}`,
              id_pregunta: pickNum(op.id_pregunta, op.pregunta_id, p.id),
              texto_opcion: op.texto_opcion ?? op.texto ?? "",
              es_correcta: op.es_correcta == 1 || op.es_correcta === true,
            }));

            return {
              ...p,
              id: pickNum(p.id, p.pregunta_id, p.id_pregunta),
              texto: decodeHtml(
                p.texto_pregunta ?? p.texto ?? p.enunciado ?? p.contenido ?? ""
              ),
              orden: pickNum(p.orden, idx + 1),
              opciones,
            };
          });

          ordered = ordered
            .filter(
              (q) => Array.isArray(q.opciones) && q.opciones.length > 0
            )
            .sort(
              (a, b) =>
                (pickNum(a.orden, 9999) ?? 9999) -
                (pickNum(b.orden, 9999) ?? 9999)
            );

          ordered = shuffleIfNeeded(ordered, meta.aleatorizar_preguntas);
          ordered = ordered.map((q) => ({
            ...q,
            opciones: shuffleIfNeeded(
              q.opciones,
              meta.aleatorizar_opciones
            ),
          }));

          if (!cancel) {
            setActividad(meta.actividad);
            setPreguntas(ordered);
            const tl = pickNum(meta.tiempo_limite);
            setSecondsLeft(
              Number.isFinite(tl) && tl > 0 ? tl * 60 : null
            );
          }
          return;
        }

        // Si no hay preguntas pre-cargadas (p.ej. práctica), usamos el camino normal
        if (!meta?.preguntaIds?.length) {
          if (!cancel) {
            setActividad(meta.actividad);
            setPreguntas([]);
            const tl = pickNum(meta.tiempo_limite);
            if (Number.isFinite(tl) && tl > 0) setSecondsLeft(tl * 60);
          }
          return;
        }

        const loaded = [];
        for (const row of meta.preguntaIds) {
          if (!row || !Number.isFinite(row.id)) continue;
          const p = await fetchPreguntaConOpciones(row.id, headers);
          if (p) {
            loaded.push({
              ...p,
              id: pickNum(p?.id) ?? row.id,
              orden: pickNum(p?.pivot?.orden, row.orden),
            });
          }
        }

        let ordered =
          Array.isArray(loaded) && loaded.length
            ? loaded
                .filter((q) => q && Number.isFinite(q.id))
                .sort((a, b) => {
                  const oa = pickNum(a.orden, a?.pivot?.orden, 9999);
                  const ob = pickNum(b.orden, b?.pivot?.orden, 9999);
                  if (oa !== ob) return oa - ob;
                  return a.id - b.id;
                })
            : [];

        // Aleatorizar orden de preguntas
        ordered = shuffleIfNeeded(ordered, meta.aleatorizar_preguntas);

        // Aleatorizar opciones
        ordered = ordered.map((q) => {
          if (!q) return null;
          const ops = Array.isArray(q?.opciones) ? q.opciones : [];
          const cleanOps = uniqueBy(
            ops.filter((op) => Number(op?.id_pregunta) === Number(q.id)),
            (op) => op?.id ?? `${q.id}-${op?.texto_opcion}`
          );
          const finalOps = shuffleIfNeeded(
            cleanOps.filter(Boolean),
            meta.aleatorizar_opciones
          );
          return { ...q, opciones: finalOps };
        });

        ordered = ordered.filter(Boolean);

        if (!cancel) {
          setActividad(meta.actividad);
          setPreguntas(ordered);
          const tl = pickNum(meta.tiempo_limite);
          setSecondsLeft(Number.isFinite(tl) && tl > 0 ? tl * 60 : null);
        }
      } catch (e) {
        if (!cancel)
          setError(e?.message || "Error al cargar la actividad");
      } finally {
        if (!cancel) setLoading(false);
      }
    }

    load();
    return () => {
      cancel = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [tipo, id, headers]);

  // Preguntas visibles: solo las que tienen opciones (para omitir abiertas)
  const visibles = useMemo(() => {
    const base = Array.isArray(preguntas) ? preguntas.filter(Boolean) : [];
    return base.filter(
      (q) => Array.isArray(q?.opciones) && q.opciones.length > 0
    );
  }, [preguntas]);

  // Countdown
  useEffect(() => {
    if (!Number.isFinite(secondsLeft)) return;
    if (secondsLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s === null) return null;
        if (s <= 1) {
          clearInterval(timerRef.current);
          if (!graded) {
            const res = gradeAttempt(visibles, respuestas);
            setResultado(res);
            setGraded(true);
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [secondsLeft, graded, visibles, respuestas]);

  const mmss = useMemo(() => {
    if (!Number.isFinite(secondsLeft)) return null;
    const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
    const ss = String(secondsLeft % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }, [secondsLeft]);

  const onSelect = (idPregunta, idOpcion) => {
    if (secondsLeft === 0 || graded) return;
    setRespuestas((prev) => ({ ...prev, [idPregunta]: idOpcion }));
  };

  const retroMode = getRetroMode(actividad);
  const puedeMostrarFeedback = (fase) => {
    if (retroMode === "oculto") return false;
    if (retroMode === "inmediata") return true;
    if (retroMode === "al_final") return fase === "final";
    return fase === "final";
  };

  /*  Render  */
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="animate-pulse p-6 bg-white border rounded-2xl">
          Cargando…
        </div>
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
              secondsLeft > 0 && !graded
                ? "bg-amber-50 border-amber-200 text-amber-700"
                : "bg-gray-100 border-gray-200 text-gray-700"
            }`}
          >
            {secondsLeft > 0 && !graded
              ? `Tiempo restante: ${mmss}`
              : "Tiempo detenido"}
          </div>
        )}
      </div>

      {/* Preguntas */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        {visibles.length === 0 ? (
          <div className="text-gray-600">
            No hay preguntas con opciones (opción múltiple o Verdadero/Falso)
            para mostrar. Las preguntas abiertas sin opciones se omiten en esta
            vista.
          </div>
        ) : (
          <ol className="space-y-6" data-color-mode="light">
            {visibles.map((q, idx) => {
              if (!q) return null;
              const seleccion = respuestas[q.id];
              let estado = null;

              if (puedeMostrarFeedback("durante") && seleccion != null) {
                const correcta = Array.isArray(q?.opciones)
                  ? q.opciones.find((o) => o?.es_correcta)
                  : null;
                if (correcta) {
                  estado =
                    String(seleccion) === String(correcta.id) ? "ok" : "bad";
                }
              }

              return (
                <li key={`q-${q.id}-${idx}`} className="border rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold
                     ${
                       estado === "ok"
                         ? "bg-emerald-100 text-emerald-700"
                         : estado === "bad"
                         ? "bg-rose-100 text-rose-700"
                         : "bg-purple-100 text-purple-700"
                     }`}
                    >
                      {idx + 1}
                    </div>

                    <div className="flex-1 prose prose-slate max-w-none prose-p:leading-relaxed">
                      {/* Enunciado con LaTeX */}
                      <MarkdownPreview
                        source={q.texto || ""}
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[
                          [rehypeKatex, { output: "html" }],
                          rehypeSlug,
                          [rehypeAutolinkHeadings, { behavior: "wrap" }],
                        ]}
                      />

                      {/* Opciones */}
                      <ul className="mt-4 space-y-2">
                        {(Array.isArray(q?.opciones) ? q.opciones : []).map(
                          (op, i) => {
                            if (!op) return null;
                            const checked = respuestas[q.id] === op.id;
                            const disabled = secondsLeft === 0 || graded;
                            let postClass = "";

                            if (graded && puedeMostrarFeedback("final")) {
                              const esSel = checked;
                              const esOk = op.es_correcta;
                              if (esOk)
                                postClass = "border-emerald-400 bg-emerald-50";
                              if (esSel && !esOk)
                                postClass = "border-rose-400 bg-rose-50";
                            }

                            return (
                              <li key={`op-${op.id ?? `${q.id}-${i}`}`}>
                                <label
                                  className={`flex items-center gap-3 border rounded-xl px-4 py-2 cursor-pointer ${
                                    checked
                                      ? "border-indigo-400 bg-indigo-50"
                                      : "border-gray-200 hover:bg-gray-50"
                                  } ${
                                    disabled
                                      ? "opacity-60 cursor-not-allowed"
                                      : ""
                                  } ${postClass}`}
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
                                  {/* Opción con Markdown + LaTeX */}
                                  <div className="flex-1 text-sm text-gray-800">
                                    <MarkdownPreview
                                      source={op.texto_opcion || ""}
                                      wrapperElement={{
                                        "data-color-mode": "light",
                                      }}
                                      remarkPlugins={[remarkGfm, remarkMath]}
                                      rehypePlugins={[rehypeKatex]}
                                    />
                                  </div>
                                </label>
                              </li>
                            );
                          }
                        )}
                      </ul>

                      {/* Retro inmediata por reactivo */}
                      {puedeMostrarFeedback("durante") &&
                        respuestas[q.id] != null &&
                        !graded && (
                          <div className="mt-3 text-sm">
                            {(() => {
                              const correcta = Array.isArray(q?.opciones)
                                ? q.opciones.find((o) => o?.es_correcta)
                                : null;
                              const esOk =
                                correcta &&
                                String(respuestas[q.id]) ===
                                  String(correcta.id);
                              return (
                                <div
                                  className={`px-3 py-2 rounded-lg inline-flex items-center gap-2 ${
                                    esOk
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : "bg-rose-50 text-rose-700 border border-rose-200"
                                  }`}
                                >
                                  {esOk ? "✔ Correcto" : "✘ Incorrecto"}
                                  {q?.retroalimentacion ||
                                  q?.explicacion ||
                                  q?.feedback ? (
                                    <span className="ml-2 opacity-80">
                                      {q?.retroalimentacion ??
                                        q?.explicacion ??
                                        q?.feedback}
                                    </span>
                                  ) : null}
                                </div>
                              );
                            })()}
                          </div>
                        )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {/* Acciones abajo */}
      <div className="flex flex-col md:flex-row gap-3 justify-end">
        <button
          disabled={secondsLeft === 0 || graded}
          onClick={() => {
            console.log("Respuestas seleccionadas:", respuestas);
            alert("Respuestas guardadas (demo).");
          }}
          className={`h-10 px-6 rounded-xl text-white ${
            secondsLeft === 0 || graded
              ? "bg-gray-400"
              : "bg-emerald-600 hover:bg-emerald-700"
          }`}
        >
          Guardar respuestas
        </button>

        <button
          onClick={() => {
            const res = gradeAttempt(visibles, respuestas);
            setResultado(res);
            setGraded(true);
          }}
          className="h-10 px-6 rounded-xl text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Finalizar y calificar
        </button>

        <button
          onClick={() => navigate(-1)}
          className="h-10 px-4 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Volver
        </button>
      </div>

      {/* Panel de Resultados Simulados */}
      {graded && resultado && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
          <div className="flex flex-wrap items-center gap-4 justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Resultados simulados
              </h2>
              <p className="text-gray-600">
                {resultado.correctas} correctas • {resultado.incorrectas}{" "}
                incorrectas • {resultado.omitidas} sin responder
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-extrabold text-indigo-700">
                {resultado.puntaje}%
              </div>
              <div className="text-xs text-gray-500">
                Puntaje (aciertos / {resultado.total})
              </div>
            </div>
          </div>

          {/* Barras rápidas */}
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="p-4 border rounded-xl">
              <div className="text-sm text-gray-500">Correctas</div>
              <div className="font-semibold">{resultado.correctas}</div>
              <div className="h-2 bg-gray-100 rounded mt-2">
                <div
                  className="h-2 rounded bg-emerald-500"
                  style={{
                    width: `${
                      (resultado.correctas / (resultado.total || 1)) * 100
                    }%`,
                  }}
                />
              </div>
            </div>
            <div className="p-4 border rounded-xl">
              <div className="text-sm text-gray-500">Incorrectas</div>
              <div className="font-semibold">{resultado.incorrectas}</div>
              <div className="h-2 bg-gray-100 rounded mt-2">
                <div
                  className="h-2 rounded bg-rose-500"
                  style={{
                    width: `${
                      (resultado.incorrectas / (resultado.total || 1)) * 100
                    }%`,
                  }}
                />
              </div>
            </div>
            <div className="p-4 border rounded-xl">
              <div className="text-sm text-gray-500">Omitidas</div>
              <div className="font-semibold">{resultado.omitidas}</div>
              <div className="h-2 bg-gray-100 rounded mt-2">
                <div
                  className="h-2 rounded bg-amber-500"
                  style={{
                    width: `${
                      (resultado.omitidas / (resultado.total || 1)) * 100
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Tabla Bloom */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">
              Desempeño por nivel Bloom
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 border-b">
                    <th className="py-2 pr-4">Nivel</th>
                    <th className="py-2 pr-4">Correctas</th>
                    <th className="py-2 pr-4">Incorrectas</th>
                    <th className="py-2 pr-4">Omitidas</th>
                    <th className="py-2 pr-4">Total</th>
                    <th className="py-2 pr-4">%</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(resultado.porBloom).map(([nivel, stats]) => {
                    const pct = stats.total
                      ? Math.round((stats.correctas / stats.total) * 100)
                      : 0;
                    return (
                      <tr key={nivel} className="border-b last:border-b-0">
                        <td className="py-2 pr-4 font-medium">{nivel}</td>
                        <td className="py-2 pr-4 text-emerald-700">
                          {stats.correctas}
                        </td>
                        <td className="py-2 pr-4 text-rose-700">
                          {stats.incorrectas}
                        </td>
                        <td className="py-2 pr-4 text-amber-700">
                          {stats.omitidas}
                        </td>
                        <td className="py-2 pr-4">{stats.total}</td>
                        <td className="py-2 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-100 rounded">
                              <div
                                className="h-2 bg-emerald-500 rounded"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="tabular-nums">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {Object.keys(resultado.porBloom).length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-3 text-gray-500">
                        Sin datos de nivel Bloom.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detalle por reactivo */}
          {puedeMostrarFeedback("final") && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800">
                Detalle por reactivo
              </h3>
              <ol className="space-y-4">
                {resultado.detalle.map((d, i) => (
                  <li
                    key={`det-${d.id}-${i}`}
                    className="border rounded-xl p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold
                        ${
                          d.esCorrecta
                            ? "bg-emerald-100 text-emerald-700"
                            : d.seleccion == null
                            ? "bg-amber-100 text-amber-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <div className="prose prose-slate max-w-none">
                          <MarkdownPreview
                            source={d.texto || ""}
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[
                              [rehypeKatex, { output: "html" }],
                              rehypeSlug,
                              [rehypeAutolinkHeadings, { behavior: "wrap" }],
                            ]}
                          />
                        </div>
                        <div className="mt-3 text-sm">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-1 rounded bg-gray-100 text-gray-700">
                              Bloom: {d.bloom}
                            </span>
                            <span
                              className={`px-2 py-1 rounded ${
                                d.esCorrecta
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : d.seleccion == null
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-rose-50 text-rose-700 border border-rose-200"
                              }`}
                            >
                              {d.esCorrecta
                                ? "Correcta"
                                : d.seleccion == null
                                ? "Omitida"
                                : "Incorrecta"}
                            </span>
                          </div>
                          <div className="mt-2 text-gray-700">
                            <span className="text-gray-600">
                              Respuesta correcta:{" "}
                            </span>
                            <div className="mt-1">
                              <MarkdownPreview
                                source={d.correctaTexto || "(sin texto)"}
                                wrapperElement={{
                                  "data-color-mode": "light",
                                }}
                                remarkPlugins={[remarkGfm, remarkMath]}
                                rehypePlugins={[rehypeKatex]}
                              />
                            </div>
                          </div>
                          {d.retro ? (
                            <div className="mt-2 text-gray-700">
                              <span className="text-gray-600">
                                Retroalimentación:{" "}
                              </span>
                              {d.retro}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
