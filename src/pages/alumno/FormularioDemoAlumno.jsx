import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function FormularioDemoAlumno() {
  const { id } = useParams(); // ID de la actividad seleccionada
  const navigate = useNavigate();

  const [respuestas, setRespuestas] = useState({
    q1: "",
    q2: [],
    q3: "",
  });

  const handleChange = (name, value) => {
    setRespuestas((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleCheck = (value) => {
    setRespuestas((prev) => {
      const yaEsta = prev.q2.includes(value);
      return {
        ...prev,
        q2: yaEsta
          ? prev.q2.filter((v) => v !== value)
          : [...prev.q2, value],
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Tus respuestas fueron enviadas (demo). Revisa consola.");
    console.log("RESPUESTAS ENVIADAS A LA ACTIVIDAD", id, respuestas);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado / regresar */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Actividad #{id} · Cuestionario de Fundamentos
          </h1>
          <p className="text-sm text-gray-600">
            Responde las siguientes preguntas. Tienes 20 minutos.
          </p>
        </div>

        <button
          onClick={() => navigate("/alumno/actividades")}
          className="text-sm px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          ⬅ Volver a actividades
        </button>
      </div>

      {/* Info rápida */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <div className="flex flex-wrap items-center gap-6 text-xs text-gray-600">
          <div>
            <span className="font-semibold text-gray-800 block text-sm">
              Curso:
            </span>
            <span>Introducción a la Programación</span>
          </div>
          <div>
            <span className="font-semibold text-gray-800 block text-sm">
              Tiempo restante:
            </span>
            <span className="text-red-600 font-semibold">19:24</span>
          </div>
          <div>
            <span className="font-semibold text-gray-800 block text-sm">
              Intentos:
            </span>
            <span>1 / 2</span>
          </div>
          <div>
            <span className="font-semibold text-gray-800 block text-sm">
              Progreso:
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-semibold bg-indigo-100 text-indigo-700">
              2 / 10 preguntas
            </span>
          </div>
        </div>
      </div>

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-10"
      >
        {/* Pregunta 1 */}
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <p className="text-gray-800 font-medium">
              <span className="text-indigo-600 font-bold mr-2">1.</span>
              ¿Cuál es la salida de{" "}
              <code className="bg-gray-100 px-1 py-0.5 rounded text-xs text-gray-800">
                console.log(2 + "2")
              </code>{" "}
              en JavaScript?
            </p>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              1 punto
            </span>
          </div>

          <div className="grid gap-2">
            {[
              { value: "22", label: `"22"` },
              { value: "4", label: "4" },
              { value: "NaN", label: "NaN" },
              { value: "Error", label: "Marca error" },
            ].map((opt) => (
              <label
                key={opt.value}
                className={`flex items-start gap-3 cursor-pointer rounded-lg border p-3 ${
                  respuestas.q1 === opt.value
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="q1"
                  className="mt-1"
                  value={opt.value}
                  checked={respuestas.q1 === opt.value}
                  onChange={(e) => handleChange("q1", e.target.value)}
                />
                <span className="text-sm text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>

          <p className="text-xs text-gray-500 italic">
            Selecciona solo una opción.
          </p>
        </div>

        {/* Pregunta 2 */}
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <p className="text-gray-800 font-medium">
              <span className="text-indigo-600 font-bold mr-2">2.</span>
              ¿Cuáles de las siguientes son etiquetas HTML semánticas?
            </p>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              2 puntos
            </span>
          </div>

          <div className="grid gap-2">
            {[
              { value: "header", label: "<header>" },
              { value: "div", label: "<div>" },
              { value: "section", label: "<section>" },
              { value: "footer", label: "<footer>" },
            ].map((opt) => (
              <label
                key={opt.value}
                className="flex items-start gap-3 cursor-pointer rounded-lg border p-3 border-gray-200 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={respuestas.q2.includes(opt.value)}
                  onChange={() => {
                    setRespuestas((prev) => {
                      const yaEsta = prev.q2.includes(opt.value);
                      return {
                        ...prev,
                        q2: yaEsta
                          ? prev.q2.filter((v) => v !== opt.value)
                          : [...prev.q2, opt.value],
                      };
                    });
                  }}
                />
                <span className="text-sm text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>

          <p className="text-xs text-gray-500 italic">
            Marca todas las que apliquen.
          </p>
        </div>

        {/* Pregunta 3 */}
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <p className="text-gray-800 font-medium">
              <span className="text-indigo-600 font-bold mr-2">3.</span>
              Explica con tus propias palabras qué es una API y para qué sirve.
            </p>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              5 puntos
            </span>
          </div>

          <textarea
            className="w-full min-h-[120px] rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-800 p-3 resize-y"
            placeholder="Tu respuesta aquí..."
            value={respuestas.q3}
            onChange={(e) =>
              setRespuestas((prev) => ({ ...prev, q3: e.target.value }))
            }
          />

          <div className="flex justify-between text-xs text-gray-500">
            <span>Mínimo 3 líneas.</span>
            <span>{respuestas.q3.length} / 500</span>
          </div>
        </div>

        {/* Footer botones */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-gray-200 pt-6">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="inline-flex items-center px-2 py-1 rounded bg-yellow-100 text-yellow-700 font-medium">
              Borrador guardado
            </span>
            <span>Última vez: hace 2 min</span>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
              onClick={() => alert("Borrador guardado (demo).")}
            >
              Guardar borrador
            </button>

            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
            >
              Enviar respuestas
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
