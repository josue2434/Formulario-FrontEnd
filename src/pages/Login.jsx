import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
  const { login, signupAlumno, resolveRoleAndRedirect } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState("login"); // "login" | "signup"

  // ---- Login state ----
  const [loginForm, setLoginForm] = useState({ correo: "", clave: "" });
  const [showPwdLogin, setShowPwdLogin] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // ---- Signup state ----
  const [signupForm, setSignupForm] = useState({
    nombre: "",
    correo: "",
    clave: "",
    escolaridad: "",
    foto_perfil: null,
  });
  const [showPwdSignup, setShowPwdSignup] = useState(false);
  const [signupError, setSignupError] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  // ---- Handlers ----
  const onSubmitLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      await login(loginForm.correo, loginForm.clave);
      // Redirección por rol (si el usuario puede ser docente/admin)
      await resolveRoleAndRedirect(navigate);
    }catch (err) {
  const res = err?.response;
  console.log("Signup error:", res?.status, res?.data);
  const msg =
    res?.data?.message ||
    (res?.data?.errors && Object.values(res.data.errors).flat().join(" | ")) ||
    "No fue posible crear la cuenta";
  setSignupError(msg);

    } finally {
      setLoginLoading(false);
    }
  };

  const onFileChange = (file) => {
    setSignupForm((v) => ({ ...v, foto_perfil: file }));
    if (file) setPreview(URL.createObjectURL(file));
    else setPreview(null);
  };

  const onSubmitSignup = async (e) => {
    e.preventDefault();
    setSignupError("");
    setSignupLoading(true);
    try {
      // Registrar alumno -> el backend devuelve token + usuario + alumno
      await signupAlumno(signupForm);
      // Como es alumno por defecto, vámonos directo a /alumno
      navigate("/alumno", { replace: true });
    } catch (err) {
      // Mostrar mensajes de validación del backend si vienen
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.errors && Object.values(err.response.data.errors).flat().join(" | ") ||
        "No fue posible crear la cuenta";
      setSignupError(msg);
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-white shadow-sm">
        {/* Tabs */}
        <div className="flex">
          <button
            className={`flex-1 py-3 text-center font-medium rounded-t-2xl ${tab === "login" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700"}`}
            onClick={() => setTab("login")}
          >
            Iniciar sesión
          </button>
          <button
            className={`flex-1 py-3 text-center font-medium rounded-t-2xl ${tab === "signup" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700"}`}
            onClick={() => setTab("signup")}
          >
            Crear cuenta (Alumno)
          </button>
        </div>

        {/* Panel */}
        <div className="p-6 space-y-5">
          {tab === "login" ? (
            <form onSubmit={onSubmitLogin} className="space-y-4">
              <h1 className="text-2xl font-bold text-gray-800 text-center">Iniciar sesión</h1>

              {loginError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{loginError}</div>
              )}

              <div>
                <label className="text-sm text-gray-600">Correo</label>
                <input
                  type="email"
                  className="mt-1 w-full rounded-xl border p-2 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  value={loginForm.correo}
                  onChange={(e) => setLoginForm((v) => ({ ...v, correo: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Clave</label>
                <div className="mt-1 flex gap-2">
                  <input
                    type={showPwdLogin ? "text" : "password"}
                    className="flex-1 rounded-xl border p-2 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    value={loginForm.clave}
                    onChange={(e) => setLoginForm((v) => ({ ...v, clave: e.target.value }))}
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwdLogin((s) => !s)}
                    className="text-xs px-3 py-2 rounded-lg border hover:bg-gray-50"
                  >
                    {showPwdLogin ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-60"
              >
                {loginLoading ? "Entrando…" : "Entrar"}
              </button>
            </form>
          ) : (
            <form onSubmit={onSubmitSignup} className="space-y-4">
              <h1 className="text-2xl font-bold text-gray-800 text-center">Crear cuenta (Alumno)</h1>

              {signupError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{signupError}</div>
              )}

              <div>
                <label className="text-sm text-gray-600">Nombre completo</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-xl border p-2 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  value={signupForm.nombre}
                  onChange={(e) => setSignupForm((v) => ({ ...v, nombre: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Correo</label>
                <input
                  type="email"
                  className="mt-1 w-full rounded-xl border p-2 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  value={signupForm.correo}
                  onChange={(e) => setSignupForm((v) => ({ ...v, correo: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Clave (mín. 8)</label>
                <div className="mt-1 flex gap-2">
                  <input
                    type={showPwdSignup ? "text" : "password"}
                    className="flex-1 rounded-xl border p-2 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    value={signupForm.clave}
                    onChange={(e) => setSignupForm((v) => ({ ...v, clave: e.target.value }))}
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwdSignup((s) => !s)}
                    className="text-xs px-3 py-2 rounded-lg border hover:bg-gray-50"
                  >
                    {showPwdSignup ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600">Escolaridad</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-xl border p-2 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  value={signupForm.escolaridad}
                  onChange={(e) => setSignupForm((v) => ({ ...v, escolaridad: e.target.value }))}
                  placeholder="Ej. Bachillerato, Licenciatura…"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Foto de perfil (opcional)</label>
                <input
                  type="file"
                  accept="image/*"
                  className="mt-1 block w-full text-sm text-gray-700"
                  onChange={(e) => onFileChange(e.target.files?.[0] || null)}
                />
                {preview && (
                  <img src={preview} alt="preview" className="mt-2 h-20 w-20 rounded-full object-cover border" />
                )}
              </div>

              <button
                type="submit"
                disabled={signupLoading}
                className="w-full rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-60"
              >
                {signupLoading ? "Creando cuenta…" : "Crear cuenta"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
