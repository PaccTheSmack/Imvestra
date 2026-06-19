import * as React from "react";
import { CaretDown } from "@phosphor-icons/react";

interface DarkSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
}

export default function DarkSelect({ label, error, hint, options, className = "", id, ...props }: DarkSelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-xs font-medium text-[#6A5A3A] uppercase tracking-wide">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={[
            "w-full appearance-none bg-white border border-[rgba(16,20,24,0.1)] rounded-[8px]",
            "px-3 py-2.5 pr-9 text-sm text-[#101418]",
            "focus:outline-none focus:border-[rgba(160,120,48,0.3)] hover:border-[rgba(160,120,48,0.2)]",
            "transition-all duration-150 cursor-pointer",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            error ? "border-[rgba(185,28,28,0.4)]" : "",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        >
          {options.map(({ value, label: optLabel }) => (
            <option key={value} value={value} style={{ background: "#FFFFFF", color: "#101418" }}>
              {optLabel}
            </option>
          ))}
        </select>
        <CaretDown
          size={13}
          color="#A89A7A"
          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
        />
      </div>
      {error && <p className="text-xs text-[#B91C1C]">{error}</p>}
      {hint && !error && <p className="text-xs text-[#A89A7A]">{hint}</p>}
    </div>
  );
}
