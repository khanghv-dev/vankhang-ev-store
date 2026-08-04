"use client";

import React, { useState, useRef, useEffect } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder = "Nhập nội dung bài viết chi tiết ở đây..." }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showHtmlSource, setShowHtmlSource] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);
  const [youtubeUrlInput, setYoutubeUrlInput] = useState("");
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);

  // Synchronize initial value to contentEditable div
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  // Helper to extract YouTube Video ID
  const extractYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // Insert Image Action
  const handleInsertImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrlInput.trim()) return;

    const imgHtml = `<img src="${imageUrlInput.trim()}" alt="Article Image" class="my-4 rounded-2xl max-w-full h-auto mx-auto shadow-2xl border border-slate-800" />`;
    execCommand("insertHTML", imgHtml);
    setImageUrlInput("");
    setShowImageModal(false);
  };

  // Insert YouTube Video Embed Action
  const handleInsertYoutube = (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrlInput.trim()) return;

    const videoId = extractYouTubeId(youtubeUrlInput.trim());
    if (videoId) {
      const embedHtml = `
        <div class="my-6 aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-800/80 bg-slate-950">
          <iframe 
            src="https://www.youtube.com/embed/${videoId}" 
            title="YouTube video player" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen 
            class="w-full h-full"
          ></iframe>
        </div>
        <p><br></p>
      `;
      execCommand("insertHTML", embedHtml);
      setYoutubeUrlInput("");
      setShowYoutubeModal(false);
    } else {
      alert("Đường dẫn YouTube không hợp lệ! Vui lòng kiểm tra lại URL.");
    }
  };

  return (
    <div className="border border-slate-800 rounded-3xl overflow-hidden bg-slate-950 shadow-2xl">
      
      {/* ── WYSIWYG TOOLBAR ────────────────────────────────────────────────── */}
      <div className="bg-slate-900/80 border-b border-slate-800 p-3 flex flex-wrap items-center gap-1.5 backdrop-blur-md text-xs select-none">
        
        {/* Formatting Buttons */}
        <button
          type="button"
          onClick={() => execCommand("bold")}
          title="In Đậm (Ctrl+B)"
          className="p-2 font-black rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white transition-colors w-8 h-8 flex items-center justify-center border border-slate-800/60"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => execCommand("italic")}
          title="In Nghiêng (Ctrl+I)"
          className="p-2 italic font-serif rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white transition-colors w-8 h-8 flex items-center justify-center border border-slate-800/60"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => execCommand("underline")}
          title="Gạch Chân (Ctrl+U)"
          className="p-2 underline rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white transition-colors w-8 h-8 flex items-center justify-center border border-slate-800/60"
        >
          U
        </button>

        <div className="h-4 w-px bg-slate-800 mx-1"></div>

        {/* Headings */}
        <button
          type="button"
          onClick={() => execCommand("formatBlock", "<h2>")}
          title="Tiêu đề H2"
          className="px-2.5 py-1 font-bold rounded-xl hover:bg-slate-800 text-blue-400 border border-blue-500/20 transition-colors text-[11px]"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => execCommand("formatBlock", "<h3>")}
          title="Tiêu đề H3"
          className="px-2.5 py-1 font-bold rounded-xl hover:bg-slate-800 text-cyan-400 border border-cyan-500/20 transition-colors text-[11px]"
        >
          H3
        </button>
        <button
          type="button"
          onClick={() => execCommand("formatBlock", "<blockquote>")}
          title="Trích Dẫn"
          className="px-2 py-1 font-serif rounded-xl hover:bg-slate-800 text-amber-400 border border-amber-500/20 transition-colors text-[11px]"
        >
          “Quote”
        </button>

        <div className="h-4 w-px bg-slate-800 mx-1"></div>

        {/* Lists & Alignment */}
        <button
          type="button"
          onClick={() => execCommand("insertUnorderedList")}
          title="Danh sách gạch đầu dòng"
          className="p-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors w-8 h-8 flex items-center justify-center border border-slate-800/60"
        >
          • List
        </button>

        <div className="h-4 w-px bg-slate-800 mx-1"></div>

        {/* Media Embed Buttons */}
        <button
          type="button"
          onClick={() => setShowImageModal(true)}
          title="Chèn ảnh vào bài viết"
          className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 font-semibold transition-colors flex items-center gap-1.5"
        >
          <span>🖼️</span> Chèn Ảnh
        </button>

        <button
          type="button"
          onClick={() => setShowYoutubeModal(true)}
          title="Chèn video YouTube"
          className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 font-semibold transition-colors flex items-center gap-1.5"
        >
          <span>🎥</span> Chèn YouTube
        </button>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHtmlSource(!showHtmlSource)}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
              showHtmlSource
                ? "bg-purple-600 text-white border-purple-500"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            {showHtmlSource ? "👁️ WYSIWYG" : "Code HTML"}
          </button>
        </div>
      </div>

      {/* ── EDITOR CONTENT AREA ───────────────────────────────────────────── */}
      {showHtmlSource ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={14}
          className="w-full bg-slate-950 text-emerald-400 font-mono text-xs p-5 outline-none resize-none leading-relaxed"
          placeholder="Nhập mã HTML trực tiếp tại đây..."
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          className="min-h-[350px] p-6 text-slate-100 font-sans text-sm outline-none focus:outline-none prose prose-invert max-w-none leading-relaxed overflow-y-auto"
          style={{ wordBreak: "break-word" }}
        />
      )}

      {/* ── MODAL CHÈN ẢNH ───────────────────────────────────────────────── */}
      {showImageModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>🖼️</span> Chèn Đường Dẫn Ảnh Giữa Bài
              </h4>
              <button type="button" onClick={() => setShowImageModal(false)} className="text-slate-500 hover:text-white font-bold">✕</button>
            </div>
            
            <form onSubmit={handleInsertImage} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-2">URL Hình Ảnh (HTTPS)</label>
                <input
                  type="url"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  required
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl p-3 text-xs outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImageModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Chèn Vào Bài
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL CHÈN YOUTUBE ────────────────────────────────────────────── */}
      {showYoutubeModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>🎥</span> Chèn Video YouTube Trực Quan
              </h4>
              <button type="button" onClick={() => setShowYoutubeModal(false)} className="text-slate-500 hover:text-white font-bold">✕</button>
            </div>
            
            <form onSubmit={handleInsertYoutube} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-2">Đường dẫn Video YouTube</label>
                <input
                  type="url"
                  value={youtubeUrlInput}
                  onChange={(e) => setYoutubeUrlInput(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl p-3 text-xs outline-none focus:border-rose-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">Hệ thống sẽ tự động nhúng Player responsive xem mượt mà.</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowYoutubeModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Nhúng Video
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
