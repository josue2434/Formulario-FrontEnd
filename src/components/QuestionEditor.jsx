// src/components/QuestionEditor.jsx
import MDEditor, { commands } from "@uiw/react-md-editor";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import "katex/dist/katex.min.css";

export function QuestionEditor({ value = "", onChange }) {
  const onChangeWrapped = (val) => {
    onChange?.(val ?? "");
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
          preview="edit"            // Solo modo edición
          visibleDragbar={false}
          hideToolbar={false}
          commands={basicCommands}  // Comandos básicos
          extraCommands={[]}        // Sin fullscreen ni ayuda
          value={value}
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

