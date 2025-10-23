// src/pages/docente/CrearActividad.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axiosClient"; // debe tener baseURL: "/api" e interceptor de token

export default function CrearActividad() {
  const navigate = useNavigate();

  // ===== Tipo =====
  const [tipo, setTipo] = useState("practica"); // "practica" | "examen"

  // ===== Comunes =====
  const [idCurso, setIdCurso] = useState(1); // TODO: traer desde tu contexto/selector de curso
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [cantidadReactivos, setCantidadReactivos] = useState(5);
  const [intentosPermitidos, setIntentosPermitidos] = useState(1);
  const [umbralAprobacion, setUmbralAprobacion] = useState(60);

  // ===== Examen =====
  const [modo, setModo] = useState("");
  const [tiempoLimite, setTiempoLimite] = useState(""); // minutos (nullable)
  const [aleatorizarPreguntas, setAleatorizarPreguntas] = useState(true);
  const [aleatorizarOpciones, setAleatorizarOpciones] = useState(true);

  // ===== Filtros opcionales (ambos controladores los aceptan) =====
  const [idTema, setIdTema] = useState("");
  const [idDificultad, setIdDificultad] = useState("");
  const [idNivelBloom, setIdNivelBloom] = useState("");
  const [idTipoPregunta, setIdTipoPregunta] = useState("");

  // ===== Selección manual desde sub-página =====
  const [seleccion, setSeleccion] = useState([]); // [{id, texto_pregunta}]

  // ===== UI =====
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  // Restaura selección guardada por la sub-página
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("seleccion-preguntas") || "[]");
      if (Array.isArray(saved)) {
        setSeleccion(
          saved.map((x) => ({
            id: Number(x.id),
            texto_pregunta: x.texto_pregunta || `Pregunta #${x.id}`,
          }))
        );
      }
    } catch {}
  }, []);

  // Validaciones mínimas
  const errores = useMemo(() => {
    const e = [];
    if (!idCurso) e.push("El curso es obligatorio.");
    if (!nombre.trim()) e.push("El nombre es obligatorio.");
    if (Number(cantidadReactivos) <= 0) e.push("La cantidad de reactivos debe ser mayor a 0.");
    if (Number(intentosPermitidos) <= 0) e.push("Los intentos permitidos deben ser mayor a 0.");
    if (Number(umbralAprobacion) < 60) e.push("El umbral de aprobación debe ser 60 o mayor.");
    if (tipo === "examen") {
      if (aleatorizarPreguntas === undefined) e.push("Falta aleatorizar_preguntas.");
      if (aleatorizarOpciones === undefined) e.push("Falta aleatorizar_opciones.");
    }
    return e;
  }, [idCurso, nombre, cantidadReactivos, intentosPermitidos, umbralAprobacion, tipo, aleatorizarPreguntas, aleatorizarOpciones]);

  // Payload base para ambos controladores
  const basePayload = () => {
    const b = {
      id_curso: Number(idCurso),
      nombre: nombre.trim(),
      descripcion: descripcion || null,
      cantidad_reactivos: Number(cantidadReactivos),
      intentos_permitidos: Number(intentosPermitidos),
      umbral_aprobacion: Number(umbralAprobacion),
    };
    // Filtros opcionales
    if (idTema) b.id_tema = Number(idTema);
    if (idDificultad) b.id_dificultad = Number(idDificultad);
    if (idNivelBloom) b.id_nivel_bloom = Number(idNivelBloom);
    if (idTipoPregunta) b.id_tipo_pregunta = Number(idTipoPregunta);
    return b;
  };

  // === Llamadas a API con rutas EXACTAS de tu backend ===

  // Crea actividad según tipo
  const createActividad = async () => {
    const base = basePayload();

    if (tipo === "practica") {
      // RUTA REAL: POST /actividad/practica
      const res = await api.post("/actividad/practica", base, { validateStatus: () => true });
      if (res.status < 200 || res.status >= 300) {
        throw new Error(res.data?.message || res.data?.error || `HTTP ${res.status}`);
      }
      const j = res.data || {};
      const actividadId =
        j?.actividad?.id || j?.id || j?.data?.id || j?.actividad_practica?.id || j?.actividad_examen?.id;
      if (!actividadId) throw new Error("No se pudo obtener el ID de la actividad creada (práctica).");
      return Number(actividadId);
    }

    // EXAMEN
    const payload = {
      ...base,
      modo: modo || null,
      tiempo_limite: String(tiempoLimite).trim() ? Number(tiempoLimite) : null,
      aleatorizar_preguntas: Boolean(aleatorizarPreguntas),
      aleatorizar_opciones: Boolean(aleatorizarOpciones),
      estado: true, // requerido por tu controlador de examen
    };

    // RUTA REAL: POST /actividad-examenes
    const res = await api.post("/actividad-examenes", payload, { validateStatus: () => true });
    if (res.status < 200 || res.status >= 300) {
      throw new Error(res.data?.message || res.data?.error || `HTTP ${res.status}`);
    }
    const j = res.data || {};
    const actividadId =
      j?.actividad?.id || j?.id || j?.data?.id || j?.actividad_practica?.id || j?.actividad_examen?.id;
    if (!actividadId) throw new Error("No se pudo obtener el ID de la actividad creada (examen).");
    return Number(actividadId);
  };

  // Vincula preguntas seleccionadas
  const attachSeleccion = async (actividadId) => {
    if (!seleccion.length) return;

    if (tipo === "practica") {
      // RUTA REAL: POST /pregunta/actividad-practica
      for (let i = 0; i < seleccion.length; i++) {
        const pid = Number(seleccion[i].id);
        const res = await api.post(
          "/pregunta/actividad-practica",
          { id_actividad_practica: Number(actividadId), id_pregunta: pid, orden: i + 1 },
          { validateStatus: () => true }
        );
        if (res.status < 200 || res.status >= 300) {
          throw new Error(
            `Error vinculando (práctica) #${pid}: ${res.data?.message || res.data?.error || `HTTP ${res.status}`}`
          );
        }
      }
      return;
    }

    // EXAMEN → RUTA REAL: POST /pregunta-actividad-examenes
    for (let i = 0; i < seleccion.length; i++) {
      const pid = Number(seleccion[i].id);
      const res = await api.post(
        "/pregunta-actividad-examenes",
        { id_actividad_examen: Number(actividadId), id_pregunta: pid, orden: i + 1 },
        { validateStatus: () => true }
      );
      if (res.status < 200 || res.status >= 300) {
        throw new Error(
          `Error vinculando (examen) #${pid}: ${res.data?.message || res.data?.error || `HTTP ${res.status}`}`
        );
      }
    }
  };

  // Guardar
  const guardar = async (e) => {
    e?.preventDefault?.();
    setMsg(null);

    if (errores.length) {
      setMsg({ ok: false, text: errores[0] });
      return;
    }

    try {
      setSaving(true);
      const actividadId = await createActividad();
      await attachSeleccion(actividadId);

      // Limpia selección persistida
      localStorage.removeItem("seleccion-preguntas");

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

  // UI
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

        {/* Selección manual desde sub-página */}
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800">🧩 Selección de preguntas (manual)</h2>
            <button
              type="button"
              onClick={() =>
                navigate(`/docente/banco-preguntas/seleccionar?returnTo=/docente/crear-actividad`)
              }
              className="h-9 px-4 rounded-xl border border-gray-300 bg-white hover:bg-gray-50"
            >
              Seleccionar desde Banco
            </button>
          </div>

          {seleccion.length === 0 ? (
            <p className="text-sm text-gray-500 mt-3">
              No hay preguntas seleccionadas. Si no seleccionas, el backend tomará preguntas por filtros/aleatoriedad (según tu configuración).
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
                    onClick={() => setSeleccion((curr) => curr.filter((x) => x.id !== p.id))}
                    className="h-9 px-3 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Filtros opcionales (back los usa al crear si no seleccionas) */}
        <section>
          <h2 className="text-base font-semibold text-gray-800">🎯 Filtros opcionales</h2>
          <div className="grid md:grid-cols-2 gap-4 mt-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Tema (opcional)</label>
              <input
                type="number"
                value={idTema}
                onChange={(e) => setIdTema(e.target.value)}
                className="w-full border rounded-xl px-3 h-10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Dificultad (opcional)</label>
              <input
                type="number"
                value={idDificultad}
                onChange={(e) => setIdDificultad(e.target.value)}
                className="w-full border rounded-xl px-3 h-10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nivel Bloom (opcional)</label>
              <input
                type="number"
                value={idNivelBloom}
                onChange={(e) => setIdNivelBloom(e.target.value)}
                className="w-full border rounded-xl px-3 h-10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo de pregunta (opcional)</label>
              <input
                type="number"
                value={idTipoPregunta}
                onChange={(e) => setIdTipoPregunta(e.target.value)}
                className="w-full border rounded-xl px-3 h-10"
              />
            </div>
          </div>
        </section>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate("/docente/dashboard")}
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
          <p className={`text-sm ${msg.ok ? "text-green-600" : "text-red-600"} mt-2`}>
            {msg.text}
          </p>
        )}
      </form>
    </div>
  );
}
