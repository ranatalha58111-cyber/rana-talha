import { Type } from "@google/genai";
import { JarvisToolDefinition } from "../toolTypes";

export const spotifyTool: JarvisToolDefinition = {
  id: "tool-spotify",
  name: "spotifyController",
  displayName: "Spotify Audio Adapter",
  version: "1.0.0",
  category: "integrations",
  enabled: false, // Default config per PRD: Calendar/Spotify can be toggled ON/OFF
  description: "Control background music, search tracks, play ambient soundscapes, or pause audio stream.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        description: "Playback action: 'play', 'pause', 'next', 'previous', or 'search_track'.",
      },
      query: {
        type: Type.STRING,
        description: "Song title, artist, or playlist name, e.g. 'Interstellar Soundtrack' or 'Lofi Focus'.",
      },
    },
    required: ["action"],
  },
  execute: (args) => {
    const action = args?.action || "play";
    const query = args?.query || "Ambient Focus";

    return {
      result: {
        provider: "Spotify Music Service",
        status: `Executed ${action} for "${query}"`,
        nowPlaying: {
          track: query,
          artist: "Curated Playlist",
          state: action === "pause" ? "paused" : "playing",
        },
      },
      sideEffect: {
        type: "AUDIO_PLAYBACK_CHANGE",
        action,
        query,
      },
    };
  },
};
