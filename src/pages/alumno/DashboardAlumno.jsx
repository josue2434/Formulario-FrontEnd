import { BookOpen, Award, Clock, Activity } from "lucide-react";

export default function DashboardAlumno() {
  return (
    <div className="space-y-6">
      {/* Título */}
      <header>
        <h1 className="text-3xl font-bold text-gray-800">Panel del Alumno</h1>
        <p className="text-gray-600">Resumen de tu progreso y actividades recientes.</p>
      </header>

      {/* Tarjetas de resumen */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 bg-white rounded-2xl shadow border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-indigo-100 rounded-full">
            <BookOpen className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Cursos inscritos</p>
            <h3 className="text-2xl font-semibold text-gray-800">5</h3>
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl shadow border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-full">
            <Award className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Cursos completados</p>
            <h3 className="text-2xl font-semibold text-gray-800">2</h3>
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl shadow border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-yellow-100 rounded-full">
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Horas de estudio</p>
            <h3 className="text-2xl font-semibold text-gray-800">18</h3>
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl shadow border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-pink-100 rounded-full">
            <Activity className="w-6 h-6 text-pink-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Cuestionarios resueltos</p>
            <h3 className="text-2xl font-semibold text-gray-800">12</h3>
          </div>
        </div>
      </section>

      {/* Actividades recientes */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Actividades recientes</h2>
        <div className="bg-white border border-gray-100 rounded-2xl shadow overflow-hidden">
          <table className="w-full text-sm text-left text-gray-700">
            <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Curso</th>
                <th className="px-6 py-3">Actividad</th>
                <th className="px-6 py-3">Fecha</th>
                <th className="px-6 py-3 text-center">Estatus</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="px-6 py-4">Introducción a la Programación</td>
                <td className="px-6 py-4">Cuestionario 1</td>
                <td className="px-6 py-4">08/10/2025</td>
                <td className="px-6 py-4 text-center text-green-600 font-semibold">Completado</td>
              </tr>
              <tr className="border-t">
                <td className="px-6 py-4">Desarrollo Web</td>
                <td className="px-6 py-4">Actividad práctica</td>
                <td className="px-6 py-4">07/10/2025</td>
                <td className="px-6 py-4 text-center text-yellow-600 font-semibold">En curso</td>
              </tr>
              <tr className="border-t">
                <td className="px-6 py-4">Bases de Datos</td>
                <td className="px-6 py-4">Examen parcial</td>
                <td className="px-6 py-4">05/10/2025</td>
                <td className="px-6 py-4 text-center text-red-600 font-semibold">Pendiente</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
