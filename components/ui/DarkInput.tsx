import * as React from "react";

interface DarkInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  error?: string;
  hint?: string;
}

export default function DarkInput({ label, error, hint, className = "", id, ...props }: DarkInputProps) {
  const inputId = id ?? (typeof label === "string" ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-[#6A5A3A]">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={[
          "w-full bg-white border border-[rgba(16,20,24,0.1)] rounded-[8px]",
          "px-3 py-2.5 text-sm text-[#101418] placeholder:text-[#A89A7A]",
          "focus:outline-none focus:ring-2 focus:ring-[rgba(160,120,48,0.2)] focus:border-[rgba(160,120,48,0.3)]",
          "transition-all duration-150",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          error ? "border-[rgba(185,28,28,0.4)] focus:border-[rgba(185,28,28,0.4)] focus:ring-[rgba(185,28,28,0.15)]" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
      {error && <p className="text-xs text-[#B91C1C]">{error}</p>}
      {hint && !error && <p className="text-xs text-[#A89A7A]">{hint}</p>}
    </div>
  );
}
