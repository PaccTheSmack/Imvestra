"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  CheckSquare,
  CheckCircle,
  Clipboard,
  Wrench,
  Scales,
  CurrencyEur,
  UsersFour,
  DotsThree,
  PencilSimple,
  Trash,
  X,
  Sparkle,
  Warning,
  ArrowSquareOut,
  ArrowRight,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import DarkButton from "@/components/ui/DarkButton";
import DarkInput from "@/components/ui/DarkInput";
import DarkSelect from "@/components/ui/DarkSelect";
import FadeIn from "@/components/ui/FadeIn";
import type { Task } from "@/types";
import TaskActionCard from "@/components/dashboard/TaskActionCard";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type TaskWithProperty = Task & {
  properties?: { id: string; name: string } | null;
  action_type?: string | null;
  action_payload?: Record<string, unknown>;
  source_type?: string;
};

interface AufgabenViewProps {
  tasks: TaskWithProperty[];
  properties: { id: string; name: string }[];
}

type FilterKind = "all" | "open" | "done";
type SortKind   = "due_date" | "priority" | "created";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const PRIORITY_CONFIG = {
  high:   { label: "Dringend", color: "#B91C1C", bg: "rgba(185,28,28,0.08)",  border: "rgba(185,28,28,0.12)"  },
  medium: { label: "Offen",   color: "#A07830", bg: "rgba(160,120,48,0.08)", border: "rgba(160,120,48,0.12)" },
  low:    { label: "Geplant", color: "#6B7280", bg: "rgba(0,0,0,0.04)",      border: "rgba(0,0,0,0.08)"      },
} as const;

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

const CATEGORY_CONFIG: Record<string, { label: string; Icon: PhosphorIcon }> = {
  general:     { label: "Allgemein",      Icon: Clipboard   },
  maintenance: { label: "Instandhaltung", Icon: Wrench      },
  legal:       { label: "Rechtliches",    Icon: Scales      },
  financial:   { label: "Finanziell",     Icon: CurrencyEur },
  tenant:      { label: "Mieter",         Icon: UsersFour   },
  other:       { label: "Sonstiges",      Icon: DotsThree   },
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const todayStr = new Date().toISOString().split("T")[0];

function fmtDateShort(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("de-DE", { day: "numeric", month: "short" });
}

type DueBand = "overdue" | "today" | "upcoming" | "no_date" | "done";

function dueBand(t: TaskWithProperty): DueBand {
  if (t.completed) return "done";
  if (!t.due_date)  return "no_date";
  if (t.due_date < todayStr)  return "overdue";
  if (t.due_date === todayStr) return "today";
  return "upcoming";
}

const BAND_ORDER: DueBand[] = ["overdue", "today", "upcoming", "no_date", "done"];

const BAND_META: Record<DueBand, { label: string; color: string }> = {
  overdue:  { label: "ÜBERFÄLLIG", color: "#B91C1C" },
  today:    { label: "HEUTE",      color: "#92400E" },
  upcoming: { label: "DEMNÄCHST",  color: "#9CA3AF" },
  no_date:  { label: "KEIN DATUM", color: "#9CA3AF" },
  done:     { label: "ERLEDIGT",   color: "#9CA3AF" },
};

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function AufgabenView({ tasks: initialTasks, properties }: AufgabenViewProps) {
  const router        = useRouter();
  const prefersReduced = useReducedMotion();

  const [localTasks, setLocalTasks] = useState<TaskWithProperty[]>(initialTasks);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const [showAddTask, setShowAddTask] = useState(false);
  const [filter, setFilter]         = useState<FilterKind>("open");
  const [selectedProp, setSelectedProp] = useState("all");
  const [sortBy, setSortBy]         = useState<SortKind>("due_date");
  const [savingTask, setSavingTask] = useState(false);

  const [taskForm, setTaskForm] = useState({
    title: "", description: "", priority: "medium", category: "general",
    due_date: "", property_id: "",
  });

  // ── Stats ──────────────────────────────────────────────────────────────────
  const openTasks      = localTasks.filter((t) => !t.completed).length;
  const overdueTasks   = localTasks.filter((t) => !t.completed && t.due_date && t.due_date < todayStr).length;
  const highPriority   = localTasks.filter((t) => !t.completed && t.priority === "high").length;
  const completedTasks = localTasks.filter((t) => t.completed).length;

  // ── Filter + sort ──────────────────────────────────────────────────────────
  let filtered = [...localTasks];
  if (filter === "open")  filtered = filtered.filter((t) => !t.completed);
  if (filter === "done")  filtered = filtered.filter((t) => t.completed);
  if (selectedProp !== "all") filtered = filtered.filter((t) => t.property_id === selectedProp);

  filtered.sort((a, b) => {
    if (sortBy === "priority") return (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1);
    if (sortBy === "created")  return b.created_at.localeCompare(a.created_at);
    // due_date: nulls last
    if (!a.due_date && !b.due_date) return 0;
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return a.due_date.localeCompare(b.due_date);
  });

  // ── Grouped ────────────────────────────────────────────────────────────────
  const grouped: Partial<Record<DueBand, TaskWithProperty[]>> = {};
  for (const t of filtered) {
    const band = dueBand(t);
    if (!grouped[band]) grouped[band] = [];
    grouped[band]!.push(t);
  }

  const visibleBands = BAND_ORDER.filter((b) => (grouped[b]?.length ?? 0) > 0);

  // ── Handlers ───────────────────────────────────────────────────────────────
  async function toggleTask(id: string, completed: boolean) {
    setLocalTasks((prev) => prev.map((t) => t.id === id ? { ...t, completed } : t));
    const supabase = createClient();
    await supabase.from("tasks").update({ completed }).eq("id", id);
    router.refresh();
  }

  async function deleteTask(id: string) {
    setDeletingIds((prev) => new Set(Array.from(prev).concat(id)));
    setTimeout(async () => {
      setLocalTasks((prev) => prev.filter((t) => t.id !== id));
      setDeletingIds((prev) => { const s = new Set(Array.from(prev)); s.delete(id); return s; });
      const supabase = createClient();
      await supabase.from("tasks").delete().eq("id", id);
      router.refresh();
    }, 280);
  }

  async function saveTask() {
    if (!taskForm.title.trim()) return;
    setSavingTask(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSavingTask(false); return; }

    const { data: newTask } = await supabase
      .from("tasks")
      .insert({
        user_id:     user.id,
        title:       taskForm.title.trim(),
        description: taskForm.description || null,
        priority:    taskForm.priority,
        category:    taskForm.category,
        due_date:    taskForm.due_date || null,
        property_id: taskForm.property_id || null,
        completed:   false,
        auto_generated: false,
      })
      .select("*, properties(id, name)")
      .single();

    if (newTask) setLocalTasks((prev) => [...prev, newTask as TaskWithProperty]);
    setSavingTask(false);
    setShowAddTask(false);
    setTaskForm({ title: "", description: "", priority: "medium", category: "general", due_date: "", property_id: "" });
    router.refresh();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="px-8 py-7 w-full" style={{ minHeight: "100vh", background: "#F8F7F4" }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(160,120,48,0.08)", border: "1px solid rgba(160,120,48,0.18)" }}
          >
            <CheckSquare size={18} color="#A07830" />
          </div>
          <h1 className="text-[20px] font-semibold tracking-[-0.02em]" style={{ color: "#101418" }}>
            Aufgaben
          </h1>
          {openTasks > 0 && (
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full ml-1"
              style={{ background: "#F5F5F5", border: "1px solid rgba(0,0,0,0.07)", color: "#9CA3AF" }}
            >
              {openTasks} offen
            </span>
          )}
        </div>
        <DarkButton variant="primary" onClick={() => setShowAddTask(true)}>
          Aufgabe hinzufugen
        </DarkButton>
      </div>

      {/* ── Summary cards ───────────────────────────────────────────────── */}
      <FadeIn delay={0}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "OFFEN",      value: openTasks,      color: "#101418",                          hero: false },
            { label: "ÜBERFÄLLIG", value: overdueTasks,   color: overdueTasks > 0 ? "#FFFFFF" : "#101418", hero: overdueTasks > 0 },
            { label: "HOHE PRIO",  value: highPriority,   color: highPriority > 0 ? "#92400E" : "#101418", hero: false },
            { label: "ERLEDIGT",   value: completedTasks, color: "#2D6A2D",                           hero: false },
          ].map(({ label, value, color, hero }) => (
            <div
              key={label}
              className="rounded-[14px] px-4 py-3.5"
              style={hero
                ? { background: "#A07830", border: "1px solid rgba(0,0,0,0.07)" }
                : { background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.07)" }
              }
            >
              <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: hero ? "rgba(255,255,255,0.7)" : "#9CA3AF" }}>
                {label}
              </p>
              <p className="text-2xl font-semibold tracking-tight" style={{ color }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </FadeIn>

      {/* ── Filter + sort bar ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          {(["open", "all", "done"] as FilterKind[]).map((f) => {
            const labels = { open: "Offen", all: "Alle", done: "Erledigt" };
            const active = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-3 py-1.5 rounded-full text-xs cursor-pointer transition-all"
                style={active
                  ? { background: "#A07830", color: "#FFFFFF", fontWeight: 600 }
                  : { background: "#F5F5F5", border: "1px solid rgba(0,0,0,0.07)", color: "#6B7280" }
                }
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = "#101418"; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = "#6B7280"; }}
              >
                {labels[f]}
              </button>
            );
          })}
          <select
            value={selectedProp}
            onChange={(e) => setSelectedProp(e.target.value)}
            className="px-3 py-1.5 rounded-[8px] text-xs cursor-pointer outline-none"
            style={{ background: "#F5F5F5", border: "1px solid rgba(0,0,0,0.07)", color: "#6B7280" }}
          >
            <option value="all">Alle Objekte</option>
            {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKind)}
          className="px-3 py-1.5 rounded-[8px] text-xs cursor-pointer outline-none"
          style={{ background: "#F5F5F5", border: "1px solid rgba(0,0,0,0.07)", color: "#6B7280" }}
        >
          <option value="due_date">Fälligkeit</option>
          <option value="priority">Priorität</option>
          <option value="created">Erstellt</option>
        </select>
      </div>

      {/* ── Empty state ─────────────────────────────────────────────────── */}
      {filtered.length === 0 && (
        <div className="mt-10 flex flex-col items-center text-center px-6">
          {localTasks.length === 0 ? (
            // True empty: no tasks at all
            <>
              <motion.div
                animate={prefersReduced ? {} : { y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="w-20 h-20 rounded-[20px] flex items-center justify-center mx-auto"
                style={{ background: "#F5F5F5", border: "1px solid rgba(0,0,0,0.07)" }}
              >
                <CheckSquare size={36} color="#9CA3AF" />
              </motion.div>

              <h2 className="text-[24px] font-semibold tracking-[-0.02em] mt-8" style={{ color: "#101418" }}>
                Keine Aufgaben offen
              </h2>
              <p className="text-sm mt-3 max-w-[340px] leading-relaxed" style={{ color: "#6B7280" }}>
                Organisiere Wartungsarbeiten, Fristen und alles rund um dein Portfolio — an einem Ort.
              </p>

              <div className="mt-6">
                <DarkButton variant="primary" onClick={() => setShowAddTask(true)}>
                  Erste Aufgabe erstellen
                </DarkButton>
              </div>

              {/* Ghost task previews */}
              <div className="mt-10 w-full max-w-[500px] flex flex-col gap-2 select-none pointer-events-none">
                {[
                  { title: "Heizung warten lassen",        priLabel: "Hoch",    priColor: "#B91C1C", priBg: "rgba(185,28,28,0.1)" },
                  { title: "Nebenkostenabrechnung prüfen", priLabel: "Mittel",  priColor: "#92400E", priBg: "rgba(146,64,14,0.1)"  },
                  { title: "Mietvertrag verlängern",        priLabel: "Niedrig", priColor: "#2D6A2D", priBg: "rgba(45,106,45,0.1)" },
                ].map((t, i) => (
                  <div
                    key={t.title}
                    className="rounded-[14px] px-4 py-3.5 flex items-center gap-4"
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid rgba(0,0,0,0.07)",
                      opacity: i === 0 ? 0.4 : i === 1 ? 0.25 : 0.15,
                      filter: "blur(1.5px)",
                    }}
                  >
                    <div className="w-5 h-5 rounded-[5px] flex-shrink-0" style={{ border: "2px solid rgba(0,0,0,0.15)" }} />
                    <p className="flex-1 text-sm font-medium text-[#101418] text-left">{t.title}</p>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: t.priBg, color: t.priColor }}>
                      {t.priLabel}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : filter === "done" ? (
            // Filter: done, nothing done yet
            <>
              <div className="w-16 h-16 rounded-[18px] flex items-center justify-center mx-auto"
                style={{ background: "#F5F5F5", border: "1px solid rgba(0,0,0,0.07)" }}>
                <CheckCircle size={28} color="#9CA3AF" />
              </div>
              <p className="text-base font-semibold mt-5" style={{ color: "#101418" }}>Noch nichts erledigt</p>
              <p className="text-sm mt-2" style={{ color: "#9CA3AF" }}>Erledigte Aufgaben erscheinen hier.</p>
            </>
          ) : (
            // Filter: open, all done
            <>
              <div className="w-16 h-16 rounded-[18px] flex items-center justify-center mx-auto"
                style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)" }}>
                <CheckCircle size={28} color="#22C55E" weight="fill" />
              </div>
              <p className="text-base font-semibold mt-5" style={{ color: "#101418" }}>Alles erledigt</p>
              <p className="text-sm mt-2" style={{ color: "#9CA3AF" }}>Keine offenen Aufgaben.</p>
            </>
          )}
        </div>
      )}

      {/* ── Action tasks ────────────────────────────────────────────────── */}
      {(() => {
        const actionTasks = localTasks.filter(t => t.action_type && t.action_type !== "generic")
        if (actionTasks.length === 0) return null
        return (
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3" style={{ background: "rgba(185,28,28,0.04)", border: "1px solid rgba(185,28,28,0.1)", borderRadius: 10, padding: "10px 14px" }}>
              <Warning size={15} color="#B91C1C" />
              <p style={{ fontSize: 13, fontWeight: 600, color: "#B91C1C" }}>
                {actionTasks.length} Aktion{actionTasks.length !== 1 ? "en" : ""} erforderlich
              </p>
            </div>
            <div className="flex flex-col gap-3">
              {actionTasks.map(task => (
                <TaskActionCard
                  key={task.id}
                  task={task as Parameters<typeof TaskActionCard>[0]["task"]}
                  onComplete={(id) => setLocalTasks(prev => prev.filter(t => t.id !== id))}
                  onDismiss={(id) => setLocalTasks(prev => prev.filter(t => t.id !== id))}
                />
              ))}
            </div>
          </div>
        )
      })()}

      {/* ── Task list (grouped) ─────────────────────────────────────────── */}
      <div>
        {visibleBands.map((band) => (
          <div key={band}>
            <p
              className="text-[9px] font-semibold uppercase tracking-widest px-1 mb-2 mt-5 first:mt-0"
              style={{ color: BAND_META[band].color }}
            >
              {BAND_META[band].label}
            </p>
            <AnimatePresence>
              {(grouped[band] ?? []).map((task, i) => {
                const isDeleting   = deletingIds.has(task.id);
                const bandOfTask   = dueBand(task);
                const isOverdue    = bandOfTask === "overdue";
                const isToday      = bandOfTask === "today";
                const priConfig    = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG];
                const catConfig    = CATEGORY_CONFIG[task.category] ?? CATEGORY_CONFIG.other;
                const isAutoGen    = task.auto_generated === true;

                return (
                  <motion.div
                    key={task.id}
                    initial={prefersReduced ? {} : { opacity: 0, y: 8 }}
                    animate={{ opacity: isDeleting ? 0 : task.completed ? 0.45 : 1, y: 0, height: isDeleting ? 0 : "auto" }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: prefersReduced ? 0 : 0.25, delay: i * 0.04 }}
                    className="group mb-2 overflow-hidden"
                  >
                    <div
                      className="rounded-[14px] px-4 py-3.5 flex items-start gap-4 transition-all duration-150 cursor-default"
                      style={{
                        background: "#FFFFFF",
                        border: isAutoGen
                          ? "1px solid rgba(160,120,48,0.18)"
                          : "1px solid rgba(0,0,0,0.07)",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.borderColor = isAutoGen
                          ? "rgba(160,120,48,0.32)"
                          : "rgba(160,120,48,0.15)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.borderColor = isAutoGen
                          ? "rgba(160,120,48,0.18)"
                          : "rgba(0,0,0,0.07)";
                      }}
                    >
                      {/* Checkbox */}
                      <motion.div
                        className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-[5px] flex items-center justify-center cursor-pointer"
                        style={{
                          border: task.completed ? "2px solid #A07830" : "2px solid rgba(0,0,0,0.15)",
                          background: task.completed ? "#A07830" : "transparent",
                          transition: "all 0.15s ease",
                        }}
                        whileTap={prefersReduced ? {} : { scale: 0.85 }}
                        onClick={() => toggleTask(task.id, !task.completed)}
                        onMouseEnter={(e) => {
                          if (!task.completed) (e.currentTarget as HTMLDivElement).style.borderColor = "#A07830";
                        }}
                        onMouseLeave={(e) => {
                          if (!task.completed) (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(0,0,0,0.15)";
                        }}
                      >
                        {task.completed && <CheckCircle size={14} color="#fff" weight="fill" />}
                      </motion.div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Top row */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <p
                              className="text-sm font-medium truncate"
                              style={{ color: task.completed ? "#9CA3AF" : "#101418", textDecoration: task.completed ? "line-through" : "none" }}
                            >
                              {task.title}
                            </p>
                            {isAutoGen && (
                              <span
                                className="text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0 flex items-center gap-0.5"
                                style={{ background: "rgba(160,120,48,0.08)", color: "#A07830" }}
                              >
                                <Sparkle size={7} weight="fill" />
                                AUTO
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span
                              className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase"
                              style={{ background: priConfig.bg, color: priConfig.color, border: `1px solid ${priConfig.border}` }}
                            >
                              {priConfig.label}
                            </span>
                            {task.due_date && (
                              <span
                                className="text-[10px]"
                                style={{
                                  color: isOverdue ? "#B91C1C" : isToday ? "#92400E" : "#9CA3AF",
                                  fontWeight: isOverdue || isToday ? 600 : 400,
                                }}
                              >
                                {fmtDateShort(task.due_date)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        {task.description && (
                          <p className="text-xs mt-0.5 truncate" style={{ color: "#9CA3AF" }}>
                            {task.description}
                          </p>
                        )}

                        {/* Bottom row */}
                        <div className="mt-2 flex items-center gap-3">
                          <span className="text-[10px]" style={{ color: "#9CA3AF" }}>
                            {catConfig.label}
                          </span>
                          {task.properties?.name && (
                            <span className="text-[10px]" style={{ color: "#9CA3AF" }}>
                              · {task.properties.name}
                            </span>
                          )}
                          {/* Actions */}
                          <div className="ml-auto flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity items-center">
                            {/* Als erledigt button for all tasks */}
                            {!task.completed && (
                              <button
                                className="flex items-center gap-1 text-[11px] font-semibold transition-colors duration-150 cursor-pointer"
                                style={{ color: "#A07830" }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#8A6420"; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#A07830"; }}
                                onClick={() => toggleTask(task.id, true)}
                              >
                                Als erledigt ✓
                              </button>
                            )}
                            {/* Action-type specific navigation buttons */}
                            {task.action_type === "confirm_payment" && !task.completed && (
                              <button
                                className="flex items-center gap-1 text-[11px] font-semibold transition-colors duration-150 cursor-pointer"
                                style={{ color: "#A07830" }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#8A6420"; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#A07830"; }}
                                onClick={() => router.push("/bank")}
                              >
                                Zahlung prüfen →
                                <ArrowRight size={12} />
                              </button>
                            )}
                            {task.action_type === "create_mahnung" && !!task.action_payload?.payment_id && !task.completed && (
                              <button
                                className="flex items-center gap-1 text-[11px] font-semibold transition-colors duration-150 cursor-pointer"
                                style={{ color: "#A07830" }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#8A6420"; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#A07830"; }}
                                onClick={() => router.push(`/mahnwesen?payment_id=${task.action_payload!.payment_id}`)}
                              >
                                Mahnung erstellen →
                                <ArrowRight size={12} />
                              </button>
                            )}
                            {task.action_type === "create_mahnung" && !!task.action_payload?.existing_mahnung_id && !task.completed && (
                              <button
                                className="flex items-center gap-1 text-[11px] font-semibold transition-colors duration-150 cursor-pointer"
                                style={{ color: "#A07830" }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#8A6420"; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#A07830"; }}
                                onClick={() => router.push(`/mahnwesen?mahnung_id=${task.action_payload!.existing_mahnung_id}`)}
                              >
                                Mahnung eskalieren →
                                <ArrowRight size={12} />
                              </button>
                            )}
                            {task.action_type === "check_zinsbindung" && !task.completed && (
                              <button
                                className="flex items-center gap-1 text-[11px] font-semibold transition-colors duration-150 cursor-pointer"
                                style={{ color: "#A07830" }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#8A6420"; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#A07830"; }}
                                onClick={() => router.push(`/finanzen?tab=zinsbindung&financing_id=${task.action_payload!.financing_id}`)}
                              >
                                Zur Zinsbindung →
                                <ArrowRight size={12} />
                              </button>
                            )}
                            {task.action_type === "generic" && typeof task.action_payload?.redirect === "string" && !task.completed && (
                              <button
                                className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer"
                                style={{ color: "#A07830", background: "rgba(160,120,48,0.08)", border: "1px solid rgba(160,120,48,0.15)" }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(160,120,48,0.14)"; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(160,120,48,0.08)"; }}
                                onClick={() => router.push(task.action_payload!.redirect as string)}
                              >
                                <ArrowSquareOut size={10} />
                                Öffnen →
                              </button>
                            )}
                            {!isAutoGen && (
                              <button
                                className="p-1 rounded transition-colors"
                                style={{ color: "#9CA3AF" }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = "#101418")}
                                onMouseLeave={(e) => (e.currentTarget.style.color = "#9CA3AF")}
                              >
                                <PencilSimple size={13} />
                              </button>
                            )}
                            <button
                              className="p-1 rounded transition-colors"
                              style={{ color: "#9CA3AF" }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = "#B91C1C")}
                              onMouseLeave={(e) => (e.currentTarget.style.color = "#9CA3AF")}
                              onClick={() => deleteTask(task.id)}
                            >
                              <Trash size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* ── Modal: Add Task ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showAddTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-12 px-4 pb-4 overflow-y-auto"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowAddTask(false); }}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="w-full max-w-[480px] rounded-[20px] overflow-hidden"
              style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 24px 80px rgba(0,0,0,0.12)" }}
            >
              <div className="px-6 py-5 flex justify-between items-center" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
                <p className="text-base font-semibold" style={{ color: "#101418" }}>Aufgabe hinzufugen</p>
                <button onClick={() => setShowAddTask(false)} style={{ color: "#9CA3AF" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#101418")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#9CA3AF")}>
                  <X size={18} />
                </button>
              </div>

              <div className="px-6 py-5 flex flex-col gap-4">
                <DarkInput
                  label="Titel"
                  placeholder="z.B. Heizung warten lassen"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))}
                />
                <div>
                  <label className="block text-[11px] font-medium mb-1.5" style={{ color: "#9CA3AF" }}>
                    Beschreibung
                  </label>
                  <textarea
                    placeholder="Details zur Aufgabe..."
                    value={taskForm.description}
                    onChange={(e) => setTaskForm((f) => ({ ...f, description: e.target.value }))}
                    rows={3}
                    className="w-full rounded-[8px] px-3 py-2.5 text-sm outline-none resize-none placeholder:text-[#9CA3AF]"
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid rgba(0,0,0,0.08)",
                      color: "#101418",
                      minHeight: 80,
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(160,120,48,0.4)")}
                    onBlur={(e)  => (e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)")}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <DarkSelect
                    label="Priorität"
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm((f) => ({ ...f, priority: e.target.value }))}
                    options={[
                      { value: "high",   label: "Hoch"    },
                      { value: "medium", label: "Mittel"  },
                      { value: "low",    label: "Niedrig" },
                    ]}
                  />
                  <DarkSelect
                    label="Kategorie"
                    value={taskForm.category}
                    onChange={(e) => setTaskForm((f) => ({ ...f, category: e.target.value }))}
                    options={Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => ({ value: key, label: cfg.label }))}
                  />
                  <DarkInput
                    label="Fällig am"
                    type="date"
                    value={taskForm.due_date}
                    onChange={(e) => setTaskForm((f) => ({ ...f, due_date: e.target.value }))}
                  />
                  <DarkSelect
                    label="Objekt"
                    value={taskForm.property_id}
                    onChange={(e) => setTaskForm((f) => ({ ...f, property_id: e.target.value }))}
                    options={[
                      { value: "", label: "Kein Objekt" },
                      ...properties.map((p) => ({ value: p.id, label: p.name })),
                    ]}
                  />
                </div>
              </div>

              <div className="px-6 py-4 flex justify-end gap-3" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
                <DarkButton variant="ghost" onClick={() => setShowAddTask(false)}>Abbrechen</DarkButton>
                <DarkButton variant="primary" loading={savingTask} onClick={saveTask}>Aufgabe speichern</DarkButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
