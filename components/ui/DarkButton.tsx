"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface DarkButtonProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: "button" | "submit" | "reset";
  form?: string;
  name?: string;
  value?: string;
  "aria-label"?: string;
  title?: string;
  id?: string;
  tabIndex?: number;
  style?: React.CSSProperties;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-[#A07830] text-white font-semibold hover:bg-[#8A6420] hover:shadow-[0_4px_16px_rgba(160,120,48,0.2)]",
  secondary:
    "bg-white text-[#101418] border border-[rgba(16,20,24,0.1)] hover:bg-[#F0EDE4] hover:border-[rgba(16,20,24,0.16)]",
  ghost:
    "bg-transparent border border-[rgba(16,20,24,0.14)] text-[#101418] hover:bg-[#F0EDE4]",
  danger:
    "bg-[rgba(185,28,28,0.08)] text-[#B91C1C] border border-[rgba(185,28,28,0.2)] hover:bg-[rgba(185,28,28,0.14)]",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs rounded-[6px] gap-1.5",
  md: "px-4 py-2.5 text-sm rounded-[8px] gap-2",
  lg: "px-6 py-3 text-sm rounded-[10px] gap-2.5",
};

export default function DarkButton({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  children,
  disabled,
  className = "",
  ...props
}: DarkButtonProps) {
  const prefersReduced = useReducedMotion();

  const hoverAnim = prefersReduced
    ? {}
    : variant === "primary"
    ? { y: -1 }
    : {};

  return (
    <motion.button
      disabled={disabled || loading}
      whileHover={hoverAnim}
      whileTap={prefersReduced ? {} : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={[
        "inline-flex items-center justify-center font-medium transition-colors duration-150",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        variantStyles[variant],
        sizeStyles[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        icon
      )}
      {children}
    </motion.button>
  );
}
