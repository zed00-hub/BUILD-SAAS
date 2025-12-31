import { GoogleGenAI, Type } from "@google/genai";
import { SlidePlan } from "../types";

// Helper to convert Blob/File to Base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const getGeminiClient = () => {
  // Use process.env.API_KEY exclusively as per guidelines
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

// Map "Nano Banana Pro" request to `gemini-3-pro-image-preview`
const IMAGE_MODEL_NAME = 'gemini-3-pro-image-preview';
// Use Flash for logic/planning tasks
const TEXT_MODEL_NAME = 'gemini-3-flash-preview';

interface GenerateImageOptions {
  prompt: string;
  referenceImage?: string; // Base64 (Product or Style)
  logoImage?: string; // Base64 (Brand Logo)
  elementImage?: string; // Base64 (Additional Element)
  aspectRatio: "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
  imageSize?: "1K" | "2K" | "4K";
}

export const generateSocialPlan = async (topic: string, slideCount: number): Promise<SlidePlan[]> => {
  const ai = getGeminiClient();

  const prompt = `You are an expert social media strategist. 
  Create a detailed ${slideCount}-slide carousel plan for the following topic/content: "${topic}".
  
  The plan should be structured logically (e.g., Hook -> Problem -> Solution -> Value -> CTA).
  For specific visual descriptions, ensure they are highly detailed for an AI image generator.
  The language of the titles/subtitles should match the language of the topic provided.
  `;

  const response = await ai.models.generateContent({
    model: TEXT_MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            slideNumber: { type: Type.INTEGER },
            role: { type: Type.STRING, description: "The strategic role of this slide (e.g., Hook, Education)" },
            visualDescription: { type: Type.STRING, description: "Detailed visual description of the image background and main subject" },
            title: { type: Type.STRING, description: "Main headline text for the design" },
            subtitle: { type: Type.STRING, description: "Supporting text or body copy" },
            designNotes: { type: Type.STRING, description: "Color palette and mood notes" }
          },
          required: ["slideNumber", "role", "visualDescription", "title", "subtitle", "designNotes"]
        }
      }
    }
  });

  if (response.text) {
    return JSON.parse(response.text) as SlidePlan[];
  }
  throw new Error("Failed to generate content plan");
};

export const generateImage = async (options: GenerateImageOptions): Promise<string> => {
  const ai = getGeminiClient();
  
  const parts: any[] = [];
  
  // 1. Primary Reference Image (Style or Product)
  if (options.referenceImage) {
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: options.referenceImage
      }
    });
  }

  // 2. Logo Image (if provided)
  if (options.logoImage) {
    parts.push({
      inlineData: {
        mimeType: 'image/png', // Logos are often PNGs with transparency
        data: options.logoImage
      }
    });
  }

  // 3. Additional Element Image (if provided)
  if (options.elementImage) {
    parts.push({
      inlineData: {
        mimeType: 'image/png',
        data: options.elementImage
      }
    });
  }

  // 4. Construct the Text Prompt
  let finalPrompt = options.prompt;
  
  if (options.logoImage) {
    finalPrompt += " \n\nIMPORTANT: Use the second provided image (the Logo) and place it clearly and professionally in the bottom-right corner of the design.";
  }

  if (options.elementImage) {
     finalPrompt += " \n\nIMPORTANT: Use the third provided image (the Element) and integrate it naturally into the composition as a key visual component.";
  }

  parts.push({ text: finalPrompt });

  try {
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL_NAME,
      contents: {
        parts: parts
      },
      config: {
        imageConfig: {
          aspectRatio: options.aspectRatio,
          imageSize: options.imageSize || "1K" 
        }
      }
    });

    // Extract image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("No image generated in response.");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const editGeneratedImage = async (originalImageBase64: string, instruction: string): Promise<string> => {
  const ai = getGeminiClient();
  
  // Clean base64 if it has header
  const cleanBase64 = originalImageBase64.includes(',') ? originalImageBase64.split(',')[1] : originalImageBase64;

  const prompt = `Edit this image. Instruction: ${instruction}. Maintain high quality and consistency.`;

  try {
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL_NAME, // Same model for high quality edits
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: cleanBase64
            }
          },
          { text: prompt }
        ]
      },
      config: {
        imageConfig: {
          imageSize: "1K" // Maintain resolution for speed in edits
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("Failed to edit image.");
  } catch (error) {
    console.error("Gemini API Edit Error:", error);
    throw error;
  }
};