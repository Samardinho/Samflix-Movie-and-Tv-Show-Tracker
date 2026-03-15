import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import cors from "cors";
import express, { Request, Response } from "express";
import { getMovieDetails, getTvDetails, searchMulti, getMovieExternalIds, getTvExternalIds, getMovieWatchProviders, getTvWatchProviders } from "./tmdb";
import { getOmdbRatings } from "./rottenTomatoes";
import { handleChatRequest } from "./chat";

admin.initializeApp();

const app = express();

const corsMiddleware = cors({
  origin: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
});

app.use(corsMiddleware);
app.use(express.json());

app.get("/search", async (req: Request, res: Response) => {
  const query = (req.query.query as string | undefined) ?? "";
  if (!query.trim()) {
    return res.status(400).json({ error: "Missing query parameter" });
  }

  try {
    const data = await searchMulti(query);
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch search results" });
  }
});

app.get("/movie/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "Missing movie id" });
  }

  try {
    const [movie, externalIds] = await Promise.all([
      getMovieDetails(id),
      getMovieExternalIds(id).catch((err) => {
        console.warn("Failed to get external IDs:", err);
        return null;
      })
    ]);

    // Fetch OMDb ratings if we have IMDB ID
    let omdbRatings = null;
    if (externalIds?.imdb_id) {
      console.log(`Fetching ratings for IMDB ID: ${externalIds.imdb_id}`);
      omdbRatings = await getOmdbRatings(externalIds.imdb_id);
      console.log("OMDb ratings result:", omdbRatings);
    }

    return res.json({
      ...movie,
      omdbRatings
    });
  } catch (error) {
    console.error("Error fetching movie details:", error);
    return res.status(500).json({ error: "Failed to fetch movie details" });
  }
});

app.get("/tv/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "Missing tv id" });
  }

  try {
    const [tv, externalIds] = await Promise.all([
      getTvDetails(id),
      getTvExternalIds(id).catch((err) => {
        console.warn("Failed to get external IDs:", err);
        return null;
      })
    ]);

    // Fetch OMDb ratings if we have IMDB ID
    let omdbRatings = null;
    if (externalIds?.imdb_id) {
      console.log(`Fetching ratings for IMDB ID: ${externalIds.imdb_id}`);
      omdbRatings = await getOmdbRatings(externalIds.imdb_id);
      console.log("OMDb ratings result:", omdbRatings);
    }

    return res.json({
      ...tv,
      omdbRatings
    });
  } catch (error) {
    console.error("Error fetching TV details:", error);
    return res.status(500).json({ error: "Failed to fetch tv details" });
  }
});

app.get("/movie/:id/videos", async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "Missing movie id" });
  }

  try {
    const { getMovieVideos } = await import("./tmdb");
    const data = await getMovieVideos(id);
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch movie videos" });
  }
});

app.get("/tv/:id/videos", async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "Missing tv id" });
  }

  try {
    const { getTvVideos } = await import("./tmdb");
    const data = await getTvVideos(id);
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch tv videos" });
  }
});

app.get("/trending/movies", async (req: Request, res: Response) => {
  try {
    const { getTrendingMovies } = await import("./tmdb");
    const data = await getTrendingMovies();
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch trending movies" });
  }
});

app.get("/trending/tv", async (req: Request, res: Response) => {
  try {
    const { getTrendingTv } = await import("./tmdb");
    const data = await getTrendingTv();
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch trending TV shows" });
  }
});

app.get("/popular/movies", async (req: Request, res: Response) => {
  try {
    const { getPopularMovies } = await import("./tmdb");
    const data = await getPopularMovies();
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch popular movies" });
  }
});

app.get("/popular/tv", async (req: Request, res: Response) => {
  try {
    const { getPopularTv } = await import("./tmdb");
    const data = await getPopularTv();
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch popular TV shows" });
  }
});

app.get("/top-rated/movies", async (req: Request, res: Response) => {
  try {
    const { getTopRatedMovies } = await import("./tmdb");
    const data = await getTopRatedMovies();
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch top-rated movies" });
  }
});

app.get("/top-rated/tv", async (req: Request, res: Response) => {
  try {
    const { getTopRatedTv } = await import("./tmdb");
    const data = await getTopRatedTv();
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch top-rated TV shows" });
  }
});

app.get("/movie/:id/watch-providers", async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "Missing movie id" });
  }

  try {
    const data = await getMovieWatchProviders(id);
    console.log(`Successfully fetched watch providers for movie ${id}`);
    return res.json(data);
  } catch (error: any) {
    console.error("Error fetching movie watch providers:", error);
    const errorMessage = error.response?.data?.status_message || error.message || "Failed to fetch movie watch providers";
    return res.status(500).json({ 
      error: errorMessage,
      details: error.response?.data || undefined
    });
  }
});

app.get("/tv/:id/watch-providers", async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "Missing tv id" });
  }

  try {
    const data = await getTvWatchProviders(id);
    console.log(`Successfully fetched watch providers for TV ${id}`);
    return res.json(data);
  } catch (error: any) {
    console.error("Error fetching TV watch providers:", error);
    const errorMessage = error.response?.data?.status_message || error.message || "Failed to fetch TV watch providers";
    return res.status(500).json({ 
      error: errorMessage,
      details: error.response?.data || undefined
    });
  }
});


app.post("/chat", async (req: Request, res: Response) => {
  try {
    const { message, history, context } = req.body;
    
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }
    
    // Extract userId from Authorization header or context
    let userId: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split("Bearer ")[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        userId = decodedToken.uid;
      } catch (error) {
        // If token verification fails, continue without userId (anonymous user)
        console.warn("Token verification failed:", error);
      }
    }
    
    // If userId is in context, use it (fallback)
    if (!userId && context?.userId) {
      userId = context.userId;
    }
    
    // Fetch recent entries from Firestore if userId is available
    let recentEntries: any[] = [];
    if (userId) {
      try {
        const entriesRef = admin.firestore()
          .collection("users")
          .doc(userId)
          .collection("entries");
        
        const snapshot = await entriesRef
          .orderBy("updatedAt", "desc")
          .limit(20)
          .get();
        
        recentEntries = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            tmdbId: data.tmdbId,
            mediaType: data.mediaType,
            title: data.title,
            status: data.status || "plan",
            rating: data.rating || null,
            season: data.season || null,
            episode: data.episode || null
          };
        });
      } catch (error) {
        console.warn("Failed to fetch user entries:", error);
        // Continue without entries
      }
    }
    
    // Build context
    const chatContext = {
      userId: userId,
      timezone: context?.timezone || null,
      recentEntries: recentEntries
    };
    
    // Handle chat request
    try {
      const response = await handleChatRequest(
        {
          message,
          history: history || [],
          context: chatContext
        },
        userId
      );
      
      return res.json(response);
    } catch (chatError: any) {
      console.error("Chat request error:", chatError);
      // Sanitize error message to prevent API key exposure
      let errorMessage = chatError.message || "Failed to process chat request";
      errorMessage = errorMessage.replace(/sk-[a-zA-Z0-9-]{20,}/g, "sk-***");
      
      // Return a proper error response that the frontend can handle
      return res.status(500).json({ 
        error: errorMessage,
        reply: errorMessage.includes("quota") || errorMessage.includes("billing") 
          ? "I'm sorry, there's an issue with the AI service. Please check your OpenAI account billing."
          : "I'm sorry, I encountered an error. Please try again.",
        followUpQuestions: [],
        suggestedSearchQueries: [],
        suggestedTitles: [],
        safetyRefusal: false
      });
    }
  } catch (error: any) {
    console.error("Chat endpoint error:", error);
    // Sanitize error message to prevent API key exposure
    let errorMessage = error.message || "Failed to process chat request";
    errorMessage = errorMessage.replace(/sk-[a-zA-Z0-9-]{20,}/g, "sk-***");
    
    return res.status(500).json({ 
      error: errorMessage,
      reply: "I'm sorry, I encountered an error. Please try again.",
      followUpQuestions: [],
      suggestedSearchQueries: [],
      suggestedTitles: [],
      safetyRefusal: false
    });
  }
});

export const api = functions.https.onRequest(app);


