import { FunctionTool, type Context } from "@google/adk";
import { z } from "zod";
import { DESTINATIONS, VISA_DATA } from "./mock-data";

/**
 * Tool: searchDestinations
 *
 * State usage:
 * - Reads "user:preferences" (object with region/budget) as fallback defaults
 * - Writes "temp:last_destination" for UI display (e.g. showing the last-browsed destination)
 */
export const searchDestinations = new FunctionTool({
  name: "search_destinations",
  description:
    "Search travel destinations by region (domestic/international), category, and budget level. Returns matching destinations with highlights.",
  parameters: z.object({
    region: z
      .enum(["domestic", "international"])
      .optional()
      .describe("Filter by domestic (within Indonesia) or international destinations."),
    category: z
      .string()
      .optional()
      .describe("Filter by category: beach, culture, nature, culinary, adventure, diving, shopping, history, family."),
    budget: z
      .enum(["budget", "mid-range", "luxury"])
      .optional()
      .describe("Filter by budget level."),
  }),
  execute: async ({ region, category, budget }, toolContext?: Context) => {
    // Read saved user preferences
    const prefs = toolContext?.state.get<{ region?: string; budget?: string }>("user:preferences");
    const effectiveRegion = region ?? prefs?.region;
    const effectiveBudget = budget ?? prefs?.budget;

    const result = await fetchDestinations(effectiveRegion, category, effectiveBudget);

    // Remember last destination viewed
    if ("destinations" in result && result.destinations?.[0]) {
      toolContext?.state.set("temp:last_destination", result.destinations[0].name);
    }

    return result;
  },
});

/**
 * Tool: checkVisaRequirement
 */
export const checkVisaRequirement = new FunctionTool({
  name: "check_visa_requirement",
  description:
    "Check visa requirements for Indonesian passport holders traveling to a specific country. Use this only for international destinations.",
  parameters: z.object({
    country: z
      .string()
      .describe("The destination country name."),
  }),
  execute: ({ country }) => fetchVisaInfo(country),
});

/**
 * Tool: manageWishlist
 * Add, remove, or view the user's travel wishlist.
 *
 * State usage:
 * - Reads/writes "user:wishlist" (persists across sessions with DatabaseSessionService)
 */
export const manageWishlist = new FunctionTool({
  name: "manage_wishlist",
  description:
    "Manage the user's travel wishlist. Add or remove destinations, or list the current wishlist. Use this when users express interest in saving or remembering a destination.",
  parameters: z.object({
    action: z
      .enum(["add", "remove", "list"])
      .describe("The action to perform: add a destination, remove it, or list the full wishlist."),
    destination: z
      .string()
      .optional()
      .describe("The destination name (required for add/remove actions)."),
  }),
  execute: ({ action, destination }, toolContext?: Context) => {
    const wishlist = toolContext?.state.get<string[]>("user:wishlist", []) ?? [];

    if (action === "list") {
      if (wishlist.length === 0) {
        return {
          status: "empty",
          message: "Your wishlist is empty. Tell me about a destination you'd like to save!",
        };
      }
      return {
        status: "success",
        wishlist,
        message: `You have ${wishlist.length} destination(s) on your wishlist: ${wishlist.join(", ")}.`,
      };
    }

    if (!destination) {
      return {
        status: "error",
        message: "Please specify a destination name for add/remove actions.",
      };
    }

    if (action === "add") {
      if (wishlist.includes(destination)) {
        return {
          status: "already_exists",
          message: `${destination} is already on your wishlist!`,
        };
      }
      wishlist.push(destination);
      toolContext?.state.set("user:wishlist", wishlist);
      return {
        status: "added",
        wishlist,
        message: `Added ${destination} to your wishlist. You now have ${wishlist.length} destination(s).`,
      };
    }

    if (action === "remove") {
      const index = wishlist.indexOf(destination);
      if (index === -1) {
        return {
          status: "not_found",
          message: `${destination} is not on your wishlist.`,
        };
      }
      wishlist.splice(index, 1);
      toolContext?.state.set("user:wishlist", wishlist);
      return {
        status: "removed",
        wishlist,
        message: `Removed ${destination} from your wishlist. You now have ${wishlist.length} destination(s).`,
      };
    }

    return { status: "error", message: "Unknown action." };
  },
});

/**
 * Tool: savePreference
 * Saves a user travel preference to session state.
 *
 * State usage:
 * - Reads/writes "user:preferences" as a single object (persists across sessions)
 */
export const savePreference = new FunctionTool({
  name: "save_preference",
  description:
    "Save a user's travel preference (budget level or region preference) so future searches use it as default. Call this when the user explicitly states a preference.",
  parameters: z.object({
    preferred_region: z
      .enum(["domestic", "international"])
      .optional()
      .describe("The user's preferred travel region."),
    preferred_budget: z
      .enum(["budget", "mid-range", "luxury"])
      .optional()
      .describe("The user's preferred budget level."),
  }),
  execute: ({ preferred_region, preferred_budget }, toolContext?: Context) => {
    const prefs = toolContext?.state.get<{ region?: string; budget?: string }>("user:preferences") ?? {};
    const saved: string[] = [];

    if (preferred_region) {
      prefs.region = preferred_region;
      saved.push(`region: ${preferred_region}`);
    }
    if (preferred_budget) {
      prefs.budget = preferred_budget;
      saved.push(`budget: ${preferred_budget}`);
    }

    if (saved.length === 0) {
      return {
        status: "error",
        message: "No preference provided. Specify preferred_region or preferred_budget.",
      };
    }

    toolContext?.state.set("user:preferences", prefs);
    return {
      status: "saved",
      message: `Preferences saved: ${saved.join(", ")}. Future searches will use these as defaults.`,
    };
  },
});


// --- Mock data fetchers --- //

/** Simulate fetching destinations. */
async function fetchDestinations(
  region?: string,
  category?: string,
  budget?: string,
) {
  await new Promise((r) => setTimeout(r, Math.random() * 300 + 100));

  let results = DESTINATIONS;
  if (region) results = results.filter((d) => d.region === region);
  if (category) results = results.filter((d) => d.category.includes(category.toLowerCase()));
  if (budget) results = results.filter((d) => d.budget === budget);

  if (results.length === 0) {
    return {
      status: "no_results",
      message: "No destinations match your criteria. Try broadening your search.",
    };
  }

  return {
    status: "success",
    count: results.length,
    destinations: results.map((d) => ({
      name: d.name,
      country: d.country,
      region: d.region,
      budget: d.budget,
      highlights: d.highlights,
      description: d.description,
    })),
  };
}

/** Simulate fetching visa info. */
async function fetchVisaInfo(country: string) {
  await new Promise((r) => setTimeout(r, Math.random() * 200 + 100));

  const key = Object.keys(VISA_DATA).find(
    (k) => k.toLowerCase() === country.toLowerCase(),
  );

  if (!key) {
    return {
      status: "not_found",
      message: `No visa data available for ${country}. Check with the embassy for the latest requirements.`,
    };
  }

  const info = VISA_DATA[key];
  return {
    status: "success",
    country: key,
    visa_required: info?.required,
    notes: info?.notes,
  };
}
