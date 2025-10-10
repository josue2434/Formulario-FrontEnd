// src/pages/admin/AdminLayout.jsx
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

export default function AdminLayout() {
  const { logout, usuario } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg p-6 flex flex-col">
        <h2 className="text-xl font-bold mb-6 text-purple-600">SuperUsuario</h2>

        <button
          onClick={() => navigate("/admin/perfil")}
          className="mb-2 p-2 rounded-lg text-left hover:bg-gray-100"
        >
          Perfil
        </button>
        <button
          onClick={() => navigate("/admin/alumnos")}
          className="mb-2 p-2 rounded-lg text-left hover:bg-gray-100"
        >
          Alumnos
        </button>
        <button
          onClick={() => navigate("/admin/docentes")}
          className="mb-2 p-2 rounded-lg text-left hover:bg-gray-100"
        >
          Docentes
        </button>

        <div className="mt-auto">
          <button
            onClick={handleLogout}
            className="w-full rounded-lg bg-red-500 px-4 py-2 text-white font-semibold shadow hover:bg-red-600 transition"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 p-8">
        <Outlet />
      </div>
    </div>
  );
}
