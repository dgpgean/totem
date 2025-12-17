import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateEventBackground = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Good balance of speed and quality for backgrounds
      contents: {
        parts: [
          {
            text: `Generate a high quality, abstract or decorative background image suitable for a photo booth event. 
            The theme is: ${prompt}. 
            Do not include people or text. 
            Soft lighting, professional photography style, 4k resolution.`
          }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "9:16", // Vertical for totem backgrounds mostly
        }
      }
    });

    // Check for image in response
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("No image generated");
  } catch (error) {
    console.error("Gemini Image Generation Error:", error);
    throw error;
  }
};
