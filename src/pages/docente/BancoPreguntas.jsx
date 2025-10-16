import { useNavigate } from "react-router-dom";

export default function BancoPreguntas() {
  const navigate = useNavigate();
  const handleNueva = () => navigate("/docente/crear-pregunta");

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Banco de Preguntas</h1>
        <button
          onClick={handleNueva}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          + Nueva Pregunta
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <p className="text-gray-600">
            Aquí podrás gestionar todas tus preguntas para exámenes y actividades.
          </p>

          <div className="mt-4 space-y-3">
            <div className="border border-gray-200 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800">Pregunta de ejemplo 1</h3>
              <p className="text-sm text-gray-600 mt-1">Tipo: Opción múltiple</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
