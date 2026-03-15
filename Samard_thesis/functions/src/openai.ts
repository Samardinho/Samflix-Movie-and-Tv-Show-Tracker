import OpenAI from "openai";
import * as functions from "firebase-functions";

// Get OpenAI API key from Firebase Functions config or environment variable
const getOpenAIApiKey = (): string => {
  // Try Firebase Functions config first (for production)
  const config = functions.config();
  if (config?.openai?.api_key) {
    return config.openai.api_key;
  }
  
  // Fall back to environment variable (for local development)
  const envKey = process.env.OPENAI_API_KEY;
  if (envKey) {
    return envKey;
  }
  
  throw new Error("OPENAI_API_KEY is not configured. Set it in Firebase Functions config or .env file.");
};

let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = getOpenAIApiKey();
    openaiClient = new OpenAI({
      apiKey: apiKey
    });
  }
  return openaiClient;
}




