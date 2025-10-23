// src/pages/docente/CrearPregunta.jsx
import { useState, useEffect, useMemo, useRef } from "react";
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

// Normalizar string
const norm = (s) => (s || "").trim().replace(/\s+/g, " ").toLowerCase();

// Decodificar HTML si viene escapado
function decodeHtml(str) {
  if (typeof document === "undefined") return str ?? "";
  const txt = document.createElement("textarea");
  txt.innerHTML = str ?? "";
  return txt.value;
}

// ===== Sincronizar opciones en edición (sin DELETE) =====
async function syncOpciones({
  API,
  pid,
  opcionesMap,
  correctaClave,
  isVF,
  authJSON,
  authHeaders, // no se usa, se deja por compatibilidad
  opIdsState,
  setOpIdsState,
}) {
  // 1) Construye la lista deseada A..D con IDs actuales
  let deseadas = ["A", "B", "C", "D"]
    .map((clave) => ({
      clave,
      texto_opcion: (opcionesMap[clave] || "").trim(),
      es_correcta: correctaClave === clave ? 1 : 0,
      id: opIdsState?.[clave] ?? null,
    }))
    .filter((o) => o.texto_opcion !== "");

  // 2) Si es Verdadero/Falso, asegura A=Verdadero, B=Falso y limita a A/B
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

  // 3) Actualiza por ID si existe; si no, crea — NUNCA borrar
  const nuevosIds = { ...(opIdsState || {}) };

  for (const des of deseadas) {
    if (des.id) {
      // UPDATE por ID
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
        // Fallback: crear (sin borrar la anterior)
        const cr = await fetch(`${API}/opcion-respuestas`, {
          method: "POST",
          headers: authJSON,
          body: JSON.stringify({
            id_pregunta: pid,
            texto_opcion: des.texto_opcion,
            es_correcta: des.es_correcta,
          }),
        });
        if (!cr.ok) {
          const t = await cr.text();
          throw new Error(`No se pudo actualizar/crear opción "${des.texto_opcion}": ${t || cr.status}`);
        }
        const cjson = await cr.clone().json().catch(() => null);
        const newId = cjson?.id ?? cjson?.data?.id ?? null;
        if (newId) nuevosIds[des.clave] = newId;
      }
    } else {
      // CREATE
      const res = await fetch(`${API}/opcion-respuestas`, {
        method: "POST",
        headers: authJSON,
        body: JSON.stringify({
          id_pregunta: pid,
          texto_opcion: des.texto_opcion,
          es_correcta: des.es_correcta,
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Error al crear opción "${des.texto_opcion}": ${t || res.status}`);
      }
      const rj = await res.clone().json().catch(() => null);
      const newId = rj?.id ?? rj?.data?.id ?? null;
      if (newId) nuevosIds[des.clave] = newId;
    }
  }

  // 4) No borres sobrantes (backend devuelve 403). El front usará solo A..D.

  // 5) Actualiza estado local de IDs
  if (typeof setOpIdsState === "function") setOpIdsState(nuevosIds);
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
  const [loading, setLoading] = useState(true); // esperar catálogos
  const [editorKey, setEditorKey] = useState(0); // re-montar editor

  // ===== Catálogos =====
  const [blooms, setBlooms] = useState([]);
  const [difs, setDifs] = useState([]);
  const [temasList, setTemasList] = useState([]);
  const [tipos, setTipos] = useState([]);

  // ===== Selecciones =====
  const [tema, setTema] = useState("");
  const [bloomNivel, setBloomNivel] = useState("");
  const [dificultad, setDificultad] = useState("");
  const [tipo, setTipo] = useState("");

  // ===== Opciones y IDs =====
  const [opciones, setOpciones] = useState({ A: "", B: "", C: "", D: "" });
  const [opIds, setOpIds] = useState({ A: null, B: null, C: null, D: null });

  // ===== Correcta =====
  const [correcta, setCorrecta] = useState("A");

  // ===== Preview scale =====
  const [previewScale, setPreviewScale] = useState(1);

  // ===== Auth headers (memo) =====
  const token = localStorage.getItem("token");
  const authHeaders = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);

  // Evitar sobreescritura del formulario tras la primera hidratación
  const hydratedRef = useRef(false);

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
    try {
      return await res.clone().json();
    } catch {
      return null;
    }
  };

  // ===== Cargar catálogos =====
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
  }, []); // <- no dependemos de authHeaders para no re-ejecutar

  // ===== Cargar pregunta (modo edición) =====
  useEffect(() => {
    const loadEdit = async () => {
      if (!isEdit) return;
      if (loading) return;
      if (hydratedRef.current) return; // ya hidratado

      try {
        const rp = await fetch(`${API}/preguntas/${editId}`, { headers: authHeaders });
        if (!rp.ok) {
          const t = await rp.text();
          throw new Error(t || `No se pudo obtener la pregunta #${editId}`);
        }
        const jp = await rp.json();

        let texto =
          jp?.texto_pregunta ?? jp?.texto ?? jp?.enunciado ?? jp?.contenido ?? "";
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

        // re-montar editor para que muestre el valor
        setEditorKey((k) => k + 1);

        // cargar opciones e IDs
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
            } else {
              setOpIds({ A: null, B: null, C: null, D: null });
            }
          }
        } catch (e) {
          console.warn("No se pudieron cargar opciones de la pregunta (no crítico).", e);
        }
      } catch (err) {
        console.error(err);
        setMsg({ ok: false, text: err.message || "No se pudo cargar la pregunta para editar" });
      } finally {
        // Marcamos como hidratado para no volver a pisar selects/inputs
        hydratedRef.current = true;
      }
    };

    loadEdit();
    // OJO: no pongas authHeaders en deps para no re-ejecutar y pisar cambios
  }, [isEdit, editId, loading]); 

  // ===== Helpers de tipo =====
  const selectedTipo = useMemo(
    () => tipos.find((x) => String(x.id) === String(tipo)),
    [tipos, tipo]
  );
  const tipoNombre = (selectedTipo?.tipo || "").toLowerCase();
  const isOpcionMultiple = selectedTipo ? /opcion|múltiple|multiple/.test(tipoNombre) : tipo === "1";
  const isVerdaderoFalso = selectedTipo ? /verdadero|falso/.test(tipoNombre) : tipo === "2";
  const isAbierta = selectedTipo ? /abierta|abierto|texto/.test(tipoNombre) : tipo === "3";

  // Ajustar opciones/IDs por defecto al cambiar tipo
  useEffect(() => {
    if (isVerdaderoFalso) {
      // Para VF mantenemos fijos los textos
      setOpciones(() => {
        const next = { A: "Verdadero", B: "Falso", C: "", D: "" };
        setCorrecta((c) => (c === "A" || c === "B" ? c : "A"));
        return next;
      });
      // Conserva IDs de A/B si ya existen, nulifica C/D
      setOpIds((prev) => ({ A: prev.A ?? null, B: prev.B ?? null, C: null, D: null }));
    } else if (isAbierta) {
      // Para abierta limpiamos incisos
      setOpciones({ A: "", B: "", C: "", D: "" });
      setCorrecta("A");
      setOpIds({ A: null, B: null, C: null, D: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVerdaderoFalso, isAbierta]);

  const onChangeOpcion = (e) => {
    const { name, value } = e.target;
    setOpciones((prev) => ({ ...prev, [name]: value }));
  };

  // Chips
  const prettyTipo =
    selectedTipo?.tipo ||
    (isOpcionMultiple ? "Opción múltiple" : isVerdaderoFalso ? "Verdadero/Falso" : isAbierta ? "Abierta" : "—");
  const prettyBloom = blooms.find((b) => String(b.id) === String(bloomNivel))?.nombre || "—";
  const prettyDificultad = difs.find((d) => String(d.id) === String(dificultad))?.nivel || "—";
  const prettyTema = temasList.find((t) => String(t.id) === String(tema))?.nombre || "";

  // ===== Guardar / Actualizar =====
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
        estado: 1,
      };

      // ===== MODO EDICIÓN =====
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

        // Sincronizar incisos si aplica (sin DELETE) — no bloquear si falla
        const tNameSel = (tipos.find((x) => String(x.id) === String(tipo))?.tipo || "").toLowerCase();
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
              authHeaders,
              opIdsState: opIds,
              setOpIdsState: setOpIds,
            });
          } catch (e) {
            console.warn("Sync de opciones falló (se ignora para no bloquear):", e);
          }
        }

        // Redirigir al banco de preguntas tras actualizar
        setMsg({ ok: true, text: "✅ Pregunta actualizada correctamente" });
        setTimeout(() => navigate("/docente/banco-preguntas"), 600);
        setSaving(false);
        return;
      }

      // ===== MODO CREACIÓN =====
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

      // 1) Intentar leer ID de muchas formas comunes en el body
      let pid =
        preguntaData?.id ??
        preguntaData?.data?.id ??
        preguntaData?.pregunta?.id ??
        preguntaData?.data?.pregunta?.id ??
        preguntaData?.insertId ??
        preguntaData?.data?.insertId ??
        preguntaData?.lastInsertId ??
        preguntaData?.last_id ??
        preguntaData?.id_pregunta ??
        null;

      // 2) Intentar headers típicos de ubicación
      if (!pid) {
        const loc =
          preguntaRes.headers.get("Location") ||
          preguntaRes.headers.get("location") ||
          preguntaRes.headers.get("Content-Location") ||
          preguntaRes.headers.get("content-location");
        if (loc) {
          const m =
            loc.match(/\/preguntas\/(\d+)/) ||
            loc.match(/\/(\d+)\s*$/) ||
            loc.match(/(\d+)/);
          if (m) pid = Number(m[1]);
        }
      }

      // 3) Fallback: pedir la más reciente y, si se puede, filtrar por texto_pregunta
      if (!pid) {
        const latestRes =
          (await fetch(`${API}/preguntas?order=desc&limit=10`, { headers: authHeaders }).catch(() => null)) ||
          (await fetch(`${API}/preguntas?sort=desc&limit=10`, { headers: authHeaders }).catch(() => null)) ||
          (await fetch(`${API}/preguntas`, { headers: authHeaders }).catch(() => null));

        if (latestRes?.ok) {
          const lj = await safeJson(latestRes);
          const list = Array.isArray(lj) ? lj : (lj?.data ?? lj?.preguntas ?? []);
          if (Array.isArray(list) && list.length) {
            // Buscar concordancia exacta por texto
            const match = list.find(
              (p) =>
                (p?.texto_pregunta ?? p?.texto ?? p?.enunciado ?? p?.contenido ?? "") === pregunta
            );
            if (match?.id) {
              pid = Number(match.id);
            } else {
              // Tomar el mayor id
              const maxById = list.reduce((acc, cur) => {
                const cid = Number(cur?.id ?? -1);
                return cid > (acc?.id ?? -1) ? { id: cid } : acc;
              }, null);
              if (maxById?.id > 0) pid = maxById.id;
            }
          }
        }
      }

      // Si no logramos PID, no bloquees: redirige y avisa (sin crear opciones).
      if (!pid) {
        console.warn("No se pudo determinar el ID tras crear; se continuará sin crear opciones.");
        setMsg({ ok: true, text: "✅ Pregunta creada. No se detectó ID para crear opciones." });
        setTimeout(() => navigate("/docente/banco-preguntas"), 700);
        return;
      }

      // Crear opciones si aplica (ya con PID)
      const tName = (tipos.find((x) => String(x.id) === String(tipo))?.tipo || "").toLowerCase();
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
          // Limitar a A/B
          opcionesPayload = opcionesPayload.filter((o) => o.clave === "A" || o.clave === "B");
        }

        // Crear y capturar IDs
        const nuevos = { A: null, B: null, C: null, D: null };
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
          const rj = await res.clone().json().catch(() => null);
          const newId = rj?.id ?? rj?.data?.id ?? null;
          if (newId && opcion.clave) nuevos[opcion.clave] = newId;
        }
        setOpIds(nuevos);
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
        {/* ===== FORMULARIO ===== */}
        <form
          onSubmit={guardar}
          className="xl:col-span-7 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800">Datos generales</h2>
            <span className="text-xs text-gray-500">Campos obligatorios marcados con *</span>
          </div>

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

        {/* ===== PREVIEW ===== */}
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
