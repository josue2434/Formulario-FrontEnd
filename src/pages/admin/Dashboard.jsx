// src/pages/admin/Dashboard.jsx
import { useAuth } from "../../auth/AuthContext";

export default function Dashboard() {
  const { usuario } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Panel del Superusuario</h1>
      <p className="text-gray-600 mb-6">
        Bienvenido {usuario?.nombre || "Superusuario"} 👋
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Usuarios totales</h3>
          <p className="text-3xl font-bold text-purple-600">--</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Alumnos</h3>
          <p className="text-3xl font-bold text-purple-600">--</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Docentes</h3>
          <p className="text-3xl font-bold text-purple-600">--</p>
        </div>
      </div>
    </div>
  );
}
