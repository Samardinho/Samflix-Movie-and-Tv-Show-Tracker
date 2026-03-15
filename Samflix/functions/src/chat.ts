import { getOpenAIClient } from "./openai";
import * as admin from "firebase-admin";

const SYSTEM_INSTRUCTION = `You are Samflix Ai Assistant, an assistant for a Movie & TV Tracker app. You must only help with movie/TV discovery, watchlist management strategies, progress tracking, ratings, and TMDb-related guidance. 

CRITICAL: You MUST provide complete, detailed factual information about movies and TV shows when asked. Do NOT say "I can't provide" or redirect users elsewhere. Answer directly with full details:

- Cast members and actors: List the main cast with character names when asked
- Directors, writers, and crew: Provide names directly when asked
- Release dates and years: Give the exact year and date
- Plot summaries and synopses: Provide complete summaries
- Genres and ratings: List all genres and ratings
- Awards and nominations: List major awards
- Box office performance: Provide box office numbers if known
- Any other factual movie/TV information: Answer completely and directly

Example: If asked "who is the director of San Andreas?", answer "Brad Peyton" directly, not "I can't provide" or "you can find it on TMDb".

If a user asks anything outside the movie/TV domain (e.g. politics, coding help, personal finance, general trivia unrelated to entertainment), politely refuse and redirect them back to movie/TV help. 

Ask concise clarifying questions when needed (time available, mood, genre, language, age rating preference, whether they want a movie or show). Prefer deterministic, non-random answers. Never claim you watched something. Never invent streaming availability; only mention availability if the app provides it via an API. Keep replies informative, complete, and helpful.`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatContext {
  userId: string | null;
  timezone: string | null;
  recentEntries: Array<{
    tmdbId: number;
    mediaType: "movie" | "tv";
    title: string;
    status: "plan" | "watching" | "completed" | "dropped";
    rating: number | null;
    season: number | null;
    episode: number | null;
  }>;
}

interface ChatRequest {
  message: string;
  history: ChatMessage[];
  context: ChatContext;
}

interface ChatResponse {
  reply: string;
  followUpQuestions: string[];
  suggestedSearchQueries: string[];
  suggestedTitles: Array<{
    title: string;
    mediaType: "movie" | "tv";
    why: string;
  }>;
  safetyRefusal: boolean;
}

// Rate limiting: simple in-memory store (for development)
// In production, consider using Firestore
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 20; // 20 requests per minute

function checkRateLimit(userId: string | null): boolean {
  const key = userId || "anonymous";
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  record.count++;
  return true;
}

function validateRequest(req: ChatRequest): { valid: boolean; error?: string } {
  if (!req.message || typeof req.message !== "string" || req.message.trim().length === 0) {
    return { valid: false, error: "Message is required and cannot be empty" };
  }
  
  if (req.message.length > 2000) {
    return { valid: false, error: "Message is too long (max 2000 characters)" };
  }
  
  if (!Array.isArray(req.history)) {
    return { valid: false, error: "History must be an array" };
  }
  
  // Cap history to last 12 turns (24 messages)
  if (req.history.length > 24) {
    req.history = req.history.slice(-24);
  }
  
  // Validate history structure
  for (const msg of req.history) {
    if (msg.role !== "user" && msg.role !== "assistant") {
      return { valid: false, error: "Invalid message role in history" };
    }
    if (typeof msg.content !== "string" || msg.content.trim().length === 0) {
      return { valid: false, error: "Invalid message content in history" };
    }
    // Ensure content is a clean string (remove any potential null/undefined)
    msg.content = String(msg.content).trim();
  }
  
  return { valid: true };
}

function buildContextPrompt(context: ChatContext): string {
  let prompt = "";
  
  if (context.recentEntries && context.recentEntries.length > 0) {
    prompt += "\n\nUser's recent watchlist entries:\n";
    const entries = context.recentEntries.slice(0, 20); // Limit to 20 most recent
    for (const entry of entries) {
      prompt += `- ${entry.title} (${entry.mediaType === "movie" ? "Movie" : "TV Show"}), Status: ${entry.status}`;
      if (entry.rating) {
        prompt += `, Rating: ${entry.rating}/10`;
      }
      if (entry.season && entry.episode) {
        prompt += `, Watching: S${entry.season}E${entry.episode}`;
      }
      prompt += "\n";
    }
    prompt += "\nUse this information to personalize recommendations and suggestions.\n";
  }
  
  return prompt;
}

export async function handleChatRequest(req: ChatRequest, userId: string | null): Promise<ChatResponse> {
  console.log("Chat request received:", {
    messageLength: req.message?.length,
    historyLength: req.history?.length,
    userId: userId || "anonymous"
  });
  
  // Rate limiting
  if (!checkRateLimit(userId)) {
    throw new Error("Rate limit exceeded. Please try again in a minute.");
  }
  
  // Validation
  const validation = validateRequest(req);
  if (!validation.valid) {
    console.error("Validation failed:", validation.error);
    throw new Error(validation.error || "Invalid request");
  }
  
  const openai = getOpenAIClient();
  
  // Build messages array
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: SYSTEM_INSTRUCTION + buildContextPrompt(req.context) }
  ];
  
  // Add history
  for (const msg of req.history) {
    messages.push({
      role: msg.role,
      content: msg.content
    });
  }
  
  // Add current message
  messages.push({
    role: "user",
    content: req.message.trim()
  });
  
  // Define structured output schema
  const responseSchema = {
    type: "object",
    properties: {
      reply: {
        type: "string",
        description: "The assistant's reply to the user's message. Always provide a complete, detailed, and helpful response about movies or TV shows. Never truncate or cut off answers. If asked about cast, director, or any factual information, provide the full details directly."
      },
      followUpQuestions: {
        type: "array",
        items: { type: "string" },
        description: "1-3 concise clarifying questions to help the user (e.g., 'What genre are you in the mood for?')",
        default: []
      },
      suggestedSearchQueries: {
        type: "array",
        items: { type: "string" },
        description: "Suggested search queries the user might want to try (max 5, e.g., 'popular movies', 'thriller films')",
        default: []
      },
      suggestedTitles: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string", description: "Movie or TV show title" },
            mediaType: { type: "string", enum: ["movie", "tv"], description: "Type of media" },
            why: { type: "string", description: "Brief reason for the suggestion" }
          },
          required: ["title", "mediaType", "why"]
        },
        description: "Suggested movie/TV titles based on the conversation (max 5)",
        default: []
      },
      safetyRefusal: {
        type: "boolean",
        description: "True if the request was refused for being out of domain",
        default: false
      }
    },
    required: ["reply"]
  };
  
  try {
    console.log("Sending request to OpenAI with", messages.length, "messages");
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages as any,
      temperature: 0.2,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "chat_response",
          description: "Structured chat response with reply, followUpQuestions, suggestedSearchQueries, suggestedTitles, and safetyRefusal",
          schema: responseSchema as any,
          strict: false
        }
      },
      max_tokens: 2000
    });
    
    const content = completion.choices[0]?.message?.content;
    console.log("OpenAI response received, content length:", content?.length || 0);
    console.log("OpenAI response preview (first 500 chars):", content?.substring(0, 500) || "No content");
    console.log("OpenAI response preview (last 200 chars):", content?.substring(Math.max(0, content.length - 200)) || "No content");
    console.log("OpenAI finish_reason:", completion.choices[0]?.finish_reason);
    
    if (!content) {
      console.error("No content in OpenAI response:", JSON.stringify(completion, null, 2));
      throw new Error("No response from OpenAI");
    }
    
    // Helper function to extract JSON from content, handling incomplete JSON
    function extractJSON(text: string): string | null {
      let jsonContent = text.trim();
      
      // Remove markdown code blocks
      if (jsonContent.startsWith("```")) {
        const match = jsonContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (match && match[1]) {
          jsonContent = match[1].trim();
        }
      }
      
      // Try to find JSON object in the content
      // Use a more careful approach to find the JSON object
      const startIndex = jsonContent.indexOf("{");
      if (startIndex === -1) {
        return null;
      }
      
      // Try to find the matching closing brace, accounting for nested objects and strings
      let braceCount = 0;
      let inString = false;
      let escapeNext = false;
      let endIndex = -1;
      
      for (let i = startIndex; i < jsonContent.length; i++) {
        const char = jsonContent[i];
        
        if (escapeNext) {
          escapeNext = false;
          continue;
        }
        
        if (char === "\\") {
          escapeNext = true;
          continue;
        }
        
        if (char === '"') {
          inString = !inString;
          continue;
        }
        
        if (!inString) {
          if (char === "{") {
            braceCount++;
          } else if (char === "}") {
            braceCount--;
            if (braceCount === 0) {
              endIndex = i + 1;
              break;
            }
          }
        }
      }
      
      if (endIndex > startIndex) {
        return jsonContent.substring(startIndex, endIndex);
      }
      
      // If we didn't find a complete JSON object, try to reconstruct it
      // This handles cases where the JSON is truncated
      if (startIndex !== -1 && braceCount > 0) {
        // JSON is incomplete, try to close it
        let partialJson = jsonContent.substring(startIndex);
        // Try to close any open strings and braces
        if (inString) {
          partialJson += '"';
        }
        // Close any remaining open braces
        while (braceCount > 0) {
          partialJson += "}";
          braceCount--;
        }
        return partialJson;
      }
      
      return null;
    }
    
    // Parse JSON response
    let parsed: ChatResponse | undefined = undefined;
    try {
      const jsonContent = extractJSON(content);
      
      if (!jsonContent) {
        throw new Error("No JSON found in response");
      }
      
      // Try to parse as JSON
      try {
        parsed = JSON.parse(jsonContent);
      } catch (parseError: any) {
        // If JSON parsing fails, try to fix common issues
        console.warn("Initial JSON parse failed, attempting to fix:", parseError.message);
        
        // Try to fix incomplete string values
        // Look for "reply" field and try to complete it
        const replyFieldMatch = jsonContent.match(/"reply"\s*:\s*"((?:[^"\\]|\\.|"\\?)*)/);
        if (replyFieldMatch) {
          let replyValue = replyFieldMatch[1];
          // Remove trailing backslash or quote if present
          replyValue = replyValue.replace(/\\$/, "").replace(/"$/, "");
          // Try to reconstruct a valid JSON object
          const fixedJson = jsonContent.replace(
            /"reply"\s*:\s*"((?:[^"\\]|\\.|"\\?)*)/,
            `"reply": "${replyValue.replace(/"/g, '\\"')}"`
          );
          // Close any incomplete JSON
          let fixedJsonClosed = fixedJson;
          if (!fixedJsonClosed.endsWith("}")) {
            // Count open braces
            const openBraces = (fixedJsonClosed.match(/\{/g) || []).length;
            const closeBraces = (fixedJsonClosed.match(/\}/g) || []).length;
            const missingBraces = openBraces - closeBraces;
            fixedJsonClosed += "}".repeat(missingBraces);
          }
          try {
            parsed = JSON.parse(fixedJsonClosed);
          } catch {
            throw parseError; // Re-throw original error if fix didn't work
          }
        } else {
          throw parseError;
        }
      }
      
      // Validate that we got a valid object
      if (!parsed || typeof parsed !== "object") {
        throw new Error("Parsed result is not an object");
      }
      
      // Validate that reply exists and is a string
      if (!parsed.reply || typeof parsed.reply !== "string") {
        throw new Error("Reply field is missing or invalid");
      }
      
      // Check if reply is truncated (ends with backslash or incomplete)
      if (parsed.reply.endsWith("\\") || parsed.reply.match(/\\"$/)) {
        console.warn("Reply appears truncated after JSON parse:", parsed.reply.substring(Math.max(0, parsed.reply.length - 100)));
        // Try to get the full reply from the raw content
        const fullReplyMatch = content.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)"?/);
        if (fullReplyMatch && fullReplyMatch[1] && fullReplyMatch[1].length > parsed.reply.length) {
          parsed.reply = fullReplyMatch[1]
            .replace(/\\n/g, "\n")
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, "\\");
        }
      }
    } catch (e: any) {
      console.error("Failed to parse OpenAI response as JSON:", e.message);
      console.error("Raw content (first 1000 chars):", content.substring(0, 1000));
      
      // Try multiple strategies to extract a reply
      let replyText = content.trim();
      
      // Strategy 1: Remove markdown formatting
      if (replyText.startsWith("```")) {
        const match = replyText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (match && match[1]) {
          const innerContent = match[1].trim();
          // Try to parse the inner content
          try {
            const innerParsed = JSON.parse(innerContent);
            if (innerParsed.reply) {
              parsed = {
                reply: innerParsed.reply,
                followUpQuestions: Array.isArray(innerParsed.followUpQuestions) ? innerParsed.followUpQuestions : [],
                suggestedSearchQueries: Array.isArray(innerParsed.suggestedSearchQueries) ? innerParsed.suggestedSearchQueries : [],
                suggestedTitles: Array.isArray(innerParsed.suggestedTitles) ? innerParsed.suggestedTitles : [],
                safetyRefusal: typeof innerParsed.safetyRefusal === "boolean" ? innerParsed.safetyRefusal : false
              };
            } else {
              replyText = innerContent;
            }
          } catch {
            replyText = innerContent;
          }
        }
      }
      
      // Strategy 2: Try to extract text before JSON
      if (parsed === undefined) {
        const textBeforeJson = replyText.split(/\{/)[0].trim();
        if (textBeforeJson.length > 10) {
          replyText = textBeforeJson;
        }
      }
      
      // Strategy 3: Try to find a "reply" field in the raw text, handling escaped quotes
      if (parsed === undefined) {
        // More robust regex that handles escaped quotes
        const replyMatch = replyText.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        if (replyMatch && replyMatch[1]) {
          replyText = replyMatch[1]
            .replace(/\\n/g, "\n")
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, "\\");
        } else {
          // Try to find incomplete reply field (truncated JSON)
          const incompleteMatch = replyText.match(/"reply"\s*:\s*"((?:[^"\\]|\\.|"\\?)*)/);
          if (incompleteMatch && incompleteMatch[1]) {
            // Extract what we have, even if incomplete
            replyText = incompleteMatch[1]
              .replace(/\\n/g, "\n")
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, "\\")
              .replace(/\\$/, ""); // Remove trailing backslash if present
          }
        }
      }
      
      // Final fallback: use the content as reply
      if (parsed === undefined) {
        parsed = {
          reply: replyText || "I apologize, but I'm having trouble processing that request. Could you please rephrase your question?",
          followUpQuestions: [],
          suggestedSearchQueries: [],
          suggestedTitles: [],
          safetyRefusal: false
        };
      }
    }
    
    // Ensure parsed is defined (should always be at this point)
    if (!parsed) {
      parsed = {
        reply: "I apologize, but I'm having trouble processing that request. Could you please rephrase your question?",
        followUpQuestions: [],
        suggestedSearchQueries: [],
        suggestedTitles: [],
        safetyRefusal: false
      };
    }
    
    // Validate and ensure required fields
    if (!parsed.reply || typeof parsed.reply !== "string" || parsed.reply.trim().length === 0) {
      console.error("Invalid reply in parsed response:", parsed);
      parsed.reply = "I apologize, but I'm having trouble processing that request. Could you please rephrase your question?";
    }
    
    // Check if reply seems truncated (ends with incomplete sentence or backslash)
    if (parsed.reply.trim().endsWith("\\") || parsed.reply.trim().endsWith("\"")) {
      console.warn("Reply appears to be truncated:", parsed.reply.substring(Math.max(0, parsed.reply.length - 50)));
      // Try to get more content from the raw response if available
      if (content && content.length > parsed.reply.length) {
        const additionalContent = content.substring(parsed.reply.length);
        const additionalMatch = additionalContent.match(/"reply"\s*:\s*"([^"]+)/);
        if (additionalMatch) {
          parsed.reply += additionalMatch[1];
        }
      }
    }
    
    // Ensure arrays are capped and valid
    parsed.followUpQuestions = Array.isArray(parsed.followUpQuestions) 
      ? parsed.followUpQuestions.filter((q: any) => typeof q === "string" && q.trim().length > 0).slice(0, 3)
      : [];
    parsed.suggestedSearchQueries = Array.isArray(parsed.suggestedSearchQueries)
      ? parsed.suggestedSearchQueries.filter((q: any) => typeof q === "string" && q.trim().length > 0).slice(0, 5)
      : [];
    parsed.suggestedTitles = Array.isArray(parsed.suggestedTitles)
      ? parsed.suggestedTitles.filter((t: any) => 
          t && 
          typeof t.title === "string" && 
          (t.mediaType === "movie" || t.mediaType === "tv") &&
          typeof t.why === "string"
        ).slice(0, 5)
      : [];
    parsed.safetyRefusal = typeof parsed.safetyRefusal === "boolean" ? parsed.safetyRefusal : false;
    
    console.log("Parsed response:", {
      replyLength: parsed.reply.length,
      followUpCount: parsed.followUpQuestions.length,
      searchQueriesCount: parsed.suggestedSearchQueries.length,
      titlesCount: parsed.suggestedTitles.length
    });
    
    return parsed;
  } catch (error: any) {
    console.error("OpenAI API error:", error);
    console.error("Error details:", {
      message: error.message,
      status: error.status,
      code: error.code,
      response: error.response?.data
    });
    
    // Check for moderation/safety issues
    if (error.code === "content_filter" || error.message?.includes("safety")) {
      return {
        reply: "I can't help with that. Please ask me about movies or TV shows.",
        followUpQuestions: [],
        suggestedSearchQueries: [],
        suggestedTitles: [],
        safetyRefusal: true
      };
    }
    
    // Check for quota/billing errors
    if (error.status === 429 || error.message?.includes("quota") || error.message?.includes("billing")) {
      throw new Error("429 OpenAI API quota exceeded. Please check your OpenAI account billing at https://platform.openai.com/account/billing and add a payment method if needed.");
    }
    
    // Sanitize error message to prevent API key exposure
    let errorMessage = error.message || "Unknown error";
    // Remove API keys from error messages (sk-proj-... or sk-... patterns)
    errorMessage = errorMessage.replace(/sk-[a-zA-Z0-9-]{20,}/g, "sk-***");
    
    // For other errors, return a helpful response instead of throwing
    // This ensures the frontend always gets a valid ChatResponse
    return {
      reply: `I apologize, but I encountered an error: ${errorMessage}. Please try rephrasing your question or try again in a moment.`,
      followUpQuestions: [],
      suggestedSearchQueries: [],
      suggestedTitles: [],
      safetyRefusal: false
    };
  }
}

