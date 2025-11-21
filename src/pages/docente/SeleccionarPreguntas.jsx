// src/pages/docente/SeleccionarPreguntas.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import api from "../../api/axiosClient";

//IMPORTS SOLO PARA MOSTRAR MARKDOWN + LaTeX
import MarkdownPreview from "@uiw/react-markdown-preview";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import "katex/dist/katex.min.css";

export default function SeleccionarPreguntas() {
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario } = useAuth();

  // query params
  const params = new URLSearchParams(location.search);
  const returnTo = params.get("returnTo") || "/docente/crear-actividad";

  //  estado principal 
  const [preguntas, setPreguntas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // catálogos
  const [temas, setTemas] = useState([]);
  const [blooms, setBlooms] = useState([]);
  const [difs, setDifs] = useState([]);
  const [tipos, setTipos] = useState([]);

  // filtros
  const [fTema, setFTema] = useState("");
  const [fBloom, setFBloom] = useState("");
  const [fDif, setFDif] = useState("");
  const [fTipo, setFTipo] = useState("");
  const [q, setQ] = useState("");

  // docente actual
  const [docenteId, setDocenteId] = useState(null);

  // selección local
  const [picked, setPicked] = useState(() => {
    try {
      const prev = JSON.parse(
        localStorage.getItem("seleccion-preguntas") || "[]"
      );
      return new Set(prev.map((x) => Number(x.id)));
    } catch {
      return new Set();
    }
  });

  //  helpers 
  const unwrapList = (j, keys = []) => {
    if (Array.isArray(j)) return j;
    for (const k of keys) if (Array.isArray(j?.[k])) return j[k];
    if (Array.isArray(j?.data)) return j.data;
    return [];
  };

  const extractDocenteId = (src) =>
    src?.docente?.id ??
    src?.usuario?.docente?.id ??
    src?.data?.docente?.id ??
    src?.id_docente ??
    src?.docente_id ??
    null;

  const getPreguntaDocenteId = (p) =>
    p?.id_docente ?? p?.docente_id ?? p?.docente?.id ?? null;

  const togglePick = (id) => {
    setPicked((prev) => {
      const n = new Set(prev);
      const key = Number(id);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });
  };

  const addSelectedAndReturn = () => {
    const selected = list
      .filter((p) => picked.has(Number(p.id)))
      .map((p) => ({
        id: Number(p.id),
        texto_pregunta: p.texto_pregunta || "Sin texto",
      }));

    localStorage.setItem("seleccion-preguntas", JSON.stringify(selected));
    navigate(returnTo, { replace: true });
  };

  //  carga inicial 
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      setError(null);
      try {
        // docente
        const fromCtx = extractDocenteId(usuario);
        if (fromCtx) setDocenteId(fromCtx);
        if (!fromCtx) {
          const rDoc = await api.get("/usuario/docente", {
            validateStatus: () => true,
          });
          if (rDoc.status === 200)
            setDocenteId(extractDocenteId(rDoc.data) ?? null);
        }

        // catálogos + preguntas
        const [rPreg, rTem, rBlo, rDif, rTip] = await Promise.all([
          api.get("/preguntas", { validateStatus: () => true }),
          api.get("/temas"),
          api.get("/nivel-blooms"),
          api.get("/dificultades"),
          api.get("/tipo-preguntas"),
        ]);

        setPreguntas(unwrapList(rPreg.data, ["preguntas"]));
        setTemas(unwrapList(rTem.data, ["temas"]));
        setBlooms(unwrapList(rBlo.data, ["niveles", "nivel_blooms"]));
        setDifs(unwrapList(rDif.data, ["dificultades"]));
        setTipos(unwrapList(rTip.data, ["tipos", "tipo_preguntas"]));
      } catch (e) {
        setError(e?.message || "Error al cargar datos");
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, [usuario]);

  // lookups 
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

  // lista filtrada (sólo propias, no archivadas) 
  const list = useMemo(() => {
    if (docenteId == null) return [];
    const text = q.trim().toLowerCase();
    return preguntas
      .filter((p) => String(getPreguntaDocenteId(p)) === String(docenteId))
      .filter((p) => Number(p?.estado ?? 1) !== 0)
      .filter((p) =>
        fTema ? String(p.id_tema) === String(fTema) : true
      )
      .filter((p) =>
        fBloom ? String(p.id_nivel_bloom) === String(fBloom) : true
      )
      .filter((p) =>
        fDif ? String(p.id_dificultad) === String(fDif) : true
      )
      .filter((p) =>
        fTipo ? String(p.id_tipo_pregunta) === String(fTipo) : true
      )
      .filter((p) =>
        text
          ? (p.texto_pregunta || "")
              .toLowerCase()
              .includes(text) ||
            (L.temas[String(p.id_tema)]?.nombre || "")
              .toLowerCase()
              .includes(text)
          : true
      );
  }, [preguntas, docenteId, fTema, fBloom, fDif, fTipo, q, L]);

  // ===== UI =====
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header tipo "sub-página" */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(returnTo)}
              className="h-9 px-3 rounded-lg border hover:bg-gray-50"
            >
              ← Volver
            </button>
            <h1 className="text-xl font-semibold text-gray-800">
              Seleccionar preguntas
            </h1>
            <span className="ml-2 text-sm text-gray-500">
              {docenteId != null
                ? `${list.length} resultado${
                    list.length === 1 ? "" : "s"
                  }`
                : ""}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">
              {picked.size} seleccionada
              {picked.size === 1 ? "" : "s"}
            </span>
            <button
              onClick={() => setPicked(new Set())}
              className="h-9 px-3 rounded-lg border hover:bg-gray-50"
            >
              Limpiar
            </button>
            <button
              onClick={addSelectedAndReturn}
              disabled={picked.size === 0}
              className="h-9 px-4 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
            >
              Agregar seleccionadas
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow border p-4 m-4">
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
          <select
            value={fTema}
            onChange={(e) => setFTema(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Tema: todos</option>
            {temas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </select>
          <select
            value={fBloom}
            onChange={(e) => setFBloom(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Bloom: todos</option>
            {blooms.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nombre}
              </option>
            ))}
          </select>
          <select
            value={fDif}
            onChange={(e) => setFDif(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Dificultad: todas</option>
            {difs.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nivel}
              </option>
            ))}
          </select>
          <select
            value={fTipo}
            onChange={(e) => setFTipo(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Tipo: todos</option>
            {tipos.map((tp) => (
              <option key={tp.id} value={tp.id}>
                {tp.tipo}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-xl shadow border m-4">
        <div className="p-6">
          {loading && <p className="text-gray-500">Cargando preguntas...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {!loading && !error && docenteId == null && (
            <p className="text-gray-500">
              No se pudo identificar al docente actual.
            </p>
          )}
          {!loading && !error && docenteId != null && list.length === 0 && (
            <p className="text-gray-500">
              No hay preguntas que coincidan con los filtros.
            </p>
          )}
          {!loading && !error && docenteId != null && list.length > 0 && (
            <div className="grid gap-3">
              {list.map((p) => {
                const checked = picked.has(Number(p.id));
                return (
                  <label
                    key={p.id}
                    className="p-4 border rounded-lg bg-gray-50 hover:shadow-sm transition-shadow flex items-start gap-3 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="mt-1 accent-purple-600"
                      checked={checked}
                      onChange={() => togglePick(p.id)}
                    />
                    <div className="flex-1">
                      {/* AQUÍ AHORA SE RENDERIZA MARKDOWN + LaTeX */}
                      <div className="font-semibold text-gray-800 mb-1">
                        <MarkdownPreview
                          source={p.texto_pregunta || "Sin texto"}
                          wrapperElement={{ "data-color-mode": "light" }}
                          remarkPlugins={[remarkMath, remarkGfm]}
                          rehypePlugins={[rehypeKatex]}
                        />
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs">
                        {getChips(p, L).map((c, i) => (
                          <span
                            key={i}
                            className={`px-2 py-0.5 rounded-full ${c.cls}`}
                          >
                            {c.text}
                          </span>
                        ))}
                      </div>
                      {p.explicacion && (
                        <p className="text-sm text-gray-600 mt-2">
                          <strong>Explicación:</strong> {p.explicacion}
                        </p>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// helpers de chips (idéntico visual a Banco, pero sin "Archivada")
function getChips(p, L) {
  const tipoLabel =
    p?.tipo_pregunta?.tipo ??
    L.tipos[String(p.id_tipo_pregunta)]?.tipo ??
    null;
  const bloomLabel =
    p?.nivel_bloom?.nombre ??
    L.blooms[String(p.id_nivel_bloom)]?.nombre ??
    null;
  const difLabel =
    p?.dificultad?.nivel ??
    L.difs[String(p.id_dificultad)]?.nivel ??
    null;
  const temaLabel =
    p?.tema?.nombre ?? L.temas[String(p.id_tema)]?.nombre ?? null;

  const chips = [];
  if (tipoLabel)
    chips.push({
      text: tipoLabel,
      cls: "bg-purple-100 text-purple-700",
    });
  if (bloomLabel)
    chips.push({
      text: `Bloom: ${bloomLabel}`,
      cls: "bg-amber-100 text-amber-700",
    });
  if (difLabel)
    chips.push({
      text: `Dificultad: ${difLabel}`,
      cls: "bg-gray-100 text-gray-700",
    });
  if (temaLabel)
    chips.push({
      text: `Tema: ${temaLabel}`,
      cls: "bg-blue-100 text-blue-700",
    });
  return chips;
}
