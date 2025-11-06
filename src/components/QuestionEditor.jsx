// src/components/QuestionEditor.jsx
import { useEffect, useState } from "react";
import MDEditor, { commands } from "@uiw/react-md-editor";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import "katex/dist/katex.min.css";

/**
 * Props:
 * - value: string (puede llegar tarde al editar)
 * - onChange: (val: string) => void
 * - resetKey?: cualquier valor para forzar re-montaje externo si lo necesitas
 */
export function QuestionEditor({ value = "", onChange, resetKey }) {
  // Estado interno para asegurarnos de reflejar cambios del padre
  const [v, setV] = useState(value || "");

  // 🔧 CLAVE: sincronizar cuando la prop value cambie (ej. tras fetch al editar)
  useEffect(() => {
    setV(value || "");
  }, [value]);

  const onChangeWrapped = (val) => {
    const next = val ?? "";
    setV(next);
    onChange?.(next);
  };

  // Toolbar básica sin preview
  const basicCommands = [
    commands.bold,
    commands.italic,
    commands.strikethrough,
    commands.hr,
    commands.title,
    commands.link,
    commands.quote,
    commands.code,
    commands.unorderedListCommand,
    commands.orderedListCommand,
    commands.checkedListCommand,
  ];

  return (
    <div className="space-y-3" data-color-mode="light">
      {/* CSS para eliminar cualquier vista previa interna */}
      <style>{`
        .w-md-editor-content .w-md-editor-preview {
          display: none !important;
        }
        .w-md-editor-content {
          grid-template-columns: 1fr !important;
        }
      `}</style>

      <div className="border rounded-xl overflow-hidden shadow-sm">
       <MDEditor
  preview="edit"
  visibleDragbar={false}
  hideToolbar={false}
  commands={basicCommands}
  extraCommands={[]}
  value={v}
  onChange={onChangeWrapped}
  height={300}
  previewOptions={{
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [[rehypeKatex, { output: "html" }]],
  }}
/>

      </div>
    </div>
  );
}
