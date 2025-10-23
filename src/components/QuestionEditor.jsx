// src/components/QuestionEditor.jsx
import { useRef, useState } from "react";
import MDEditor from "@uiw/react-md-editor";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import "katex/dist/katex.min.css";

export function QuestionEditor({ value, onChange }) {
  const [v, setV] = useState(value || "");
  const fileInputRef = useRef(null);

  const onChangeWrapped = (val) => {
    setV(val || "");
    onChange?.(val || "");
  };

  // Subida de imagen → inserta ![](url)
  const insertImage = async (file) => {
    if (!file) return;
    const form = new FormData();
    form.append("image", file);

    const res = await fetch(`${import.meta.env.VITE_API_URL}/docente/uploads/images`, {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: form,
    });
    const data = await res.json();
    if (!res.ok || !data?.url) throw new Error(data?.message || "No se pudo subir la imagen");

    const mdImage = `

![imagen](${data.url})

`;
    onChangeWrapped((v || "") + mdImage);
  };

  return (
    <div className="space-y-3" data-color-mode="light">
      <div className="flex items-center justify-between">
        
        <div className="flex items-center gap-2">
main
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => insertImage(e.target.files?.[0])}
          />
        </div>
      </div>

      <div className="border rounded-xl overflow-hidden shadow-sm">
        <MDEditor
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
