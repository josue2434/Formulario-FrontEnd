// src/pages/docente/BancoPreguntas.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import api from "../../api/axiosClient";

export default function BancoPreguntas() {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  // ================== Estado principal ==================
  const [preguntas, setPreguntas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Catálogos
  const [temas, setTemas] = useState([]);
  const [blooms, setBlooms] = useState([]);
  const [difs, setDifs] = useState([]);
  const [tipos, setTipos] = useState([]);

  // Filtros
  const [fTema, setFTema] = useState("");
  const [fBloom, setFBloom] = useState("");
  const [fDif, setFDif] = useState("");
  const [fTipo, setFTipo] = useState("");
  const [q, setQ] = useState("");
  const [verArchivadas, setVerArchivadas] = useState(false); // muestra estado=0

  // Docente actual
  const [docenteId, setDocenteId] = useState(null);

  const handleNueva = () => navigate("/docente/crear-pregunta");

  // ================== Helpers ==================
  const unwrapList = (j, keys = []) => {
    if (Array.isArray(j)) return j;
    for (const k of keys) if (Array.isArray(j?.[k])) return j[k];
    if (Array.isArray(j?.data)) return j.data;
    return [];
  };

  const extractDocenteId = (src) => {
    if (!src) return null;
    return (
      src?.docente?.id ??
      src?.usuario?.docente?.id ??
      src?.data?.docente?.id ??
      src?.id_docente ??
      src?.docente_id ??
      null
    );
  };

  const getPreguntaDocenteId = (p) =>
    p?.id_docente ?? p?.docente_id ?? p?.docente?.id ?? null;

  const isArchived = (p) => Number(p?.estado ?? 1) === 0;
  const isRemoved = (p) => isArchived(p); // sólo manejamos archivado por estado

  // —— Payload completo para evitar 422 en PUT ——
  const buildUpdatePayload = (p, overrides = {}) => ({
    texto_pregunta: p?.texto_pregunta ?? "",
    explicacion: p?.explicacion ?? "",
    id_tema: p?.id_tema ?? p?.tema?.id ?? null,
    id_nivel_bloom: p?.id_nivel_bloom ?? p?.nivel_bloom?.id ?? null,
    id_dificultad: p?.id_dificultad ?? p?.dificultad?.id ?? null,
    id_tipo_pregunta: p?.id_tipo_pregunta ?? p?.tipo_pregunta?.id ?? null,
    id_docente: p?.id_docente ?? p?.docente_id ?? p?.docente?.id ?? null,
    estado: p?.estado ?? 1,
    ...overrides,
  });

  // ✅ ids como number y estado como boolean real (Laravel: required|boolean)
  const normalizeIdsToNumber = (payload) => ({
    ...payload,
    id_tema: payload.id_tema != null ? Number(payload.id_tema) : null,
    id_nivel_bloom: payload.id_nivel_bloom != null ? Number(payload.id_nivel_bloom) : null,
    id_dificultad: payload.id_dificultad != null ? Number(payload.id_dificultad) : null,
    id_tipo_pregunta: payload.id_tipo_pregunta != null ? Number(payload.id_tipo_pregunta) : null,
    id_docente: payload.id_docente != null ? Number(payload.id_docente) : null,
    estado:
      payload.estado === false ||
      payload.estado === 0 ||
      payload.estado === "0"
        ? false
        : true,
  });

  // PUT → PATCH → POST _method=PUT
  const tryMultiUpdate = async (id, payloadObj) => {
    // A) PUT JSON
    let res = await api.put(`/preguntas/${id}`, payloadObj, { validateStatus: () => true });
    console.log("[UPDATE:A PUT JSON] status:", res.status, res.data);
    if (res.status >= 200 && res.status < 300) return res;

    // B) PATCH JSON
    res = await api.patch(`/preguntas/${id}`, payloadObj, { validateStatus: () => true });
    console.log("[UPDATE:B PATCH JSON] status:", res.status, res.data);
    if (res.status >= 200 && res.status < 300) return res;

    // C) POST formData + _method=PUT
    const fd = new FormData();
    Object.entries(payloadObj).forEach(([k, v]) => fd.append(k, v == null ? "" : String(v)));
    fd.append("_method", "PUT");
    res = await api.post(`/preguntas/${id}`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
      validateStatus: () => true,
    });
    console.log("[UPDATE:C POST formData _method=PUT] status:", res.status, res.data);
    return res;
  };

  // ================== Carga inicial ==================
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1) Docente desde contexto
        const fromCtx = extractDocenteId(usuario);
        if (fromCtx) setDocenteId(fromCtx);

        // 2) Fallback: /usuario/docente
        if (!fromCtx) {
          const rDoc = await api.get("/usuario/docente", { validateStatus: () => true });
          if (rDoc.status === 200) {
            const idDetectado = extractDocenteId(rDoc.data);
            setDocenteId(idDetectado ?? null);
          } else {
            setDocenteId(null);
          }
        }

        // 3) Catálogos + preguntas
        const [rPreg, rTem, rBlo, rDif, rTip] = await Promise.all([
          api.get("/preguntas", { validateStatus: () => true }),
          api.get("/temas"),
          api.get("/nivel-blooms"),
          api.get("/dificultades"),
          api.get("/tipo-preguntas"),
        ]);

        const [jPreg, jTem, jBlo, jDif, jTip] = [
          rPreg.data ?? [],
          rTem.data ?? [],
          rBlo.data ?? [],
          rDif.data ?? [],
          rTip.data ?? [],
        ];

        setPreguntas(unwrapList(jPreg, ["preguntas"]));
        setTemas(unwrapList(jTem, ["temas"]));
        setBlooms(unwrapList(jBlo, ["niveles", "nivel_blooms"]));
        setDifs(unwrapList(jDif, ["dificultades"]));
        setTipos(unwrapList(jTip, ["tipos", "tipo_preguntas"]));
      } catch (err) {
        setError(err?.message || "Error al cargar datos");
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [usuario]);

  // ================== LOOKUPS ==================
  const L = useMemo(() => {
    const toMap = (arr, key = "id") =>
      arr.reduce((acc, it) => {
        const k = it?.[key];
        if (k != null) acc[String(k)] = it;
        return acc;
      }, {});
    return {
      temas: toMap(temas, "id"),
      blooms: toMap(blooms, "id"),
      difs: toMap(difs, "id"),
      tipos: toMap(tipos, "id"),
    };
  }, [temas, blooms, difs, tipos]);

  // ================== Permisos UI ==================
  const puedeGestionar = (p) => {
    if (docenteId == null) return false;
    return String(getPreguntaDocenteId(p)) === String(docenteId);
  };

  // ================== Lista filtrada ==================
  const list = useMemo(() => {
    if (docenteId == null) return [];
    const text = q.trim().toLowerCase();

    return preguntas
      .filter((p) => String(getPreguntaDocenteId(p)) === String(docenteId))
      .filter((p) => (verArchivadas ? isRemoved(p) : !isRemoved(p)))
      .filter((p) => (fTema ? String(p.id_tema) === String(fTema) : true))
      .filter((p) => (fBloom ? String(p.id_nivel_bloom) === String(fBloom) : true))
      .filter((p) => (fDif ? String(p.id_dificultad) === String(fDif) : true))
      .filter((p) => (fTipo ? String(p.id_tipo_pregunta) === String(fTipo) : true))
      .filter((p) =>
        text
          ? (p.texto_pregunta || "").toLowerCase().includes(text) ||
            (L.temas[String(p.id_tema)]?.nombre || "").toLowerCase().includes(text)
          : true
      );
  }, [preguntas, fTema, fBloom, fDif, fTipo, q, verArchivadas, docenteId, L]);

  // ================== Chips filtros activos ==================
  const activeFilters = useMemo(() => {
    const items = [];
    if (q.trim()) items.push({ key: "q", label: `Buscar: “${q.trim()}”`, clear: () => setQ("") });
    if (fTema) {
      const t = L.temas[String(fTema)];
      items.push({ key: "tema", label: `Tema: ${t?.nombre ?? fTema}`, clear: () => setFTema("") });
    }
    if (fBloom) {
      const b = L.blooms[String(fBloom)];
      items.push({ key: "bloom", label: `Bloom: ${b?.nombre ?? fBloom}`, clear: () => setFBloom("") });
    }
    if (fDif) {
      const d = L.difs[String(fDif)];
      items.push({ key: "dif", label: `Dificultad: ${d?.nivel ?? fDif}`, clear: () => setFDif("") });
    }
    if (fTipo) {
      const tp = L.tipos[String(fTipo)];
      items.push({ key: "tipo", label: `Tipo: ${tp?.tipo ?? fTipo}`, clear: () => setFTipo("") });
    }
    if (verArchivadas) {
      items.push({ key: "arch", label: "Ver archivadas", clear: () => setVerArchivadas(false) });
    }
    return items;
  }, [q, fTema, fBloom, fDif, fTipo, verArchivadas, L]);

  const clearAllFilters = () => {
    setQ("");
    setFTema("");
    setFBloom("");
    setFDif("");
    setFTipo("");
    setVerArchivadas(false);
  };

  // ================== Chips por pregunta ==================
  const getChips = (p) => {
    const tipoLabel =
      p?.tipo_pregunta?.tipo ?? L.tipos[String(p.id_tipo_pregunta)]?.tipo ?? null;
    const bloomLabel =
      p?.nivel_bloom?.nombre ?? L.blooms[String(p.id_nivel_bloom)]?.nombre ?? null;
    const difLabel =
      p?.dificultad?.nivel ?? L.difs[String(p.id_dificultad)]?.nivel ?? null;
    const temaLabel =
      p?.tema?.nombre ?? L.temas[String(p.id_tema)]?.nombre ?? null;

    const chips = [];
    if (tipoLabel) chips.push({ text: tipoLabel, cls: "bg-purple-100 text-purple-700" });
    if (bloomLabel) chips.push({ text: `Bloom: ${bloomLabel}`, cls: "bg-amber-100 text-amber-700" });
    if (difLabel) chips.push({ text: `Dificultad: ${difLabel}`, cls: "bg-gray-100 text-gray-700" });
    if (temaLabel) chips.push({ text: `Tema: ${temaLabel}`, cls: "bg-blue-100 text-blue-700" });
    if (isArchived(p)) chips.push({ text: "Archivada", cls: "bg-gray-200 text-gray-600" });
    return chips;
  };

  // ================== Acciones: archivar / desarchivar ==================
  const archivePregunta = async (id) => {
    const p = preguntas.find((x) => Number(x.id) === Number(id));
    if (!p) throw new Error("No se encontró la pregunta en memoria.");

    let rawPayload = buildUpdatePayload(p, { estado: false });
    if (!rawPayload.id_tema && p.tema?.id) rawPayload.id_tema = Number(p.tema.id);
    if (!rawPayload.id_nivel_bloom && p.nivel_bloom?.id) rawPayload.id_nivel_bloom = Number(p.nivel_bloom.id);
    if (!rawPayload.id_dificultad && p.dificultad?.id) rawPayload.id_dificultad = Number(p.dificultad.id);
    if (!rawPayload.id_tipo_pregunta && p.tipo_pregunta?.id) rawPayload.id_tipo_pregunta = Number(p.tipo_pregunta.id);

    const payload = normalizeIdsToNumber(rawPayload);
    console.log("[ARCHIVAR] payload:", payload);

    const res = await tryMultiUpdate(id, payload);

    if (res.status >= 200 && res.status < 300) {
      setPreguntas((prev) =>
        prev.map((x) =>
          Number(x.id) === Number(id) ? { ...x, estado: 0 } : x
        )
      );
      alert("Pregunta archivada.");
      return true;
    }

    const msg =
      res?.data?.message ||
      res?.data?.error ||
      (typeof res?.data === "string" ? res.data : "") ||
      `HTTP ${res.status}`;
    throw new Error(`No se pudo archivar: ${msg}`);
  };

  const restorePregunta = async (id) => {
    const p = preguntas.find((x) => Number(x.id) === Number(id));
    if (!p) throw new Error("No se encontró la pregunta en memoria.");

    let rawPayload = buildUpdatePayload(p, { estado: true });
    if (!rawPayload.id_tema && p.tema?.id) rawPayload.id_tema = Number(p.tema.id);
    if (!rawPayload.id_nivel_bloom && p.nivel_bloom?.id) rawPayload.id_nivel_bloom = Number(p.nivel_bloom.id);
    if (!rawPayload.id_dificultad && p.dificultad?.id) rawPayload.id_dificultad = Number(p.dificultad.id);
    if (!rawPayload.id_tipo_pregunta && p.tipo_pregunta?.id) rawPayload.id_tipo_pregunta = Number(p.tipo_pregunta.id);

    const payload = normalizeIdsToNumber(rawPayload);
    console.log("[DESARCHIVAR] payload:", payload);

    const res = await tryMultiUpdate(id, payload);

    if (res.status >= 200 && res.status < 300) {
      setPreguntas((prev) =>
        prev.map((x) =>
          Number(x.id) === Number(id) ? { ...x, estado: 1 } : x
        )
      );
      alert("Pregunta desarchivada.");
      return true;
    }

    const msg =
      res?.data?.message ||
      res?.data?.error ||
      (typeof res?.data === "string" ? res.data : "") ||
      `HTTP ${res.status}`;
    throw new Error(`No se pudo desarchivar: ${msg}`);
  };

  // Handlers de botones (sin DELETE)
  const handleArchiveClick = async (id) => {
    if (!confirm("¿Archivar esta pregunta?")) return;
    try {
      await archivePregunta(id);
    } catch (e) {
      console.error(e);
      alert(e.message);
    }
  };

  const handleRestoreClick = async (id) => {
    try {
      await restorePregunta(id);
    } catch (e) {
      console.error(e);
      alert(e.message);
    }
  };

  const handleEdit = (id) => navigate(`/docente/crear-pregunta?edit=${id}`);

  // ================== Render ==================
  return (
    <div>
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-2">
        <h1 className="text-3xl font-bold text-gray-800">
          Banco de Preguntas
          {docenteId != null && (
            <span className="ml-2 align-middle text-sm font-normal text-gray-500">
              {list.length} resultado{list.length === 1 ? "" : "s"}
            </span>
          )}
        </h1>
        <button
          onClick={handleNueva}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          + Nueva Pregunta
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow border p-4 mb-4">
        <div className="grid md:grid-cols-6 gap-3">
          <div className="md:col-span-2">
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por texto o tema…"
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <select value={fTema} onChange={(e) => setFTema(e.target.value)} className="border rounded-lg px-3 py-2">
            <option value="">Tema: todos</option>
            {temas.map((t) => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </select>
          <select value={fBloom} onChange={(e) => setFBloom(e.target.value)} className="border rounded-lg px-3 py-2">
            <option value="">Bloom: todos</option>
            {blooms.map((b) => (
              <option key={b.id} value={b.id}>{b.nombre}</option>
            ))}
          </select>
          <select value={fDif} onChange={(e) => setFDif(e.target.value)} className="border rounded-lg px-3 py-2">
            <option value="">Dificultad: todas</option>
            {difs.map((d) => (
              <option key={d.id} value={d.id}>{d.nivel}</option>
            ))}
          </select>
          <select value={fTipo} onChange={(e) => setFTipo(e.target.value)} className="border rounded-lg px-3 py-2">
            <option value="">Tipo: todos</option>
            {tipos.map((tp) => (
              <option key={tp.id} value={tp.id}>{tp.tipo}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm ml-1">
            <input
              type="checkbox"
              checked={verArchivadas}
              onChange={(e) => setVerArchivadas(e.target.checked)}
              className="accent-purple-600"
            />
            Ver archivadas
          </label>
        </div>

        {/* Etiquetas de filtros activos */}
        {activeFilters.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {activeFilters.map((f) => (
              <span
                key={f.key}
                className="inline-flex items-center gap-2 rounded-full bg-indigo-50 text-indigo-700 text-xs px-3 py-1 border border-indigo-100"
              >
                {f.label}
                <button
                  type="button"
                  onClick={f.clear}
                  className="rounded-full border bg-white text-indigo-700 hover:bg-indigo-100 px-1.5 leading-none"
                  title="Quitar filtro"
                >
                  ×
                </button>
              </span>
            ))}

            <button
              type="button"
              onClick={clearAllFilters}
              className="ml-1 text-xs rounded-full border px-3 py-1 hover:bg-gray-50"
              title="Quitar todos"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Lista */}
      <div className="bg-white rounded-xl shadow border">
        <div className="p-6">
          {loading && <p className="text-gray-500">Cargando preguntas...</p>}
          {error && <p className="text-red-500">{error}</p>}

          {!loading && !error && docenteId == null && (
            <p className="text-gray-500">
              No se pudo identificar al docente actual. Inicia sesión nuevamente para ver tus preguntas.
            </p>
          )}

          {!loading && !error && docenteId != null && (
            list.length === 0 ? (
              <p className="text-gray-500">No hay preguntas que coincidan con los filtros.</p>
            ) : (
              <div className="grid gap-3">
                {list.map((p) => (
                  <div key={p.id} className="p-4 border rounded-lg bg-gray-50 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-gray-800 mb-1">
                          {p.texto_pregunta || "Sin texto"}
                        </h3>
                        <div className="flex flex-wrap gap-2 text-xs">
                          {getChips(p).map((c, i) => (
                            <span key={i} className={`px-2 py-0.5 rounded-full ${c.cls}`}>{c.text}</span>
                          ))}
                        </div>
                        {p.explicacion && (
                          <p className="text-sm text-gray-600 mt-2">
                            <strong>Explicación:</strong> {p.explicacion}
                          </p>
                        )}
                      </div>

                      {puedeGestionar(p) && (
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => handleEdit(p.id)}
                            className="px-3 py-1.5 text-sm rounded bg-white border hover:bg-gray-100"
                          >
                            ✏️ Editar
                          </button>

                          {!isArchived(p) && (
                            <button
                              onClick={() => handleArchiveClick(p.id)}
                              className="px-3 py-1.5 text-sm rounded bg-yellow-600 text-white hover:bg-yellow-700"
                            >
                              📦 Archivar
                            </button>
                          )}

                          {isArchived(p) && (
                            <button
                              onClick={() => handleRestoreClick(p.id)}
                              className="px-3 py-1.5 text-sm rounded bg-green-600 text-white hover:bg-green-700"
                            >
                              ↩️ Desarchivar
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
