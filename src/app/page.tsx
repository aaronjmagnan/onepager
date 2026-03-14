"use client";

import { useState, useRef, useCallback } from "react";

const STYLES = [
  {
    id: "executive",
    icon: "◆",
    label: "Executive",
    desc: "Refined, authoritative, premium consulting aesthetic",
  },
  {
    id: "bold",
    icon: "▲",
    label: "Bold & Modern",
    desc: "High contrast, confident startup energy",
  },
  {
    id: "minimal",
    icon: "○",
    label: "Clean & Minimal",
    desc: "Ultra-minimal, whitespace-forward, sophisticated",
  },
  {
    id: "warm",
    icon: "◎",
    label: "Warm & Human",
    desc: "Approachable, editorial, warm tones",
  },
  {
    id: "tech",
    icon: "⌘",
    label: "Tech / SaaS",
    desc: "Monospace accents, crisp developer-forward layout",
  },
  {
    id: "education",
    icon: "✦",
    label: "Education",
    desc: "Clear hierarchy, accessible, trustworthy",
  },
] as const;

const DOC_TYPES = [
  "Product One-Pager",
  "Staff Guide",
  "Investor Prep",
  "Training Doc",
  "General",
];

interface FormData {
  title: string;
  tagline: string;
  body: string;
  cta: string;
  contact: string;
  docType: string;
  style: string;
}

export default function Home() {
  const [view, setView] = useState<"form" | "output">("form");
  const [form, setForm] = useState<FormData>({
    title: "",
    tagline: "",
    body: "",
    cta: "",
    contact: "",
    docType: "General",
    style: "executive",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [html, setHtml] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const update = useCallback(
    (field: keyof FormData, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const generate = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Generation failed");
      }
      const data = await res.json();
      setHtml(data.html);
      setView("output");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [form]);

  const printDoc = useCallback(() => {
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
    }
  }, [html]);

  if (view === "output") {
    return (
      <div className="p-6">
        <div className="flex gap-3 mb-6">
          <button className="pill-btn" onClick={() => setView("form")}>
            ← Edit
          </button>
          <button className="pill-btn" onClick={generate}>
            ↺ Regenerate
          </button>
          <button className="pill-btn" onClick={printDoc}>
            🖨 Print / Save PDF
          </button>
        </div>
        <iframe
          ref={iframeRef}
          className="output-iframe"
          srcDoc={html}
          title="Generated Document"
          sandbox="allow-same-origin"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto px-6 py-16" style={{ maxWidth: 640 }}>
      {/* Header */}
      <header className="mb-16">
        <h1 className="app-title">Pager</h1>
        <p className="app-subtitle">
          Turn rough content into a designed document.
        </p>
      </header>

      {/* Document Title */}
      <div className="mb-8">
        <label className="field-label">Document Title</label>
        <input
          className="field-input"
          type="text"
          placeholder="e.g. Q4 Product Overview"
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
        />
      </div>

      {/* Tagline */}
      <div className="mb-8">
        <label className="field-label">Tagline / Subtitle</label>
        <input
          className="field-input"
          type="text"
          placeholder="A short supporting line"
          value={form.tagline}
          onChange={(e) => update("tagline", e.target.value)}
        />
      </div>

      <hr className="section-divider" />

      {/* Body */}
      <div className="mb-8">
        <label className="field-label">Main Body Content</label>
        <textarea
          className="field-input"
          placeholder="Paste or write the main content for your document..."
          value={form.body}
          onChange={(e) => update("body", e.target.value)}
        />
      </div>

      <hr className="section-divider" />

      {/* CTA */}
      <div className="mb-8">
        <label className="field-label">Call to Action</label>
        <input
          className="field-input"
          type="text"
          placeholder="e.g. Schedule a demo"
          value={form.cta}
          onChange={(e) => update("cta", e.target.value)}
        />
      </div>

      {/* Contact */}
      <div className="mb-8">
        <label className="field-label">Contact / URL</label>
        <input
          className="field-input"
          type="text"
          placeholder="e.g. team@company.com or https://..."
          value={form.contact}
          onChange={(e) => update("contact", e.target.value)}
        />
      </div>

      <hr className="section-divider" />

      {/* Document Type */}
      <div className="mb-8">
        <label className="field-label">Document Type</label>
        <select
          className="field-input"
          value={form.docType}
          onChange={(e) => update("docType", e.target.value)}
        >
          {DOC_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <hr className="section-divider" />

      {/* Style */}
      <div className="mb-10">
        <label className="field-label">Style</label>
        <div className="grid grid-cols-3 gap-3 mt-3">
          {STYLES.map((s) => (
            <button
              key={s.id}
              className={`style-card${form.style === s.id ? " selected" : ""}`}
              onClick={() => update("style", s.id)}
              type="button"
            >
              <div className="style-card-icon">{s.icon}</div>
              <div className="style-card-label">{s.label}</div>
              <div className="style-card-desc">{s.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <hr className="section-divider" />

      {/* Generate */}
      {loading ? (
        <div>
          <div className="generate-btn" style={{ textAlign: "center" }}>
            <span className="loading-dots">
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </span>
          </div>
          <p className="loading-text">Designing your document…</p>
        </div>
      ) : (
        <button
          className="generate-btn"
          onClick={generate}
          disabled={!form.title.trim() || !form.body.trim()}
        >
          Generate Document
        </button>
      )}

      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
