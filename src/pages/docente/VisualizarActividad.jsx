import { useMemo, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, UserCircle2, Clock } from "lucide-react";

// ====== CONFIG ======
const DEFAULT_MINUTES = 20; // tiempo por defecto si el mock no trae duración

// ====== MOCK sin preguntas abiertas ======
const MOCK = {
  examen: {
    nombre: "Examen Unidad 1: Fundamentos",
    curso: "Programación I",
    duracionMin: 30,
    docenteNombre: "Mtra. Patricia Jiménez",
    preguntas: [
      {
        id: "q1",
        enunciado: "¿Qué es un algoritmo?",
        tipo: "seleccion_unica",
        puntos: 1,
        opciones: [
          { id: "q1a", texto: "Una receta paso a paso", correcta: true },
          { id: "q1b", texto: "Un lenguaje de programación" },
          { id: "q1c", texto: "Un compilador" },
        ],
      },
      {
        id: "q2",
        enunciado: "Selecciona las estructuras de control:",
        tipo: "seleccion_multiple",
        puntos: 2,
        opciones: [
          { id: "q2a", texto: "if/else", correcta: true },
          { id: "q2b", texto: "for", correcta: true },
          { id: "q2c", texto: "console.log" },
        ],
      },
      { id: "q3", enunciado: "La memoria RAM es volátil.", tipo: "vf", puntos: 1 },
    ],
  },
  practica: {
    nombre: "Práctica 3: Arreglos y ciclos",
    curso: "Programación I",
    duracionMin: 25,
    docenteNombre: "Mtra. Patricia Jiménez",
    preguntas: [
      {
        id: "p1",
        enunciado: "¿Cuál método agrega un elemento al final del arreglo?",
        tipo: "seleccion_unica",
        puntos: 1,
        opciones: [
          { id: "p1a", texto: "push()", correcta: true },
          { id: "p1b", texto: "pop()" },
          { id: "p1c", texto: "shift()" },
        ],
      },
      {
        id: "p2",
        enunciado: "Marca las sentencias que recorren un arreglo:",
        tipo: "seleccion_multiple",
        puntos: 2,
        opciones: [
          { id: "p2a", texto: "for (let i=0; i<arr.length; i++)", correcta: true },
          { id: "p2b", texto: "arr.forEach(cb)", correcta: true },
          { id: "p2c", texto: "return arr" },
        ],
      },
      { id: "p3", enunciado: "Los arreglos en JS son de tamaño fijo.", tipo: "vf", puntos: 1 },
    ],
  },
};

// ====== helpers ======
const isOpen = (t) => {
  const s = (t || "").toLowerCase();
  return s === "abierta" || s.includes("abierta") || s.includes("open");
};

const asTime = (secs) => {
  const m = String(Math.floor(secs / 60)).padStart(2, "0");
  const s = String(Math.floor(secs % 60)).padStart(2, "0");
  return `${m}:${s}`;
};

function RenderPregunta({ q, idx, disabled }) {
  const t = (q.tipo || "").toLowerCase();

  const isUnica =
    t.includes("opcion_unica") ||
    t.includes("seleccion_unica") ||
    t.includes("multiple_choice");

  const isMultiple =
    t.includes("seleccion_multiple") || t.includes("checkbox") || t === "multiple";

  const isVF = t === "vf" || t.includes("verdadero_falso") || t.includes("true_false");

  if (isUnica) {
    return (
      <div className="space-y-2">
        {q.opciones?.map((o) => (
          <label key={o.id} className="flex items-start gap-2 p-2 rounded-lg border hover:bg-gray-50">
            <input type="radio" disabled={disabled} name={`q_${idx}`} />
            <span className="text-gray-700">{o.texto}</span>
          </label>
        ))}
      </div>
    );
  }

  if (isMultiple) {
    return (
      <div className="space-y-2">
        {q.opciones?.map((o) => (
          <label key={o.id} className="flex items-start gap-2 p-2 rounded-lg border hover:bg-gray-50">
            <input type="checkbox" disabled={disabled} />
            <span className="text-gray-700">{o.texto}</span>
          </label>
        ))}
      </div>
    );
  }

  if (isVF) {
    return (
      <div className="space-x-4">
        <label className="inline-flex items-center gap-2 p-2 rounded-lg border hover:bg-gray-50">
          <input type="radio" disabled={disabled} name={`q_${idx}`} />
          <span>Verdadero</span>
        </label>
        <label className="inline-flex items-center gap-2 p-2 rounded-lg border hover:bg-gray-50">
          <input type="radio" disabled={disabled} name={`q_${idx}`} />
          <span>Falso</span>
        </label>
      </div>
    );
  }

  // si por alguna razón llegara una abierta, no la mostramos
  return null;
}

export default function VisualizarActividad() {
  const { tipo = "examen", id } = useParams();
  const navigate = useNavigate();

  // Data mock por tipo
  const base = useMemo(() => (tipo === "practica" ? MOCK.practica : MOCK.examen), [tipo]);

  // Filtra cualquier abierta por seguridad
  const preguntas = useMemo(() => (base.preguntas || []).filter((p) => !isOpen(p.tipo)), [base.preguntas]);

  const nombre = base.nombre;
  const curso = base.curso;
  const docenteNombre = base.docenteNombre;
  const tituloTipo = tipo === "practica" ? "Práctica" : "Examen";
  const totalSeconds = (base.duracionMin || DEFAULT_MINUTES) * 60;

  // ===== Timer =====
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    setSecondsLeft(totalSeconds); // reinicia si cambia de actividad
    setFinished(false);
  }, [totalSeconds]);

  useEffect(() => {
    if (finished) return;
    const t = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          setFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [finished]);

  const progressPct = Math.max(0, Math.min(100, (1 - secondsLeft / totalSeconds) * 100));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-indigo-600 font-semibold">
            Vista del alumno — Solo lectura (demo)
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            {tituloTipo}: {nombre} {id ? <span className="text-gray-400 text-base">(# {id})</span> : null}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              Curso: {curso}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <UserCircle2 className="w-4 h-4" />
              Docente: {docenteNombre}
            </span>
          </div>
        </div>

        {/* Timer */}
        <div className="flex flex-col items-end gap-2">
          <div
            className={`px-3 py-1.5 rounded-full border text-sm font-semibold ${
              finished ? "bg-red-50 border-red-200 text-red-700" : "bg-purple-50 border-purple-200 text-purple-700"
            }`}
            title="Tiempo restante"
          >
            <span className="inline-flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {finished ? "Tiempo agotado" : asTime(secondsLeft)}
            </span>
          </div>
          <div className="w-44 h-2 rounded-full bg-gray-200 overflow-hidden">
            <div className={`h-full ${finished ? "bg-red-400" : "bg-indigo-500"}`} style={{ width: `${progressPct}%` }} />
          </div>
          <button
            onClick={() => {
              setFinished(false);
              setSecondsLeft(totalSeconds);
            }}
            className="text-xs text-gray-600 underline hover:text-gray-800"
          >
            Reiniciar
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div className="relative bg-white border rounded-xl shadow-sm p-5">
        {finished && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] grid place-items-center rounded-xl">
            <div className="text-center">
              <div className="text-lg font-semibold text-red-700">Tiempo agotado</div>
              <div className="text-sm text-gray-600">Los controles quedan deshabilitados.</div>
            </div>
          </div>
        )}

        {preguntas?.length ? (
          <ol className="space-y-6 list-decimal pl-5">
            {preguntas.map((q, idx) => (
              <li key={q.id} className="space-y-3">
                <div className="text-gray-800 font-medium">{q.enunciado}</div>
                <RenderPregunta q={q} idx={idx} disabled={true} />
                <div className="text-xs text-gray-500">Valor: {q.puntos ?? 1} punto(s)</div>
              </li>
            ))}
          </ol>
        ) : (
          <div className="text-center text-gray-600 py-12">No se encontraron reactivos en esta demo.</div>
        )}
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-white hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Regresar
        </button>
        <div className="text-xs text-gray-500">Vista previa sin conexión al backend.</div>
      </div>
    </div>
  );
}
