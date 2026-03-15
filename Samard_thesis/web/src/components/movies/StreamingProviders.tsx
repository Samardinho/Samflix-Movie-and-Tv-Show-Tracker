import { useQuery } from "@tanstack/react-query";
import { getMovieWatchProviders, getTvWatchProviders } from "../../lib/apiClient";
import { Loader } from "../common/Loader";
import type { TmdbWatchProvidersResponse, TmdbWatchProvider } from "../../types/tmdb";

interface StreamingProvidersProps {
  mediaType: "movie" | "tv";
  mediaId: number;
  title?: string; // Movie/TV show title for better search URLs
}

// Get user's country code (default to US)
function getUserCountryCode(): string {
  // Try to get from browser locale
  try {
    const locale = navigator.language || navigator.languages?.[0] || "en-US";
    const countryCode = locale.split("-")[1]?.toUpperCase() || "US";
    return countryCode;
  } catch {
    return "US";
  }
}

// Common streaming provider names for better display
const providerNames: Record<string, string> = {
  "Netflix": "Netflix",
  "Disney Plus": "Disney+",
  "HBO Max": "Max",
  "Amazon Prime Video": "Prime Video",
  "Apple TV Plus": "Apple TV+",
  "Paramount Plus": "Paramount+",
  "Hulu": "Hulu",
  "Peacock": "Peacock",
  "Crunchyroll": "Crunchyroll",
  "YouTube Premium": "YouTube Premium",
  "YouTube": "YouTube",
  "Google Play Movies": "Google Play",
  "Apple TV": "Apple TV",
  "Vudu": "Vudu",
  "Microsoft Store": "Microsoft",
  "Redbox": "Redbox",
  "AMC on Demand": "AMC+",
  "AMC+": "AMC+",
  "fuboTV": "fuboTV",
  "Tubi": "Tubi",
  "Pluto TV": "Pluto TV",
  "The Roku Channel": "Roku Channel",
  "Crackle": "Crackle",
  "Plex": "Plex",
  "Freevee": "Freevee",
  "Kanopy": "Kanopy",
  "Shudder": "Shudder",
  "Showtime": "Showtime",
  "Starz": "Starz",
  "Cinemax": "Cinemax",
  "Epix": "Epix",
  "MGM Plus": "MGM+",
  "BET Plus": "BET+",
  "Paramount+": "Paramount+",
  "Discovery Plus": "Discovery+",
  "ESPN Plus": "ESPN+",
  "Peacock Premium": "Peacock",
  "HBO": "Max",
  "Max": "Max"
};

// Helper function to add cache-busting parameter to URLs
function addCacheBuster(url: string): string {
  // Add a timestamp-based cache buster to force fresh content
  const separator = url.includes("?") ? "&" : "?";
  const timestamp = Date.now();
  return `${url}${separator}_t=${timestamp}`;
}

// Provider URL mapping - creates direct links to provider websites
function getProviderUrl(providerName: string, title?: string): string {
  const searchQuery = title ? encodeURIComponent(title) : "";
  const providerLower = providerName.toLowerCase();
  
  // Map provider names to their search/browse URLs
  const providerUrlMap: Record<string, string> = {
    "netflix": title 
      ? `https://www.netflix.com/search?q=${searchQuery}`
      : "https://www.netflix.com",
    "disney plus": "https://www.disneyplus.com",
    "disney+": "https://www.disneyplus.com",
    "hbo max": "https://www.max.com",
    "max": "https://www.max.com",
    "amazon prime video": title
      ? `https://www.amazon.com/s?k=${searchQuery}&i=prime-instant-video`
      : "https://www.amazon.com/Prime-Video/b?node=2676882011",
    "prime video": title
      ? `https://www.amazon.com/s?k=${searchQuery}&i=prime-instant-video`
      : "https://www.amazon.com/Prime-Video/b?node=2676882011",
    "apple tv plus": "https://tv.apple.com",
    "apple tv+": "https://tv.apple.com",
    "apple tv": title
      ? `https://tv.apple.com/search?term=${searchQuery}`
      : "https://tv.apple.com",
    "paramount plus": "https://www.paramountplus.com",
    "paramount+": "https://www.paramountplus.com",
    "hulu": title
      ? `https://www.hulu.com/search?q=${searchQuery}`
      : "https://www.hulu.com",
    "peacock": "https://www.peacocktv.com",
    "crunchyroll": "https://www.crunchyroll.com",
    "youtube premium": "https://www.youtube.com/premium",
    "youtube": title
      ? `https://www.youtube.com/results?search_query=${searchQuery}`
      : "https://www.youtube.com",
    "google play movies": title
      ? `https://play.google.com/store/search?q=${searchQuery}&c=movies`
      : "https://play.google.com/store/movies",
    "vudu": title
      ? `https://www.vudu.com/content/search/${searchQuery}`
      : "https://www.vudu.com",
    "microsoft store": title
      ? `https://www.microsoft.com/en-us/store/search/movies?q=${searchQuery}`
      : "https://www.microsoft.com/en-us/store/movies-and-tv",
    "redbox": "https://www.redbox.com",
    "amc+": "https://www.amcplus.com",
    "fubotv": "https://www.fubo.tv",
    "tubi": title
      ? `https://tubitv.com/search/${searchQuery}`
      : "https://tubitv.com",
    "pluto tv": "https://pluto.tv",
    "the roku channel": "https://therokuchannel.roku.com",
    "crackle": "https://www.crackle.com",
    "plex": "https://www.plex.tv",
    "freevee": "https://www.amazon.com/Freevee/b?node=2676882011",
    "kanopy": "https://www.kanopy.com",
    "shudder": "https://www.shudder.com",
    "showtime": "https://www.sho.com",
    "starz": "https://www.starz.com",
    "cinemax": "https://www.cinemax.com",
    "epix": "https://www.epix.com",
    "mgm plus": "https://www.mgmplus.com",
    "mgm+": "https://www.mgmplus.com",
    "bet plus": "https://www.betplus.com",
    "bet+": "https://www.betplus.com",
    "discovery plus": "https://www.discoveryplus.com",
    "discovery+": "https://www.discoveryplus.com",
    "espn plus": "https://www.espn.com/watch/espnplus",
    "espn+": "https://www.espn.com/watch/espnplus",
  };

  // Try exact match first
  if (providerUrlMap[providerLower]) {
    return addCacheBuster(providerUrlMap[providerLower]);
  }

  // Try partial matches
  for (const [key, url] of Object.entries(providerUrlMap)) {
    if (providerLower.includes(key) || key.includes(providerLower)) {
      return addCacheBuster(url);
    }
  }

  // Fallback: Google search for the provider
  const fallbackUrl = `https://www.google.com/search?q=${encodeURIComponent(providerName + (title ? ` ${title}` : ""))}`;
  return addCacheBuster(fallbackUrl);
}

function ProviderCard({ 
  provider, 
  type,
  title
}: { 
  provider: TmdbWatchProvider; 
  type: string;
  title?: string;
}) {
  const logoUrl = provider.logo_path
    ? `https://image.tmdb.org/t/p/w92${provider.logo_path}`
    : null;
  
  const displayName = providerNames[provider.provider_name] || provider.provider_name;
  const providerUrl = getProviderUrl(provider.provider_name, title);

  return (
    <a
      href={providerUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all shadow-sm hover:shadow-lg group cursor-pointer"
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={provider.provider_name}
          className="w-14 h-14 object-contain rounded flex-shrink-0"
          loading="lazy"
        />
      ) : (
        <div className="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
            {displayName.substring(0, 2).toUpperCase()}
          </span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {displayName}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize mb-1">
          {type}
        </p>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:gap-2 transition-all">
          Watch Now
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </a>
  );
}

function ProviderSection({ 
  title, 
  providers, 
  type,
  mediaTitle
}: { 
  title: string; 
  providers: TmdbWatchProvider[]; 
  type: string;
  mediaTitle?: string;
}) {
  if (!providers || providers.length === 0) return null;

  return (
    <div className="mb-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
        {title}
        <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
          ({providers.length})
        </span>
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {providers.map((provider) => (
          <ProviderCard 
            key={provider.provider_id} 
            provider={provider} 
            type={type}
            title={mediaTitle}
          />
        ))}
      </div>
    </div>
  );
}

export function StreamingProviders({ mediaType, mediaId, title }: StreamingProvidersProps) {
  const countryCode = getUserCountryCode();

  const { data, isLoading, error } = useQuery({
    queryKey: ["watch-providers", mediaType, mediaId],
    queryFn: () =>
      mediaType === "movie"
        ? getMovieWatchProviders(mediaId)
        : getTvWatchProviders(mediaId),
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader />
      </div>
    );
  }

  if (error) {
    console.error("Error fetching watch providers:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Show error message with more details
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Unknown error occurred";
    
    return (
      <div className="bg-gradient-to-br from-blue-50 to-emerald-50 dark:from-blue-900/20 dark:to-emerald-900/20 p-6 rounded-2xl shadow-lg border border-blue-100 dark:border-blue-800">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Where to Watch
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          Unable to load streaming information at this time.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            Error: {errorMessage}
          </p>
        )}
      </div>
    );
  }

  if (!data) {
    return null; // No data available
  }

  // Helper function to filter out duplicate providers (prefer regular over "with Ads")
  const filterDuplicateProviders = (providers: TmdbWatchProvider[]): TmdbWatchProvider[] => {
    if (!providers || providers.length === 0) return [];
    
    const seen = new Map<string, TmdbWatchProvider>();
    
    // First pass: collect all providers
    for (const provider of providers) {
      const baseName = provider.provider_name.toLowerCase();
      const isAdsVersion = baseName.includes("with ads") || 
                          baseName.includes(" ads") ||
                          baseName.includes("standard with ads");
      
      // Extract base provider name (remove "with ads", "standard", etc.)
      let baseProviderName = baseName
        .replace(/\s+standard\s+with\s+ads?/gi, "")
        .replace(/\s+with\s+ads?/gi, "")
        .replace(/\s+ads?$/gi, "")
        .replace(/\s+premium/gi, "")
        .replace(/\s+basic/gi, "")
        .trim();
      
      // Normalize common provider names for better matching
      if (baseProviderName.startsWith("netflix")) {
        baseProviderName = "netflix";
      } else if (baseProviderName.includes("amazon prime")) {
        baseProviderName = "amazon prime video";
      } else if (baseProviderName.includes("hbo max") || baseProviderName === "max") {
        baseProviderName = "hbo max";
      }
      
      // Check if we already have this provider
      const existing = seen.get(baseProviderName);
      
      if (!existing) {
        // First time seeing this provider
        seen.set(baseProviderName, provider);
      } else {
        // We have a duplicate - prefer the one without "ads" in the name
        const existingIsAds = existing.provider_name.toLowerCase().includes("ads");
        
        if (isAdsVersion && !existingIsAds) {
          // Keep the existing non-ads version, skip this ads version
          continue;
        } else if (!isAdsVersion && existingIsAds) {
          // Replace ads version with non-ads version
          seen.set(baseProviderName, provider);
        } else if (!isAdsVersion && !existingIsAds) {
          // Both are non-ads, keep the one with better (lower) display priority
          if (provider.display_priority < existing.display_priority) {
            seen.set(baseProviderName, provider);
          }
        } else {
          // Both are ads versions, keep the one with better display priority
          if (provider.display_priority < existing.display_priority) {
            seen.set(baseProviderName, provider);
          }
        }
      }
    }
    
    return Array.from(seen.values());
  };

  // Get providers for user's country, fallback to US
  const countryProviders = data.results[countryCode] || data.results["US"] || null;

  if (!countryProviders) {
    // Show message if no providers available
    return (
      <div className="bg-gradient-to-br from-blue-50 to-emerald-50 dark:from-blue-900/20 dark:to-emerald-900/20 p-6 rounded-2xl shadow-lg border border-blue-100 dark:border-blue-800">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Where to Watch
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          No streaming providers available for this title in your region.
        </p>
      </div>
    );
  }

  const hasAnyProviders =
    (countryProviders.flatrate && countryProviders.flatrate.length > 0) ||
    (countryProviders.free && countryProviders.free.length > 0);

  if (!hasAnyProviders) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-emerald-50 dark:from-blue-900/20 dark:to-emerald-900/20 p-6 rounded-2xl shadow-lg border border-blue-100 dark:border-blue-800">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Where to Watch
        </h2>
        {countryProviders.link && (
          <a
            href={addCacheBuster(countryProviders.link)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold flex items-center gap-1 transition-colors"
          >
            View All Options
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>

      <div className="space-y-6">
        {countryProviders.flatrate && countryProviders.flatrate.length > 0 && (
          <ProviderSection
            title="Stream"
            providers={filterDuplicateProviders(countryProviders.flatrate)}
            type="Subscription"
            mediaTitle={title}
          />
        )}
        {countryProviders.free && countryProviders.free.length > 0 && (
          <ProviderSection
            title="Free"
            providers={filterDuplicateProviders(countryProviders.free)}
            type="Free"
            mediaTitle={title}
          />
        )}
      </div>

      {countryCode !== "US" && (
        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
          Showing providers for {countryCode}. 
          {data.results["US"] && (
            <span className="ml-1">
              <a
                href={countryProviders.link ? addCacheBuster(countryProviders.link) : "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                View US options
              </a>
            </span>
          )}
        </p>
      )}
    </div>
  );
}



