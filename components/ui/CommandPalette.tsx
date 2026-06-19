"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence, useReducedMotion } from "motion/react"
import {
  MagnifyingGlass,
  HouseLine,
  Calculator,
  MapPin,
  FilePdf,
  Buildings,
  UsersFour,
  Bank,
  CheckSquare,
  Receipt,
  Tag,
  Gear,
  SignOut,
  ArrowRight,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react"
import { signOut } from "@/lib/auth-actions"

type CommandItem = {
  id: string
  label: string
  category: string
  Icon: PhosphorIcon
  action: () => void
  keywords?: string[]
}

export default function CommandPalette() {
  const router = useRouter()
  const prefersReduced = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const navigate = useCallback((href: string) => {
    setOpen(false)
    router.push(href)
  }, [router])

  const COMMANDS: CommandItem[] = [
    { id: "dashboard",   label: "Übersicht",     category: "Navigation", Icon: HouseLine,   action: () => navigate("/dashboard"),   keywords: ["home", "start", "übersicht"] },
    { id: "calculator",  label: "Rechner",        category: "Navigation", Icon: Calculator,  action: () => navigate("/calculator"),  keywords: ["berechnen", "rendite", "kalkulator"] },
    { id: "verhandlung", label: "Verhandlung",    category: "Navigation", Icon: Tag,         action: () => navigate("/verhandlung"), keywords: ["preis", "deal", "kaufpreis"] },
    { id: "standort",    label: "Standort",       category: "Navigation", Icon: MapPin,      action: () => navigate("/standort"),    keywords: ["lage", "location", "karte", "map"] },
    { id: "pdf",         label: "PDF Export",     category: "Navigation", Icon: FilePdf,     action: () => navigate("/pdf-export"),  keywords: ["export", "pdf", "report", "bericht"] },
    { id: "portfolio",   label: "Portfolio",      category: "Navigation", Icon: Buildings,   action: () => navigate("/portfolio"),   keywords: ["immobilien", "objekte", "wohnungen", "häuser"] },
    { id: "mieter",      label: "Mieter",         category: "Navigation", Icon: UsersFour,   action: () => navigate("/mieter"),      keywords: ["tenant", "mietvertrag", "miete", "kontakt"] },
    { id: "finanzen",    label: "Finanzen",       category: "Navigation", Icon: Bank,        action: () => navigate("/finanzen"),    keywords: ["kredit", "finanzierung", "bank", "darlehen", "tilgung"] },
    { id: "aufgaben",    label: "Aufgaben",       category: "Navigation", Icon: CheckSquare, action: () => navigate("/aufgaben"),    keywords: ["tasks", "todo", "frist", "aufgabe"] },
    { id: "steuern",     label: "Steuern",        category: "Navigation", Icon: Receipt,     action: () => navigate("/steuern"),     keywords: ["steuer", "tax", "finanzamt", "afa"] },
    { id: "settings",    label: "Einstellungen",  category: "Navigation", Icon: Gear,        action: () => navigate("/settings"),    keywords: ["konto", "profil", "plan", "abo", "account"] },
    { id: "signout",     label: "Abmelden",       category: "Aktionen",   Icon: SignOut,     action: () => { setOpen(false); signOut() }, keywords: ["logout", "sign out", "raus"] },
  ]

  const filtered = query.trim() === ""
    ? COMMANDS
    : COMMANDS.filter(c => {
        const q = query.toLowerCase()
        return (
          c.label.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          (c.keywords ?? []).some(k => k.includes(q))
        )
      })

  const grouped = filtered.reduce<Record<string, CommandItem[]>>((acc, c) => {
    if (!acc[c.category]) acc[c.category] = []
    acc[c.category].push(c)
    return acc
  }, {})

  // Global Cmd+K + custom event
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(o => !o)
      }
    }
    const onCustom = () => setOpen(true)
    window.addEventListener("keydown", onKey)
    document.addEventListener("imvestra:palette:open", onCustom as EventListener)
    return () => {
      window.removeEventListener("keydown", onKey)
      document.removeEventListener("imvestra:palette:open", onCustom as EventListener)
    }
  }, [])

  // Focus input on open
  useEffect(() => {
    if (open) {
      setQuery("")
      setActiveIdx(0)
      const t = setTimeout(() => inputRef.current?.focus(), 40)
      return () => clearTimeout(t)
    }
  }, [open])

  // Reset index on query change
  useEffect(() => { setActiveIdx(0) }, [query])

  // Scroll active item into view
  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-idx="${activeIdx}"]`)
      ?.scrollIntoView({ block: "nearest" })
  }, [activeIdx])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape")     { setOpen(false); return }
    if (e.key === "ArrowDown")  { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, filtered.length - 1)) }
    if (e.key === "ArrowUp")    { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
    if (e.key === "Enter")      { e.preventDefault(); filtered[activeIdx]?.action() }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReduced ? 0 : 0.14 }}
            className="fixed inset-0 z-50"
            style={{ background: "rgba(16,20,24,0.4)", backdropFilter: "blur(4px)" }}
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: -6 }}
            transition={{ duration: prefersReduced ? 0 : 0.17, ease: [0.23, 1, 0.32, 1] }}
            className="fixed z-50 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[580px]"
            style={{ top: "18vh" }}
            onKeyDown={onKeyDown}
          >
            <div
              className="overflow-hidden rounded-[14px]"
              style={{
                background: "#FFFFFF",
                border: "1px solid rgba(16,20,24,0.1)",
                boxShadow: "0 24px 64px rgba(16,20,24,0.16)",
              }}
            >
              {/* Search row */}
              <div
                className="flex items-center gap-3 px-4 py-3.5"
                style={{ borderBottom: "1px solid rgba(16,20,24,0.06)" }}
              >
                <MagnifyingGlass size={16} color="#A89A7A" className="flex-shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Suchen oder navigieren..."
                  className="flex-1 bg-transparent text-sm text-[#101418] outline-none placeholder:text-[#A89A7A]"
                />
                <kbd
                  className="text-[10px] px-1.5 py-0.5 rounded flex-shrink-0"
                  style={{
                    background: "#F0EDE4",
                    color: "#6A5A3A",
                    border: "1px solid rgba(16,20,24,0.08)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  esc
                </kbd>
              </div>

              {/* Results */}
              <div ref={listRef} className="max-h-[340px] overflow-y-auto py-1.5">
                {filtered.length === 0 ? (
                  <div className="px-4 py-10 text-center text-sm text-[#A89A7A]">
                    Keine Ergebnisse für &ldquo;{query}&rdquo;
                  </div>
                ) : (
                  Object.entries(grouped).map(([category, items]) => (
                    <div key={category} className="mb-1">
                      <p
                        className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest"
                        style={{ color: "#A89A7A" }}
                      >
                        {category}
                      </p>
                      {items.map(item => {
                        const idx = filtered.indexOf(item)
                        const active = idx === activeIdx
                        return (
                          <button
                            key={item.id}
                            data-idx={idx}
                            onClick={item.action}
                            onMouseEnter={() => setActiveIdx(idx)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors duration-75"
                            style={{
                              background: active ? "rgba(160,120,48,0.08)" : "transparent",
                              color: active ? "#101418" : "#6A5A3A",
                            }}
                          >
                            <item.Icon
                              size={15}
                              color={active ? "#A07830" : "#A89A7A"}
                              className="flex-shrink-0"
                            />
                            <span className="flex-1">{item.label}</span>
                            {active && (
                              <ArrowRight size={12} color="#A89A7A" className="flex-shrink-0" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Footer hints */}
              <div
                className="px-4 py-2 flex items-center gap-5 text-[10px]"
                style={{ borderTop: "1px solid rgba(16,20,24,0.06)", color: "#A89A7A" }}
              >
                <span><span style={{ fontFamily: "var(--font-mono)" }}>↑↓</span> navigieren</span>
                <span><span style={{ fontFamily: "var(--font-mono)" }}>↵</span> öffnen</span>
                <span><span style={{ fontFamily: "var(--font-mono)" }}>esc</span> schließen</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
