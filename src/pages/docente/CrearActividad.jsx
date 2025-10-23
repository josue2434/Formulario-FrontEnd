"use client"

import { useEffect, useMemo, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"

const API_BASE = "http://127.0.0.1:8000/api" // ajusta si usas otra URL

export default function CrearActividad() {
  const navigate = useNavigate()
  const location = useLocation()

  // ===== Form =====
  const [titulo, setTitulo] = useState("")
  const [tipo, setTipo] = useState("examen") // examen | practica
  const [descripcion, setDescripcion] = useState("")
  const [duracion, setDuracion] = useState(60)
  const [intentos, setIntentos] = useState(1)

  // ===== Preguntas =====
  const [preguntas, setPreguntas] = useState([]) // catálogo backend
  const [busqueda, setBusqueda] = useState("")
  const [seleccion, setSeleccion] = useState([]) // [{id, texto_pregunta, puntos}]
  const [showSelector, setShowSelector] = useState(false)

  // ===== Estado UI =====
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  // ===== Helpers =====
  const tokenHeaders = () => {
    const token = localStorage.getItem("token")
    return {
      "Content-Type": "application/json",
      Accept: "application/json", // Evita que Laravel redirija, devuelve JSON
      "X-Requested-With": "XMLHttpRequest", // Identifica como petición AJAX
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
  }

  const activityEndpoint = () =>
    tipo === "practica" ? `${API_BASE}/actividad-practica` : `${API_BASE}/actividad-examenes`

  const linkEndpoint = (actividadId) =>
    tipo === "practica"
      ? {
          url: `${API_BASE}/pregunta-actividad-practica`,
          body: (pid, pts) => ({ id_actividad_practica: actividadId, id_pregunta: pid, puntos: pts }),
        }
      : {
          url: `${API_BASE}/pregunta-actividad-examenes`,
          body: (pid, pts) => ({ id_actividad_examen: actividadId, id_pregunta: pid, puntos: pts }),
        }

  const buildPayloadActividad = () => ({
    // Ajusta nombres si tu backend usa otros (p.ej. tiempo_limite)
    titulo,
    descripcion,
    duracion_minutos: Number(duracion) || 0,
    intentos: Number(intentos) || 1,
    estado: 1,
  })

  const normalizeIdFromResponse = async (res) => {
    try {
      const j = await res.clone().json()
      console.log("[v0] Response JSON:", j)
      if (j?.id) return Number(j.id)
      if (j?.data?.id) return Number(j.data.id)
      if (j?.actividad?.id) return Number(j.actividad.id)
      if (j?.actividad_practica?.id) return Number(j.actividad_practica.id)
      if (j?.actividad_examen?.id) return Number(j.actividad_examen.id)
    } catch (err) {
      console.error("[v0] Error parsing JSON:", err)
    }
    const loc = res.headers?.get?.("Location") || res.headers?.get?.("location")
    if (loc) {
      const m = loc.match(/\/(\d+)\s*$/)
      if (m) return Number(m[1])
    }
    return null
  }

  const togglePregunta = (p) => {
    setSeleccion((curr) => {
      const exists = curr.find((x) => x.id === p.id)
      if (exists) return curr.filter((x) => x.id !== p.id)
      return [...curr, { id: p.id, texto_pregunta: p.texto_pregunta || p.texto, puntos: 1 }]
    })
  }

  const setPuntos = (id, pts) =>
    setSeleccion((curr) => curr.map((x) => (x.id === id ? { ...x, puntos: Math.max(1, Number(pts) || 1) } : x)))

  const getCurrentUserId = () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return null
      const payload = JSON.parse(atob(token.split(".")[1]))
      return payload?.sub || payload?.id || payload?.user_id || null
    } catch {
      return null
    }
  }

  // ===== Cargar preguntas catálogo =====
  useEffect(() => {
    const fetchPreguntas = async () => {
      try {
        const token = localStorage.getItem("token")
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const res = await fetch(`${API_BASE}/preguntas`, { headers })
        const txt = await res.text()
        let data = []
        try {
          const j = JSON.parse(txt)
          if (Array.isArray(j)) data = j
          else if (Array.isArray(j?.data)) data = j.data
          else if (Array.isArray(j?.preguntas)) data = j.preguntas
        } catch {
          data = []
        }
        setPreguntas(data)
      } catch (e) {
        console.error("Error cargando preguntas:", e)
      }
    }
    fetchPreguntas()
  }, [])

  useEffect(() => {
    const currentUserId = getCurrentUserId()

    if (!currentUserId) {
      localStorage.removeItem("crear-actividad-draft")
      return
    }

    const saved = localStorage.getItem("crear-actividad-draft")
    if (saved) {
      try {
        const d = JSON.parse(saved)
        if (d?.userId && d.userId !== currentUserId) {
          localStorage.removeItem("crear-actividad-draft")
          return
        }
        if (d?.titulo) setTitulo(d.titulo)
        if (d?.tipo) setTipo(d.tipo)
        if (d?.descripcion) setDescripcion(d.descripcion)
        if (d?.duracion) setDuracion(d.duracion)
        if (d?.intentos) setIntentos(d.intentos)
        if (Array.isArray(d?.seleccion)) setSeleccion(d.seleccion)
      } catch {}
    }

    const params = new URLSearchParams(location.search)
    const added = params.get("added")
    if (added) {
      const token = localStorage.getItem("token")
      fetch(`${API_BASE}/preguntas/${added}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then((r) => r.json())
        .then((p) => {
          const texto = p?.texto_pregunta || p?.texto || `Pregunta #${added}`
          setSeleccion((curr) => {
            if (curr.find((x) => String(x.id) === String(added))) return curr
            return [...curr, { id: Number(added), texto_pregunta: texto, puntos: 1 }]
          })
          navigate(location.pathname, { replace: true })
        })
        .catch(() => {
          navigate(location.pathname, { replace: true })
        })
    }
  }, [location.search]) // Agregada dependencia para detectar cambios en URL

  // ===== Búsqueda =====
  const preguntasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return preguntas
    return preguntas.filter((p) =>
      String(p.texto_pregunta || p.texto || "")
        .toLowerCase()
        .includes(q),
    )
  }, [preguntas, busqueda])

  const guardar = async (e) => {
    e?.preventDefault?.()
    setMsg(null)

    console.log("[v0] ===== INICIANDO GUARDADO =====")
    console.log("[v0] Título:", titulo)
    console.log("[v0] Tipo:", tipo)
    console.log("[v0] Preguntas seleccionadas:", seleccion.length)

    if (!titulo.trim()) return setMsg({ ok: false, text: "El título es obligatorio." })
    if (!["examen", "practica", "tarea"].includes(tipo)) return setMsg({ ok: false, text: "Tipo inválido." })

    try {
      setSaving(true)

      const payload = buildPayloadActividad()
      const endpoint = activityEndpoint()

      console.log("[v0] ===== PASO 1: CREAR ACTIVIDAD =====")
      console.log("[v0] Endpoint:", endpoint)
      console.log("[v0] Payload:", JSON.stringify(payload, null, 2))
      console.log("[v0] Headers:", tokenHeaders())

      // 1) Crear actividad
      let resAct
      try {
        resAct = await fetch(endpoint, {
          method: "POST",
          headers: tokenHeaders(),
          body: JSON.stringify(payload),
          credentials: "include",
        })
        console.log("[v0] Fetch completado. Status:", resAct.status, resAct.statusText)
      } catch (fetchError) {
        console.error("[v0] ===== ERROR DE RED =====")
        console.error("[v0] No se pudo conectar al servidor")
        console.error("[v0] Error:", fetchError)
        console.error("[v0] Verifica que:")
        console.error("[v0]   1. El backend Laravel esté corriendo en http://127.0.0.1:8000")
        console.error("[v0]   2. No haya problemas de CORS")
        console.error("[v0]   3. El endpoint sea correcto:", endpoint)
        throw new Error(
          `No se pudo conectar al servidor. Verifica que el backend esté corriendo en http://127.0.0.1:8000`,
        )
      }

      if (!resAct.ok) {
        const errorText = await resAct.text()
        console.error("[v0] ===== ERROR DEL SERVIDOR =====")
        console.error("[v0] Status:", resAct.status)
        console.error("[v0] Response:", errorText)

        try {
          const errorJson = JSON.parse(errorText)
          console.error("[v0] Error JSON:", errorJson)
          if (errorJson.message) {
            throw new Error(`Error ${resAct.status}: ${errorJson.message}`)
          }
        } catch (parseErr) {
          // No es JSON, usar el texto plano
        }

        throw new Error(`Error ${resAct.status}: ${errorText || "Error al crear la actividad"}`)
      }

      const responseText = await resAct.text()
      console.log("[v0] Response body (texto):", responseText)

      let responseJson
      try {
        responseJson = JSON.parse(responseText)
        console.log("[v0] Response body (JSON):", responseJson)
      } catch (parseErr) {
        console.error("[v0] No se pudo parsear la respuesta como JSON")
        throw new Error("La respuesta del servidor no es JSON válido")
      }

      const actividadId =
        responseJson?.id ||
        responseJson?.data?.id ||
        responseJson?.actividad?.id ||
        responseJson?.actividad_practica?.id ||
        responseJson?.actividad_examen?.id ||
        null

      console.log("[v0] ID de actividad extraído:", actividadId)

      if (!actividadId) {
        console.error("[v0] ===== NO SE PUDO EXTRAER EL ID =====")
        console.error("[v0] Estructura de respuesta:", responseJson)
        throw new Error(
          "No se pudo obtener el ID de la actividad creada. Revisa la estructura de respuesta del backend.",
        )
      }

      // 2) Vincular preguntas
      if (seleccion.length) {
        const { url, body } = linkEndpoint(actividadId)
        console.log("[v0] ===== PASO 2: VINCULAR PREGUNTAS =====")
        console.log("[v0] Endpoint:", url)
        console.log("[v0] Cantidad de preguntas:", seleccion.length)

        for (const { id: pid, puntos } of seleccion) {
          const linkPayload = body(pid, Number(puntos) || 1)
          console.log("[v0] Vinculando pregunta", pid, "con payload:", linkPayload)

          let linkRes
          try {
            linkRes = await fetch(url, {
              method: "POST",
              headers: tokenHeaders(),
              body: JSON.stringify(linkPayload),
              credentials: "include",
            })
            console.log("[v0] Pregunta", pid, "- Status:", linkRes.status)
          } catch (fetchError) {
            console.error("[v0] Error de red al vincular pregunta", pid, ":", fetchError)
            throw new Error(`No se pudo conectar al servidor al vincular pregunta ${pid}`)
          }

          if (!linkRes.ok) {
            const linkErrorText = await linkRes.text()
            console.error("[v0] Error vinculando pregunta", pid, ":", linkErrorText)
            throw new Error(`Error al vincular pregunta ${pid}: ${linkErrorText || linkRes.status}`)
          }
        }
        console.log("[v0] Todas las preguntas vinculadas exitosamente")
      }

      // limpiar draft
      localStorage.removeItem("crear-actividad-draft")
      console.log("[v0] ===== ÉXITO =====")
      console.log("[v0] Actividad creada con ID:", actividadId)

      setMsg({ ok: true, text: "✅ Actividad creada correctamente" })
      setTimeout(() => navigate("/docente/dashboard"), 700)
    } catch (err) {
      console.error("[v0] ===== ERROR FINAL =====")
      console.error("[v0] Error completo:", err)
      console.error("[v0] Stack:", err.stack)
      setMsg({ ok: false, text: err.message || "Error inesperado" })
    } finally {
      setSaving(false)
    }
  }

  // ===== UI =====
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Crear Actividad</h1>

      <form onSubmit={guardar} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
        {/* Información General */}
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800">📋 Información general</h2>
            <span className="text-xs text-gray-500">Campos con * son obligatorios</span>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Título*</label>
              <input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                type="text"
                placeholder="Ej: Examen Final - Fundamentos de Redes"
                className="w-full h-10 border border-gray-300 rounded-xl px-3 focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Tipo de actividad*</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-xl px-3 focus:ring-2 focus:ring-purple-600"
              >
                <option value="examen">Examen</option>
                <option value="practica">Práctica</option>
                <option value="tarea">Tarea</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Duración (minutos)</label>
              <input
                type="number"
                min={1}
                value={duracion}
                onChange={(e) => setDuracion(e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-xl px-3 focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Intentos permitidos</label>
              <input
                type="number"
                min={1}
                value={intentos}
                onChange={(e) => setIntentos(e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-xl px-3 focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="block text-sm font-medium text-gray-700">Descripción</label>
              <textarea
                rows={3}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Descripción del propósito y contenido de esta actividad..."
                className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-600"
              />
            </div>
          </div>
        </section>

        {/* Preguntas */}
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800">🧩 Preguntas</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSelector(true)}
                className="h-9 px-4 rounded-xl border border-gray-300 bg-white hover:bg-gray-50"
              >
                Agregar preguntas
              </button>
              <button
                type="button"
                onClick={() => {
                  const currentUserId = getCurrentUserId()
                  const draft = { titulo, tipo, descripcion, duracion, intentos, seleccion, userId: currentUserId }
                  localStorage.setItem("crear-actividad-draft", JSON.stringify(draft))
                  const returnTo = encodeURIComponent("/docente/crear-actividad")
                  navigate(`/docente/crear-pregunta?returnTo=${returnTo}`)
                }}
                className="h-9 px-4 rounded-xl bg-purple-600 text-white hover:bg-purple-700"
              >
                + Nueva pregunta
              </button>
            </div>
          </div>

          {!seleccion.length ? (
            <p className="text-sm text-gray-500 mt-3">No has agregado preguntas aún.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {seleccion.map((p) => (
                <div key={p.id} className="flex items-center justify-between border rounded-xl px-3 py-2">
                  <div className="flex-1 pr-4">
                    <p className="text-sm text-gray-800">
                      <strong>#{p.id}</strong> — {p.texto_pregunta}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600">Puntos</label>
                    <input
                      type="number"
                      min={1}
                      value={p.puntos}
                      onChange={(e) => setPuntos(p.id, e.target.value)}
                      className="w-20 h-9 border border-gray-300 rounded-lg px-2"
                    />
                    <button
                      type="button"
                      onClick={() => togglePregunta(p)}
                      className="h-9 px-3 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Botones */}
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
            {saving ? "Creando..." : "Crear Actividad"}
          </button>
        </div>

        {msg && <p className={`text-sm ${msg.ok ? "text-green-600" : "text-red-600"}`}>{msg.text}</p>}
      </form>

      {/* Modal selector de preguntas */}
      {showSelector && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-800">Seleccionar preguntas</h3>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowSelector(false)}>
                ✕
              </button>
            </div>

            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por texto…"
              className="w-full h-10 border border-gray-300 rounded-xl px-3 focus:ring-2 focus:ring-purple-600"
            />

            <div className="mt-3 max-h-80 overflow-auto divide-y">
              {preguntasFiltradas.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 px-1">Sin resultados…</p>
              ) : (
                preguntasFiltradas.map((p) => {
                  const checked = !!seleccion.find((x) => x.id === p.id)
                  return (
                    <label
                      key={p.id}
                      className="flex items-start gap-3 py-3 cursor-pointer hover:bg-gray-50 px-2 rounded-lg"
                    >
                      <input
                        type="checkbox"
                        className="mt-1 accent-purple-600"
                        checked={checked}
                        onChange={() => togglePregunta(p)}
                      />
                      <div className="flex-1">
                        <p className="text-sm text-gray-800">
                          <strong>#{p.id}</strong> — {p.texto_pregunta || p.texto}
                        </p>
                      </div>
                    </label>
                  )
                })
              )}
            </div>

            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                className="h-9 px-4 rounded-xl border border-gray-300 bg-white hover:bg-gray-50"
                onClick={() => setShowSelector(false)}
              >
                Hecho
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
