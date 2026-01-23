import { SlidePlan } from "../types";
import { functions } from "../src/firebase";
import { httpsCallable } from "firebase/functions";

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

// Helper to Compress Image (Resize to max width, maintaining aspect ratio)
export const compressImage = (file: File, maxWidth = 1200, quality = 0.85): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Canvas context failed"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to JPEG base64
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl.split(',')[1]);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

// Helper to stitch multiple images vertically into one long image
export const stitchImagesVertically = async (images: string[]): Promise<string> => {
  if (images.length === 0) return '';
  if (images.length === 1) return images[0];

  return new Promise((resolve, reject) => {
    const loadedImages: HTMLImageElement[] = [];
    let loadedCount = 0;

    images.forEach((src, index) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        loadedImages[index] = img;
        loadedCount++;
        if (loadedCount === images.length) {
          // All images loaded, now stitch
          try {
            // Calculate total dimensions (use max width, sum of heights)
            const maxWidth = Math.max(...loadedImages.map(i => i.width));
            const totalHeight = loadedImages.reduce((sum, i) => sum + i.height, 0);

            const canvas = document.createElement('canvas');
            canvas.width = maxWidth;
            canvas.height = totalHeight;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
              reject(new Error('Canvas context failed'));
              return;
            }

            // Draw each image, stacking vertically
            let currentY = 0;
            loadedImages.forEach((loadedImg) => {
              // Center horizontally if narrower than max width
              const x = (maxWidth - loadedImg.width) / 2;
              ctx.drawImage(loadedImg, x, currentY);
              currentY += loadedImg.height;
            });

            // Convert to data URL
            const result = canvas.toDataURL('image/png', 1.0);
            resolve(result);
          } catch (e) {
            reject(e);
          }
        }
      };
      img.onerror = () => reject(new Error(`Failed to load image ${index + 1}`));
      img.src = src;
    });
  });
};

// Map "Nano Banana Pro" request to `gemini-3-pro-image-preview`
const IMAGE_MODEL_NAME = 'gemini-3-pro-image-preview';
// Use Flash for logic/planning tasks
const TEXT_MODEL_NAME = 'gemini-3-flash-preview';

interface GenerateImageOptions {
  prompt: string;
  referenceImage?: string; // Base64 (Product or Style)
  logoImage?: string; // Base64 (Brand Logo)
  elementImages?: string[]; // Base64 (Additional Elements)
  aspectRatio: "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
  imageSize?: "1K" | "2K" | "4K";
}

interface CloudFunctionResponse {
  text: string;
  candidates: any[];
}

const callGeminiFunction = async (data: any): Promise<CloudFunctionResponse> => {
  const generateContent = httpsCallable(functions, 'generateContent', { timeout: 540000 });
  try {
    const result = await generateContent(data);
    return result.data as CloudFunctionResponse;
  } catch (error) {
    console.error("Firebase Function Error:", error);
    throw error;
  }
};

export const generateSocialPlan = async (topic: string, slideCount: number): Promise<SlidePlan[]> => {
  const prompt = `You are an expert social media strategist. 
  Create a detailed ${slideCount}-slide carousel plan for the following topic/content: "${topic}".
  
  The plan should be structured logically (e.g., Hook -> Problem -> Solution -> Value -> CTA).
  For specific visual descriptions, ensure they are highly detailed for an AI image generator.
  The language of the titles/subtitles should match the language of the topic provided.
  `;

  const response = await callGeminiFunction({
    modelName: TEXT_MODEL_NAME,
    prompt: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "ARRAY", // Corrected enum usage for plain object transmission
        items: {
          type: "OBJECT",
          properties: {
            slideNumber: { type: "INTEGER" },
            role: { type: "STRING", description: "The strategic role of this slide (e.g., Hook, Education)" },
            visualDescription: { type: "STRING", description: "Detailed visual description of the image background and main subject" },
            title: { type: "STRING", description: "Main headline text for the design" },
            subtitle: { type: "STRING", description: "Supporting text or body copy" },
            designNotes: { type: "STRING", description: "Color palette and mood notes" }
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

  // 3. Additional Element Images (if provided)
  if (options.elementImages && options.elementImages.length > 0) {
    options.elementImages.forEach((img) => {
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: img
        }
      });
    });
  }

  // 4. Construct the Text Prompt
  let finalPrompt = options.prompt;

  if (options.logoImage) {
    finalPrompt += " \n\nIMPORTANT: Use the second provided image (the Logo) and place it clearly and professionally in the bottom-right corner of the design.";
  }

  if (options.elementImages && options.elementImages.length > 0) {
    finalPrompt += ` \n\nIMPORTANT: Use the provided additional element images (after the logo) and integrate them naturally into the composition as key visual components.`;
  }

  parts.push({ text: finalPrompt });

  try {
    const response = await callGeminiFunction({
      modelName: IMAGE_MODEL_NAME,
      parts: parts,
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
  // Clean base64 if it has header
  const cleanBase64 = originalImageBase64.includes(',') ? originalImageBase64.split(',')[1] : originalImageBase64;

  const prompt = `Edit this image. Instruction: ${instruction}. 
  CRITICAL REQUIREMENTS:
  - Maintain ULTRA-HIGH 4K Resolution and professional photorealistic quality.
  - STRICTLY PRESERVE all existing text, especially ARABIC TEXT. It MUST remain crystal clear, sharp, and legible. Do NOT blur, distort, or change the language of any text.
  - Ensure editing logic is precise and blends seamlessly with the original image.
  - Preserve the original lighting, shadows, and texture where appropriate.
  - Output should be crisp, sharp, and artifact-free.`;

  try {
    const response = await callGeminiFunction({
      modelName: IMAGE_MODEL_NAME,
      parts: [
        {
          inlineData: {
            mimeType: 'image/png',
            data: cleanBase64
          }
        },
        { text: prompt }
      ],
      config: {
        imageConfig: {
          imageSize: "4K" // Maximum resolution
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