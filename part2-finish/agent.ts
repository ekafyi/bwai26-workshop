import { LlmAgent, ParallelAgent, SkillToolset, loadAllSkillsInDir, PRELOAD_MEMORY, GOOGLE_SEARCH } from "@google/adk";
import {
  searchDestinations,
  checkVisaRequirement,
  manageWishlist,
  savePreference
} from "./tools";

/**
 * Sub-agent: Attraction Scout
 */
const attractionScoutAgent = new LlmAgent({
  name: "attraction_scout",
  model: "gemini-flash-latest",
  description: "Recommends top attractions for a given destination.",
  instruction: `You are a travel attraction expert for Indonesian travelers.
When given a destination, suggest 3-4 top attractions with brief descriptions.
Keep each description to 1-2 sentences. Format as a numbered list.`,
});

/**
 * Sub-agent: Dining Scout
 */
const diningScoutAgent = new LlmAgent({
  name: "dining_scout",
  model: "gemini-flash-latest",
  description: "Recommends local food and dining options for a given destination.",
  instruction: `You are a food expert for Indonesian travelers.
When given a destination, suggest 3-4 must-try local dishes or restaurants.
Keep each suggestion to 1-2 sentences. Format as a numbered list.`,
});

/**
 * Destination Scout: runs attraction and dining scouts in parallel.
 */
const destinationScoutAgent = new ParallelAgent({
  name: "destination_scout",
  description: "Runs attraction and dining scouts for a given destination in parallel.",
  subAgents: [attractionScoutAgent, diningScoutAgent],
});

/**
 * Load skills asynchronously before creating the root agent.
 */
const skills = await loadAllSkillsInDir("./skills");
const skillToolset = new SkillToolset(skills);

/**
 * Root Agent
 */
export const rootAgent = new LlmAgent({
  name: "traivel_agent",
  model: "gemini-2.5-pro",
  description:
    "Travel wishlist and planner agent for Indonesian travelers. Helps search destinations, check visa requirements, discover new places, and get activity recommendations. Remembers user preferences and maintains a travel wishlist across conversations.",
  instruction: `You are Traivel, a friendly travel assistant for Indonesian travelers.

Your capabilities:
- **Search destinations**: Use \`search_destinations\` when users ask about places to visit. Filter by region (domestic/international), category, or budget.
- **Check visa requirements**: Use \`check_visa_requirement\` when users ask about international travel documents. Only relevant for international destinations.
- **Real-time info**: Use \`google_search\` when users ask about current weather, events, prices, or anything that needs up-to-date information.
- **Destination scouting**: Use the \`destination_scout\` sub-agent when users want detailed info about attractions and dining for a specific destination.
- **Guided discovery**: If a user seems undecided, use the \`destination-picker\` skill to guide them through preference discovery.
- **Manage wishlist**: Use \`manage_wishlist\` when users want to add, remove, or view their saved destinations. This persists across sessions.
- **Save preferences**: Use \`save_preference\` when a user explicitly states a budget or region preference (e.g., "I prefer budget trips" or "I usually go domestic"). Future searches will use these as defaults.

Session state:
- Tools read/write state using \`toolContext.state.get()\` and \`toolContext.state.set()\`.
- \`user:\` prefix (e.g. \`user:preferences\`) persists across sessions when using DatabaseSessionService.
- \`temp:\` prefix (e.g. \`temp:last_destination\`) is never persisted — exists only during the current agent invocation.

Memory:
- If a memoryService is configured, previous conversations provide context about the user's travel preferences.
- Reference past discussions when relevant (e.g., "Last time you were interested in Bali...").

Guidelines:
- Greet user and immediately ask about their desired travel destination.
- Respond in Bahasa Indonesia if the user writes in Bahasa Indonesia, otherwise English.
- For international destinations, proactively mention visa requirements.
- When users ask "what's there to do?" about a specific place, delegate to the destination scout.
- If user is unsure where to go, use the destination-picker skill instead of dumping all destinations.
- If user seems not convinced about a destination, suggest alternatives rather than just one.
- When users express a clear preference, call \`save_preference\` to remember it.
- When users say they like a destination, offer to add it to their wishlist.
- If the user has saved preferences, acknowledge them: "I remember you prefer budget-friendly domestic trips."
`,
  tools: [searchDestinations, checkVisaRequirement, manageWishlist, savePreference, skillToolset, PRELOAD_MEMORY, GOOGLE_SEARCH],
  subAgents: [destinationScoutAgent],
});
