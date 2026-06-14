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
        <label htmlFor={selectId} className="text-xs font-medium text-[#888888] uppercase tracking-wide">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={[
            "w-full appearance-none bg-[#141414] border border-[rgba(255,255,255,0.07)] rounded-[8px]",
            "px-3 py-2.5 pr-9 text-sm text-white",
            "focus:outline-none focus:border-[rgba(29,184,122,0.4)] focus:bg-[#1A1A1A]",
            "transition-all duration-150 cursor-pointer",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            error ? "border-[rgba(255,68,68,0.4)]" : "",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        >
          {options.map(({ value, label: optLabel }) => (
            <option key={value} value={value} style={{ background: "#141414", color: "#fff" }}>
              {optLabel}
            </option>
          ))}
        </select>
        <CaretDown
          size={13}
          color="#555555"
          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
        />
      </div>
      {error && <p className="text-xs text-[#FF4444]">{error}</p>}
      {hint && !error && <p className="text-xs text-[#555555]">{hint}</p>}
    </div>
  );
}
