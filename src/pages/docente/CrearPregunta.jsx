// src/pages/docente/CrearPregunta.jsx
import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { QuestionEditor } from "../../components/QuestionEditor";

// Markdown + LaTeX
import MarkdownPreview from "@uiw/react-markdown-preview";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import "katex/dist/katex.min.css";

// 👇 Cliente axios que ya usas en todo el proyecto
import api from "../../api/axiosClient";

// URL base de la API
const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

// Normalizador
const norm = (s) => (s || "").trim().replace(/\s+/g, " ").toLowerCase();

// Decodificar HTML almacenado
function decodeHtml(str) {
  if (typeof document === "undefined") return str ?? "";
  const txt = document.createElement("textarea");
  txt.innerHTML = str ?? "";
  return txt.value;
}

// =======================================================
//  🔁 syncOpciones: creación/actualización sin borrado
// =======================================================
async function syncOpciones({
  API,
  pid,
  opcionesMap,
  correctaClave,
  isVF,
  authJSON,
  opIdsState,
  setOpIdsState,
}) {
  let deseadas = ["A", "B", "C", "D"]
    .map((clave) => ({
      clave,
      texto_opcion: (opcionesMap[clave] || "").trim(),
      es_correcta: correctaClave === clave ? 1 : 0,
      id: opIdsState?.[clave] ?? null,
    }))
    .filter((o) => o.texto_opcion !== "");

  if (isVF) {
    const ensure = (label, k) => {
      const idx = deseadas.findIndex((o) => norm(o.texto_opcion) === norm(label));
      if (idx === -1) {
        const existing = deseadas.find((o) => o.clave === k);
        if (existing) {
          existing.texto_opcion = label;
          existing.es_correcta = correctaClave === k ? 1 : 0;
        } else {
          deseadas.push({
            clave: k,
            texto_opcion: label,
            es_correcta: correctaClave === k ? 1 : 0,
            id: opIdsState?.[k] ?? null,
          });
        }
      }
    };
    ensure("Verdadero", "A");
    ensure("Falso", "B");
    deseadas = deseadas.filter((o) => o.clave === "A" || o.clave === "B");
  }

  const nuevosIds = { ...(opIdsState || {}) };

  for (const des of deseadas) {
    if (des.id) {
      let ok = false;
      for (const method of ["PUT", "PATCH"]) {
        const up = await fetch(`${API}/opcion-respuestas/${des.id}`, {
          method,
          headers: authJSON,
          body: JSON.stringify({
            id_pregunta: pid,
            texto_opcion: des.texto_opcion,
            es_correcta: des.es_correcta,
          }),
        });
        if (up.ok) {
          ok = true;
          break;
        }
      }

      if (!ok) {
        const cr = await fetch(`${API}/opcion-respuestas`, {
          method: "POST",
          headers: authJSON,
          body: JSON.stringify({
            id_pregunta: pid,
            texto_opcion: des.texto_opcion,
            es_correcta: des.es_correcta,
          }),
        });
        if (!cr.ok) throw new Error("No se pudo actualizar/crear opción");
        const cjson = await cr.clone().json().catch(() => null);
        const newId = cjson?.id ?? cjson?.data?.id ?? null;
        if (newId) nuevosIds[des.clave] = newId;
      }
    } else {
      const res = await fetch(`${API}/opcion-respuestas`, {
        method: "POST",
        headers: authJSON,
        body: JSON.stringify({
          id_pregunta: pid,
          texto_opcion: des.texto_opcion,
          es_correcta: des.es_correcta,
        }),
      });
      if (!res.ok) throw new Error("Error al crear opción");
      const rj = await res.clone().json().catch(() => null);
      const newId = rj?.id ?? rj?.data?.id ?? null;
      if (newId) nuevosIds[des.clave] = newId;
    }
  }

  if (typeof setOpIdsState === "function") setOpIdsState(nuevosIds);
}

// =======================================================
//  COMPONENTE PRINCIPAL
// =======================================================
export default function CrearPregunta() {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const editId = search.get("edit");
  const isEdit = !!editId;

  const [pregunta, setPregunta] = useState("");
  const [explicacion, setExplicacion] = useState("");
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editorKey, setEditorKey] = useState(0);

  // catálogos
  const [blooms, setBlooms] = useState([]);
  const [difs, setDifs] = useState([]);
  const [temasList, setTemasList] = useState([]);
  const [tipos, setTipos] = useState([]);

  // selects
  const [tema, setTema] = useState("");
  const [bloomNivel, setBloomNivel] = useState("");
  const [dificultad, setDificultad] = useState("");
  const [tipo, setTipo] = useState("");

  const [opciones, setOpciones] = useState({ A: "", B: "", C: "", D: "" });
  const [opIds, setOpIds] = useState({ A: null, B: null, C: null, D: null });
  const [correcta, setCorrecta] = useState("A");

  const [previewScale, setPreviewScale] = useState(1);

  const token = localStorage.getItem("token");
  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  const hydratedRef = useRef(false);

  const safeJson = async (res) => {
    try {
      return await res.clone().json();
    } catch {
      return null;
    }
  };

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

  // =======================================================
  //  Cargar catálogos
  // =======================================================
  useEffect(() => {
    const fetchCatalogos = async () => {
      try {
        const commonHeaders = { Accept: "application/json", ...authHeaders };

        const [rB, rD, rT, rTp] = await Promise.all([
          fetch(`${API}/nivel-blooms`, { headers: commonHeaders }),
          fetch(`${API}/dificultades`, { headers: commonHeaders }),
          fetch(`${API}/temas`, { headers: commonHeaders }),
          fetch(`${API}/tipo-preguntas`, { headers: commonHeaders }),
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
  }, []);

  // =======================================================
  //  Cargar datos al editar
  // =======================================================
  useEffect(() => {
    const loadEdit = async () => {
      if (!isEdit || loading || hydratedRef.current) return;

      try {
        const commonHeaders = { Accept: "application/json", ...authHeaders };

        const rp = await fetch(`${API}/preguntas/${editId}`, { headers: commonHeaders });
        if (!rp.ok) throw new Error(`No se pudo obtener la pregunta #${editId}`);

        const jp = await rp.json();
        let texto =
          jp?.texto_pregunta ?? jp?.texto ?? jp?.enunciado ?? jp?.contenido ?? "";
        texto = decodeHtml(String(texto));

        const exp = jp?.explicacion ?? "";
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

        setEditorKey((k) => k + 1);

        let ro = await fetch(`${API}/opcion-respuestas?pregunta=${editId}`, {
          headers: commonHeaders,
        });

        if (!ro.ok) {
          ro = await fetch(`${API}/preguntas/${editId}/opciones`, {
            headers: commonHeaders,
          });
        }

        if (ro.ok) {
          const jo = await safeJson(ro);
          const list = Array.isArray(jo) ? jo : (jo?.data ?? jo?.opciones ?? []);
          if (Array.isArray(list) && list.length) {
            const map = { A: "", B: "", C: "", D: "" };
            const ids = { A: null, B: null, C: null, D: null };
            const ord = ["A", "B", "C", "D"];
            list.slice(0, 4).forEach((op, i) => {
              map[ord[i]] = op?.texto_opcion ?? op?.texto ?? "";
              ids[ord[i]] = op?.id ?? null;
              if (op?.es_correcta == 1 || op?.es_correcta === true) {
                setCorrecta(ord[i]);
              }
            });
            setOpciones(map);
            setOpIds(ids);
          }
        }
      } catch (err) {
        console.error(err);
        setMsg({ ok: false, text: err.message });
      } finally {
        hydratedRef.current = true;
      }
    };
    loadEdit();
  }, [isEdit, editId, loading, authHeaders]);

  const selectedTipo = useMemo(
    () => tipos.find((x) => String(x.id) === String(tipo)),
    [tipos, tipo]
  );
  const tipoNombre = (selectedTipo?.tipo || "").toLowerCase();
  const isOpcionMultiple = selectedTipo ? /opcion|múltiple|multiple/.test(tipoNombre) : tipo === "1";
  const isVerdaderoFalso = selectedTipo ? /verdadero|falso/.test(tipoNombre) : tipo === "2";
  const isAbierta = selectedTipo ? /abierta|texto/.test(tipoNombre) : tipo === "3";

  // =======================================================
  // Guardar / Crear
  // =======================================================
  const guardar = async (e) => {
    e.preventDefault();
    setMsg(null);
    setSaving(true);

    try {
      if (!pregunta.trim()) throw new Error("El enunciado no puede estar vacío.");
      if (!tipo) throw new Error("Selecciona el tipo de pregunta.");

      const headersAuthJson = {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...authHeaders,
      };

      const bodyPregunta = {
        texto_pregunta: pregunta,
        explicacion,
        id_tema: tema ? Number(tema) : null,
        id_nivel_bloom: bloomNivel ? Number(bloomNivel) : null,
        id_dificultad: dificultad ? Number(dificultad) : null,
        id_tipo_pregunta: Number(tipo),
        estado: 1,
      };

      // =======================
      // UPDATE (usa axios api)
      // =======================
      if (isEdit) {
        try {
          await api.put(`/preguntas/${editId}`, bodyPregunta);
        } catch (error) {
          const msgBackend =
            error?.response?.data?.message ||
            error?.response?.data?.error ||
            error?.message;
          throw new Error(msgBackend || "No se pudo actualizar la pregunta");
        }

        const tNameSel = (selectedTipo?.tipo || "").toLowerCase();
        const isOM = /opcion|múltiple|multiple/.test(tNameSel);
        const isVF = /verdadero|falso/.test(tNameSel);

        if (isOM || isVF) {
          try {
            await syncOpciones({
              API,
              pid: Number(editId),
              opcionesMap: opciones,
              correctaClave: correcta,
              isVF,
              authJSON: headersAuthJson,
              opIdsState: opIds,
              setOpIdsState: setOpIds,
            });
          } catch (e) {
            console.warn("Sync de opciones falló (se ignora para no bloquear):", e);
          }
        }

        setMsg({ ok: true, text: "✅ Pregunta actualizada correctamente" });
        setTimeout(() => navigate("/docente/banco-preguntas"), 600);
        setSaving(false);
        return;
      }

      // =======================
      // CREATE (usa axios api)
      // =======================
      let preguntaData;
      try {
        const resp = await api.post("/preguntas", bodyPregunta);
        preguntaData = resp?.data;
      } catch (error) {
        const msgBackend =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message;
        throw new Error(msgBackend || "Error al crear la pregunta");
      }

      // Intentar sacar el ID de distintas formas típicas
      let pid =
        preguntaData?.id ??
        preguntaData?.data?.id ??
        preguntaData?.pregunta?.id ??
        preguntaData?.data?.pregunta?.id ??
        preguntaData?.id_pregunta ??
        preguntaData?.data?.id_pregunta ??
        null;

      // Fallback: consultar las últimas preguntas para deducir el ID
      if (!pid) {
        try {
          const latestResp =
            (await api
              .get("/preguntas", {
                params: { order: "desc", limit: 10 },
              })
              .catch(() => null)) || (await api.get("/preguntas").catch(() => null));

          const lj = latestResp?.data;
          const list = Array.isArray(lj)
            ? lj
            : lj?.data ?? lj?.preguntas ?? lj?.preguntas?.data ?? [];

          if (Array.isArray(list) && list.length) {
            const match = list.find(
              (p) =>
                (p?.texto_pregunta ?? p?.texto ?? p?.enunciado ?? p?.contenido ?? "") ===
                pregunta
            );
            if (match?.id) {
              pid = Number(match.id);
            } else {
              const maxById = list.reduce((acc, cur) => {
                const cid = Number(cur?.id ?? -1);
                return cid > (acc?.id ?? -1) ? { id: cid } : acc;
              }, null);
              if (maxById?.id > 0) pid = maxById.id;
            }
          }
        } catch (e) {
          console.warn("No se pudo deducir ID desde el listado de preguntas:", e);
        }
      }

      // Si aun así no hay PID, no bloqueamos la creación de la pregunta
      if (!pid) {
        console.warn(
          "No se pudo determinar el ID de la pregunta recién creada. Se continúa sin crear opciones."
        );
        setMsg({
          ok: true,
          text: "✅ Pregunta creada (no se detectó ID para registrar las opciones).",
        });
        setTimeout(() => navigate("/docente/banco-preguntas"), 700);
        return;
      }

      // Crear opciones si aplica (ya con PID)
      const tName = (selectedTipo?.tipo || "").toLowerCase();
      const isOMCreate = /opcion|múltiple|multiple/.test(tName);
      const isVFCreate = /verdadero|falso/.test(tName);

      if (isOMCreate || isVFCreate) {
        let opcionesPayload = Object.entries(opciones)
          .filter(([_, texto]) => (texto || "").trim() !== "")
          .map(([clave, texto]) => ({
            id_pregunta: pid,
            texto_opcion: texto,
            es_correcta: correcta === clave ? 1 : 0,
            clave,
          }));

        if (isVFCreate) {
          const ensure = (label, k) => {
            if (!opcionesPayload.find((o) => norm(o.texto_opcion) === norm(label))) {
              opcionesPayload.push({
                id_pregunta: pid,
                texto_opcion: label,
                es_correcta: correcta === k ? 1 : 0,
                clave: k,
              });
            }
          };
          ensure("Verdadero", "A");
          ensure("Falso", "B");
          opcionesPayload = opcionesPayload.filter((o) => o.clave === "A" || o.clave === "B");
        }

        for (const opcion of opcionesPayload) {
          const res = await fetch(`${API}/opcion-respuestas`, {
            method: "POST",
            headers: headersAuthJson,
            body: JSON.stringify({
              id_pregunta: opcion.id_pregunta,
              texto_opcion: opcion.texto_opcion,
              es_correcta: opcion.es_correcta,
            }),
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

  // =======================================================
  // UI
  // =======================================================
  const prettyTipo =
    selectedTipo?.tipo ||
    (isOpcionMultiple ? "Opción múltiple" : isVerdaderoFalso ? "Verdadero/Falso" : "—");

  const prettyBloom =
    blooms.find((b) => String(b.id) === String(bloomNivel))?.nombre || "—";
  const prettyDificultad =
    difs.find((d) => String(d.id) === String(dificultad))?.nivel || "—";
  const prettyTema =
    temasList.find((t) => String(t.id) === String(tema))?.nombre || "";

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        {isEdit ? "Editar Pregunta" : "Crear Pregunta"}
      </h1>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* FORMULARIO */}
        <form
          onSubmit={guardar}
          className="xl:col-span-7 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800">Datos generales</h2>
            <span className="text-xs text-gray-500">
              Campos obligatorios marcados con *
            </span>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Tema */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Tema*</label>
              <select
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-xl px-3 focus:ring-2 focus:ring-purple-600"
              >
                <option value="">-- Selecciona un tema --</option>
                {temasList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Tipo de pregunta*
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-xl px-3 focus:ring-2 focus:ring-purple-600"
              >
                <option value="">-- Seleccionar --</option>
                {tipos.map((tp) => (
                  <option key={tp.id} value={tp.id}>
                    {tp.tipo}
                  </option>
                ))}
              </select>
            </div>

            {/* Bloom */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Nivel de Bloom
              </label>
              <select
                value={bloomNivel}
                onChange={(e) => setBloomNivel(e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-xl px-3 focus:ring-2 focus:ring-purple-600"
              >
                <option value="">-- Seleccionar --</option>
                {blooms.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Dificultad */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Dificultad
              </label>
              <select
                value={dificultad}
                onChange={(e) => setDificultad(e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-xl px-3 focus:ring-2 focus:ring-purple-600"
              >
                <option value="">-- Seleccionar --</option>
                {difs.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nivel}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Contenido (enunciado)*
                
              </label>
              
            </div>
            <QuestionEditor
              key={editorKey}
              value={pregunta}
              onChange={setPregunta}
              
            />
            <p className="text-xs text-gray-500">
              Tip: inline <code>$a^2+b^2=c^2$</code> o bloque <code>{`$$\\int_0^1 x^2 dx$$`}</code>.
            </p>
          </div>

          {/* Opciones - OM */}
          {isOpcionMultiple && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-800">
                Incisos (opción múltiple)
              </h3>

              <div className="grid md:grid-cols-2 gap-3">
                {["A", "B", "C", "D"].map((k) => (
                  <div key={k} className="space-y-1">
                    <label className="block text-xs font-medium text-gray-600">
                      Opción {k}
                    </label>
                    <input
                      type="text"
                      name={k}
                      value={opciones[k]}
                      onChange={(e) =>
                        setOpciones((prev) => ({
                          ...prev,
                          [k]: e.target.value,
                        }))
                      }
                      className="w-full h-10 border border-gray-300 rounded-xl px-3 focus:ring-2 focus:ring-purple-600"
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">
                  Respuesta correcta
                </label>
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

          {/* Verdadero/Falso */}
          {isVerdaderoFalso && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-800">
                Incisos (Verdadero/Falso)
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {[{ k: "A", label: "Verdadero" }, { k: "B", label: "Falso" }].map(
                  ({ k, label }) => (
                    <label
                      key={k}
                      className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer ${
                        correcta === k
                          ? "border-purple-500 bg-purple-50"
                          : "border-gray-200 hover:bg-gray-50"
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
                  )
                )}
              </div>
            </div>
          )}

          {/* Respuesta Abierta */}
          {isAbierta && (
            <p className="text-sm text-gray-600">
              El alumno escribirá su respuesta. La calificación puede ser
              manual o automática.
            </p>
          )}

          {/* Explicación */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Explicación de la respuesta
            </label>
            <textarea
              rows={4}
              value={explicacion}
              onChange={(e) => setExplicacion(e.target.value)}
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
              {saving
                ? isEdit
                  ? "Actualizando..."
                  : "Guardando..."
                : isEdit
                ? "Actualizar"
                : "Guardar Pregunta"}
            </button>
          </div>

          {msg && (
            <p
              className={`text-sm ${
                msg.ok ? "text-green-600" : "text-red-600"
              }`}
            >
              {msg.text}
            </p>
          )}
        </form>

        {/* PREVIEW */}
        <aside className="xl:col-span-5">
          <div className="sticky top-6">
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-gray-700">
                    Vista previa
                  </span>

                  {prettyTema && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      {prettyTema}
                    </span>
                  )}

                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                    {prettyTipo}
                  </span>

                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                    Bloom: {prettyBloom}
                  </span>

                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                    Dificultad: {prettyDificultad}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewScale((s) => Math.max(0.9, s - 0.05))
                    }
                    className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
                  >
                    A−
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewScale((s) => Math.min(1.2, s + 0.05))
                    }
                    className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
                  >
                    A+
                  </button>
                </div>
              </div>

              <div className="px-5 py-5" data-color-mode="light">
                <div
                  className="prose max-w-none"
                  style={{
                    transform: `scale(${previewScale})`,
                    transformOrigin: "top left",
                  }}
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

                  {isOpcionMultiple && (
                    <ul className="mt-4 space-y-2">
                      {["A", "B", "C", "D"].map(
                        (k) =>
                          opciones[k] && (
                            <li
                              key={k}
                              className={`border rounded-xl px-4 py-2 ${
                                correcta === k
                                  ? "border-purple-500 bg-purple-50"
                                  : "border-gray-200"
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <strong className="mt-1">{k})</strong>
                                <div className="flex-1">
                                  <MarkdownPreview
                                    source={opciones[k]}
                                    remarkPlugins={[remarkGfm, remarkMath]}
                                    rehypePlugins={[
                                      [rehypeKatex, { output: "html" }],
                                    ]}
                                  />
                                </div>
                              </div>
                            </li>
                          )
                      )}
                    </ul>
                  )}

                  {isVerdaderoFalso && (
                    <ul className="mt-4 space-y-2">
                      {[{ k: "A", label: "Verdadero" }, { k: "B", label: "Falso" }].map(
                        ({ k, label }) => (
                          <li
                            key={k}
                            className={`border rounded-xl px-4 py-2 ${
                              correcta === k
                                ? "border-purple-500 bg-purple-50"
                                : "border-gray-200"
                            }`}
                          >
                            <strong>{k})</strong> {label}
                          </li>
                        )
                      )}
                    </ul>
                  )}

                  {explicacion && (
                    <div className="mt-6 p-4 border rounded-xl bg-white">
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
