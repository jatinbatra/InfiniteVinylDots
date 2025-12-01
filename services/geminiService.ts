import { GoogleGenAI, Type } from "@google/genai";
import { AlbumInsight } from "../types";

// Note: In a real app, never expose API keys on the client.
// This is structured for the demo environment where process.env.API_KEY is available.
const apiKey = process.env.API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const getAlbumInsight = async (artist: string, album: string): Promise<AlbumInsight | null> => {
  if (!ai) {
    console.warn("Gemini API Key not found");
    return { vibe: "API Key missing", trivia: "Configure API Key to see insights." };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Give me a short "vibe check" (2-3 words describing the mood) and one interesting, short trivia fact about the album "${album}" by ${artist}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            vibe: { type: Type.STRING, description: "2-3 words describing the mood" },
            trivia: { type: Type.STRING, description: "A short interesting fact" }
          },
          required: ["vibe", "trivia"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AlbumInsight;
    }
    return null;

  } catch (error) {
    console.error("Error fetching album insight:", error);
    return null;
  }
};