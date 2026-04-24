/** biome-ignore-all lint/suspicious/noImplicitAnyLet: demo */
import { getRunner } from "@/traivel-agent/runner";

const APP_NAME = "traivel";

// In production, get this from DB e.g. based on auth cookie.
const MOCK_USER_ID = "johndoe123";

const STATE_KEYS = [
  "user:wishlist",
  "user:preferences",
  "temp:last_destination",
] as const;

/**
 * POST /api/agent
 *
 * Body: { message: string, sessionId?: string }
 * Response: { text: string, sessionId: string }
 */
export async function POST(req: Request) {
  try {
    const { message, sessionId } = await req.json();
    if (!message) {
      return Response.json({ error: "Message is required" }, { status: 400 });
    }

    const runner = await getRunner();

    // ── Get or create session ────────────────────────────────────────
    let session;
    if (sessionId) {
      session = await runner.sessionService.getSession({
        appName: APP_NAME,
        userId: MOCK_USER_ID,
        sessionId,
      });
    }
    if (!session) {
      session = await runner.sessionService.createSession({
        appName: APP_NAME,
        userId: MOCK_USER_ID,
      });
    }

    // ── Run the agent ────────────────────────────────────────────────
    const events = [];
    for await (const event of runner.runAsync({
      userId: MOCK_USER_ID,
      sessionId: session.id,
      newMessage: { role: "user", parts: [{ text: message }] },
    })) {
      events.push(event);
    }

    // ── Extract the final text response ──────────────────────────────
    let text = "";
    for (const event of [...events].reverse()) {
      if (event.content?.role === "model") {
        for (const part of event.content.parts ?? []) {
          if (part.text) {
            text = part.text;
            break;
          }
        }
        if (text) break;
      }
		}

		// ── Collect current state ────────────────────────────────────────
    const refreshedSession = await runner.sessionService.getSession({
      appName: APP_NAME,
      userId: MOCK_USER_ID,
      sessionId: session.id,
    });
    const state: Record<string, unknown> = {};
    for (const key of STATE_KEYS) {
      const val = refreshedSession?.state[key];
      if (val !== undefined) state[key] = val;
    }

    // ── Collect relevant memories ────────────────────────────────────
    const memories: string[] = [];
    try {
      const memResult = await runner.memoryService?.searchMemory({
        appName: APP_NAME,
        userId: MOCK_USER_ID,
        query: message,
      });
      for (const mem of memResult?.memories ?? []) {
        const texts = (mem.content?.parts ?? [])
          .map((p) => p.text)
          .filter(Boolean);
        if (texts.length) memories.push(texts.join(" "));
      }
    } catch {
      // memory search is best-effort; do nothing if not found
    }

    return Response.json({ text, sessionId: session.id, state, memories });
  } catch (error) {
    console.error("Agent error:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

/**
 * GET /api/agent?sessionId=xxx
 *
 * Validates whether a session still exists on the server.
 * Response: { valid: boolean }
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId");
  if (!sessionId) return Response.json({ valid: false });

  try {
    const runner = await getRunner();
    const session = await runner.sessionService.getSession({
      appName: APP_NAME,
      userId: MOCK_USER_ID,
      sessionId,
    });
    // Reconstruct chat messages from session events
    const messages: { role: "user" | "agent"; text: string }[] = [];
    for (const event of session?.events ?? []) {
      if (event.content?.role === "user" || event.content?.role === "model") {
				const text = (event.content.parts ?? []).map((p) => p.text).filter(Boolean).join("");
        // @ts-ignore
        if (text) messages.push({ role: event.content.role, text });
      }
    }

    return Response.json({ valid: !!session, messages });
  } catch {
    return Response.json({ valid: false });
  }
}
