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
        <Question size={12} color="#444" />
      </button>
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#1A1A1A] border border-[rgba(255,255,255,0.12)] rounded-[8px] px-3 py-2 z-50 w-[220px] text-[11px] text-[#888] leading-relaxed shadow-[0_8px_24px_rgba(0,0,0,0.6)] pointer-events-none">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1A1A1A]" />
        </div>
      )}
    </div>
  )
}
