
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const suggestChapters = async (projectDescription: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Proposa una estructura de capítols per a una memòria d'arquitectura basada en aquesta descripció: "${projectDescription}". Respon en català.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING }
            },
            required: ["title"]
          }
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error suggesting chapters:", error);
    return [];
  }
};

export const suggestPlaceholderValues = async (projectName: string, projectDescription: string, keys: string[]) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Ets un assistent per a arquitectes. Donat el projecte "${projectName}" i la descripció "${projectDescription}", inventa o dedueix valors coherents per a aquestes claus de dades: ${keys.join(", ")}. Respon només amb el JSON mapejant claus a valors. Respon en català si escau.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: keys.reduce((acc: any, key) => {
            acc[key] = { type: Type.STRING };
            return acc;
          }, {}),
          required: keys
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error suggesting placeholder values:", error);
    return null;
  }
};

export const generateExecutiveSummary = async (project: any) => {
  try {
    const placeholdersStr = project.placeholders.map((p: any) => `${p.key}: ${p.value}`).join(", ");
    const chaptersStr = project.chapters.map((c: any) => c.title).join(", ");
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Genera un text d'introducció professional per a una memòria d'arquitectura. 
      Projecte: ${project.name}. 
      Dades clau: ${placeholdersStr}. 
      Capítols inclosos: ${chaptersStr}. 
      El text ha de ser formal, d'estil arquitectònic i estar en català. Inclou una salutació i un resum de l'objecte del projecte.`,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating summary:", error);
    return "No s'ha pogut generar l'introducció.";
  }
};
