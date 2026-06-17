"use client"

import { useState, useEffect } from "react"
import { CaretLeft, CaretRight } from "@phosphor-icons/react"

interface Props {
  value: string // YYYY-MM-DD
  onChange: (value: string) => void
  label?: string
  helper?: string
}

export default function MonthYearPicker({ value, onChange, label, helper }: Props) {
  const today = new Date()

  const [day, setDay] = useState(1)
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [year, setYear] = useState(today.getFullYear())

  // Initialize from value
  useEffect(() => {
    if (value) {
      const d = new Date(value)
      if (!isNaN(d.getTime())) {
        setDay(d.getDate())
        setMonth(d.getMonth() + 1)
        setYear(d.getFullYear())
      }
    }
  }, [])

  // Emit change whenever day/month/year changes
  useEffect(() => {
    const maxDay = new Date(year, month, 0).getDate()
    const safeDay = Math.min(day, maxDay)
    const dateStr = `${year}-${month.toString().padStart(2, "0")}-${safeDay.toString().padStart(2, "0")}`
    onChange(dateStr)
  }, [day, month, year])

  const MONTHS = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun",
    "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]

  const maxDay = new Date(year, month, 0).getDate()

  function Arrow({ onClick, dir }: {
    onClick: () => void
    dir: "left" | "right"
  }) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-6 h-6 flex items-center justify-center hover:bg-[rgba(255,255,255,0.08)] rounded-[4px] transition-colors flex-shrink-0"
      >
        {dir === "left"
          ? <CaretLeft size={11} color="#666" />
          : <CaretRight size={11} color="#666" />}
      </button>
    )
  }

  function NumberField({
    value: val, min, max, onChange: onCh, width = "w-10"
  }: {
    value: number
    min: number
    max: number
    onChange: (n: number) => void
    width?: string
  }) {
    const [editing, setEditing] = useState(false)
    const [raw, setRaw] = useState(val.toString())

    useEffect(() => {
      if (!editing) setRaw(val.toString())
    }, [val, editing])

    return (
      <input
        type="number"
        value={editing ? raw : val}
        min={min}
        max={max}
        onChange={e => {
          setRaw(e.target.value)
          const n = parseInt(e.target.value)
          if (!isNaN(n) && n >= min && n <= max) onCh(n)
        }}
        onFocus={() => { setEditing(true); setRaw(val.toString()) }}
        onBlur={() => {
          setEditing(false)
          const n = parseInt(raw)
          if (isNaN(n) || n < min) onCh(min)
          else if (n > max) onCh(max)
          else onCh(n)
        }}
        className={`${width} bg-transparent text-sm font-semibold text-white text-center border-none outline-none focus:bg-[rgba(255,255,255,0.06)] rounded-[4px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
      />
    )
  }

  return (
    <div>
      {label && (
        <label className="text-[11px] text-[#666] uppercase tracking-wider mb-2 block">
          {label}
        </label>
      )}

      <div className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[8px] overflow-hidden">

        {/* Column headers */}
        <div className="grid grid-cols-3 border-b border-[rgba(255,255,255,0.05)]">
          {["TAG", "MONAT", "JAHR"].map(h => (
            <div key={h} className="px-3 py-1.5 text-center text-[9px] text-[#444] uppercase tracking-wide border-r border-[rgba(255,255,255,0.05)] last:border-0">
              {h}
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="grid grid-cols-3 divide-x divide-[rgba(255,255,255,0.05)]">

          {/* DAY */}
          <div className="px-2 py-3 flex items-center justify-between gap-1">
            <Arrow
              dir="left"
              onClick={() => setDay(d => d <= 1 ? maxDay : d - 1)}
            />
            <NumberField
              value={day} min={1} max={maxDay}
              onChange={setDay}
            />
            <Arrow
              dir="right"
              onClick={() => setDay(d => d >= maxDay ? 1 : d + 1)}
            />
          </div>

          {/* MONTH */}
          <div className="px-2 py-3 flex items-center justify-between gap-1">
            <Arrow
              dir="left"
              onClick={() => setMonth(m => m <= 1 ? 12 : m - 1)}
            />
            <span className="text-sm font-semibold text-white w-10 text-center select-none">
              {MONTHS[month - 1]}
            </span>
            <Arrow
              dir="right"
              onClick={() => setMonth(m => m >= 12 ? 1 : m + 1)}
            />
          </div>

          {/* YEAR */}
          <div className="px-2 py-3 flex items-center justify-between gap-1">
            <Arrow
              dir="left"
              onClick={() => setYear(y => y - 1)}
            />
            <NumberField
              value={year}
              min={1900}
              max={today.getFullYear() + 30}
              onChange={setYear}
              width="w-14"
            />
            <Arrow
              dir="right"
              onClick={() => setYear(y => y + 1)}
            />
          </div>

        </div>
      </div>

      {helper && (
        <p className="text-[10px] text-[#555] mt-1.5">{helper}</p>
      )}
    </div>
  )
}
