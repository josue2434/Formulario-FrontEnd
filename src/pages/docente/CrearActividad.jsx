// src/pages/docente/CrearActividad.jsx
"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../api/axiosClient";

import MarkdownPreview from "@uiw/react-markdown-preview";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import "katex/dist/katex.min.css";

const LS_SEL = "seleccion-preguntas";
const LS_FORM = "crear-actividad-form";

export default function CrearActividad() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const editTipo = searchParams.get("tipo");
  const isEdit = !!editId;
  const hydratedRef = useRef(false);

  const [tipo, setTipo] = useState("practica");
  const [idCurso, setIdCurso] = useState(1);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [cantidadReactivos, setCantidadReactivos] = useState(5);
  const [intentosPermitidos, setIntentosPermitidos] = useState(1);
  const [umbralAprobacion, setUmbralAprobacion] = useState(60);

  const [modo, setModo] = useState("");
  const [tiempoLimite, setTiempoLimite] = useState("");
  const [aleatorizarPreguntas, setAleatorizarPreguntas] = useState(true);
  const [aleatorizarOpciones, setAleatorizarOpciones] = useState(true);

  const [seleccion, setSeleccion] = useState([]);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const maxReactivos = useMemo(
    () => Number(cantidadReactivos) || 0,
    [cantidadReactivos]
  );
  const restante = Math.max(0, maxReactivos - seleccion.length);
  const topeAlcanzado = maxReactivos > 0 && seleccion.length >= maxReactivos;

  const leerSeleccionLS = () => {
    try {
      const raw = localStorage.getItem(LS_SEL);
      const arr = JSON.parse(raw || "[]");
      if (!Array.isArray(arr)) return [];
      return arr.map((x) => ({
        id: Number(x.id),
        texto_pregunta: x.texto_pregunta || `Pregunta #${x.id}`,
      }));
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
      return JSON.parse(localStorage.getItem(LS_FORM) || "{}");
    } catch {
      return {};
    }
  };

  const persistirFormulario = () => {
    try {
      localStorage.setItem(
        LS_FORM,
        JSON.stringify({
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
        })
      );
    } catch {}
  };

  const limpiarPersistencia = () => {
    try {
      localStorage.removeItem(LS_FORM);
      localStorage.removeItem(LS_SEL);
    } catch {}
  };

  // Cargar datos (edición o desde localStorage)
  useEffect(() => {
    const loadEdit = async () => {
      if (!isEdit || hydratedRef.current) return;

      try {
        const endpoint =
          editTipo === "examen"
            ? `/actividad-examenes/${editId}`
            : `/actividad/practica/${editId}`;

        const res = await api.get(endpoint);
        const act = res.data?.actividad || res.data;

        if (act) {
          setTipo(editTipo || "practica");
          setIdCurso(act.id_curso || 1);
          setNombre(act.nombre || "");
          setDescripcion(act.descripcion || "");
          setCantidadReactivos(act.cantidad_reactivos || 5);
          setIntentosPermitidos(act.intentos_permitidos || 1);
          setUmbralAprobacion(act.umbral_aprobacion || 60);

          if (editTipo === "examen") {
            setModo(act.modo || "");
            setTiempoLimite(act.tiempo_limite || "");
            setAleatorizarPreguntas(act.aleatorizar_preguntas ?? true);
            setAleatorizarOpciones(act.aleatorizar_opciones ?? true);
          }

          if (Array.isArray(act.preguntas)) {
            const sel = act.preguntas.map((p) => ({
              id: p.id,
              texto_pregunta: p.texto_pregunta || `Pregunta #${p.id}`,
            }));
            setSeleccion(sel);
            persistirSeleccion(sel);
          }
        }
      } catch {
        setMsg({ ok: false, text: "No se pudo cargar la actividad." });
      }

      hydratedRef.current = true;
    };

    if (isEdit) loadEdit();
    else {
      const f = leerFormularioLS();
      if (f && Object.keys(f).length) {
        if (typeof f.tipo === "string") setTipo(f.tipo);
        if (f.idCurso != null) setIdCurso(Number(f.idCurso));
        if (typeof f.nombre === "string") setNombre(f.nombre);
        if (typeof f.descripcion === "string") setDescripcion(f.descripcion);
        if (f.cantidadReactivos != null)
          setCantidadReactivos(Number(f.cantidadReactivos));
        if (f.intentosPermitidos != null)
          setIntentosPermitidos(Number(f.intentosPermitidos));
        if (f.umbralAprobacion != null)
          setUmbralAprobacion(Number(f.umbralAprobacion));
        if (typeof f.modo === "string") setModo(f.modo);
        if (f.tiempoLimite != null) setTiempoLimite(String(f.tiempoLimite));
        if (typeof f.aleatorizarPreguntas === "boolean")
          setAleatorizarPreguntas(f.aleatorizarPreguntas);
        if (typeof f.aleatorizarOpciones === "boolean")
          setAleatorizarOpciones(f.aleatorizarOpciones);
      }
    }

    if (!isEdit) {
      const inicial = leerSeleccionLS();
      setSeleccion(inicial);
      persistirSeleccion(inicial);
    }
  }, []);

  // Persistir formulario mientras se escribe (solo crear)
  useEffect(() => {
    if (!isEdit) persistirFormulario();
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

  // Refrescar selección al volver del banco
  useEffect(() => {
    if (isEdit) return;
    const onFocus = () => {
      const arr = leerSeleccionLS();
      setSeleccion(arr);
      persistirSeleccion(arr);
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [maxReactivos, isEdit]);

  // No permitir más de maxReactivos
  useEffect(() => {
    if (maxReactivos > 0 && seleccion.length > maxReactivos) {
      const trimmed = seleccion.slice(0, maxReactivos);
      setSeleccion(trimmed);
      persistirSeleccion(trimmed);
    }
  }, [maxReactivos, seleccion]);

  const errores = useMemo(() => {
    const e = [];
    if (!idCurso) e.push("El curso es obligatorio.");
    if (!nombre.trim()) e.push("El nombre es obligatorio.");
    if (maxReactivos <= 0)
      e.push("La cantidad de reactivos debe ser mayor a 0.");
    if (Number(intentosPermitidos) <= 0)
      e.push("Los intentos permitidos deben ser mayor a 0.");
    if (Number(umbralAprobacion) < 60)
      e.push("Umbral mínimo 60.");

    if (seleccion.length === 0)
      e.push("Debes seleccionar preguntas.");
    else if (seleccion.length !== maxReactivos)
      e.push(
        `Seleccionaste ${seleccion.length} preguntas, deben ser ${maxReactivos}.`
      );

    return e;
  }, [
    idCurso,
    nombre,
    maxReactivos,
    seleccion.length,
    intentosPermitidos,
    umbralAprobacion,
  ]);

  const basePayload = () => ({
    id_curso: Number(idCurso),
    nombre: nombre.trim(),
    descripcion: descripcion || null,
    cantidad_reactivos: maxReactivos,
    intentos_permitidos: Number(intentosPermitidos),
    umbral_aprobacion: Number(umbralAprobacion),
    estado: true,
  });

  const createActividad = async () => {
    const base = basePayload();

    // PRÁCTICA
    if (tipo === "practica") {
      const payload = {
        ...base,
        preguntas: seleccion.map((p, i) => ({
          id: Number(p.id),
          orden: i + 1,
        })),
      };

      const res = await api.post("/actividad/practica", payload, {
        validateStatus: () => true,
      });

      if (res.status < 200 || res.status >= 300)
        throw new Error(res.data?.message || res.data?.error);

      return res.data.actividad.id;
    }

    // EXAMEN: también enviamos preguntas
    const payload = {
      ...base,
      modo,
      tiempo_limite: tiempoLimite ? Number(tiempoLimite) : null,
      aleatorizar_preguntas: Boolean(aleatorizarPreguntas),
      aleatorizar_opciones: Boolean(aleatorizarOpciones),
      preguntas: seleccion.map((p, i) => ({
        id: Number(p.id),
        orden: i + 1,
      })),
    };

    const res = await api.post("/actividad-examenes", payload, {
      validateStatus: () => true,
    });

    if (res.status < 200 || res.status >= 300)
      throw new Error(
        res.data?.message ||
          (res.data?.errors
            ? Object.values(res.data.errors)[0][0]
            : res.data?.error)
      );

    return res.data.actividad.id;
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (errores.length) {
      setMsg({ ok: false, text: errores[0] });
      return;
    }

    try {
      setSaving(true);
      persistirFormulario();

      const actividadId = await createActividad();
      console.log("Actividad creada con id:", actividadId);

      limpiarPersistencia();
      setMsg({
        ok: true,
        text: `Actividad ${tipo} creada correctamente.`,
      });

      setTimeout(() => navigate("/docente/actividades"), 700);
    } catch (err) {
      setMsg({ ok: false, text: err?.message });
    } finally {
      setSaving(false);
    }
  };

  const irASelector = () => {
    if (maxReactivos <= 0) {
      setMsg({
        ok: false,
        text: "Define una cantidad > 0",
      });
      return;
    }

    persistirFormulario();

    const selectedIds = encodeURIComponent(
      JSON.stringify(seleccion.map((s) => s.id))
    );

    navigate(
      `/docente/banco-preguntas/seleccionar?returnTo=${encodeURIComponent(
        "/docente/crear-actividad"
      )}&max=${maxReactivos}&selected=${selectedIds}`
    );
  };

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        {isEdit ? "Editar" : "Crear"}{" "}
        {tipo === "examen" ? "Examen" : "Actividad Práctica"}
      </h1>

      <form
        onSubmit={guardar}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6"
      >
        {/* Tipo */}
        <section>
          <label className="block text-sm font-medium">Tipo</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            disabled={isEdit}
            className="w-full h-10 border border-gray-300 rounded-xl px-3"
          >
            <option value="practica">Práctica</option>
            <option value="examen">Examen</option>
          </select>
        </section>

        {/* Datos generales */}
        <section>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Curso*</label>
              <input
                type="number"
                value={idCurso}
                onChange={(e) => setIdCurso(e.target.value)}
                className="w-full h-10 border rounded-xl px-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Nombre*</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full h-10 border rounded-xl px-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">
                Cantidad de reactivos*
              </label>
              <input
                type="number"
                min={1}
                value={cantidadReactivos}
                onChange={(e) => setCantidadReactivos(e.target.value)}
                className="w-full h-10 border rounded-xl px-3"
              />
              <p className="text-xs text-gray-500">
                Debe coincidir con el número de preguntas seleccionadas abajo.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium">Intentos*</label>
              <input
                type="number"
                min={1}
                value={intentosPermitidos}
                onChange={(e) => setIntentosPermitidos(e.target.value)}
                className="w-full h-10 border rounded-xl px-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">
                Umbral de aprobación*
              </label>
              <input
                type="number"
                min={60}
                max={100}
                value={umbralAprobacion}
                onChange={(e) => setUmbralAprobacion(e.target.value)}
                className="w-full h-10 border rounded-xl px-3"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium">Descripción</label>
              <textarea
                rows={3}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="w-full border rounded-xl px-3 py-2"
              />
            </div>
          </div>
        </section>

        {/* Opciones extra solo examen */}
        {tipo === "examen" && (
          <section>
            <h2 className="font-semibold text-gray-800 mb-2">
              Opciones del examen
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Modo</label>
                <input
                  value={modo}
                  onChange={(e) => setModo(e.target.value)}
                  type="text"
                  className="w-full h-10 border rounded-xl px-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Tiempo límite (min, opcional)
                </label>
                <input
                  value={tiempoLimite}
                  onChange={(e) => setTiempoLimite(e.target.value)}
                  type="number"
                  min={1}
                  className="w-full h-10 border rounded-xl px-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Aleatorizar preguntas
                </label>
                <select
                  value={aleatorizarPreguntas ? "1" : "0"}
                  onChange={(e) =>
                    setAleatorizarPreguntas(e.target.value === "1")
                  }
                  className="w-full h-10 border rounded-xl px-3"
                >
                  <option value="1">Sí</option>
                  <option value="0">No</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Aleatorizar opciones
                </label>
                <select
                  value={aleatorizarOpciones ? "1" : "0"}
                  onChange={(e) =>
                    setAleatorizarOpciones(e.target.value === "1")
                  }
                  className="w-full h-10 border rounded-xl px-3"
                >
                  <option value="1">Sí</option>
                  <option value="0">No</option>
                </select>
              </div>
            </div>
          </section>
        )}

        {/* Selección de preguntas */}
        <section>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">
              Selección de preguntas (manual)
            </h2>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">
                Restantes: {restante} / {maxReactivos}
              </span>

              <button
                type="button"
                onClick={irASelector}
                disabled={topeAlcanzado}
                className={`h-9 px-4 rounded-xl border ${
                  topeAlcanzado
                    ? "border-gray-200 text-gray-400 bg-gray-50"
                    : "border-gray-300 bg-white hover:bg-gray-50"
                }`}
              >
                {topeAlcanzado ? "Límite alcanzado" : "Seleccionar desde Banco"}
              </button>
            </div>
          </div>

          {seleccion.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">
              No hay preguntas seleccionadas. Debes seleccionar tantas preguntas
              como indique la “Cantidad de reactivos”.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {seleccion.map((p, i) => (
                <div
                  key={p.id}
                  className="border rounded-xl p-3 flex justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <strong>#{p.id}</strong>
                      <span className="text-xs text-gray-500">
                        (orden {i + 1})
                      </span>
                    </div>

                    <MarkdownPreview
                      source={p.texto_pregunta}
                      wrapperElement={{ "data-color-mode": "light" }}
                      remarkPlugins={[remarkMath, remarkGfm]}
                      rehypePlugins={[rehypeKatex]}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const nueva = seleccion.filter((x) => x.id !== p.id);
                      setSeleccion(nueva);
                      persistirSeleccion(nueva);
                    }}
                    className="text-red-600 border border-red-300 h-8 px-3 rounded-lg"
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Botones */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              limpiarPersistencia();
              navigate("/docente/actividades");
            }}
            className="h-10 px-4 rounded-xl border"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={saving}
            className="h-10 px-6 bg-purple-600 text-white rounded-xl"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>

        {msg && (
          <p
            className={`text-sm mt-2 ${
              msg.ok ? "text-green-600" : "text-red-600"
            }`}
          >
            {msg.text}
          </p>
        )}
      </form>
    </div>
  );
}
