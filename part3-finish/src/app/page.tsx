"use client";

import { useState, useRef, useEffect } from "react";

const STORAGE_KEY = "traivel:sessionId";

// ── Types ─────────────────────────────────────────────────────────────

interface StateSnapshot {
  [key: string]: unknown;
}

interface Message {
  id: string;
  role: "user" | "agent";
  text: string;
}

// ── Main Page ─────────────────────────────────────────────────────────

export default function Home() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [state, setState] = useState<StateSnapshot | null>(null);
  const [memories, setMemories] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [alert, setAlert] = useState<string | null>(null);

  // On mount, restore session from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    // Validate the session still exists on the server
    fetch(`/api/agent?sessionId=${encodeURIComponent(stored)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.valid) {
          setSessionId(stored);
          if (data.messages?.length) {
            setMessages(data.messages.map((m: { role: string; text: string }) => ({
              id: crypto.randomUUID(),
              role: m.role as "user" | "agent",
              text: m.text,
            })));
          }
        } else {
          localStorage.removeItem(STORAGE_KEY);
          setAlert(`Session ${stored} not found`);
        }
      })
      .catch(() => {
        // Server unreachable — still try to use stored session
        setSessionId(stored);
      });
  }, []);

  function handleSessionIdChange(id: string | null) {
    setSessionId(id);
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <div className="flex flex-col h-dvh max-w-2xl mx-auto">
      <Header />
      {alert && (
        <div className="shrink-0 border-b border-border bg-destructive/10 px-4 py-2 text-xs text-destructive flex items-center justify-between">
          <span>{alert}</span>
          <button type="button" onClick={() => setAlert(null)} className="ml-2 font-bold">✕</button>
        </div>
      )}
      <SessionInfo sessionId={sessionId} state={state} memories={memories} />
      <ChatArea
        messages={messages}
        onMessagesChange={setMessages}
        sessionId={sessionId}
        onSessionIdChange={handleSessionIdChange}
        onStateChange={setState}
        onMemoriesChange={setMemories}
      />
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────────────

function Header() {
  return (
    <header className="shrink-0 border-b border-border px-4 py-3 flex items-center gap-2">
      <span className="text-2xl">✈️</span>
      <div>
        <h1 className="text-lg font-semibold leading-tight">Traivel</h1>
        <p className="text-xs text-muted-foreground">
          AI Travel Assistant
        </p>
      </div>
    </header>
  );
}

function SessionInfo({ sessionId, state, memories }: { sessionId: string | null; state: StateSnapshot | null; memories: string[] }) {
  if (!sessionId) return null;
  const hasState = state && Object.keys(state).length > 0;
  const hasMemories = memories.length > 0;
  return (
    <div className="shrink-0 border-b border-border px-4 py-1 text-xs text-muted-foreground space-y-0.5">
      <div>Session: <code className="font-mono">{sessionId}</code></div>
      {hasState && (
        <div>
          State:{"\n"}
          <pre className="inline ml-1 font-mono">{JSON.stringify(state, null, 2)}</pre>
        </div>
      )}
      {hasMemories && (
        <div>
          Memories ({memories.length}):{"\n"}
          <pre className="inline ml-1 font-mono">{memories.join(" | ")}</pre>
        </div>
      )}
    </div>
  );
}

// ── Chat Area ─────────────────────────────────────────────────────────

function ChatArea({ messages, onMessagesChange, sessionId, onSessionIdChange, onStateChange, onMemoriesChange }: { messages: Message[]; onMessagesChange: (fn: (prev: Message[]) => Message[]) => void; sessionId: string | null; onSessionIdChange: (id: string | null) => void; onStateChange: (s: StateSnapshot | null) => void; onMemoriesChange: (m: string[]) => void }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    onMessagesChange((prev) => [...prev, { id: crypto.randomUUID(), role: "user", text }]);
    setLoading(true);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId }),
      });
      const data = await res.json();

      if (data.error) {
        onMessagesChange((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "agent", text: `⚠️ Error: ${data.error}` },
        ]);
      } else {
        onSessionIdChange(data.sessionId);
        onStateChange(data.state ?? null);
        onMemoriesChange(data.memories ?? []);
        onMessagesChange((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "agent",
            text: data.text,
          },
        ]);
      }
    } catch {
      onMessagesChange((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "agent", text: "⚠️ Network error. Is the server running?" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && !loading && (
          <div className="text-center text-muted-foreground mt-16 space-y-2">
            <p className="text-4xl">🏖️</p>
            <p className="font-medium">Ask me about travel destinations!</p>
            <p className="text-sm">
              Try: &ldquo;Recommend a budget beach destination&rdquo; or &ldquo;What&apos;s the weather in Tokyo?&rdquo;
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl px-4 py-3 text-sm text-muted-foreground">
              <span className="inline-flex gap-1">
                <span className="animate-bounce">●</span>
                <span className="animate-bounce [animation-delay:0.1s]">●</span>
                <span className="animate-bounce [animation-delay:0.2s]">●</span>
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="shrink-0 border-t border-border p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about destinations, visas, travel tips..."
            className="flex-1 rounded-xl border border-border bg-muted px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </form>
    </>
  );
}
