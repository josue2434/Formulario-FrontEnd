// src/pages/docente/CrearPregunta.jsx
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { QuestionEditor } from "../../components/QuestionEditor";
import MarkdownPreview from "@uiw/react-markdown-preview";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import "katex/dist/katex.min.css";

const API = "http://localhost:8000/api";

// Utilidad: normalizar string
const norm = (s) => (s || "").trim().replace(/\s+/g, " ").toLowerCase();

// (Opcional) decodificar HTML entidades simples si tu API devuelve &quot; etc.
function decodeHtml(str) {
  if (typeof document === "undefined") return str ?? "";
  const txt = document.createElement("textarea");
  txt.innerHTML = str ?? "";
  return txt.value;
}

export default function CrearPregunta() {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const editId = search.get("edit");
  const isEdit = !!editId;

  // ===== Estado base =====
  const [pregunta, setPregunta] = useState("");
  const [explicacion, setExplicacion] = useState("");
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Clave para forzar re-montaje del editor cuando llega el valor asíncrono
  const [editorKey, setEditorKey] = useState(0);

  // ===== Catálogos =====
  const [blooms, setBlooms] = useState([]);       // [{id, nombre}]
  const [difs, setDifs] = useState([]);           // [{id, nivel}]
  const [temasList, setTemasList] = useState([]); // [{id, nombre}]
  const [tipos, setTipos] = useState([]);         // [{id, tipo}]

  // ===== Selecciones =====
  const [tema, setTema] = useState("");             // id_tema
  const [bloomNivel, setBloomNivel] = useState(""); // id_nivel_bloom
  const [dificultad, setDificultad] = useState(""); // id_dificultad
  const [tipo, setTipo] = useState("");             // id_tipo_pregunta

  // ===== Opciones e inciso correcto =====
  const [opciones, setOpciones] = useState({ A: "", B: "", C: "", D: "" });
  const [correcta, setCorrecta] = useState("A");

  // ===== Preview scale =====
  const [previewScale, setPreviewScale] = useState(1);

  // =================== Helpers ===================
  const token = localStorage.getItem("token");
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const parseOrEmpty = (txt) => {
    try {
      const json = JSON.parse(txt);
      if (Array.isArray(json)) return json;
      if (json.data && Array.isArray(json.data)) return json.data;
      if (json.niveles) return json.niveles;
      if (json.temas) return json.temas;
      if (json.dificultades) return json.dificultades;
      if (json.tipos) return json.tipos;
      if (json.pregunta) return [json.pregunta];
      return [];
    } catch {
      return [];
    }
  };

  const safeJson = async (res) => {
    try { return await res.clone().json(); } catch { return null; }
  };

  // =================== Cargar catálogos ===================
  useEffect(() => {
    const fetchCatalogos = async () => {
      try {
        const [rB, rD, rT, rTp] = await Promise.all([
          fetch(`${API}/nivel-blooms`, { headers: authHeaders }),
          fetch(`${API}/dificultades`, { headers: authHeaders }),
          fetch(`${API}/temas`, { headers: authHeaders }),
          fetch(`${API}/tipo-preguntas`, { headers: authHeaders }),
        ]);

        const textos = await Promise.all([rB.text(), rD.text(), rT.text(), rTp.text()]);
        setBlooms(parseOrEmpty(textos[0]));
        setDifs(parseOrEmpty(textos[1]));
        setTemasList(parseOrEmpty(textos[2]));
        setTipos(parseOrEmpty(textos[3]));
      } catch (err) {
        console.error("Error cargando catálogos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalogos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =================== Cargar pregunta (modo edición) ===================
  useEffect(() => {
    const loadEdit = async () => {
      if (!isEdit) return;
      if (loading) return; // esperamos catálogos para poder preseleccionar

      try {
        // 1) GET pregunta
        const rp = await fetch(`${API}/preguntas/${editId}`, { headers: authHeaders });
        if (!rp.ok) {
          const t = await rp.text();
          throw new Error(t || `No se pudo obtener la pregunta #${editId}`);
        }
        const jp = await rp.json();
        // console.log("Pregunta API:", jp);

        // Fallbacks de nombre de campo para el enunciado
        let texto =
          jp?.texto_pregunta ??
          jp?.texto ??
          jp?.enunciado ??
          jp?.contenido ??
          "";

        // Si viene HTML-escapado, lo normalizamos (opcional)
        texto = decodeHtml(String(texto));

        const exp = jp?.explicacion ?? jp?.explicación ?? "";

        const idTema = jp?.id_tema ?? jp?.tema?.id ?? "";
        const idBloom = jp?.id_nivel_bloom ?? jp?.nivel_bloom?.id ?? "";
        const idDif = jp?.id_dificultad ?? jp?.dificultad?.id ?? "";
        const idTipo = jp?.id_tipo_pregunta ?? jp?.tipo_pregunta?.id ?? "";

        setPregunta(texto);
        setExplicacion(exp);
        setTema(idTema ? String(idTema) : "");
        setBloomNivel(idBloom ? String(idBloom) : "");
        setDificultad(idDif ? String(idDif) : "");
        setTipo(idTipo ? String(idTipo) : "");

        // 🚀 Forzar que el editor se “reinicialice” con el nuevo valor
        setEditorKey((k) => k + 1);

        // 2) (Opcional) cargar opciones si tu API las expone
        try {
          let ro = await fetch(`${API}/opcion-respuestas?pregunta=${editId}`, { headers: authHeaders });
          if (!ro.ok) {
            ro = await fetch(`${API}/preguntas/${editId}/opciones`, { headers: authHeaders });
          }
          if (ro.ok) {
            const jo = await safeJson(ro);
            const list = Array.isArray(jo) ? jo : (jo?.data ?? jo?.opciones ?? []);
            if (Array.isArray(list) && list.length) {
              const map = { A: "", B: "", C: "", D: "" };
              const ord = ["A", "B", "C", "D"];
              list.slice(0, 4).forEach((op, i) => {
                map[ord[i]] = op?.texto_opcion ?? op?.texto ?? "";
                if (op?.es_correcta == 1 || op?.es_correcta === true) {
                  setCorrecta(ord[i]);
                }
              });
              setOpciones(map);
            }
          }
        } catch (e) {
          console.warn("No se pudieron cargar opciones de la pregunta (no crítico).", e);
        }
      } catch (err) {
        console.error(err);
        setMsg({ ok: false, text: err.message || "No se pudo cargar la pregunta para editar" });
      }
    };

    loadEdit();
  }, [isEdit, editId, authHeaders, loading]);

  // ===== Helpers para el tipo seleccionado =====
  const selectedTipo = useMemo(
    () => tipos.find((x) => String(x.id) === String(tipo)),
    [tipos, tipo]
  );

  const tipoNombre = (selectedTipo?.tipo || "").toLowerCase();
  const isOpcionMultiple = selectedTipo
    ? /opcion|múltiple|multiple/.test(tipoNombre)
    : tipo === "1";
  const isVerdaderoFalso = selectedTipo
    ? /verdadero|falso/.test(tipoNombre)
    : tipo === "2";
  const isAbierta = selectedTipo
    ? /abierta|abierto|texto/.test(tipoNombre)
    : tipo === "3";

  // Ajustar opciones por defecto al cambiar tipo
  useEffect(() => {
    if (isVerdaderoFalso) {
      setOpciones(() => {
        const next = { A: "Verdadero", B: "Falso", C: "", D: "" };
        setCorrecta((c) => (c === "A" || c === "B" ? c : "A"));
        return next;
      });
    } else if (isAbierta) {
      setOpciones({ A: "", B: "", C: "", D: "" });
      setCorrecta("A");
    }
  }, [isVerdaderoFalso, isAbierta]);

  const onChangeOpcion = (e) => {
    const { name, value } = e.target;
    setOpciones((prev) => ({ ...prev, [name]: value }));
  };

  // Chips bonitos en preview
  const prettyTipo =
    selectedTipo?.tipo ||
    (isOpcionMultiple ? "Opción múltiple" : isVerdaderoFalso ? "Verdadero/Falso" : isAbierta ? "Abierta" : "—");
  const prettyBloom = blooms.find((b) => String(b.id) === String(bloomNivel))?.nombre || "—";
  const prettyDificultad = difs.find((d) => String(d.id) === String(dificultad))?.nivel || "—";
  const prettyTema = temasList.find((t) => String(t.id) === String(tema))?.nombre || "";

  // =================== Guardar / Actualizar ===================
  const guardar = async (e) => {
    e.preventDefault();
    setMsg(null);
    setSaving(true);

    try {
      if (!pregunta.trim()) throw new Error("El enunciado no puede estar vacío.");
      if (!tipo) throw new Error("Selecciona el tipo de pregunta.");

      const headersAuthJson = {
        "Content-Type": "application/json",
        ...authHeaders,
      };

      const bodyPregunta = {
        texto_pregunta: pregunta,
        explicacion,
        id_tema: tema ? Number(tema) : null,
        id_nivel_bloom: bloomNivel ? Number(bloomNivel) : null,
        id_dificultad: dificultad ? Number(dificultad) : null,
        id_tipo_pregunta: Number(tipo),
        estado: 1, // al crear/actualizar dejamos activa
      };

      if (isEdit) {
        const putRes = await fetch(`${API}/preguntas/${editId}`, {
          method: "PUT",
          headers: headersAuthJson,
          body: JSON.stringify(bodyPregunta),
        });
        const putJson = await safeJson(putRes);
        if (!putRes.ok) {
          throw new Error(putJson?.message || (await putRes.text()) || "No se pudo actualizar la pregunta");
        }

        setMsg({ ok: true, text: "✅ Pregunta actualizada correctamente" });
        setTimeout(() => navigate("/docente/banco-preguntas"), 700);
        setSaving(false);
        return;
      }

      const preguntaRes = await fetch(`${API}/preguntas`, {
        method: "POST",
        headers: headersAuthJson,
        body: JSON.stringify(bodyPregunta),
      });

      const preguntaData = await safeJson(preguntaRes);
      if (!preguntaRes.ok) {
        const errTxt = preguntaData?.message || (await preguntaRes.text());
        throw new Error(errTxt || "Error al crear la pregunta");
      }

      let pid = preguntaData?.id || preguntaData?.data?.id || preguntaData?.pregunta?.id || null;
      if (!pid) {
        const loc = preguntaRes.headers.get("Location") || preguntaRes.headers.get("location");
        if (loc) {
          const m = loc.match(/\/preguntas\/(\d+)/) || loc.match(/\/(\d+)\s*$/);
          if (m) pid = Number(m[1]);
        }
      }
      if (!pid) throw new Error("No se obtuvo el ID de la pregunta creada");

      // Crear opciones si aplica
      const tName = (tipos.find((x) => String(x.id) === String(tipo))?.tipo || "").toLowerCase();
      const isOM = /opcion|múltiple|multiple/.test(tName);
      const isVF = /verdadero|falso/.test(tName);

      if (isOM || isVF) {
        let opcionesPayload = Object.entries(opciones)
          .filter(([_, texto]) => (texto || "").trim() !== "")
          .map(([clave, texto]) => ({
            id_pregunta: pid,
            texto_opcion: texto,
            es_correcta: correcta === clave ? 1 : 0,
          }));

        if (isVF) {
          const ensure = (label, k) => {
            if (!opcionesPayload.find((o) => norm(o.texto_opcion) === norm(label))) {
              opcionesPayload.push({
                id_pregunta: pid,
                texto_opcion: label,
                es_correcta: correcta === k ? 1 : 0,
              });
            }
          };
          ensure("Verdadero", "A");
          ensure("Falso", "B");
        }

        for (const opcion of opcionesPayload) {
          const res = await fetch(`${API}/opcion-respuestas`, {
            method: "POST",
            headers: headersAuthJson,
            body: JSON.stringify(opcion),
          });
          if (!res.ok) {
            const t = await res.text();
            throw new Error(`Error al guardar una opción: ${t || res.status}`);
          }
        }
      }

      setMsg({ ok: true, text: "✅ Pregunta creada correctamente" });
      setTimeout(() => navigate("/docente/banco-preguntas"), 700);
    } catch (err) {
      console.error(err);
      setMsg({ ok: false, text: err.message || "Error inesperado" });
    } finally {
      setSaving(false);
    }
  };

  // ===== UI =====
  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        {isEdit ? "Editar Pregunta" : "Crear Pregunta"}
      </h1>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* ===== FORMULARIO (span 7/12 en xl) ===== */}
        <form
          onSubmit={guardar}
          className="xl:col-span-7 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6"
        >
          {/* Header de sección */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800">Datos generales</h2>
            <span className="text-xs text-gray-500">Campos obligatorios marcados con *</span>
          </div>

          {/* Selecciones principales */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Tema*</label>
              <select
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-xl px-3 focus:ring-2 focus:ring-purple-600"
              >
                <option value="">-- Selecciona un tema --</option>
                {temasList.map((t) => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Tipo de pregunta*</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-xl px-3 focus:ring-2 focus:ring-purple-600"
              >
                <option value="">-- Seleccionar --</option>
                {tipos.map((tp) => (
                  <option key={tp.id} value={tp.id}>{tp.tipo}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Nivel de Bloom</label>
              <select
                value={bloomNivel}
                onChange={(e) => setBloomNivel(e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-xl px-3 focus:ring-2 focus:ring-purple-600"
              >
                <option value="">-- Seleccionar --</option>
                {blooms.map((b) => (
                  <option key={b.id} value={b.id}>{b.nombre}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Dificultad</label>
              <select
                value={dificultad}
                onChange={(e) => setDificultad(e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-xl px-3 focus:ring-2 focus:ring-purple-600"
              >
                <option value="">-- Seleccionar --</option>
                {difs.map((d) => (
                  <option key={d.id} value={d.id}>{d.nivel}</option>
                ))}
              </select>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Contenido (enunciado)*</label>
            </div>
            {/* 👇 clave para forzar re-montaje cuando cargamos en edición */}
            <QuestionEditor key={editorKey} value={pregunta} onChange={setPregunta} />
            <p className="text-xs text-gray-500">
              Tip: inline <code>$a^2+b^2=c^2$</code> o bloque <code>{`$$\\int_0^1 x^2 dx$$`}</code>.
            </p>
          </div>

          {/* Opciones */}
          {isOpcionMultiple && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-800">Incisos (opción múltiple)</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {["A", "B", "C", "D"].map((k) => (
                  <div key={k} className="space-y-1">
                    <label className="block text-xs font-medium text-gray-600">Opción {k}</label>
                    <input
                      type="text"
                      name={k}
                      value={opciones[k]}
                      onChange={onChangeOpcion}
                      placeholder={`Texto de la opción ${k}`}
                      className="w-full h-10 border border-gray-300 rounded-xl px-3 focus:ring-2 focus:ring-purple-600"
                    />
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">Respuesta correcta</label>
                <select
                  value={correcta}
                  onChange={(e) => setCorrecta(e.target.value)}
                  className="w-full h-10 border border-gray-300 rounded-xl px-3 focus:ring-2 focus:ring-purple-600"
                >
                  {["A", "B", "C", "D"].map((k) => (
                    <option key={k} value={k}>
                      {k} — {opciones[k] || "sin texto"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {isVerdaderoFalso && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-800">Incisos (Verdadero / Falso)</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {[{ k: "A", label: "Verdadero" }, { k: "B", label: "Falso" }].map(({ k, label }) => (
                  <label
                    key={k}
                    className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer ${
                      correcta === k ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="vf"
                      checked={correcta === k}
                      onChange={() => setCorrecta(k)}
                      className="accent-purple-600"
                    />
                    <span className="font-medium">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {isAbierta && (
            <p className="text-sm text-gray-600">
              El alumno escribirá su respuesta. La calificación puede ser manual o por palabras clave.
            </p>
          )}

          {/* Explicación */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Explicación de la respuesta</label>
            <textarea
              rows={4}
              value={explicacion}
              onChange={(e) => setExplicacion(e.target.value)}
              placeholder="Justifica la respuesta correcta, incluye pistas o referencias…"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-600"
            />
          </div>

          {/* Botones */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate("/docente/banco-preguntas")}
              className="h-10 px-5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-10 px-6 rounded-xl bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {saving ? (isEdit ? "Actualizando..." : "Guardando...") : (isEdit ? "Actualizar" : "Guardar Pregunta")}
            </button>
          </div>

          {msg && (
            <p className={`text-sm ${msg.ok ? "text-green-600" : "text-red-600"}`}>
              {msg.text}
            </p>
          )}
        </form>

        {/* ===== PREVIEW (span 5/12 en xl) ===== */}
        <aside className="xl:col-span-5">
          <div className="sticky top-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b bg-white">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-gray-700">Vista previa</span>
                  {prettyTema && (
                    <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      {prettyTema}
                    </span>
                  )}
                  <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                    {prettyTipo}
                  </span>
                  <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                    Bloom: {prettyBloom}
                  </span>
                  <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                    Dificultad: {prettyDificultad}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewScale((s) => Math.max(0.9, +(s - 0.05).toFixed(2)))}
                    className="text-xs px-2 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50"
                    title="Reducir"
                  >
                    A−
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewScale((s) => Math.min(1.2, +(s + 0.05).toFixed(2)))}
                    className="text-xs px-2 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50"
                    title="Aumentar"
                  >
                    A+
                  </button>
                </div>
              </div>

              <div className="px-5 py-5" data-color-mode="light">
                <div
                  className="prose prose-slate max-w-none prose-p:leading-relaxed prose-pre:bg-slate-50 prose-pre:text-slate-800 prose-code:bg-slate-100"
                  style={{ transform: `scale(${previewScale})`, transformOrigin: "top left" }}
                >
                  <MarkdownPreview
                    source={pregunta}
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[
                      [rehypeKatex, { output: "html" }],
                      rehypeSlug,
                      [rehypeAutolinkHeadings, { behavior: "wrap" }],
                    ]}
                  />

                  {/* Vista previa de incisos */}
                  {isOpcionMultiple && (
                    <ul className="mt-4 space-y-2">
                      {["A", "B", "C", "D"].map(
                        (k) =>
                          opciones[k] && (
                            <li
                              key={k}
                              className={`border rounded-xl px-4 py-2 ${
                                correcta === k ? "border-purple-500 bg-purple-50" : "border-gray-200"
                              }`}
                            >
                              <strong>{k})</strong> {opciones[k]}
                            </li>
                          )
                      )}
                    </ul>
                  )}

                  {isVerdaderoFalso && (
                    <ul className="mt-4 space-y-2">
                      {[{ k: "A", label: "Verdadero" }, { k: "B", label: "Falso" }].map(({ k, label }) => (
                        <li
                          key={k}
                          className={`border rounded-xl px-4 py-2 ${
                            correcta === k ? "border-purple-500 bg-purple-50" : "border-gray-200"
                          }`}
                        >
                          <strong>{k})</strong> {label}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Explicación */}
                  {explicacion && (
                    <div className="mt-6 p-4 rounded-xl border bg-white">
                      <h4 className="m-0">Explicación</h4>
                      <p className="mt-1 whitespace-pre-wrap">{explicacion}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
