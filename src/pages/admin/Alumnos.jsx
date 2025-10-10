// src/pages/admin/Alumnos.jsx
import { useEffect, useState } from "react";
import api from "../../api/axiosClient";
import { useAuth } from "../../auth/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Alumnos() {
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAlumnos = async () => {
      try {
        const res = await api.get("/usuarios/alumnos");
        const data = Array.isArray(res.data)
          ? res.data.map((a) => ({
              ...a,
              usuario: a.usuario || { nombre: a.nombre, correo: a.correo },
            }))
          : [];
        setAlumnos(data);
      } catch (err) {
        console.error(err);
        if (err.response?.status === 401) {
          await logout();
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAlumnos();
  }, [logout, navigate]);

  const cambiarEstado = async (id, nuevoEstado) => {
    try {
      await api.post(`/usuario/alumno/${id}`, { estado: nuevoEstado });
      setAlumnos((prev) =>
        prev.map((a) => (a.id === id ? { ...a, estado: nuevoEstado } : a))
      );
    } catch {
      alert("Error al cambiar el estado");
    }
  };

  if (loading) return <p className="text-gray-500">Cargando alumnos...</p>;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Gestión de Alumnos</h2>
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
          {alumnos.length > 0 ? (
            alumnos.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="p-2 border-b">{a.usuario?.nombre}</td>
                <td className="p-2 border-b">{a.usuario?.correo}</td>
                <td className="p-2 border-b">
                  {a.estado === 1 ? (
                    <span className="text-green-600 font-semibold">Activo</span>
                  ) : (
                    <span className="text-red-500 font-semibold">Inactivo</span>
                  )}
                </td>
                <td className="p-2 border-b text-center">
                  {a.estado === 1 ? (
                    <button
                      onClick={() => cambiarEstado(a.id, 0)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm"
                    >
                      Dar de baja
                    </button>
                  ) : (
                    <button
                      onClick={() => cambiarEstado(a.id, 1)}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm"
                    >
                      Reactivar
                    </button>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="p-4 text-center text-gray-500">
                No hay registros
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
