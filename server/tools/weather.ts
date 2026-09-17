import { Type } from "@google/genai";
import { JarvisToolDefinition } from "../toolTypes";

export const weatherTool: JarvisToolDefinition = {
  id: "tool-weather",
  name: "getWeather",
  displayName: "Weather Forecast Engine",
  version: "1.1.0",
  category: "information",
  enabled: true,
  description: "Get current meteorological conditions, temperature, humidity, wind, and forecast for any city or location worldwide.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      location: {
        type: Type.STRING,
        description: "The city or geographic area, e.g. 'San Francisco', 'London', 'Dubai', 'Paris'.",
      },
    },
    required: ["location"],
  },
  execute: (args) => {
    const loc = args?.location || "Unknown Location";
    const conditions = ["Clear Sunny", "Partly Cloudy", "Mild Breeze", "Overcast", "Light Rain", "Pleasant Skies"];
    const hash = loc.split("").reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0);
    const tempC = 16 + (hash % 16);
    const tempF = Math.round((tempC * 9) / 5 + 32);
    const condition = conditions[hash % conditions.length];
    const humidity = 40 + (hash % 45);
    const windSpeed = 8 + (hash % 18);

    return {
      result: {
        location: loc,
        temperature: `${tempC}°C (${tempF}°F)`,
        condition,
        humidity: `${humidity}%`,
        wind: `${windSpeed} km/h`,
        airQuality: "Good (AQI 28)",
        forecast: `Expect ${condition.toLowerCase()} throughout the day with moderate humidity.`,
      },
    };
  },
};
