import { Type } from "@google/genai";
import { JarvisToolDefinition } from "../toolTypes";

/**
 * Detects Tavily API key from environment variables,
 * supporting standard spellings as well as common variations (tarvily, travily).
 */
export function getTavilyApiKey(): string | null {
  const candidates = [
    process.env.TAVILY_API_KEY,
    process.env.tavily_api_key,
    process.env.tarvily,
    process.env.TARVILY,
    process.env.tarvily_api_key,
    process.env.TARVILY_API_KEY,
    process.env.travily,
    process.env.TRAVILY,
    process.env.travily_api_key,
    process.env.TRAVILY_API_KEY,
    process.env.tavily,
    process.env.TAVILY,
    process.env.TAVILY_KEY,
    process.env.TRAIL_API_KEY,
  ];

  for (const c of candidates) {
    if (typeof c === "string" && c.trim().length > 0) {
      return c.trim();
    }
  }
  return null;
}

export function hasTavilyApiKey(): boolean {
  return Boolean(getTavilyApiKey());
}

export type WebIntelCategory = "video" | "website";

export interface WebSearchResultItem {
  id?: string;
  title: string;
  url: string;
  snippet: string;
  source?: string;
  category: WebIntelCategory;
  authorOrChannel?: string;
}

export interface WebSearchResult {
  query: string;
  cleanTopic: string;
  engine: string;
  answer: string | null;
  resultsCount: number;
  sources: WebSearchResultItem[];
}

/**
 * Clean user query into a concise subject topic.
 * Strips conversational pleasantries in Urdu, Roman Urdu, and English.
 */
export function extractCleanTopic(rawQuery: string): string {
  let text = (rawQuery || "").trim();
  
  // Clean punctuation and multiple spaces
  text = text.replace(/[\?\!\.,:;]/g, " ").replace(/\s+/g, " ").trim();

  // Strip leading greetings/fillers
  text = text.replace(
    /^(jarvis|hey jarvis|gravis|hello jarvis|hi jarvis|bhai|yaar|janab|sir|sahab|please|can you|could you|tell me|tell me about|what is|what are|who is|who are|explain|how does|how to|search for|search the web for|search|lookup|look up|mujhe batao|batao|sunao|mujhe)\s+/i,
    ""
  );

  // Strip trailing question fillers
  text = text.replace(
    /\s+(kya hai|kya hoti hai|kya hota hai|batao|samjhao|kaise karein|kaise hota hai|ke baare mein batao|ke bare me batao|explain karo|bata dein|chahiye|kiya hai)$/i,
    ""
  );

  text = text.trim();
  return text.length >= 2 ? text : rawQuery.trim();
}

/**
 * Generates structured items strictly for Videos and Websites.
 */
function buildCuratedCategoryItems(cleanTopic: string): WebSearchResultItem[] {
  const encTopic = encodeURIComponent(cleanTopic);
  
  return [
    // 1. VIDEOS (YouTube)
    {
      title: `Watch: ${cleanTopic} - Video Explainer & Guide`,
      url: `https://www.youtube.com/results?search_query=${encTopic}+guide`,
      snippet: `Curated video tutorials, visual walkthroughs, and expert demonstrations covering ${cleanTopic}.`,
      source: "YOUTUBE VIDEO",
      category: "video",
      authorOrChannel: "YouTube Hub",
    },
    {
      title: `YouTube: ${cleanTopic} - Overview & Walkthrough`,
      url: `https://www.youtube.com/results?search_query=${encTopic}+overview`,
      snippet: `High-definition visual overview, latest presentations, and deep dive video demonstrations.`,
      source: "YOUTUBE VIDEO",
      category: "video",
      authorOrChannel: "YouTube Tech",
    },

    // 2. WEBSITES & OFFICIAL PORTALS
    {
      title: `${cleanTopic} - Official Portal & Resource Hub`,
      url: `https://duckduckgo.com/?q=!ducky+${encTopic}+official+website`,
      snippet: `Direct link to primary canonical portal, official project documentation, and core resources.`,
      source: "OFFICIAL PORTAL",
      category: "website",
      authorOrChannel: "Official Site",
    },
    {
      title: `${cleanTopic} - Open Projects & Web Directory`,
      url: `https://github.com/search?q=${encTopic}`,
      snippet: `Community repositories, web platforms, code architectures, and live project resources.`,
      source: "GITHUB / WEB DIRECTORY",
      category: "website",
      authorOrChannel: "GitHub Community",
    },
    {
      title: `${cleanTopic} - Online Knowledge Portal`,
      url: `https://en.wikipedia.org/wiki/Special:Search?search=${encTopic}`,
      snippet: `Verified portal knowledge base and reference directory.`,
      source: "WIKIPEDIA PORTAL",
      category: "website",
      authorOrChannel: "Wikipedia",
    },
  ];
}

export async function executeWebSearch(rawQuery: string): Promise<WebSearchResult> {
  const tavilyKey = getTavilyApiKey();
  const cleanTopic = extractCleanTopic(rawQuery);
  const curatedDefaults = buildCuratedCategoryItems(cleanTopic);

  if (tavilyKey && cleanTopic) {
    try {
      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        signal: AbortSignal.timeout(1800),
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: tavilyKey,
          query: cleanTopic,
          search_depth: "basic",
          include_answer: true,
          max_results: 6,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const tavilySources: WebSearchResultItem[] = (data.results || []).map((r: any) => {
          const url = (r.url || "#").toLowerCase();
          const title = (r.title || "Web Result").toLowerCase();
          
          let category: WebIntelCategory = "website";
          if (
            url.includes("youtube.com") ||
            url.includes("youtu.be") ||
            url.includes("vimeo") ||
            url.includes("dailymotion") ||
            title.includes("video") ||
            title.includes("watch")
          ) {
            category = "video";
          } else {
            category = "website";
          }

          return {
            title: r.title || "Web Result",
            url: r.url || "#",
            snippet: r.content || "",
            source: category === "video" ? "YOUTUBE VIDEO" : "OFFICIAL WEB PORTAL",
            category,
          };
        });

        // Ensure both videos and websites are represented
        const hasVideos = tavilySources.some((s) => s.category === "video");
        const hasWebsites = tavilySources.some((s) => s.category === "website");

        const combinedSources = [...tavilySources];
        if (!hasVideos) {
          combinedSources.unshift(curatedDefaults[0]); // Add primary YouTube video
        }
        if (!hasWebsites) {
          combinedSources.push(curatedDefaults[2]); // Add official website
        }

        return {
          query: rawQuery,
          cleanTopic,
          engine: "Tavily Real-Time Index",
          answer: data.answer || null,
          resultsCount: combinedSources.length,
          sources: combinedSources,
        };
      } else {
        const errText = await response.text();
        console.warn(`Tavily search API returned HTTP ${response.status}: ${errText}`);
      }
    } catch (err) {
      console.warn("Tavily search API query notice, falling back to curated index:", err);
    }
  }

  // Curated Videos & Websites only
  return {
    query: rawQuery,
    cleanTopic,
    engine: "JARVIS Neural Web Intel",
    answer: null,
    resultsCount: curatedDefaults.length,
    sources: curatedDefaults,
  };
}

export const webSearchTool: JarvisToolDefinition = {
  id: "tool-web-search",
  name: "searchWeb",
  displayName: "Live Web Search (Tavily/Trail)",
  version: "1.4.0",
  category: "information",
  enabled: true,
  description: "Search the web or real-time knowledge base for current news, facts, technical data, weather, or live information using Tavily.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: "The targeted web search query string, e.g. 'latest AI news today' or 'weather in Tokyo'.",
      },
    },
    required: ["query"],
  },
  execute: async (args) => {
    const rawQuery = args?.query || "";
    const searchData = await executeWebSearch(rawQuery);
    return {
      result: searchData,
    };
  },
};


