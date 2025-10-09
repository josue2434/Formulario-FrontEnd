import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/axiosClient";

export default function DashboardSuper() {
  const { logout, usuario } = useAuth();
  const navigate = useNavigate();

  const [alumnos, setAlumnos] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [activeTab, setActiveTab] = useState("perfil"); // perfil por defecto
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [alumnosRes, docentesRes] = await Promise.all([
          api.get("/usuarios/alumnos"),
          api.get("/usuarios/docentes"),
        ]);

        const rawAlumnos = alumnosRes.data;
        const alumnosData = Array.isArray(rawAlumnos)
          ? rawAlumnos.map((a) => ({
              ...a,
              usuario: a.usuario || { nombre: a.nombre, correo: a.correo },
            }))
          : [];

        const rawDocentes = docentesRes.data;
        const docentesData = Array.isArray(rawDocentes)
          ? rawDocentes.map((d) => ({
              ...d,
              usuario: d.usuario || { nombre: d.nombre, correo: d.correo },
            }))
          : [];

        setAlumnos(alumnosData);
        setDocentes(docentesData);
      } catch (err) {
        console.error("Error al cargar datos:", err);
        if (err.response?.status === 401) {
          await logout();
          navigate("/login");
        } else {
          setError("No se pudieron cargar los datos");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [logout, navigate]);

  const cambiarEstado = async (tipo, id, nuevoEstado) => {
    const endpoint =
      tipo === "alumno" ? `/usuario/alumno/${id}` : `/usuario/docente/${id}`;

    try {
      await api.post(endpoint, { estado: nuevoEstado });

      if (tipo === "alumno") {
        setAlumnos((prev) =>
          prev.map((a) => (a.id === id ? { ...a, estado: nuevoEstado } : a))
        );
      } else {
        setDocentes((prev) =>
          prev.map((d) => (d.id === id ? { ...d, estado: nuevoEstado } : d))
        );
      }
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      alert("Error al cambiar el estado");
    }
  };

  const renderTabla = (data, tipo) => (
    <table className="min-w-full border border-gray-300 rounded-lg text-left mt-4">
      <thead className="bg-gray-100">
        <tr>
          <th className="p-2 border-b">Nombre</th>
          <th className="p-2 border-b">Correo</th>
          <th className="p-2 border-b">Estado</th>
          <th className="p-2 border-b text-center">Acción</th>
        </tr>
      </thead>
      <tbody>
        {data.length > 0 ? (
          data.map((item) => {
            const nombre = item.usuario?.nombre || item.nombre || "N/A";
            const correo = item.usuario?.correo || item.correo || "N/A";

            return (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-2 border-b">{nombre}</td>
                <td className="p-2 border-b">{correo}</td>
                <td className="p-2 border-b">
                  {item.estado === 1 ? (
                    <span className="text-green-600 font-semibold">Activo</span>
                  ) : (
                    <span className="text-red-500 font-semibold">Inactivo</span>
                  )}
                </td>
                <td className="p-2 border-b text-center">
                  {item.estado === 1 ? (
                    <button
                      onClick={() => cambiarEstado(tipo, item.id, 0)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm"
                    >
                      Dar de baja
                    </button>
                  ) : (
                    <button
                      onClick={() => cambiarEstado(tipo, item.id, 1)}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm"
                    >
                      Reactivar
                    </button>
                  )}
                </td>
              </tr>
            );
          })
        ) : (
          <tr>
            <td colSpan="4" className="p-4 text-center text-gray-500">
              No hay registros
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Cargando datos...</p>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-red-500">{error}</p>
      </div>
    );

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg p-6 flex flex-col">
        <h2 className="text-xl font-bold mb-6 text-purple-600">SuperUsuario</h2>
        <button
          onClick={() => setActiveTab("perfil")}
          className={`mb-2 p-2 rounded-lg text-left ${
            activeTab === "perfil"
              ? "bg-purple-500 text-white"
              : "hover:bg-gray-100"
          }`}
        >
          Perfil
        </button>
        <button
          onClick={() => setActiveTab("alumnos")}
          className={`mb-2 p-2 rounded-lg text-left ${
            activeTab === "alumnos"
              ? "bg-purple-500 text-white"
              : "hover:bg-gray-100"
          }`}
        >
          Alumnos
        </button>
        <button
          onClick={() => setActiveTab("docentes")}
          className={`mb-2 p-2 rounded-lg text-left ${
            activeTab === "docentes"
              ? "bg-purple-500 text-white"
              : "hover:bg-gray-100"
          }`}
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
        <h1 className="text-2xl font-bold mb-4">Panel del Superusuario</h1>
        <p className="text-gray-600 mb-6">
          Bienvenido {usuario?.nombre || "Superusuario"} 👋
        </p>

        {activeTab === "perfil" && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">Perfil</h2>
            <p><strong>Nombre:</strong> {usuario?.nombre || "N/A"}</p>
            <p><strong>Correo:</strong> {usuario?.correo || "N/A"}</p>
          </div>
        )}

        {activeTab === "alumnos" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Gestión de Alumnos</h2>
            {renderTabla(alumnos, "alumno")}
          </div>
        )}

        {activeTab === "docentes" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Gestión de Docentes</h2>
            {renderTabla(docentes, "docente")}
          </div>
        )}
      </div>
    </div>
  );
}
