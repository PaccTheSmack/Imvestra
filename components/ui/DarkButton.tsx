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
    "bg-[#00E0D7] text-[#080808] font-semibold shadow-[0_0_0_1px_rgba(0,224,215,0.3),0_4px_16px_rgba(0,224,215,0.12)] hover:brightness-105",
  secondary:
    "bg-[#1A1A1A] text-white border border-[rgba(255,255,255,0.07)] hover:bg-[#222222] hover:border-[rgba(255,255,255,0.12)]",
  ghost:
    "bg-transparent text-[#888888] hover:text-white hover:bg-[rgba(255,255,255,0.05)]",
  danger:
    "bg-[rgba(255,68,68,0.1)] text-[#FF4444] border border-[rgba(255,68,68,0.2)] hover:bg-[rgba(255,68,68,0.15)]",
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
