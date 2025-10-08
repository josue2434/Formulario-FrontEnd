import { useEffect, useState } from "react";
import { getAlumnoPerfil, updateAlumnoPerfil, deleteAlumnoCuenta } from "../api/alumno";

export default function AlumnoPerfil() {
  const [perfil, setPerfil] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await getAlumnoPerfil();
        if (alive) setPerfil(data);
      } catch (e) {
        setMsg("No fue posible cargar el perfil");
      }
    })();
    return () => { alive = false; };
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setGuardando(true);
    try {
      const payload = {
        // ajusta a lo que tu backend acepte en updateMe
        nombre: perfil?.usuario?.nombre ?? perfil?.nombre,
        escolaridad: perfil?.escolaridad,
      };
      const resp = await updateAlumnoPerfil(payload);
      setMsg(resp?.message || "Perfil actualizado");
    } catch (e) {
      setMsg(e?.response?.data?.message || "Error al actualizar");
    } finally {
      setGuardando(false);
    }
  };

  const onDelete = async () => {
    if (!confirm("¿Seguro que quieres eliminar tu cuenta?")) return;
    try {
      const resp = await deleteAlumnoCuenta();
      alert(resp?.message || "Cuenta eliminada");
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      window.location.href = "/login";
    } catch (e) {
      alert(e?.response?.data?.message || "No fue posible eliminar la cuenta");
    }
  };

  if (!perfil) return <div>Cargando…</div>;

  // Los campos dependen de cómo responde tu /usuario/alumno, ajusta los names si difieren
  const nombre = perfil?.usuario?.nombre ?? perfil?.nombre ?? "";
  const escolaridad = perfil?.escolaridad ?? "";

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-xl font-bold">Mi perfil</h1>

      {msg && <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-2 text-indigo-700">{msg}</div>}

      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="text-sm text-gray-600">Nombre</label>
          <input
            type="text"
            className="mt-1 w-full rounded-lg border p-2"
            value={nombre}
            onChange={(e) =>
              setPerfil((p) => ({
                ...p,
                usuario: { ...(p?.usuario || {}), nombre: e.target.value },
                nombre: e.target.value,
              }))
            }
            required
          />
        </div>

        <div>
          <label className="text-sm text-gray-600">Escolaridad</label>
          <input
            type="text"
            className="mt-1 w-full rounded-lg border p-2"
            value={escolaridad}
            onChange={(e) => setPerfil((p) => ({ ...p, escolaridad: e.target.value }))}
            required
          />
        </div>

        <button
          type="submit"
          disabled={guardando}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60"
        >
          {guardando ? "Guardando…" : "Guardar cambios"}
        </button>
      </form>

      <hr className="my-6" />

      <button
        onClick={onDelete}
        className="rounded-lg bg-red-500 px-4 py-2 text-white font-semibold hover:bg-red-600"
      >
        Eliminar mi cuenta
      </button>
    </div>
  );
}
