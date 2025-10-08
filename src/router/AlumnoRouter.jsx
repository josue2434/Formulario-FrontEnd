// src/router/AlumnoRoute.jsx
//import { useEffect, useState } from "react";
//import { Navigate, Outlet } from "react-router-dom";
//import api from "../api/axiosClient";

//export default function AlumnoRoute() {
//  const [state, setState] = useState({ ready: false, allow: false });
//
//  useEffect(() => {
//    let alive = true;
//    (async () => {
//      try {
//        await api.get("/usuario/alumno"); // 200 si es alumno
//        if (alive) setState({ ready: true, allow: true });
//      } catch {
//        if (alive) setState({ ready: true, allow: false });
//      }
//    })();
//    return () => { alive = false; };
//  }, []);
//
//  if (!state.ready) {
//    return (
//      <div className="min-h-screen grid place-items-center text-gray-500">
//        Verificando acceso…
//     </div>
//  );
//  }

  // Si no es alumno -> login (o podrías mandar a /)
//  if (!state.allow) return <Navigate to="/login" replace />;
//
//  return <Outlet />;
//}
//