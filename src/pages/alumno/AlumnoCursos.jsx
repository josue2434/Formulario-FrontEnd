import { useMemo, useState } from "react";
import { BookOpen, Clock, Trophy, PlayCircle, Star, CheckCircle } from "lucide-react";

const cursosMock = [
  {
    id: 1,
    titulo: "Introducción a la Programación",
    docente: "Mtra. Ana Ruiz",
    horas: 12,
    progreso: 80,
    calificacion: 9.1,
    portada: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop",
    estado: "en-curso", // en-curso | completado | pendiente
    ultimaActividad: "08/10/2025",
  },
  {
    id: 2,
    titulo: "Desarrollo Web con HTML, CSS y JS",
    docente: "Ing. Carlos Mora",
    horas: 24,
    progreso: 45,
    calificacion: 8.7,
    portada: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop",
    estado: "en-curso",
    ultimaActividad: "07/10/2025",
  },
  {
    id: 3,
    titulo: "Bases de Datos con MySQL",
    docente: "Mtro. Luis Ortega",
    horas: 18,
    progreso: 100,
    calificacion: 9.5,
    portada: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=800&auto=format&fit=crop",
    estado: "completado",
    ultimaActividad: "05/10/2025",
  },
  {
    id: 4,
    titulo: "Algoritmos y Estructuras de Datos",
    docente: "Dra. Sofía Núñez",
    horas: 20,
    progreso: 0,
    calificacion: null,
    portada: "https://images.unsplash.com/photo-1526378722484-bd91ca387e72?q=80&w=800&auto=format&fit=crop",
    estado: "pendiente",
    ultimaActividad: "-",
  },
];

const estadoBadge = {
  "en-curso": "bg-yellow-100 text-yellow-700",
  "completado": "bg-green-100 text-green-700",
  "pendiente": "bg-gray-100 text-gray-600",
};

export default function AlumnoCursos() {
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState("todos"); // todos | en-curso | completado | pendiente

  const cursosFiltrados = useMemo(() => {
    return cursosMock.filter((c) => {
      const matchTexto =
        c.titulo.toLowerCase().includes(q.toLowerCase()) ||
        c.docente.toLowerCase().includes(q.toLowerCase());
      const matchEstado = filtro === "todos" ? true : c.estado === filtro;
      return matchTexto && matchEstado;
    });
  }, [q, filtro]);

  return (
    <div className="space-y-6">
      {/* Título y controles */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Mis Cursos</h1>
          <p className="text-gray-600">Consulta tus cursos inscritos, progreso y estatus.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Buscar por curso o docente…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full sm:w-72 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            <option value="todos">Todos</option>
            <option value="en-curso">En curso</option>
            <option value="completado">Completados</option>
            <option value="pendiente">Pendientes</option>
          </select>
        </div>
      </header>

      {/* Grid de cursos */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {cursosFiltrados.map((c) => (
          <article key={c.id} className="bg-white border border-gray-100 rounded-2xl shadow overflow-hidden flex flex-col">
            {/* Portada */}
            <div className="relative h-40 w-full">
              <img src={c.portada} alt={c.titulo} className="h-full w-full object-cover" />
              <span className={`absolute top-3 left-3 text-xs px-2.5 py-1 rounded-full font-medium ${estadoBadge[c.estado]}`}>
                {c.estado === "en-curso" ? "En curso" : c.estado === "completado" ? "Completado" : "Pendiente"}
              </span>
            </div>

            {/* Contenido */}
            <div className="p-5 flex-1 flex flex-col gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 leading-snug">{c.titulo}</h3>
                <p className="text-sm text-gray-500">Imparte: {c.docente}</p>
              </div>

              {/* Métricas rápidas */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  {c.horas} h
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  Última actividad: {c.ultimaActividad}
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  {c.calificacion ? `${c.calificacion}` : "—"}
                </div>
              </div>

              {/* Progreso */}
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progreso</span>
                  <span>{c.progreso}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${c.progreso === 100 ? "bg-green-500" : "bg-indigo-600"}`}
                    style={{ width: `${c.progreso}%` }}
                  />
                </div>
              </div>

              {/* Acciones */}
              <div className="mt-auto flex items-center gap-3">
                {c.estado === "completado" ? (
                  <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition">
                    <CheckCircle className="w-4 h-4" />
                    Ver certificado
                  </button>
                ) : c.estado === "en-curso" ? (
                  <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition">
                    <PlayCircle className="w-4 h-4" />
                    Continuar
                  </button>
                ) : (
                  <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-200 text-gray-700 cursor-not-allowed">
                    <PlayCircle className="w-4 h-4" />
                    Comenzar
                  </button>
                )}

                <button className="ml-auto inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition">
                  <Trophy className="w-4 h-4 text-amber-600" />
                  Detalles
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

      {/* Vacío */}
      {cursosFiltrados.length === 0 && (
        <div className="text-center py-16 bg-white border border-dashed border-gray-300 rounded-2xl">
          <p className="text-gray-600">No se encontraron cursos con esos filtros.</p>
          <p className="text-sm text-gray-500">Intenta limpiar la búsqueda o cambiar el estado.</p>
        </div>
      )}
    </div>
  );
}
