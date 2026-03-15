import { useState, useEffect } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
  onRandomPick?: () => void;
  isRandomPicking?: boolean;
}

export function SearchBar({
  onSearch,
  placeholder = "Search movies and TV shows...",
  debounceMs = 500,
  onRandomPick,
  isRandomPicking = false
}: SearchBarProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs, onSearch]);

  return (
    <div className="w-full relative group flex items-center gap-3">
      <div className="flex-1 relative">
        <div className="absolute left-4 sm:left-6 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors z-10">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-12 sm:pl-16 pr-12 sm:pr-14 py-4 sm:py-5 md:py-6 rounded-xl sm:rounded-2xl border-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-500/30 dark:focus:ring-blue-400/30 text-base sm:text-lg md:text-xl font-medium transition-all shadow-lg hover:shadow-xl"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all"
            aria-label="Clear search"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      {onRandomPick && (
        <button
          onClick={onRandomPick}
          disabled={isRandomPicking}
          className="px-4 sm:px-5 py-4 sm:py-5 md:px-6 md:py-6 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 dark:from-blue-500 dark:to-emerald-500 dark:hover:from-blue-600 dark:hover:to-emerald-600 text-white rounded-xl sm:rounded-2xl font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
          aria-label="Pick for me"
          title="Get a random recommendation"
        >
          {isRandomPicking ? (
            <>
              <svg className="w-5 h-5 md:w-6 md:h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="hidden sm:inline">Picking...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden sm:inline">Pick for me</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
