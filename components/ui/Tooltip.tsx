"use client"

import { useState } from "react"
import { Question } from "@phosphor-icons/react"

interface TooltipProps {
  text: string
  children?: React.ReactNode
}

export default function Tooltip({ text, children }: TooltipProps) {
  const [show, setShow] = useState(false)

  return (
    <div className="relative inline-flex items-center">
      {children}
      <button
        type="button"
        className="ml-1 flex-shrink-0"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(s => !s)}
      >
        <Question size={12} color="#9CA3AF" />
      </button>
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white border border-[rgba(16,20,24,0.12)] rounded-[8px] px-3 py-2 z-50 w-[220px] text-[11px] text-[#6B7280] leading-relaxed shadow-[0_8px_24px_rgba(16,20,24,0.12)] pointer-events-none">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white" />
        </div>
      )}
    </div>
  )
}
