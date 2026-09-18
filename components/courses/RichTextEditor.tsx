"use client";

import { useRef, useEffect, useCallback, useState, type ReactNode } from "react";
import {
  Bold, Italic, Underline, Heading1, Heading2, List, ListOrdered,
  Quote, Minus, Image as ImageIcon, Loader2, Link as LinkIcon,
} from "lucide-react";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export default function RichTextEditor({ value, onChange, placeholder = "Write article content here…", minHeight = 260 }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileRef   = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [linkUrl, setLinkUrl]     = useState("");
  const [showLink, setShowLink]   = useState(false);

  // Sync external value → editor (only on mount / when value changes externally)
  const lastHtml = useRef(value);
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (el.innerHTML !== value && value !== lastHtml.current) {
      el.innerHTML = value;
      lastHtml.current = value;
    }
  }, [value]);

  const emit = useCallback(() => {
    const html = editorRef.current?.innerHTML ?? "";
    lastHtml.current = html;
    onChange(html);
  }, [onChange]);

  /* ── Exec-command helpers ── */
  const exec = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    emit();
  };

  /* ── Paste: strip unwanted wrapper spans but keep core formatting ── */
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const cd = e.clipboardData;

    // Prefer HTML if available (preserves bold/italic/headings etc.)
    if (cd.types.includes("text/html")) {
      const raw = cd.getData("text/html");
      // Sanitise: remove script/style/meta/link tags, keep structure
      const clean = raw
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<meta[^>]*>/gi, "")
        .replace(/<link[^>]*>/gi, "")
        // Strip class / id / style to avoid external styles polluting ours
        .replace(/\s(class|id|style|data-\w+)="[^"]*"/gi, "")
        // Keep only allowed tags
        .replace(/<(?!\/?(?:b|strong|i|em|u|h[1-6]|ul|ol|li|blockquote|p|br|img|a|hr|figure|figcaption|table|tr|td|th|thead|tbody)[>\s\/])[^>]+>/gi, "");
      document.execCommand("insertHTML", false, clean);
    } else {
      // Fall back to plain text with line-break preservation
      const text = cd.getData("text/plain");
      const lines = text.split(/\r?\n/);
      const html  = lines.map(l => l ? `<p>${l.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</p>` : "<br>").join("");
      document.execCommand("insertHTML", false, html);
    }
    emit();
  }, [emit]);

  /* ── Image upload ── */
  const handleImageFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("files", file);
      fd.append("folder", "course-articles");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json() as { urls?: string[] };
      if (data.urls?.[0]) {
        exec("insertHTML", `<img src="${data.urls[0]}" alt="Article image" style="max-width:100%;border-radius:8px;margin:8px 0;" />`);
      }
    } finally {
      setUploading(false);
    }
  };

  const onImageDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleImageFile(file);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
    e.target.value = "";
  };

  /* ── Link ── */
  const insertLink = () => {
    if (!linkUrl.trim()) return;
    exec("createLink", linkUrl.trim());
    setShowLink(false);
    setLinkUrl("");
  };

  const ToolBtn = ({ onClick, active, title, children }: { onClick: () => void; active?: boolean; title: string; children: ReactNode }) => (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      title={title}
      className={`w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-all text-sm ${active ? "bg-slate-100 text-[#0a1628] font-bold" : ""}`}
    >
      {children}
    </button>
  );

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:border-[#0a1628] transition-all bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-slate-100 bg-slate-50">
        <ToolBtn onClick={() => exec("bold")} title="Bold"><Bold className="w-3.5 h-3.5" /></ToolBtn>
        <ToolBtn onClick={() => exec("italic")} title="Italic"><Italic className="w-3.5 h-3.5" /></ToolBtn>
        <ToolBtn onClick={() => exec("underline")} title="Underline"><Underline className="w-3.5 h-3.5" /></ToolBtn>
        <div className="w-px h-5 bg-slate-200 mx-1" />
        <ToolBtn onClick={() => exec("formatBlock", "<h1>")} title="Heading 1"><Heading1 className="w-3.5 h-3.5" /></ToolBtn>
        <ToolBtn onClick={() => exec("formatBlock", "<h2>")} title="Heading 2"><Heading2 className="w-3.5 h-3.5" /></ToolBtn>
        <ToolBtn onClick={() => exec("formatBlock", "<p>")} title="Paragraph">¶</ToolBtn>
        <div className="w-px h-5 bg-slate-200 mx-1" />
        <ToolBtn onClick={() => exec("insertUnorderedList")} title="Bullet List"><List className="w-3.5 h-3.5" /></ToolBtn>
        <ToolBtn onClick={() => exec("insertOrderedList")} title="Numbered List"><ListOrdered className="w-3.5 h-3.5" /></ToolBtn>
        <ToolBtn onClick={() => exec("formatBlock", "<blockquote>")} title="Blockquote"><Quote className="w-3.5 h-3.5" /></ToolBtn>
        <ToolBtn onClick={() => exec("insertHorizontalRule")} title="Divider"><Minus className="w-3.5 h-3.5" /></ToolBtn>
        <div className="w-px h-5 bg-slate-200 mx-1" />
        {/* Link */}
        <div className="relative">
          <ToolBtn onClick={() => setShowLink(v => !v)} title="Insert Link"><LinkIcon className="w-3.5 h-3.5" /></ToolBtn>
          {showLink && (
            <div className="absolute top-9 left-0 z-50 bg-white border border-slate-200 rounded-xl shadow-lg p-2 flex gap-2 min-w-[260px]">
              <input
                autoFocus
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                onKeyDown={e => e.key === "Enter" && insertLink()}
                placeholder="https://example.com"
                className="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-[#0a1628]"
              />
              <button type="button" onClick={insertLink} className="text-xs font-bold text-white bg-[#0a1628] px-3 py-1.5 rounded-lg">Add</button>
            </div>
          )}
        </div>
        {/* Image upload */}
        <ToolBtn onClick={() => fileRef.current?.click()} title="Insert Image">
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
        </ToolBtn>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onImagePick} />
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onPaste={handlePaste}
        onDrop={onImageDrop}
        onDragOver={e => e.preventDefault()}
        data-placeholder={placeholder}
        className="outline-none px-4 py-3 text-sm text-slate-700 leading-relaxed prose prose-sm max-w-none
          [&:empty:before]:content-[attr(data-placeholder)] [&:empty:before]:text-slate-400 [&:empty:before]:pointer-events-none
          [&_h1]:text-2xl [&_h1]:font-black [&_h1]:text-[#0a1628] [&_h1]:mt-4 [&_h1]:mb-2
          [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[#0a1628] [&_h2]:mt-3 [&_h2]:mb-1.5
          [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1
          [&_blockquote]:border-l-4 [&_blockquote]:border-[#ffbe24] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-500
          [&_hr]:my-4 [&_a]:text-[#1a3a6b] [&_a]:underline
          [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-2"
        style={{ minHeight }}
      />
    </div>
  );
}
