import fs from "node:fs";
import OpenAI, { toFile } from "openai";
import { Buffer } from "node:buffer";

// Lazy initialize OpenAI client
let _openai: OpenAI | undefined;

export function getOpenAIClient(): OpenAI {
  if (!_openai) {
    if (process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
      try {
        _openai = new OpenAI({
          apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
          baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
        });
      } catch (error) {
        // Mock OpenAI client for development without API key
        _openai = {
          images: {
            generate: async (params: any) => {
              // Return a mock response for development
              const mockImageBuffer = Buffer.alloc(100, 'mock'); // Create a small mock buffer
              const base64String = mockImageBuffer.toString('base64');
              return {
                data: [{ b64_json: base64String }]
              };
            },
            edit: async (params: any) => {
              // Return a mock response for development
              const mockImageBuffer = Buffer.alloc(100, 'mock'); // Create a small mock buffer
              const base64String = mockImageBuffer.toString('base64');
              return {
                data: [{ b64_json: base64String }]
              };
            }
          }
        } as any;
        console.warn("OpenAI API key not found. Running with mock image responses for development.");
      }
    } else {
      // Mock OpenAI client for development without API key
      _openai = {
        images: {
          generate: async (params: any) => {
            // Return a mock response for development
            const mockImageBuffer = Buffer.alloc(100, 'mock'); // Create a small mock buffer
            const base64String = mockImageBuffer.toString('base64');
            return {
              data: [{ b64_json: base64String }]
            };
          },
          edit: async (params: any) => {
            // Return a mock response for development
            const mockImageBuffer = Buffer.alloc(100, 'mock'); // Create a small mock buffer
            const base64String = mockImageBuffer.toString('base64');
            return {
              data: [{ b64_json: base64String }]
            };
          }
        }
      } as any;
      console.warn("OpenAI API key not found. Running with mock image responses for development.");
    }
  }
  return _openai!; // Assert non-null since we initialize it in the if block
}

/**
 * Generate an image and return as Buffer.
 * Uses gpt-image-1 model via Replit AI Integrations.
 */
export async function generateImageBuffer(
  prompt: string,
  size: "1024x1024" | "512x512" | "256x256" = "1024x1024"
): Promise<Buffer> {
  const response = await getOpenAIClient().images.generate({
    model: "gpt-image-1",
    prompt,
    size,
  });
  const base64 = response.data?.[0]?.b64_json ?? "";
  return Buffer.from(base64, "base64");
}

/**
 * Edit/combine multiple images into a composite.
 * Uses gpt-image-1 model via Replit AI Integrations.
 */
export async function editImages(
  imageFiles: string[],
  prompt: string,
  outputPath?: string
): Promise<Buffer> {
  const images = await Promise.all(
    imageFiles.map((file) =>
      toFile(fs.createReadStream(file), file, {
        type: "image/png",
      })
    )
  );

  const response = await getOpenAIClient().images.edit({
    model: "gpt-image-1",
    image: images,
    prompt,
  });

  const imageBase64 = response.data?.[0]?.b64_json ?? "";
  const imageBytes = Buffer.from(imageBase64, "base64");

  if (outputPath) {
    fs.writeFileSync(outputPath, imageBytes);
  }

  return imageBytes;
}