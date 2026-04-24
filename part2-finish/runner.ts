import { Runner, DatabaseSessionService, InMemoryMemoryService } from "@google/adk";
import { rootAgent } from "./agent";

const APP_NAME = "traivel";

// In production, get this from DB e.g. based on auth cookie.
const MOCK_USER_ID = "johndoe123";

/**
 * Programmatic `Runner` with `DatabaseSessionService` and `InMemoryMemoryService`.
 * 
 * Execute as standalone script to see how it works: 
 * ```sh
 * npm run runner
 * ```
 */
async function main() {
  // --- 1. Initiate session service --- //
  const sessionService = new DatabaseSessionService("sqlite://./traivel.db");
  await sessionService.init();

  // --- 2. Initiate memory service (in memory; lost on server restart)  --- //
  const memoryService = new InMemoryMemoryService();

  // --- 3. Create the Runner  --- //
  const runner = new Runner({
    agent: rootAgent,
    appName: APP_NAME,
    sessionService,
    memoryService,
  });

  // --- 4. Run a conversation turn --- //
  const session = await sessionService.createSession({
    appName: APP_NAME,
    userId: MOCK_USER_ID,
  });

  const events = runner.runAsync({
    userId: MOCK_USER_ID,
    sessionId: session.id,
    // Sample user question
    newMessage: { role: "user", parts: [{ text: "Recommend a budget beach destination" }] },
  });

  for await (const event of events) {
    if (event.content?.parts?.[0]?.text) {
      console.log(`Agent: ${event.content.parts[0].text}`);
    }
  }

  // --- 5. Write session to memory --- //
  const fullSession = await sessionService.getSession({
    appName: APP_NAME,
    userId: MOCK_USER_ID,
    sessionId: session.id,
  });
  if (fullSession) {
    await memoryService.addSessionToMemory(fullSession);
  }

  // --- 6. Read from memory --- //
  const memories = await memoryService.searchMemory({
    appName: APP_NAME,
    userId: MOCK_USER_ID,
    query: "beach", // Search query based on sample data
  });
  console.log(`✓ Memory search found ${memories.memories.length} match(es)`);
}

main().catch(console.error);
