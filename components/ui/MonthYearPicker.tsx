"use client";

import { useState } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";

const MONTHS = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
const CURRENT_YEAR = new Date().getFullYear();

interface MonthYearPickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  helper?: string;
  error?: string;
  minYear?: number;
  maxYear?: number;
}

function parseValue(value: string): { month: number; year: number } {
  if (value && /^\d{4}-\d{2}/.test(value)) {
    const [y, m] = value.split("-");
    return { month: parseInt(m) - 1, year: parseInt(y) };
  }
  const now = new Date();
  return { month: now.getMonth(), year: now.getFullYear() };
}

function toISODate(month: number, year: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-01`;
}

export default function MonthYearPicker({
  value,
  onChange,
  label,
  helper,
  error,
  minYear = CURRENT_YEAR - 40,
  maxYear = CURRENT_YEAR + 30,
}: MonthYearPickerProps) {
  const parsed = parseValue(value);
  const [month, setMonth] = useState(parsed.month);
  const [year, setYear] = useState(parsed.year);

  function updateMonth(delta: number) {
    let m = month + delta;
    let y = year;
    if (m > 11) { m = 0; y += 1; }
    if (m < 0)  { m = 11; y -= 1; }
    y = Math.max(minYear, Math.min(maxYear, y));
    setMonth(m);
    setYear(y);
    onChange(toISODate(m, y));
  }

  function updateYear(delta: number) {
    const y = Math.max(minYear, Math.min(maxYear, year + delta));
    setYear(y);
    onChange(toISODate(month, y));
  }

  const borderColor = error
    ? "rgba(255,68,68,0.4)"
    : "rgba(255,255,255,0.07)";

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-[#888888] uppercase tracking-wide">
          {label}
        </label>
      )}
      <div
        className="rounded-[8px] overflow-hidden"
        style={{ border: `1px solid ${borderColor}`, background: "#141414" }}
      >
        <div className="grid grid-cols-2 divide-x divide-[rgba(255,255,255,0.06)]">
          {/* Month column */}
          <div className="flex items-center justify-between px-3 py-2.5 gap-2">
            <button
              type="button"
              onClick={() => updateMonth(-1)}
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-[rgba(255,255,255,0.06)] transition-colors cursor-pointer flex-shrink-0"
            >
              <CaretLeft size={11} color="#666" />
            </button>
            <span className="text-sm text-white font-medium w-8 text-center select-none">
              {MONTHS[month]}
            </span>
            <button
              type="button"
              onClick={() => updateMonth(1)}
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-[rgba(255,255,255,0.06)] transition-colors cursor-pointer flex-shrink-0"
            >
              <CaretRight size={11} color="#666" />
            </button>
          </div>

          {/* Year column */}
          <div className="flex items-center justify-between px-3 py-2.5 gap-2">
            <button
              type="button"
              onClick={() => updateYear(-1)}
              disabled={year <= minYear}
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-[rgba(255,255,255,0.06)] transition-colors cursor-pointer flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <CaretLeft size={11} color="#666" />
            </button>
            <span className="text-sm text-white font-medium w-10 text-center select-none tabular-nums">
              {year}
            </span>
            <button
              type="button"
              onClick={() => updateYear(1)}
              disabled={year >= maxYear}
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-[rgba(255,255,255,0.06)] transition-colors cursor-pointer flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <CaretRight size={11} color="#666" />
            </button>
          </div>
        </div>
      </div>
      {error && <p className="text-xs text-[#FF4444]">{error}</p>}
      {helper && !error && <p className="text-xs text-[#777777]">{helper}</p>}
    </div>
  );
}
