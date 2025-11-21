// src/pages/docente/VistaPreviaActividades.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import api from "../../api/axiosClient";import { ClipboardList, BookOpen, Tag, Edit, Eye, BarChart3, Clock, BrainCircuit, CheckSquare, ChevronDown } from "lucide-react";

export default function VistaPreviaActividades() {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  //  Estado 
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null); // Para expandir resumen
  const [docenteId, setDocenteId] = useState(null);

  //  Filtros 
  const [q, setQ] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos"); // todos | examen | practica

  // Helpers 
  const extractDocenteId = (src) =>
    src?.docente?.id ?? src?.usuario?.docente?.id ?? src?.data?.docente?.id ?? null;

  const getActividadDocenteId = (act) => act?.id_docente ?? act?.docente?.id ?? null;

  //  Carga de datos 
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1. Obtener ID del docente
        const id = extractDocenteId(usuario);
        setDocenteId(id);
        if (!id) {
          // Fallback si no está en el contexto
          const rDoc = await api.get("/usuario/docente", { validateStatus: () => true });
          if (rDoc.status === 200) {
            setDocenteId(extractDocenteId(rDoc.data) ?? null);
          } else {
            throw new Error("No se pudo identificar al docente.");
          }
        }

        // 2. Cargar ambas listas de actividades
        const [resExamenes, resPracticas] = await Promise.all([
          api.get("/actividad-examenes"),
          api.get("/actividades/practicas"),
        ]);

        const examenes = (resExamenes.data?.actividades || resExamenes.data || []).map((act) => ({
          ...act,
          tipo_actividad: "Examen",
        }));

        const practicas = (resPracticas.data?.actividades || resPracticas.data || []).map((act) => ({
          ...act,
          tipo_actividad: "Práctica",
        }));

        setActividades([...examenes, ...practicas]);
      } catch (err) {
        setError(err?.message || "Error al cargar las actividades.");
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [usuario]);

  //  Lista filtrada 
  const actividadesFiltradas = useMemo(() => {
    if (!docenteId) return [];

    return actividades
      .filter((act) => String(getActividadDocenteId(act)) === String(docenteId))
      .filter((act) => {
        const matchTexto = q
          ? act.nombre.toLowerCase().includes(q.toLowerCase()) ||
            act.curso?.nombre.toLowerCase().includes(q.toLowerCase())
          : true;

        const matchTipo =
          filtroTipo === "todos"
            ? true
            : act.tipo_actividad.toLowerCase() === filtroTipo;

        return matchTexto && matchTipo;
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [actividades, docenteId, q, filtroTipo]);

  //  Manejador de Archivar 
  const handleArchive = async (actividad) => {
    const confirmacion = window.confirm(
      `¿Estás seguro de que quieres archivar la actividad "${actividad.nombre}"?`
    );
    if (!confirmacion) return;

    const endpoint =
      actividad.tipo_actividad === "Examen"
        ? `/actividad-examenes/${actividad.id}`
        : `/actividad/practica/${actividad.id}`;

    try {
      const res = await api.delete(endpoint);
      if (res.status === 200 || res.status === 204) {
        // Eliminar la actividad de la lista local para actualizar la UI
        setActividades((prev) =>
          prev.filter((a) => !(a.id === actividad.id && a.tipo_actividad === actividad.tipo_actividad))
        );
        alert("Actividad archivada correctamente.");
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Error al archivar la actividad.");
    }
  };

  // ===== Manejador de expandir/colapsar resumen =====
  const toggleResumen = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  // ===== Renderizado =====
  if (loading) return <p className="text-gray-500">Cargando actividades...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <ClipboardList className="w-8 h-8 text-purple-600" />
            Mis Actividades
          </h1>
          <p className="text-gray-600">
            Visualiza y gestiona los exámenes y prácticas que has creado.
          </p>
        </div>
      </header>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Buscar por nombre o curso..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full sm:w-80 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
        >
          <option value="todos">Todos los tipos</option>
          <option value="examen">Examen</option>
          <option value="practica">Práctica</option>
        </select>
      </div>

      {/* Lista de Actividades */}
      <section className="space-y-4">
        {actividadesFiltradas.length > 0 ? (
          actividadesFiltradas.map((act) => (
            <article
              key={`${act.tipo_actividad}-${act.id}`}
              className="bg-white border border-gray-200 rounded-xl shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:justify-between gap-4 p-5">
                {/* Info Principal */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        act.tipo_actividad === "Examen"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {act.tipo_actividad}
                    </span>
                    <h2 className="text-lg font-semibold text-gray-800">
                      {act.nombre}
                    </h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-gray-500" />
                      Curso: {act.curso?.nombre || "No asignado"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-gray-500" />
                      Reactivos: {act.cantidad_reactivos}
                    </span>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 shrink-0">
                  {act.tipo_actividad === "Examen" && (
                    <button
                      onClick={() => toggleResumen(act.id)}
                      className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50"
                      title="Ver resumen de distribución"
                    >
                      <BarChart3 className="w-4 h-4" /> Resumen
                      <ChevronDown className={`w-4 h-4 transition-transform ${expandedId === act.id ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                  <button
                    onClick={() =>
                      navigate(
                        `/docente/visualizar/${act.tipo_actividad === "Examen" ? "examen" : "practica"}/${act.id}`
                      )
                    }
                    className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50"
                  >
                    <Eye className="w-4 h-4" /> Visualizar
                  </button>

               <button
  onClick={() =>
    navigate(
      `/docente/crear-actividad?edit=${act.id}&tipo=${
        act.tipo_actividad === "Examen" ? "examen" : "practica"
      }`
    )
  }
  className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50"
>
  <Edit className="w-4 h-4" /> Editar
</button>


                </div>
              </div>
              {/* Panel de Resumen (expandible) */}
              {expandedId === act.id && act.tipo_actividad === "Examen" && (
                <ResumenExamen actividad={act} />
              )}
            </article>
          ))
        ) : (
          <div className="text-center py-12 bg-white border border-dashed rounded-xl">
            <p className="text-gray-600">No se encontraron actividades con los filtros actuales.</p>
          </div>
        )}
      </section>
    </div>
  );
}

/**
 * Panel de Resumen de Distribución para un Examen.
 */
function ResumenExamen({ actividad }) {
  const resumen = useMemo(() => {
    const preguntas = actividad.preguntas || [];
    const totalEjercicios = actividad.cantidad_reactivos || 0;
    const tiempoEstimado = actividad.tiempo_limite || 0;

    // Asumimos que cada pregunta tiene el mismo peso para sumar 100%.
    const ponderacionPorPregunta = totalEjercicios > 0 ? 100 / totalEjercicios : 0;
    const sumaPonderaciones = totalEjercicios > 0 ? 100 : 0;

    const distribucionTipo = preguntas.reduce((acc, p) => {
      const tipo = p.tipo_pregunta?.tipo || "Desconocido";
      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
    }, {});

    const distribucionBloom = preguntas.reduce((acc, p) => {
      const nivel = p.nivel_bloom?.nombre || "No asignado";
      acc[nivel] = (acc[nivel] || 0) + 1;
      return acc;
    }, {});

    return {
      totalEjercicios,
      sumaPonderaciones,
      tiempoEstimado,
      distribucionTipo,
      distribucionBloom,
      ponderacionPorPregunta,
    };
  }, [actividad]);

  return (
    <div className="bg-gray-50 border-t border-gray-200 p-5 animate-fade-in-down">
      <h3 className="text-base font-semibold text-gray-800 mb-4">Resumen de Distribución del Examen</h3>
      
      {/* Métricas Generales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-center">
        <div className="bg-white p-3 rounded-lg border">
          <dt className="text-xs text-gray-500">Total de Ejercicios</dt>
          <dd className="text-xl font-bold text-purple-700 flex items-center justify-center gap-2"><CheckSquare className="w-5 h-5" /> {resumen.totalEjercicios}</dd>
        </div>
        <div className="bg-white p-3 rounded-lg border">
          <dt className="text-xs text-gray-500">Suma Ponderaciones</dt>
          <dd className="text-xl font-bold text-purple-700">{resumen.sumaPonderaciones}%</dd>
        </div>
        <div className="bg-white p-3 rounded-lg border">
          <dt className="text-xs text-gray-500">Tiempo Estimado</dt>
          <dd className="text-xl font-bold text-purple-700 flex items-center justify-center gap-2"><Clock className="w-5 h-5" /> {resumen.tiempoEstimado} min</dd>
        </div>
        <div className="bg-white p-3 rounded-lg border">
          <dt className="text-xs text-gray-500">Ponderación / Pregunta</dt>
          <dd className="text-xl font-bold text-purple-700">{resumen.ponderacionPorPregunta.toFixed(1)}%</dd>
        </div>
      </div>

      {/* Distribuciones */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Por Tipo de Pregunta */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Distribución por Tipo</h4>
          <ul className="space-y-1 text-sm">
            {Object.entries(resumen.distribucionTipo).map(([tipo, count]) => (
              <li key={tipo} className="flex justify-between items-center bg-white p-2 rounded-md border"><span>{tipo}</span> <span className="font-semibold">{count}</span></li>
            ))}
          </ul>
        </div>
        {/* Por Nivel de Bloom */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2"><BrainCircuit className="w-4 h-4" /> Distribución por Nivel Bloom</h4>
          <ul className="space-y-1 text-sm">
            {Object.entries(resumen.distribucionBloom).map(([nivel, count]) => (
              <li key={nivel} className="flex justify-between items-center bg-white p-2 rounded-md border"><span>{nivel}</span> <span className="font-semibold">{count}</span></li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}