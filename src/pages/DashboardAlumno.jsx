// src/pages/DashboardAlumno.jsx
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";

export default function DashboardAlumno() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="p-6 bg-white shadow rounded-xl text-center space-y-4">
        <h1 className="text-2xl font-bold">🎓 Panel Alumno</h1>
        <p className="text-gray-600">Bienvenido al panel del alumno.</p>

        <button
          onClick={handleLogout}
          className="mt-4 w-full rounded-lg bg-red-500 px-4 py-2 text-white font-semibold shadow hover:bg-red-600 transition"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
