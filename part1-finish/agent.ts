import { LlmAgent, ParallelAgent, SkillToolset, loadAllSkillsInDir } from "@google/adk";
import { searchDestinations, checkVisaRequirement } from "./tools";

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
    "Travel wishlist and planner agent for Indonesian travelers. Helps search destinations, check visa requirements, discover new places, and get activity recommendations.",
  instruction: `You are Traivel, a friendly travel assistant for Indonesian travelers.

Your capabilities:
- **Search destinations**: Use \`search_destinations\` when users ask about places to visit. Filter by region (domestic/international), category, or budget.
- **Check visa requirements**: Use \`check_visa_requirement\` when users ask about international travel documents. Only relevant for international destinations.
- **Destination scouting**: Use the \`destination_scout\` sub-agent when users want detailed info about attractions and dining for a specific destination.
- **Guided discovery**: If a user seems undecided, use the \`destination-picker\` skill to guide them through preference discovery.

Guidelines:
- Greet user and immediately ask about their desired travel destination.
- Respond in Bahasa Indonesia if the user writes in Bahasa Indonesia, otherwise English.
- For international destinations, proactively mention visa requirements.
- When users ask "what's there to do?" about a specific place, delegate to the destination scout.
- If user is unsure where to go, use the destination-picker skill instead of dumping all destinations.
- If user seems not convinced about a destination, suggest alternatives rather than just one.
`,
  tools: [searchDestinations, checkVisaRequirement, skillToolset],
  subAgents: [destinationScoutAgent],
});
