// src/pages/docente/CrearActividad.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axiosClient"; // baseURL: "/api" + interceptor token

const LS_SEL = "seleccion-preguntas";
const LS_FORM = "crear-actividad-form";

export default function CrearActividad() {
  const navigate = useNavigate();

  // ===== Estado base (se puede sobreescribir con LS) =====
  const [tipo, setTipo] = useState("practica"); // "practica" | "examen"
  const [idCurso, setIdCurso] = useState(1);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [cantidadReactivos, setCantidadReactivos] = useState(5);
  const [intentosPermitidos, setIntentosPermitidos] = useState(1);
  const [umbralAprobacion, setUmbralAprobacion] = useState(60);

  // Examen
  const [modo, setModo] = useState("");
  const [tiempoLimite, setTiempoLimite] = useState(""); // minutos
  const [aleatorizarPreguntas, setAleatorizarPreguntas] = useState(true);
  const [aleatorizarOpciones, setAleatorizarOpciones] = useState(true);

  // Selección manual
  const [seleccion, setSeleccion] = useState([]); // [{id, texto_pregunta}]

  // UI
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  // Derivados
  const maxReactivos = useMemo(() => Number(cantidadReactivos) || 0, [cantidadReactivos]);
  const restante = Math.max(0, maxReactivos - seleccion.length);
  const topeAlcanzado = maxReactivos > 0 && seleccion.length >= maxReactivos;

  // ---------- Helpers de LS ----------
  const leerSeleccionLS = () => {
    try {
      const raw = localStorage.getItem(LS_SEL);
      const arr = JSON.parse(raw || "[]");
      if (!Array.isArray(arr)) return [];
      const normalizada = arr.map((x) => ({
        id: Number(x.id),
        texto_pregunta: x.texto_pregunta || `Pregunta #${x.id}`,
      }));
      return maxReactivos > 0 ? normalizada.slice(0, maxReactivos) : normalizada;
    } catch {
      return [];
    }
  };

  const persistirSeleccion = (arr) => {
    try {
      localStorage.setItem(LS_SEL, JSON.stringify(arr));
    } catch {}
  };

  const leerFormularioLS = () => {
    try {
      const raw = localStorage.getItem(LS_FORM);
      const f = JSON.parse(raw || "{}");
      return f && typeof f === "object" ? f : {};
    } catch {
      return {};
    }
  };

  const persistirFormulario = () => {
    try {
      const payload = {
        tipo,
        idCurso,
        nombre,
        descripcion,
        cantidadReactivos,
        intentosPermitidos,
        umbralAprobacion,
        modo,
        tiempoLimite,
        aleatorizarPreguntas,
        aleatorizarOpciones,
      };
      localStorage.setItem(LS_FORM, JSON.stringify(payload));
    } catch {}
  };

  const limpiarPersistencia = () => {
    try {
      localStorage.removeItem(LS_FORM);
      localStorage.removeItem(LS_SEL);
    } catch {}
  };

  // ---------- Carga inicial: restaurar formulario + selección ----------
  useEffect(() => {
    // Restaurar formulario (si existe)
    const f = leerFormularioLS();
    if (f && Object.keys(f).length) {
      if (typeof f.tipo === "string") setTipo(f.tipo);
      if (f.idCurso != null) setIdCurso(Number(f.idCurso));
      if (typeof f.nombre === "string") setNombre(f.nombre);
      if (typeof f.descripcion === "string") setDescripcion(f.descripcion);
      if (f.cantidadReactivos != null) setCantidadReactivos(Number(f.cantidadReactivos));
      if (f.intentosPermitidos != null) setIntentosPermitidos(Number(f.intentosPermitidos));
      if (f.umbralAprobacion != null) setUmbralAprobacion(Number(f.umbralAprobacion));
      if (typeof f.modo === "string") setModo(f.modo);
      if (f.tiempoLimite != null) setTiempoLimite(String(f.tiempoLimite ?? ""));
      if (typeof f.aleatorizarPreguntas === "boolean") setAleatorizarPreguntas(f.aleatorizarPreguntas);
      if (typeof f.aleatorizarOpciones === "boolean") setAleatorizarOpciones(f.aleatorizarOpciones);
    }

    // Restaurar selección (si existe)
    const inicialSel = leerSeleccionLS();
    setSeleccion(inicialSel);
    persistirSeleccion(inicialSel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Auto-guardar formulario en LS ante cualquier cambio ----------
  useEffect(() => {
    persistirFormulario();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tipo,
    idCurso,
    nombre,
    descripcion,
    cantidadReactivos,
    intentosPermitidos,
    umbralAprobacion,
    modo,
    tiempoLimite,
    aleatorizarPreguntas,
    aleatorizarOpciones,
  ]);

  // ---------- Recarga al volver del selector (recuperar foco) ----------
  useEffect(() => {
    const onFocus = () => {
      const arr = leerSeleccionLS();
      setSeleccion(arr);
      persistirSeleccion(arr);
      // el formulario ya se mantiene en estado + LS
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxReactivos]);

  // ---------- Recorte si baja el tope ----------
  useEffect(() => {
    if (maxReactivos > 0 && seleccion.length > maxReactivos) {
      const trimmed = seleccion.slice(0, maxReactivos);
      setSeleccion(trimmed);
      persistirSeleccion(trimmed);
    }
  }, [maxReactivos, seleccion]);

  // ---------- Validaciones ----------
  const errores = useMemo(() => {
    const e = [];
    if (!idCurso) e.push("El curso es obligatorio.");
    if (!nombre.trim()) e.push("El nombre es obligatorio.");
    if (maxReactivos <= 0) e.push("La cantidad de reactivos debe ser mayor a 0.");
    if (Number(intentosPermitidos) <= 0) e.push("Los intentos permitidos deben ser mayor a 0.");
    if (Number(umbralAprobacion) < 60) e.push("El umbral de aprobación debe ser 60 o mayor.");

    // Regla: si usas selección manual, debe coincidir con la cantidad
    if (seleccion.length === 0) {
      e.push("Debes seleccionar preguntas desde el Banco.");
    } else if (seleccion.length !== maxReactivos) {
      e.push(
        `Seleccionaste ${seleccion.length} pregunta(s), pero estableciste ${maxReactivos} reactivo(s). Deben coincidir exactamente.`
      );
    }

    if (tipo === "examen") {
      if (aleatorizarPreguntas === undefined) e.push("Falta aleatorizar_preguntas.");
      if (aleatorizarOpciones === undefined) e.push("Falta aleatorizar_opciones.");
    }
    return e;
  }, [
    idCurso,
    nombre,
    maxReactivos,
    intentosPermitidos,
    umbralAprobacion,
    tipo,
    aleatorizarPreguntas,
    aleatorizarOpciones,
    seleccion.length,
  ]);

  // ---------- Payload ----------
  const basePayload = () => ({
    id_curso: Number(idCurso),
    nombre: nombre.trim(),
    descripcion: descripcion || null,
    cantidad_reactivos: maxReactivos,
    intentos_permitidos: Number(intentosPermitidos),
    umbral_aprobacion: Number(umbralAprobacion),
  });

  // ---------- API: crear actividad (compat con tu controlador de Examen) ----------
  const createActividad = async () => {
    const base = basePayload();

    if (tipo === "practica") {
      const res = await api.post("/actividad/practica", base, { validateStatus: () => true });
      if (res.status < 200 || res.status >= 300)
        throw new Error(res.data?.message || res.data?.error || `HTTP ${res.status}`);
      const j = res.data || {};
      const actividadId =
        j?.actividad?.id || j?.id || j?.data?.id || j?.actividad_practica?.id || j?.actividad_examen?.id;
      if (!actividadId) throw new Error("No se pudo obtener el ID de la actividad creada (práctica).");
      return Number(actividadId);
    }

    // EXAMEN: tu controlador puede adjuntar preguntas automáticamente según filtros.
    // Enviamos el payload completo (sin filtros si no los usas) y luego manejamos la vinculación manual
    // tolerando duplicados (por si el back ya adjuntó).
    const payload = {
      ...base,
      modo: modo || null,
      tiempo_limite: String(tiempoLimite).trim() ? Number(tiempoLimite) : null,
      aleatorizar_preguntas: Boolean(aleatorizarPreguntas),
      aleatorizar_opciones: Boolean(aleatorizarOpciones),
      estado: true,
      // Si en el futuro reactivas filtros, agrégalos aquí (id_tema, id_dificultad, etc.)
    };

    const res = await api.post("/actividad-examenes", payload, { validateStatus: () => true });
    if (res.status < 200 || res.status >= 300)
      throw new Error(res.data?.message || res.data?.error || `HTTP ${res.status}`);
    const j = res.data || {};
    const actividadId =
      j?.actividad?.id || j?.id || j?.data?.id || j?.actividad_practica?.id || j?.actividad_examen?.id;
    if (!actividadId) throw new Error("No se pudo obtener el ID de la actividad creada (examen).");
    return Number(actividadId);
  };

  // ---------- API: vincular preguntas (dedupe + tolerar duplicados del back) ----------
  const attachSeleccion = async (actividadId) => {
    const cant = Number(maxReactivos) || 0;
    if (!seleccion.length || cant <= 0) return;

    // limitar + dedupe
    const limitada = seleccion.slice(0, cant);
    const unicoPorId = Array.from(new Map(limitada.map((p) => [Number(p.id), { ...p, id: Number(p.id) }])).values());

    const isSuccess = (res) => res && (res.status === 200 || res.status === 201);
    const shouldIgnoreDup = (res) => {
      const msg = (res?.data?.message || res?.data?.error || "").toString().toLowerCase();
      return (
        res?.status === 500 &&
        (msg.includes("duplicate entry") || msg.includes("duplicate") || msg.includes("integrity constraint"))
      );
    };

    if (tipo === "practica") {
      for (let i = 0; i < unicoPorId.length; i++) {
        const pid = unicoPorId[i].id;
        const res = await api.post(
          "/pregunta/actividad-practica",
          { id_actividad_practica: Number(actividadId), id_pregunta: pid, orden: i + 1 },
          { validateStatus: () => true }
        );
        if (!isSuccess(res) && !shouldIgnoreDup(res)) {
          throw new Error(
            `Error vinculando (práctica) #${pid}: ${res.data?.message || res.data?.error || `HTTP ${res.status}`}`
          );
        }
      }
      return;
    }

    // EXAMEN (el back podría haber adjuntado ya). Posteamos igual pero ignoramos duplicados.
    for (let i = 0; i < unicoPorId.length; i++) {
      const pid = unicoPorId[i].id;
      const res = await api.post(
        "/pregunta-actividad-examenes",
        { id_actividad_examen: Number(actividadId), id_pregunta: pid, orden: i + 1 },
        { validateStatus: () => true }
      );
      if (!isSuccess(res) && !shouldIgnoreDup(res)) {
        throw new Error(
          `Error vinculando (examen) #${pid}: ${res.data?.message || res.data?.error || `HTTP ${res.status}`}`
        );
      }
    }
  };

  // ---------- Guardar ----------
  const guardar = async (e) => {
    e?.preventDefault?.();
    setMsg(null);

    if (errores.length) {
      setMsg({ ok: false, text: errores[0] });
      return;
    }

    try {
      setSaving(true);
      // guardamos por si algo recarga
      persistirFormulario();

      const actividadId = await createActividad();
      await attachSeleccion(actividadId);

      // Limpiar persistencia solo al éxito
      limpiarPersistencia();

      setMsg({
        ok: true,
        text:
          `✅ ${tipo === "examen" ? "Examen" : "Actividad práctica"} creado` +
          (seleccion.length ? " y preguntas vinculadas." : "."),
      });
      setTimeout(() => navigate("/docente/dashboard"), 800);
    } catch (err) {
      setMsg({ ok: false, text: err?.message || "Error al crear la actividad." });
    } finally {
      setSaving(false);
    }
  };

  // ---------- Ir al selector (persistir antes de navegar) ----------
  const irASelector = () => {
    if (maxReactivos <= 0) {
      setMsg({ ok: false, text: "Define primero una cantidad de reactivos mayor a 0." });
      return;
    }
    persistirFormulario(); // <- evita que se “pierdan” los datos de arriba
    const selectedIds = encodeURIComponent(JSON.stringify(seleccion.map((s) => s.id)));
    navigate(
      `/docente/banco-preguntas/seleccionar?returnTo=${encodeURIComponent(
        "/docente/crear-actividad"
      )}&max=${maxReactivos}&selected=${selectedIds}`
    );
  };

  // ---------- UI ----------
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Crear {tipo === "examen" ? "Examen" : "Actividad Práctica"}
      </h1>

      <form onSubmit={guardar} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
        {/* Tipo */}
        <section>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-1 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700">Tipo</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-xl px-3 focus:ring-2 focus:ring-purple-600"
              >
                <option value="practica">Práctica</option>
                <option value="examen">Examen</option>
              </select>
            </div>
          </div>
        </section>

        {/* Información general */}
        <section>
          <div className="grid md:grid-cols-2 gap-4 mt-2">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Curso*</label>
              <input
                type="number"
                value={idCurso}
                min={1}
                onChange={(e) => setIdCurso(e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-xl px-3"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Nombre*</label>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                type="text"
                placeholder={tipo === "examen" ? "Ej: Examen Parcial 1" : "Ej: Práctica – Fundamentos"}
                className="w-full h-10 border border-gray-300 rounded-xl px-3"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Cantidad de reactivos*</label>
              <input
                type="number"
                min={1}
                value={cantidadReactivos}
                onChange={(e) => setCantidadReactivos(e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-xl px-3"
              />
              <p className="text-xs text-gray-500">
                Debe coincidir con el número de preguntas seleccionadas abajo.
              </p>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Intentos permitidos*</label>
              <input
                type="number"
                min={1}
                value={intentosPermitidos}
                onChange={(e) => setIntentosPermitidos(e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-xl px-3"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Umbral de aprobación (mín. 60)*</label>
              <input
                type="number"
                min={60}
                max={100}
                value={umbralAprobacion}
                onChange={(e) => setUmbralAprobacion(e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-xl px-3"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Descripción</label>
              <textarea
                rows={3}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Descripción del propósito y criterios de esta actividad…"
                className="w-full border border-gray-300 rounded-xl px-3 py-2"
              />
            </div>
          </div>
        </section>

        {/* Opciones SOLO examen */}
        {tipo === "examen" && (
          <section>
            <h2 className="text-base font-semibold text-gray-800">🧪 Opciones del examen</h2>
            <div className="grid md:grid-cols-2 gap-4 mt-3">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Modo (opcional)</label>
                <input
                  value={modo}
                  onChange={(e) => setModo(e.target.value)}
                  type="text"
                  placeholder="p.ej. presencial, en línea…"
                  className="w-full h-10 border border-gray-300 rounded-xl px-3"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Tiempo límite (minutos, opcional)</label>
                <input
                  value={tiempoLimite}
                  onChange={(e) => setTiempoLimite(e.target.value)}
                  type="number"
                  min={1}
                  placeholder="Ej: 90"
                  className="w-full h-10 border border-gray-300 rounded-xl px-3"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Aleatorizar preguntas*</label>
                <select
                  value={aleatorizarPreguntas ? "1" : "0"}
                  onChange={(e) => setAleatorizarPreguntas(e.target.value === "1")}
                  className="w-full h-10 border border-gray-300 rounded-xl px-3"
                >
                  <option value="1">Sí</option>
                  <option value="0">No</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Aleatorizar opciones*</label>
                <select
                  value={aleatorizarOpciones ? "1" : "0"}
                  onChange={(e) => setAleatorizarOpciones(e.target.value === "1")}
                  className="w-full h-10 border border-gray-300 rounded-xl px-3"
                >
                  <option value="1">Sí</option>
                  <option value="0">No</option>
                </select>
              </div>
            </div>
          </section>
        )}

        {/* Selección manual */}
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800">🧩 Selección de preguntas (manual)</h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">
                Restantes: <strong>{restante}</strong> / {maxReactivos}
              </span>
              <button
                type="button"
                onClick={irASelector}
                disabled={topeAlcanzado || maxReactivos <= 0}
                className={`h-9 px-4 rounded-xl border ${
                  topeAlcanzado ? "border-gray-200 text-gray-400 bg-gray-50" : "border-gray-300 bg-white hover:bg-gray-50"
                }`}
                title={topeAlcanzado ? "Ya alcanzaste el máximo de reactivos" : "Seleccionar desde Banco"}
              >
                {topeAlcanzado ? "Límite alcanzado" : "Seleccionar desde Banco"}
              </button>
            </div>
          </div>

          {seleccion.length === 0 ? (
            <p className="text-sm text-gray-500 mt-3">
              No hay preguntas seleccionadas. Debes seleccionar tantas preguntas como indique la “Cantidad de reactivos”.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {seleccion.map((p, idx) => (
                <div key={p.id} className="flex items-center justify-between border rounded-xl px-3 py-2">
                  <p className="text-sm text-gray-800">
                    <strong>#{p.id}</strong> — {p.texto_pregunta}
                    <span className="text-gray-500 ml-2">(orden {idx + 1})</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const nueva = seleccion.filter((x) => x.id !== p.id);
                      setSeleccion(nueva);
                      persistirSeleccion(nueva);
                    }}
                    className="h-9 px-3 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Quitar
                  </button>
                </div>
              ))}
              <p className="text-xs text-gray-500">
                Seleccionadas: {seleccion.length} — Deben ser exactamente {maxReactivos}.
              </p>
            </div>
          )}
        </section>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              limpiarPersistencia();
              navigate("/docente/dashboard");
            }}
            className="h-10 px-5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="h-10 px-6 rounded-xl bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {saving ? "Creando..." : `Crear ${tipo === "examen" ? "Examen" : "Práctica"}`}
          </button>
        </div>

        {msg && (
          <p className={`text-sm ${msg.ok ? "text-green-600" : "text-red-600"} mt-2`}>{msg.text}</p>
        )}
      </form>
    </div>
  );
}
