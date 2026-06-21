"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Message {
  id: string;
  text: string;
  sender: string;
  created_at: string;
}

interface Props {
  messages: Message[];
}

export default function NachrichtenThread({ messages }: Props) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/mieter/nachrichten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Fehler beim Senden");
      }
      setText("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Thread */}
      <div
        style={{
          padding: "20px 24px",
          minHeight: 200,
          maxHeight: 480,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {messages.length === 0 ? (
          <p style={{ fontSize: 14, color: "#9CA3AF", textAlign: "center", marginTop: 40 }}>
            Noch keine Nachrichten.
          </p>
        ) : (
          messages.map((msg) => {
            const isMieter = msg.sender === "mieter";
            return (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  justifyContent: isMieter ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "72%",
                    padding: "10px 14px",
                    borderRadius: isMieter ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                    backgroundColor: isMieter ? "#00897B" : "#F3F4F6",
                    color: isMieter ? "#fff" : "#111827",
                    fontSize: 14,
                    lineHeight: 1.5,
                  }}
                >
                  <div>{msg.text}</div>
                  <div
                    style={{
                      fontSize: 11,
                      marginTop: 4,
                      opacity: 0.65,
                      textAlign: "right",
                    }}
                  >
                    {new Date(msg.created_at).toLocaleString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        style={{
          borderTop: "1px solid rgba(0,0,0,0.07)",
          padding: "16px 24px",
        }}
      >
        {error && (
          <p style={{ fontSize: 13, color: "#DC2626", marginBottom: 8 }}>{error}</p>
        )}
        <form onSubmit={handleSend} style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Nachricht schreiben…"
            rows={2}
            style={{
              flex: 1,
              padding: "9px 12px",
              border: "1px solid rgba(0,0,0,0.12)",
              borderRadius: 8,
              fontSize: 14,
              color: "#111827",
              backgroundColor: "#fff",
              outline: "none",
              resize: "none",
              boxSizing: "border-box",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(e as unknown as React.FormEvent);
              }
            }}
          />
          <button
            type="submit"
            disabled={loading || !text.trim()}
            style={{
              padding: "9px 18px",
              backgroundColor: loading || !text.trim() ? "#9CA3AF" : "#00897B",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: loading || !text.trim() ? "not-allowed" : "pointer",
              transition: "background-color 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            {loading ? "…" : "Senden"}
          </button>
        </form>
      </div>
    </>
  );
}
