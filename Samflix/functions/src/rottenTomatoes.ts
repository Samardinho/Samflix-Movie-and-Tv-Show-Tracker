import axios from "axios";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

// Load environment variables
const possiblePaths = [
  path.join(__dirname, "../.env"),
  path.join(process.cwd(), "functions/.env"),
  path.join(process.cwd(), ".env"),
  ".env"
];

for (const envPath of possiblePaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

export interface OmdbRatings {
  imdbRating?: number | null;
  imdbVotes?: string | null;
  metascore?: number | null;
}

/**
 * Get OMDb ratings (IMDb rating, Metascore, etc.)
 */
export async function getOmdbRatings(imdbId: string): Promise<OmdbRatings | null> {
  if (!imdbId) {
    return null;
  }

  const normalizedImdbId = imdbId.startsWith('tt') ? imdbId : `tt${imdbId}`;
  const omdbApiKey = process.env.OMDB_API_KEY;
  
  if (!omdbApiKey) {
    return null;
  }

  try {
    const response = await axios.get(`http://www.omdbapi.com/`, {
      params: {
        i: normalizedImdbId,
        apikey: omdbApiKey
      },
      timeout: 10000
    });
    
    if (response.data && response.data.Response !== "False") {
      const data = response.data;
      
      let imdbRating = null;
      let metascore = null;
      
      if (data.imdbRating && data.imdbRating !== "N/A" && data.imdbRating !== "") {
        const parsed = Number(data.imdbRating);
        if (!isNaN(parsed)) imdbRating = parsed;
      }
      
      if (data.Metascore && data.Metascore !== "N/A" && data.Metascore !== "") {
        const parsed = Number(data.Metascore);
        if (!isNaN(parsed)) metascore = parsed;
      }
      
      if (imdbRating !== null || metascore !== null) {
        return {
          imdbRating,
          imdbVotes: data.imdbVotes || null,
          metascore
        };
      }
    }
  } catch (error: any) {
    console.warn(`OMDb ratings fetch failed:`, error.message);
  }
  
  return null;
}


