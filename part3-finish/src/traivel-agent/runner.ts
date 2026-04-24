import { Runner, DatabaseSessionService, InMemoryMemoryService, type BaseMemoryService } from "@google/adk";
import { rootAgent } from "./agent";

const APP_NAME = "traivel";
// const MOCK_USER_ID = "johndoe123"; // Move to Agent API route

/**
 * Programmatic `Runner` with `DatabaseSessionService` and `InMemoryMemoryService`.
 */
export async function initializeRunner(): Promise<Runner> {
  // --- 1. Initiate session service --- //
  const sessionService = new DatabaseSessionService("sqlite://./traivel.db");
  await sessionService.init();

  // --- 2. Initiate memory service  --- //
  const memoryService = new CustomDbMemoryService();

  // --- 3. Create the Runner  --- //
  const runner = new Runner({
    agent: rootAgent,
    appName: APP_NAME,
    sessionService,
    memoryService,
  });
  console.log("[runner] Initialized with SQLite session persistence");
  return runner;

  // Steps 4-6 omitted for now
}

let runnerPromise: Promise<Runner> | null = null;
/**
 * Returns a singleton Runner instance.
 * Initializes DatabaseSessionService + InMemoryMemoryService on first call.
 */
export async function getRunner(): Promise<Runner> {
  if (!runnerPromise) {
    runnerPromise = initializeRunner();
  }
  return runnerPromise;
}

// ----- //

/**
 * Minimal example of a persistent MemoryService.
 * Wraps InMemoryMemoryService — swap the internals
 * with a vector store (Weaviate, Pinecone, etc.) for production.
 */
class CustomDbMemoryService implements BaseMemoryService {
  private inner = new InMemoryMemoryService();

  async addSessionToMemory(session: Parameters<BaseMemoryService["addSessionToMemory"]>[0]) {
    // TODO: chunk events → embed → store to vector DB
    await this.inner.addSessionToMemory(session);
  }

  async searchMemory(...args: Parameters<BaseMemoryService["searchMemory"]>) {
    // TODO: embed query → similarity search in vector DB
    return this.inner.searchMemory(...args);
  }
}
