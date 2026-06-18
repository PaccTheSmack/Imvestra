import { useState, useEffect } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration: number;
}

type Listener = (toasts: ToastItem[]) => void;

let _toasts: ToastItem[] = [];
const _listeners: Set<Listener> = new Set();
const _timers: Map<string, ReturnType<typeof setTimeout>> = new Map();

function notify() {
  _listeners.forEach((l) => l([..._toasts]));
}

export function toast(opts: {
  type?: ToastType;
  title: string;
  description?: string;
  duration?: number;
}) {
  const id = Math.random().toString(36).slice(2, 10);
  const duration = opts.duration ?? 4500;
  const item: ToastItem = {
    id,
    type: opts.type ?? "info",
    title: opts.title,
    description: opts.description,
    duration,
  };
  _toasts = [..._toasts.slice(-4), item];
  notify();

  const timer = setTimeout(() => dismissToast(id), duration);
  _timers.set(id, timer);
  return id;
}

// Convenience shortcuts
toast.success = (title: string, description?: string) =>
  toast({ type: "success", title, description });
toast.error = (title: string, description?: string) =>
  toast({ type: "error", title, description });
toast.warning = (title: string, description?: string) =>
  toast({ type: "warning", title, description });
toast.info = (title: string, description?: string) =>
  toast({ type: "info", title, description });

export function dismissToast(id: string) {
  const timer = _timers.get(id);
  if (timer) { clearTimeout(timer); _timers.delete(id); }
  _toasts = _toasts.filter((t) => t.id !== id);
  notify();
}

export function useToastStore() {
  const [toasts, setToasts] = useState<ToastItem[]>([..._toasts]);

  useEffect(() => {
    _listeners.add(setToasts);
    return () => { _listeners.delete(setToasts); };
  }, []);

  return { toasts, dismiss: dismissToast };
}
