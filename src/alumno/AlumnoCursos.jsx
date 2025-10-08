import { useEffect, useState } from "react";
import { getMisCursos, inscribirCurso } from "../api/alumno";

export default function AlumnoCursos() {
  const [cursos, setCursos] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const cargar = async () => {
    setMsg("");
    setLoading(true);
    try {
      const data = await getMisCursos();
      setCursos(data);
    } catch (e) {
      setMsg(e?.response?.data?.message || "No fue posible cargar tus cursos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const inscribir = async () => {
    const id = prompt("ID del curso a inscribirte:");
    if (!id) return;
    try {
      const r = await inscribirCurso(id);
      alert(r?.message || "Inscripción realizada");
      await cargar();
    } catch (e) {
      alert(e?.response?.data?.message || "No fue posible inscribirte");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <h1 className="text-xl font-bold">Mis cursos</h1>
        <button
          onClick={cargar}
          className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50"
        >
          Recargar
        </button>
        <button
          onClick={inscribir}
          className="rounded-lg bg-emerald-600 px-3 py-1 text-sm text-white hover:bg-emerald-700"
        >
          Inscribirme a curso (por ID)
        </button>
      </div>

      {msg && <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-2 text-yellow-700">{msg}</div>}

      {loading && <div>Cargando…</div>}

      {!loading && Array.isArray(cursos) && cursos.length === 0 && (
        <div className="text-gray-500">Aún no tienes cursos.</div>
      )}

      {!loading && Array.isArray(cursos) && cursos.length > 0 && (
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cursos.map((c) => (
            <li key={c.id} className="rounded-xl border bg-white p-4 shadow-sm">
              <h3 className="font-semibold">{c.nombre ?? c.titulo ?? `Curso #${c.id}`}</h3>
              <p className="text-sm text-gray-600">{c.descripcion ?? "Sin descripción"}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
