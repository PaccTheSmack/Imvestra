"use client"

import CommandPalette from "@/components/ui/CommandPalette"

export default function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <CommandPalette />
    </>
  )
}
