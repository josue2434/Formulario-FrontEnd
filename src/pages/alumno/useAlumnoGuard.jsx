// src/alumno/useAlumnoGuard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axiosClient";

export default function useAlumnoGuard() {
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await api.get("/usuario/alumno"); // 200 si es alumno
        if (alive) setReady(true);
      } catch {
        // si NO es alumno -> fuera
        navigate("/login", { replace: true });
      }
    })();
    return () => { alive = false; };
  }, [navigate]);

  return ready; // el layout puede mostrar "Verificando..." hasta que esté listo
}
