"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  FolderOpen,
  UploadSimple,
  MagnifyingGlass,
  List,
  GridFour,
  FilePdf,
  Image as ImageIcon,
  File,
  FileText,
  Receipt,
  ClipboardText,
  Envelope,
  Shield,
  Bank,
  DownloadSimple,
  Trash,
  X,
  ShareNetwork,
} from "@phosphor-icons/react";
import type { Document, DocumentCategory } from "@/types";
import { DOCUMENT_CATEGORIES, formatFileSize } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Icon resolver
// ─────────────────────────────────────────────────────────────────────────────

function getCategoryIcon(iconName: string, size = 16, color = "#A07830") {
  const props = { size, color };
  switch (iconName) {
    case "FileText":     return <FileText {...props} />;
    case "Receipt":      return <Receipt {...props} />;
    case "ClipboardText":return <ClipboardText {...props} />;
    case "Image":        return <ImageIcon {...props} />;
    case "Envelope":     return <Envelope {...props} />;
    case "Shield":       return <Shield {...props} />;
    case "Bank":         return <Bank {...props} />;
    default:             return <File {...props} />;
  }
}

function getFileTypeIcon(mime: string, size = 16) {
  if (mime === "application/pdf") return <FilePdf size={size} color="#B91C1C" />;
  if (mime.startsWith("image/")) return <ImageIcon size={size} color="#7C3AED" />;
  return <File size={size} color="#A07830" />;
}

function getFileTypeBg(mime: string) {
  if (mime === "application/pdf") return { bg: "rgba(185,28,28,0.08)", border: "rgba(185,28,28,0.12)" };
  if (mime.startsWith("image/")) return { bg: "rgba(124,58,237,0.08)", border: "rgba(124,58,237,0.12)" };
  return { bg: "rgba(160,120,48,0.08)", border: "rgba(160,120,48,0.12)" };
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface DokumenteViewProps {
  documents: Document[];
  properties: { id: string; name: string }[];
  tenants: { id: string; name: string; property_id: string }[];
}

const ALL_CATEGORIES = Object.keys(DOCUMENT_CATEGORIES) as DocumentCategory[];

// ─────────────────────────────────────────────────────────────────────────────
// Category stat card
// ─────────────────────────────────────────────────────────────────────────────

function CategoryCard({
  category,
  count,
  selected,
  onClick,
}: {
  category: DocumentCategory | "all";
  count: number;
  selected: boolean;
  onClick: () => void;
}) {
  const cfg = category === "all" ? null : DOCUMENT_CATEGORIES[category];
  return (
    <button
      onClick={onClick}
      className="text-left transition-all duration-150"
      style={{
        background: selected ? "rgba(160,120,48,0.03)" : "white",
        border: `1px solid ${selected ? "#A07830" : "rgba(0,0,0,0.07)"}`,
        borderRadius: 12,
        padding: "12px 14px",
      }}
    >
      <div className="flex items-center justify-between mb-2">
        {cfg
          ? getCategoryIcon(cfg.iconName, 15, cfg.color)
          : <FolderOpen size={15} color="#A07830" />
        }
        <span
          className="tabular-nums"
          style={{
            fontSize: 11,
            fontWeight: 700,
            background: selected ? "rgba(160,120,48,0.12)" : "#F0EDE4",
            color: selected ? "#A07830" : "#6A5A3A",
            padding: "1px 7px",
            borderRadius: 99,
          }}
        >
          {count}
        </span>
      </div>
      <p style={{ fontSize: 11, color: "#6B7280", fontWeight: selected ? 600 : 400 }}>
        {cfg ? cfg.label : "Alle"}
      </p>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Upload modal
// ─────────────────────────────────────────────────────────────────────────────

function UploadModal({
  properties,
  tenants,
  onClose,
  onUploaded,
}: {
  properties: { id: string; name: string }[];
  tenants: { id: string; name: string; property_id: string }[];
  onClose: () => void;
  onUploaded: (doc: Document) => void;
}) {
  const prefersReduced = useReducedMotion();
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<DocumentCategory>("sonstiges");
  const [propertyId, setPropertyId] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredTenants = tenants.filter(t => !propertyId || t.property_id === propertyId);

  const handleFiles = (files: FileList | null) => {
    if (files?.[0]) setFile(files[0]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("category", category);
    if (propertyId) fd.append("property_id", propertyId);
    if (tenantId) fd.append("tenant_id", tenantId);
    if (notes) fd.append("notes", notes);

    const res = await fetch("/api/documents/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.document) {
      onUploaded(data.document);
      onClose();
    }
    setUploading(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="w-full mx-4"
        style={{ maxWidth: 560, background: "white", borderRadius: 18, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.14)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
          <div className="flex items-center gap-3">
            <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(160,120,48,0.08)", border: "1px solid rgba(160,120,48,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <UploadSimple size={16} color="#A07830" />
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#101418" }}>Dokument hochladen</p>
              <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>PDF, Word, Excel, Bilder bis 50 MB</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF" }}
            className="transition-colors hover:bg-gray-100"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5">
          {/* Drop zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className="transition-all duration-150 cursor-pointer"
            style={{
              border: `2px dashed ${dragging ? "#A07830" : file ? "rgba(160,120,48,0.4)" : "rgba(160,120,48,0.25)"}`,
              borderRadius: 12,
              background: dragging ? "rgba(160,120,48,0.06)" : file ? "rgba(160,120,48,0.02)" : "rgba(160,120,48,0.03)",
              padding: "24px 20px",
              textAlign: "center",
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="application/pdf,image/*,.doc,.docx,.xls,.xlsx,.txt,.csv"
              onChange={(e) => handleFiles(e.target.files)}
            />
            {file ? (
              <div
                className="flex items-center gap-3 text-left"
                style={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, padding: "10px 14px" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ ...getFileTypeBg(file.type), width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1px solid ${getFileTypeBg(file.type).border}` }}>
                  {getFileTypeIcon(file.type, 16)}
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: 13, fontWeight: 500, color: "#101418", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</p>
                  <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>{formatFileSize(file.size)}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  style={{ width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF", flexShrink: 0 }}
                  className="hover:bg-gray-100 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <UploadSimple size={28} color="#A07830" style={{ margin: "0 auto 10px" }} />
                <p style={{ fontSize: 14, fontWeight: 500, color: "#101418" }}>Datei hierher ziehen oder klicken</p>
                <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>PDF, Word, Excel, Bilder bis 50 MB</p>
              </>
            )}
          </div>

          {/* Form */}
          <div className="flex flex-col mt-5" style={{ gap: 14 }}>
            {/* Category */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: "#6B7280", display: "block", marginBottom: 5 }}>Kategorie *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                className="w-full transition-all duration-150"
                style={{ background: "white", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 10, padding: "9px 14px", fontSize: 13, color: "#101418", outline: "none" }}
              >
                {ALL_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{DOCUMENT_CATEGORIES[cat].label}</option>
                ))}
              </select>
            </div>

            {/* Property + Tenant row */}
            <div className="grid grid-cols-2" style={{ gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: "#6B7280", display: "block", marginBottom: 5 }}>Objekt (optional)</label>
                <select
                  value={propertyId}
                  onChange={(e) => { setPropertyId(e.target.value); setTenantId(""); }}
                  style={{ background: "white", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 10, padding: "9px 14px", fontSize: 13, color: "#101418", outline: "none", width: "100%" }}
                >
                  <option value="">Kein Objekt</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: "#6B7280", display: "block", marginBottom: 5 }}>Mieter (optional)</label>
                <select
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  disabled={filteredTenants.length === 0}
                  style={{ background: filteredTenants.length === 0 ? "#F5F5F5" : "white", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 10, padding: "9px 14px", fontSize: 13, color: filteredTenants.length === 0 ? "#9CA3AF" : "#101418", outline: "none", width: "100%" }}
                >
                  <option value="">Kein Mieter</option>
                  {filteredTenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: "#6B7280", display: "block", marginBottom: 5 }}>Notizen (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Interne Anmerkungen..."
                style={{ background: "white", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 10, padding: "9px 14px", fontSize: 13, color: "#101418", width: "100%", resize: "none", outline: "none", fontFamily: "inherit" }}
              />
            </div>
          </div>

          {/* Progress */}
          {uploading && (
            <div className="mt-4">
              <div style={{ height: 4, background: "#F0EDE4", borderRadius: 99, overflow: "hidden" }}>
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: "90%" }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  style={{ height: "100%", background: "#A07830", borderRadius: 99 }}
                />
              </div>
              <p style={{ fontSize: 12, color: "#6B7280", marginTop: 6, textAlign: "center" }}>Wird hochgeladen...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
          <button
            onClick={onClose}
            disabled={uploading}
            style={{ fontSize: 13, fontWeight: 500, color: "#6B7280", padding: "9px 16px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.1)" }}
            className="transition-colors hover:bg-gray-50"
          >
            Abbrechen
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex items-center gap-2 transition-all"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: !file || uploading ? "#9CA3AF" : "#fff",
              background: !file || uploading ? "rgba(0,0,0,0.06)" : "#A07830",
              padding: "9px 20px",
              borderRadius: 10,
              boxShadow: !file || uploading ? "none" : "0 4px 14px rgba(160,120,48,0.2)",
              cursor: !file || uploading ? "not-allowed" : "pointer",
            }}
          >
            {uploading ? (
              <>
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity=".3"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
                Hochladen...
              </>
            ) : (
              <>
                <UploadSimple size={14} />
                Hochladen
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Preview modal
// ─────────────────────────────────────────────────────────────────────────────

function PreviewModal({
  doc,
  onClose,
}: {
  doc: Document;
  onClose: () => void;
}) {
  const prefersReduced = useReducedMotion();
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const cfg = DOCUMENT_CATEGORIES[doc.category];
  const { bg, border } = getFileTypeBg(doc.mime_type);

  const fetchUrl = useCallback(async () => {
    const res = await fetch(`/api/documents/${doc.id}/url`);
    const data = await res.json();
    setUrl(data.url ?? null);
    setLoading(false);
  }, [doc.id]);

  useState(() => { fetchUrl(); });

  const handleDownload = async () => {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.original_name;
    a.click();
  };

  const isPDF = doc.mime_type === "application/pdf";
  const isImage = doc.mime_type.startsWith("image/");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="w-full mx-4 flex flex-col"
        style={{ maxWidth: 900, height: "85vh", background: "white", borderRadius: 18, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.18)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
          <div className="flex items-center gap-3 min-w-0">
            <div style={{ width: 36, height: 36, borderRadius: 8, background: bg, border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {getFileTypeIcon(doc.mime_type, 16)}
            </div>
            <div className="min-w-0">
              <p style={{ fontSize: 14, fontWeight: 600, color: "#101418", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 7px", borderRadius: 99, background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
                  {cfg.label}
                </span>
                {doc.properties?.name && (
                  <span style={{ fontSize: 11, color: "#9CA3AF" }}>{doc.properties.name}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 transition-all"
              style={{ fontSize: 12, fontWeight: 600, color: "#A07830", background: "rgba(160,120,48,0.08)", border: "1px solid rgba(160,120,48,0.15)", padding: "7px 14px", borderRadius: 8 }}
            >
              <DownloadSimple size={14} />
              Download
            </button>
            <button
              onClick={onClose}
              style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF" }}
              className="hover:bg-gray-100 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-hidden" style={{ background: "#F8F7F4" }}>
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <svg className="animate-spin mx-auto mb-3" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#A07830" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity=".3"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
                <p style={{ fontSize: 13, color: "#9CA3AF" }}>Lade Vorschau...</p>
              </div>
            </div>
          ) : url ? (
            isPDF ? (
              <iframe src={url} width="100%" height="100%" style={{ border: "none", display: "block" }} title={doc.name} />
            ) : isImage ? (
              <div className="h-full flex items-center justify-center p-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={doc.name} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain", borderRadius: 8 }} />
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center px-6">
                <div style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(160,120,48,0.08)", border: "1px solid rgba(160,120,48,0.12)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                  <File size={24} color="#A07830" />
                </div>
                <p style={{ fontSize: 15, fontWeight: 600, color: "#101418", marginBottom: 6 }}>Vorschau nicht verfügbar</p>
                <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 20 }}>Dieser Dateityp kann nicht im Browser angezeigt werden.</p>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2"
                  style={{ fontSize: 13, fontWeight: 600, color: "white", background: "#A07830", padding: "10px 20px", borderRadius: 10, boxShadow: "0 4px 14px rgba(160,120,48,0.25)" }}
                >
                  <DownloadSimple size={15} />
                  Datei herunterladen
                </button>
              </div>
            )
          ) : (
            <div className="h-full flex items-center justify-center">
              <p style={{ fontSize: 13, color: "#9CA3AF" }}>Fehler beim Laden der Datei.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-6 px-5 py-3 flex-shrink-0" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
          <span style={{ fontSize: 11, color: "#9CA3AF" }}>
            <strong style={{ color: "#6B7280", fontWeight: 500 }}>Größe:</strong> {formatFileSize(doc.file_size)}
          </span>
          <span style={{ fontSize: 11, color: "#9CA3AF" }}>
            <strong style={{ color: "#6B7280", fontWeight: 500 }}>Datum:</strong> {formatDate(doc.created_at)}
          </span>
          {doc.properties?.name && (
            <span style={{ fontSize: 11, color: "#9CA3AF" }}>
              <strong style={{ color: "#6B7280", fontWeight: 500 }}>Objekt:</strong> {doc.properties.name}
            </span>
          )}
          {doc.tenants?.name && (
            <span style={{ fontSize: 11, color: "#9CA3AF" }}>
              <strong style={{ color: "#6B7280", fontWeight: 500 }}>Mieter:</strong> {doc.tenants.name}
            </span>
          )}
          {doc.notes && (
            <span style={{ fontSize: 11, color: "#9CA3AF" }}>
              <strong style={{ color: "#6B7280", fontWeight: 500 }}>Notiz:</strong> {doc.notes}
            </span>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main view
// ─────────────────────────────────────────────────────────────────────────────

export default function DokumenteView({ documents: initialDocs, properties, tenants }: DokumenteViewProps) {
  const prefersReduced = useReducedMotion();
  const [documents, setDocuments] = useState<Document[]>(initialDocs);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [filterCategory, setFilterCategory] = useState<DocumentCategory | "all">("all");
  const [filterProperty, setFilterProperty] = useState("all");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [deleting, setDeleting] = useState<string | null>(null);

  // Share state
  const [sharingDocId, setSharingDocId] = useState<string | null>(null);
  const [sharedDocs, setSharedDocs] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(initialDocs.map(d => [d.id, (d as Document & { visible_to_tenant?: boolean }).visible_to_tenant ?? false]))
  );
  const [sharingLoading, setSharingLoading] = useState<string | null>(null);
  const [shareToast, setShareToast] = useState<string | null>(null);

  useEffect(() => {
    if (!shareToast) return;
    const t = setTimeout(() => setShareToast(null), 3000);
    return () => clearTimeout(t);
  }, [shareToast]);

  useEffect(() => {
    if (!sharingDocId) return;
    const handler = () => setSharingDocId(null);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [sharingDocId]);

  async function toggleShare(docId: string, currentlyShared: boolean) {
    setSharingLoading(docId);
    const res = await fetch(`/api/dokumente/${docId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visible_to_tenant: !currentlyShared }),
    });
    setSharingLoading(null);
    if (res.ok) {
      setSharedDocs(prev => ({ ...prev, [docId]: !currentlyShared }));
      setShareToast(!currentlyShared ? "Mit Mieter geteilt" : "Freigabe entfernt");
      setSharingDocId(null);
    } else {
      setShareToast("Fehler beim Aktualisieren");
    }
  }

  // Stats
  const totalSize = documents.reduce((s, d) => s + d.file_size, 0);
  const byCat = ALL_CATEGORIES.reduce<Record<string, number>>((acc, cat) => {
    acc[cat] = documents.filter(d => d.category === cat).length;
    return acc;
  }, {});

  // Top 5 cats with docs
  const topCats = ALL_CATEGORIES
    .filter(c => byCat[c] > 0)
    .sort((a, b) => byCat[b] - byCat[a])
    .slice(0, 5);

  // Filter
  const filtered = documents.filter(d => {
    if (filterCategory !== "all" && d.category !== filterCategory) return false;
    if (filterProperty !== "all" && d.property_id !== filterProperty) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!d.name.toLowerCase().includes(q) &&
          !d.original_name.toLowerCase().includes(q) &&
          !(d.notes ?? "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Dokument wirklich löschen? Dieser Vorgang kann nicht rückgängig gemacht werden.")) return;
    setDeleting(id);
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (res.ok) setDocuments(prev => prev.filter(d => d.id !== id));
    setDeleting(null);
  };

  const handleDownload = async (doc: Document) => {
    const res = await fetch(`/api/documents/${doc.id}/url`);
    const { url } = await res.json();
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.original_name;
    a.click();
  };

  return (
    <div className="w-full min-h-screen" style={{ background: "#F8F7F4" }}>

      {/* ── PAGE HEADER ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-8 pt-7 pb-0 mb-6">
        <div className="flex items-center gap-3">
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(160,120,48,0.08)", border: "1px solid rgba(160,120,48,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FolderOpen size={18} color="#A07830" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: "#101418", letterSpacing: "-0.02em" }}>Dokumente</h1>
            <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 1 }}>
              {documents.length} {documents.length === 1 ? "Datei" : "Dateien"} · {formatFileSize(totalSize)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex" style={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 8, padding: 3 }}>
            {(["list", "grid"] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: viewMode === mode ? "#F0EDE4" : "transparent",
                  color: viewMode === mode ? "#A07830" : "#9CA3AF",
                  transition: "all 0.12s",
                }}
              >
                {mode === "list" ? <List size={14} /> : <GridFour size={14} />}
              </button>
            ))}
          </div>

          {/* Upload */}
          <motion.button
            whileHover={prefersReduced ? {} : { y: -1 }}
            whileTap={prefersReduced ? {} : { scale: 0.97 }}
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2"
            style={{ fontSize: 13, fontWeight: 600, color: "white", background: "#A07830", padding: "10px 18px", borderRadius: 10, boxShadow: "0 4px 14px rgba(160,120,48,0.2)" }}
          >
            <UploadSimple size={15} />
            Hochladen
          </motion.button>
        </div>
      </div>

      {/* ── CATEGORY STATS ──────────────────────────────────────────── */}
      {(topCats.length > 0 || documents.length === 0) && (
        <div className="px-8 mb-5">
          <div className="grid" style={{ gridTemplateColumns: `repeat(${Math.min(topCats.length + 1, 6)}, 1fr)`, gap: 10 }}>
            <CategoryCard
              category="all"
              count={documents.length}
              selected={filterCategory === "all"}
              onClick={() => setFilterCategory("all")}
            />
            {topCats.map(cat => (
              <CategoryCard
                key={cat}
                category={cat}
                count={byCat[cat]}
                selected={filterCategory === cat}
                onClick={() => setFilterCategory(filterCategory === cat ? "all" : cat)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── FILTERS ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-8 mb-5">
        {/* Search */}
        <div className="flex items-center gap-2.5 flex-1" style={{ maxWidth: 320, background: "white", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, padding: "9px 14px" }}>
          <MagnifyingGlass size={14} color="#9CA3AF" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Datei suchen..."
            style={{ flex: 1, fontSize: 13, color: "#101418", background: "transparent", outline: "none", border: "none" }}
          />
          {search && (
            <button onClick={() => setSearch("")}>
              <X size={13} color="#9CA3AF" />
            </button>
          )}
        </div>

        {/* Property filter */}
        {properties.length > 0 && (
          <select
            value={filterProperty}
            onChange={(e) => setFilterProperty(e.target.value)}
            style={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, padding: "9px 14px", fontSize: 13, color: filterProperty === "all" ? "#6B7280" : "#101418", outline: "none" }}
          >
            <option value="all">Alle Objekte</option>
            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}

        {/* Category filter */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as DocumentCategory | "all")}
          style={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, padding: "9px 14px", fontSize: 13, color: filterCategory === "all" ? "#6B7280" : "#101418", outline: "none" }}
        >
          <option value="all">Alle Kategorien</option>
          {ALL_CATEGORIES.map(cat => <option key={cat} value={cat}>{DOCUMENT_CATEGORIES[cat].label}</option>)}
        </select>

        <span style={{ fontSize: 12, color: "#9CA3AF", marginLeft: "auto" }}>
          {filtered.length} {filtered.length === 1 ? "Dokument" : "Dokumente"}
        </span>
      </div>

      {/* ── EMPTY STATE ─────────────────────────────────────────────── */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center px-8 text-center" style={{ minHeight: 320 }}>
          <div style={{ width: 56, height: 56, background: "#F0EDE4", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
            <FolderOpen size={24} color="#A89A7A" />
          </div>
          <p style={{ fontSize: 16, fontWeight: 600, color: "#101418" }}>
            {search || filterCategory !== "all" || filterProperty !== "all"
              ? "Keine Dokumente gefunden"
              : "Noch keine Dokumente"}
          </p>
          <p style={{ fontSize: 13, color: "#A89A7A", marginTop: 6, maxWidth: 280 }}>
            {search || filterCategory !== "all" || filterProperty !== "all"
              ? "Versuche andere Filter oder Suchbegriffe."
              : "Lade Mietverträge, Rechnungen, Belege und mehr hoch."}
          </p>
          {!search && filterCategory === "all" && filterProperty === "all" && (
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 mt-5"
              style={{ fontSize: 13, fontWeight: 600, color: "white", background: "#A07830", padding: "10px 20px", borderRadius: 10, boxShadow: "0 4px 14px rgba(160,120,48,0.2)" }}
            >
              <UploadSimple size={15} />
              Erstes Dokument hochladen
            </button>
          )}
        </div>
      )}

      {/* ── LIST VIEW ───────────────────────────────────────────────── */}
      {filtered.length > 0 && viewMode === "list" && (
        <div className="mx-8" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 14, overflow: "hidden" }}>
          {/* Table header */}
          <div
            className="grid px-5 py-3"
            style={{ gridTemplateColumns: "2.5fr 1fr 1fr 100px 110px 110px", background: "#F8F7F4", borderBottom: "1px solid rgba(0,0,0,0.06)" }}
          >
            {["NAME", "KATEGORIE", "OBJEKT", "GRÖSSE", "DATUM", ""].map(h => (
              <span key={h} style={{ fontSize: 9, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.1em", textTransform: "uppercase" }}>{h}</span>
            ))}
          </div>

          {/* Rows */}
          {filtered.map((doc, i) => {
            const cfg = DOCUMENT_CATEGORIES[doc.category];
            const { bg, border } = getFileTypeBg(doc.mime_type);
            return (
              <motion.div
                key={doc.id}
                initial={prefersReduced ? {} : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.2) }}
                className="grid px-5 items-center cursor-pointer transition-colors duration-100 hover:bg-[#F8F7F4]"
                style={{
                  gridTemplateColumns: "2.5fr 1fr 1fr 100px 110px 110px",
                  paddingTop: 12,
                  paddingBottom: 12,
                  borderBottom: i < filtered.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none",
                }}
                onClick={() => setSelectedDoc(doc)}
              >
                {/* Name */}
                <div className="flex items-center gap-3">
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: bg, border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {getFileTypeIcon(doc.mime_type, 15)}
                  </div>
                  <div className="min-w-0">
                    <p style={{ fontSize: 13, fontWeight: 500, color: "#101418", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.name}</p>
                    <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 280 }}>{doc.original_name}</p>
                  </div>
                </div>

                {/* Category */}
                <div>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}30`, display: "inline-block" }}>
                    {cfg.label}
                  </span>
                </div>

                {/* Property */}
                <p style={{ fontSize: 12, color: "#6B7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {doc.properties?.name ?? "—"}
                </p>

                {/* Size */}
                <p style={{ fontSize: 12, color: "#9CA3AF", fontVariantNumeric: "tabular-nums" }}>{formatFileSize(doc.file_size)}</p>

                {/* Date */}
                <p style={{ fontSize: 12, color: "#9CA3AF" }}>{formatDate(doc.created_at)}</p>

                {/* Actions */}
                <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                  {/* Share */}
                  <div style={{ position: "relative" }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSharingDocId(sharingDocId === doc.id ? null : doc.id); }}
                      className="transition-colors"
                      title="Mit Mieter teilen"
                      style={{ width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: sharedDocs[doc.id] ? "#00897B" : "#9CA3AF" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,137,123,0.08)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <ShareNetwork size={14} />
                    </button>
                    <AnimatePresence>
                      {sharingDocId === doc.id && (
                        <motion.div
                          initial={{ opacity: 0, y: 4, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4, scale: 0.95 }}
                          transition={{ duration: 0.12 }}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            position: "absolute",
                            right: 0,
                            top: 34,
                            zIndex: 20,
                            background: "white",
                            border: "1px solid rgba(0,0,0,0.09)",
                            borderRadius: 12,
                            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                            padding: "12px 14px",
                            minWidth: 190,
                          }}
                        >
                          <p style={{ fontSize: 12, fontWeight: 600, color: "#101418", marginBottom: 10 }}>Mit Mieter teilen</p>
                          <button
                            onClick={() => toggleShare(doc.id, sharedDocs[doc.id] ?? false)}
                            disabled={sharingLoading === doc.id}
                            className="w-full flex items-center gap-2 transition-all"
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: (sharedDocs[doc.id]) ? "#B91C1C" : "white",
                              background: (sharedDocs[doc.id]) ? "rgba(185,28,28,0.08)" : "#00897B",
                              border: (sharedDocs[doc.id]) ? "1px solid rgba(185,28,28,0.15)" : "none",
                              padding: "8px 12px",
                              borderRadius: 8,
                              cursor: "pointer",
                              justifyContent: "center",
                            }}
                          >
                            {sharingLoading === doc.id ? "..." : sharedDocs[doc.id] ? "Freigabe entfernen" : "Freigeben"}
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {sharedDocs[doc.id] && (
                    <span style={{ fontSize: 9, fontWeight: 700, background: "rgba(0,137,123,0.1)", color: "#00897B", padding: "2px 6px", borderRadius: 99, whiteSpace: "nowrap" }}>
                      Geteilt
                    </span>
                  )}
                  <button
                    onClick={() => handleDownload(doc)}
                    className="transition-colors"
                    style={{ width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#F0EDE4")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <DownloadSimple size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="transition-colors"
                    style={{ width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: deleting === doc.id ? "#B91C1C" : "#9CA3AF" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(185,28,28,0.08)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <Trash size={14} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── GRID VIEW ───────────────────────────────────────────────── */}
      {filtered.length > 0 && viewMode === "grid" && (
        <div className="px-8 grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
          {filtered.map((doc, i) => {
            const cfg = DOCUMENT_CATEGORIES[doc.category];
            const { bg } = getFileTypeBg(doc.mime_type);
            return (
              <motion.div
                key={doc.id}
                initial={prefersReduced ? {} : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.25) }}
                whileHover={prefersReduced ? {} : { y: -2, boxShadow: "0 4px 16px rgba(160,120,48,0.1)" }}
                onClick={() => setSelectedDoc(doc)}
                className="cursor-pointer overflow-hidden transition-all duration-200"
                style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 14 }}
              >
                {/* Preview area */}
                <div className="flex items-center justify-center" style={{ height: 100, background: bg }}>
                  {getFileTypeIcon(doc.mime_type, 36)}
                </div>

                {/* Info */}
                <div style={{ padding: "10px 12px" }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: "#101418", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 5 }}>
                    {doc.name}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span style={{ fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 99, background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
                      {cfg.label}
                    </span>
                    {sharedDocs[doc.id] && (
                      <span style={{ fontSize: 9, fontWeight: 700, background: "rgba(0,137,123,0.1)", color: "#00897B", padding: "2px 6px", borderRadius: 99 }}>
                        Geteilt
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p style={{ fontSize: 10, color: "#9CA3AF" }}>{formatFileSize(doc.file_size)} · {formatDate(doc.created_at)}</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleShare(doc.id, sharedDocs[doc.id] ?? false); }}
                      title={sharedDocs[doc.id] ? "Freigabe entfernen" : "Mit Mieter teilen"}
                      style={{ color: sharedDocs[doc.id] ? "#00897B" : "#C4B5A0", padding: 2 }}
                      className="transition-opacity hover:opacity-70"
                    >
                      <ShareNetwork size={12} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Bottom padding */}
      <div style={{ height: 40 }} />

      {/* ── MODALS ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showUpload && (
          <UploadModal
            key="upload"
            properties={properties}
            tenants={tenants}
            onClose={() => setShowUpload(false)}
            onUploaded={(doc) => setDocuments(prev => [doc, ...prev])}
          />
        )}
        {selectedDoc && (
          <PreviewModal
            key="preview"
            doc={selectedDoc}
            onClose={() => setSelectedDoc(null)}
          />
        )}
      </AnimatePresence>

      {/* Share toast */}
      <AnimatePresence>
        {shareToast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60]"
            style={{
              background: "#101418",
              color: "white",
              fontSize: 13,
              fontWeight: 500,
              padding: "10px 20px",
              borderRadius: 12,
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
              whiteSpace: "nowrap",
            }}
          >
            {shareToast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
