import { User, Mail, Phone, Calendar, BookOpen, Edit, Trash2 } from "lucide-react";

export default function AlumnoPerfil() {
  return (
    <div className="space-y-8">
      {/* Título */}
      <header>
        <h1 className="text-3xl font-bold text-gray-800">Perfil del Alumno</h1>
        <p className="text-gray-600">
          Visualiza tu información personal y académica registrada en el sistema.
        </p>
      </header>

      {/* Información general */}
      <section className="bg-white rounded-2xl shadow border border-gray-100 p-8 flex flex-col md:flex-row gap-8">
        {/* Foto de perfil */}
        <div className="flex flex-col items-center md:w-1/3">
          <img
            src="https://cdn-icons-png.flaticon.com/512/219/219970.png"
            alt="Foto del alumno"
            className="w-32 h-32 rounded-full border-4 border-indigo-200 shadow-md object-cover"
          />
          <h2 className="text-xl font-semibold text-gray-800 mt-4">Juan Pérez</h2>
          <p className="text-gray-500 text-sm">Estudiante de Ingeniería en Sistemas</p>

          {/* Botones */}
          <div className="flex gap-3 mt-6">
            <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
              <Edit className="w-4 h-4" />
              Editar
            </button>
            <button className="flex items-center gap-2 bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200 transition">
              <Trash2 className="w-4 h-4" />
              Eliminar
            </button>
          </div>
        </div>

        {/* Datos del alumno */}
        <div className="flex-1 space-y-6">
          {/* Información personal */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">
              Información personal
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-4">
              <li className="flex items-center gap-3 text-gray-700">
                <User className="w-5 h-5 text-indigo-600" />
                <span><strong>Nombre:</strong> Juan Pérez</span>
              </li>
              <li className="flex items-center gap-3 text-gray-700">
                <Mail className="w-5 h-5 text-indigo-600" />
                <span><strong>Correo:</strong> juanperez@correo.com</span>
              </li>
              <li className="flex items-center gap-3 text-gray-700">
                <Phone className="w-5 h-5 text-indigo-600" />
                <span><strong>Teléfono:</strong> +52 332-145-7890</span>
              </li>
              <li className="flex items-center gap-3 text-gray-700">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <span><strong>Fecha de registro:</strong> 12/03/2024</span>
              </li>
            </ul>
          </div>

          {/* Información académica */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">
              Información académica
            </h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <span><strong>Carrera:</strong> Ingeniería en Sistemas Computacionales</span>
              </li>
              <li className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <span><strong>Matrícula:</strong> UDG20251234</span>
              </li>
              <li className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <span><strong>Semestre actual:</strong> 5°</span>
              </li>
              <li className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <span><strong>Promedio general:</strong> 9.2</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
