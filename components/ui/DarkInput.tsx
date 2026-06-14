import * as React from "react";

interface DarkInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export default function DarkInput({ label, error, hint, className = "", id, ...props }: DarkInputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-[#888888] uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={[
          "w-full bg-[#141414] border border-[rgba(255,255,255,0.07)] rounded-[8px]",
          "px-3 py-2.5 text-sm text-white placeholder:text-[#555555]",
          "focus:outline-none focus:border-[rgba(29,184,122,0.4)] focus:bg-[#1A1A1A]",
          "transition-all duration-150",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          error ? "border-[rgba(255,68,68,0.4)] focus:border-[rgba(255,68,68,0.6)]" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
      {error && <p className="text-xs text-[#FF4444]">{error}</p>}
      {hint && !error && <p className="text-xs text-[#555555]">{hint}</p>}
    </div>
  );
}
