// src/pages/admin/Perfil.jsx
import { useAuth } from "../../auth/AuthContext";

export default function Perfil() {
  const { usuario } = useAuth();

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-2">Perfil</h2>
      <p><strong>Nombre:</strong> {usuario?.nombre || "N/A"}</p>
      <p><strong>Correo:</strong> {usuario?.correo || "N/A"}</p>
    </div>
  );
}
