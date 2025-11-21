// src/pages/docente/EditarActividad.jsx
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function EditarActividad() {
  const navigate = useNavigate();
  const { tipo, id } = useParams();

  useEffect(() => {
    const tipoLower = String(tipo || "").toLowerCase();
    const esValido = tipoLower === "examen" || tipoLower === "practica";

    if (!id || !esValido) {
      navigate("/docente/actividades", { replace: true });
      return;
    }

    // Reusar CrearActividad en modo edición
    navigate(`/docente/crear-actividad?edit=${id}&tipo=${tipoLower}`, {
      replace: true,
    });
  }, [tipo, id, navigate]);

  return (
    <div className="p-6 text-gray-600">
      Cargando editor de actividad...
    </div>
  );
}
