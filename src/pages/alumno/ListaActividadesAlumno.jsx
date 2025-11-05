import { ClipboardList, Clock, BookOpen, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ListaActividadesAlumno() {
  const navigate = useNavigate();

  // Simulado, después esto viene del backend
  const actividades = [
    {
      id: 101,
      titulo: "Cuestionario: Fundamentos de Programación",
      curso: "Introducción a la Programación",
      tipo: "Cuestionario",
      estado: "Pendiente",
      limite: "10/10/2025",
      duracion: "20 min",
      intentos: "1 / 2",
    },
    {
      id: 102,
      titulo: "Práctica: Maquetación con HTML y CSS",
      curso: "Desarrollo Web",
      tipo: "Práctica",
      estado: "En curso",
      limite: "09/10/2025",
      duracion: "40 min",
      intentos: "1 / ∞",
    },
    {
      id: 103,
      titulo: "Examen Parcial: Modelo Relacional",
      curso: "Bases de Datos con MySQL",
      tipo: "Examen",
      estado: "Disponible",
      limite: "12/10/2025",
      duracion: "45 min",
      intentos: "0 / 1",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-purple-600" />
            <span>Mis Actividades</span>
          </h1>
          <p className="text-sm text-gray-600">
            Selecciona una actividad para comenzar o continuar.
          </p>
        </div>

        <button
          onClick={() => navigate("/alumno/dashboard")}
          className="text-sm px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          ⬅ Volver al panel
        </button>
      </header>

      {/* Lista de actividades */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {actividades.map((act) => (
          <div
            key={act.id}
            className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col"
          >
            {/* Header con gradiente y estado */}
            <div className="p-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold leading-tight">
                  {act.titulo}
                </p>
                <p className="text-xs text-purple-100 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  {act.curso}
                </p>
              </div>

              <span
                className={`text-xs font-semibold px-2 py-1 rounded-md ${
                  act.estado === "Pendiente"
                    ? "bg-yellow-100 text-yellow-700"
                    : act.estado === "En curso"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {act.estado}
              </span>
            </div>

            {/* Info */}
            <div className="p-4 text-sm text-gray-700 space-y-2">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span>{act.duracion}</span>
                </div>

                <div className="flex items-center gap-2 text-gray-600">
                  <span className="text-xs bg-gray-100 border border-gray-300 text-gray-700 px-2 py-0.5 rounded">
                    {act.tipo}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-gray-600">
                  <span className="text-xs bg-gray-100 border border-gray-300 text-gray-700 px-2 py-0.5 rounded">
                    Intentos {act.intentos}
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                Fecha límite:{" "}
                <span className="font-medium">{act.limite}</span>
              </p>
            </div>

            {/* Botón Iniciar / Continuar */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={() => navigate(`/alumno/actividad/${act.id}`)}
                className="flex items-center gap-2 text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
              >
                <Play className="w-4 h-4" />
                <span>
                  {act.estado === "En curso" ? "Continuar" : "Iniciar"}
                </span>
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
