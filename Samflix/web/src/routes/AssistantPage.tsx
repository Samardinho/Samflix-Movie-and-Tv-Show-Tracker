import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useUserEntries } from "../hooks/useUserEntries";
import { sendChatMessage, type ChatMessage, type ChatContext } from "../lib/chatClient";
import { Loader } from "../components/common/Loader";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { searchMulti } from "../lib/apiClient";

interface Message extends ChatMessage {
  id: string;
  createdAt: Date;
  followUpQuestions?: string[];
  suggestedSearchQueries?: string[];
  suggestedTitles?: Array<{
    title: string;
    mediaType: "movie" | "tv";
    why: string;
  }>;
}

export function AssistantPage() {
  const { user } = useAuth();
  const { entries, upsertEntry } = useUserEntries();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [showClearChatConfirm, setShowClearChatConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Load chat history from localStorage
  useEffect(() => {
    if (user?.uid) {
      const saved = localStorage.getItem(`chat_history_${user.uid}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Validate and filter messages
          const validMessages = parsed
            .filter((msg: any) => 
              msg &&
              (msg.role === "user" || msg.role === "assistant") &&
              typeof msg.content === "string" &&
              msg.content.trim().length > 0
            )
            .map((msg: any) => ({
              id: msg.id || Date.now().toString(),
              role: msg.role as "user" | "assistant",
              content: String(msg.content).trim(),
              createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
              followUpQuestions: Array.isArray(msg.followUpQuestions) ? msg.followUpQuestions : undefined,
              suggestedSearchQueries: Array.isArray(msg.suggestedSearchQueries) ? msg.suggestedSearchQueries : undefined,
              suggestedTitles: Array.isArray(msg.suggestedTitles) ? msg.suggestedTitles : undefined
            }));
          setMessages(validMessages);
        } catch (e) {
          console.error("Failed to load chat history:", e);
          // Clear corrupted history
          localStorage.removeItem(`chat_history_${user.uid}`);
        }
      }
    }
  }, [user?.uid]);

  // Save chat history to localStorage
  useEffect(() => {
    if (user?.uid && messages.length > 0) {
      try {
        // Only save valid messages
        const validMessages = messages
          .filter(msg => 
            msg &&
            (msg.role === "user" || msg.role === "assistant") &&
            typeof msg.content === "string" &&
            msg.content.trim().length > 0
          )
          .map(msg => ({
            id: msg.id,
            role: msg.role,
            content: String(msg.content).trim(),
            createdAt: msg.createdAt.toISOString(),
            followUpQuestions: msg.followUpQuestions,
            suggestedSearchQueries: msg.suggestedSearchQueries,
            suggestedTitles: msg.suggestedTitles
          }));
        
        localStorage.setItem(
          `chat_history_${user.uid}`,
          JSON.stringify(validMessages)
        );
      } catch (e) {
        console.error("Failed to save chat history:", e);
      }
    }
  }, [messages, user?.uid]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const buildContext = (): ChatContext => {
    // Get last 20 entries sorted by updatedAt
    const recentEntries = entries
      .slice(0, 20)
      .map(entry => ({
        tmdbId: entry.tmdbId,
        mediaType: entry.mediaType,
        title: entry.title,
        status: entry.status,
        rating: entry.rating,
        season: entry.season,
        episode: entry.episode
      }));

    return {
      userId: user?.uid || null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      recentEntries
    };
  };

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      // Filter and validate history messages
      const history: ChatMessage[] = messages
        .filter(msg => 
          msg &&
          (msg.role === "user" || msg.role === "assistant") &&
          typeof msg.content === "string" &&
          msg.content.trim().length > 0
        )
        .map(msg => ({
          role: msg.role as "user" | "assistant",
          content: String(msg.content).trim()
        }))
        .slice(-24); // Limit to last 24 messages (12 turns)

      const context = buildContext();

      return await sendChatMessage({
        message: message.trim(),
        history,
        context
      });
    }
  });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || chatMutation.isPending) return;

    const messageText = inputValue.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      createdAt: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");

    try {
      const response = await chatMutation.mutateAsync(messageText);

      if (!response || !response.reply) {
        throw new Error("Received empty response from assistant");
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.reply,
        createdAt: new Date(),
        followUpQuestions: response.followUpQuestions,
        suggestedSearchQueries: response.suggestedSearchQueries,
        suggestedTitles: response.suggestedTitles
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      let errorContent = "Failed to get response. Please try again.";
      if (error instanceof Error) {
        errorContent = error.message;
        // Add helpful link for quota errors
        if (error.message.includes("quota") || error.message.includes("billing")) {
          errorContent += "\n\n💡 This is a billing issue with your OpenAI account. The chatbot feature requires an active OpenAI account with available credits.";
        }
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: errorContent,
        createdAt: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleFollowUpQuestion = (question: string) => {
    setInputValue(question);
    // Trigger send after a brief delay to ensure input is set
    setTimeout(() => {
      const form = document.querySelector("form");
      if (form) {
        form.requestSubmit();
      }
    }, 100);
  };

  const handleSuggestedQuery = async (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleSuggestedTitle = async (title: string, mediaType: "movie" | "tv") => {
    // Search for the title first
    try {
      const results = await searchMulti(title);
      const match = results.results.find(
        item =>
          (item.media_type === mediaType &&
            ((item.media_type === "movie" && item.title?.toLowerCase() === title.toLowerCase()) ||
              (item.media_type === "tv" && item.name?.toLowerCase() === title.toLowerCase()))) ||
          (item.media_type === mediaType &&
            ((item.media_type === "movie" && item.title?.toLowerCase().includes(title.toLowerCase())) ||
              (item.media_type === "tv" && item.name?.toLowerCase().includes(title.toLowerCase())))
          )
      );

      if (match) {
        if (match.media_type === "movie") {
          navigate(`/movie/${match.id}`);
        } else {
          navigate(`/tv/${match.id}`);
        }
      } else {
        // If no exact match, navigate to search
        navigate(`/search?q=${encodeURIComponent(title)}`);
      }
    } catch (error) {
      // Fallback to search page
      navigate(`/search?q=${encodeURIComponent(title)}`);
    }
  };

  const handleAddToWatchlist = async (title: string, mediaType: "movie" | "tv") => {
    // Search for the title and add the first match
    try {
      const results = await searchMulti(title);
      const match = results.results.find(
        item =>
          item.media_type === mediaType &&
          ((item.media_type === "movie" && item.title) || (item.media_type === "tv" && item.name))
      );

      if (match) {
        await upsertEntry({
          tmdbId: match.id,
          mediaType: match.media_type as "movie" | "tv",
          title: (match.media_type === "movie" ? match.title : match.name) || title,
          posterPath: match.poster_path,
          status: "plan"
        });
        // Show success message or navigate to watchlist
        navigate("/watchlist");
      } else {
        navigate(`/search?q=${encodeURIComponent(title)}`);
      }
    } catch (error) {
      console.error("Failed to add to watchlist:", error);
      navigate(`/search?q=${encodeURIComponent(title)}`);
    }
  };

  const clearChat = () => {
    setShowClearChatConfirm(true);
  };

  const confirmClearChat = () => {
    setMessages([]);
    if (user?.uid) {
      localStorage.removeItem(`chat_history_${user.uid}`);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-b from-slate-50 via-blue-50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-800 relative overflow-hidden flex flex-col">
      {/* Animated background orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/10 dark:bg-blue-500/20 rounded-full blur-3xl animate-pulse pointer-events-none"></div>
      <div className="absolute -bottom-32 right-1/3 w-96 h-96 bg-emerald-400/10 dark:bg-emerald-500/20 rounded-full blur-3xl animate-pulse pointer-events-none" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 -right-32 w-80 h-80 bg-cyan-400/10 dark:bg-cyan-500/20 rounded-full blur-3xl animate-pulse pointer-events-none" style={{ animationDelay: '2s' }}></div>

      <div className="max-w-5xl mx-auto px-4 py-4 relative z-10 w-full h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 mb-3">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="space-y-1">
              <button
                onClick={() => navigate(-1)}
                className="mb-2 inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:shadow-md active:scale-95"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-cyan-500 to-emerald-500 rounded-full flex items-center justify-center text-lg shadow-lg">
                  ✨
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 dark:from-blue-400 dark:via-cyan-400 dark:to-emerald-400 bg-clip-text text-transparent">
                  Samflix AI
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 ml-0">
                Your personal movie & TV show assistant
              </p>
            </div>
            <div className="flex items-start gap-1.5 self-start sm:self-auto">
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-red-500/10 to-orange-500/10 dark:from-red-500/20 dark:to-orange-500/20 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-500/20 dark:hover:bg-red-500/30 transition-all shadow-sm hover:shadow-md whitespace-nowrap"
                >
                  🗑️ Clear
                </button>
              )}
              <button
                onClick={() => navigate("/")}
                className="px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-blue-500/10 to-cyan-500/10 dark:from-blue-500/20 dark:to-cyan-500/20 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-500/20 dark:hover:bg-blue-500/30 transition-all shadow-sm hover:shadow-md whitespace-nowrap"
              >
                🏠 Home
              </button>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex-1 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-800/50 overflow-hidden flex flex-col backdrop-filter min-h-0">
          {/* Messages */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 scroll-smooth"
          >
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md animate-fade-in">
                  <div className="mb-4 flex justify-center">
                    <div className="text-5xl drop-shadow-lg animate-bounce">🎬</div>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Welcome to Samflix AI!
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-5 text-xs sm:text-sm leading-relaxed">
                    I'm your intelligent movie and TV show companion. Ask me anything about discovering content, managing your watchlist, or finding what to watch next.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      onClick={() => handleFollowUpQuestion("What should I watch tonight?")}
                      className="p-2.5 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 border border-blue-200/50 dark:border-blue-800/50 rounded-lg hover:shadow-lg transition-all hover:scale-105 text-left group"
                    >
                      <div className="text-lg mb-1">🌙</div>
                      <p className="font-semibold text-xs text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Tonight's pick</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Get a recommendation</p>
                    </button>
                    <button
                      onClick={() => handleFollowUpQuestion("Recommend a good thriller")}
                      className="p-2.5 bg-gradient-to-br from-emerald-50 to-cyan-50 dark:from-emerald-900/30 dark:to-cyan-900/30 border border-emerald-200/50 dark:border-emerald-800/50 rounded-lg hover:shadow-lg transition-all hover:scale-105 text-left group"
                    >
                      <div className="text-lg mb-1">🎯</div>
                      <p className="font-semibold text-xs text-gray-900 dark:text-gray-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Genre search</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Find by genre</p>
                    </button>
                    <button
                      onClick={() => handleFollowUpQuestion("What's trending now?")}
                      className="p-2.5 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/30 dark:to-red-900/30 border border-orange-200/50 dark:border-orange-800/50 rounded-lg hover:shadow-lg transition-all hover:scale-105 text-left group"
                    >
                      <div className="text-lg mb-1">🔥</div>
                      <p className="font-semibold text-xs text-gray-900 dark:text-gray-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">Trending</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Popular now</p>
                    </button>
                    <button
                      onClick={() => handleFollowUpQuestion("Help me pick something")}
                      className="p-2.5 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 border border-purple-200/50 dark:border-purple-800/50 rounded-lg hover:shadow-lg transition-all hover:scale-105 text-left group"
                    >
                      <div className="text-lg mb-1">🎁</div>
                      <p className="font-semibold text-xs text-gray-900 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Surprise me</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Personalized pick</p>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex animate-fade-in ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] md:max-w-[65%] rounded-lg px-3 py-2.5 shadow-lg transition-all ${
                        message.role === "user"
                          ? "bg-gradient-to-br from-blue-600 via-cyan-600 to-emerald-600 dark:from-blue-500 dark:via-cyan-500 dark:to-emerald-500 text-white shadow-blue-200/50 dark:shadow-blue-900/30"
                          : "bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-750 text-gray-900 dark:text-gray-100 shadow-gray-200/50 dark:shadow-gray-900/30"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words text-xs sm:text-sm leading-relaxed">{message.content}</p>
                      {/* Follow-up questions */}
                      {message.followUpQuestions && message.followUpQuestions.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-white/20 dark:border-gray-700/50 space-y-1.5">
                          <p className="text-xs font-semibold opacity-80">💡 Quick questions:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {message.followUpQuestions.map((q, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleFollowUpQuestion(q)}
                                className={`text-xs px-2.5 py-1 rounded-full transition-all hover:scale-105 ${
                                  message.role === "user"
                                    ? "bg-white/20 hover:bg-white/30 backdrop-blur-sm"
                                    : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/60"
                                }`}
                              >
                                {q}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Suggested search queries */}
                      {message.suggestedSearchQueries && message.suggestedSearchQueries.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-white/20 dark:border-gray-700/50 space-y-1.5">
                          <p className="text-xs font-semibold opacity-80">🔍 Try searching:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {message.suggestedSearchQueries.map((query, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleSuggestedQuery(query)}
                                className={`text-xs px-2.5 py-1 rounded-full transition-all hover:scale-105 ${
                                  message.role === "user"
                                    ? "bg-white/20 hover:bg-white/30 backdrop-blur-sm"
                                    : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/60"
                                }`}
                              >
                                {query}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Suggested titles */}
                      {message.suggestedTitles && message.suggestedTitles.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-white/20 dark:border-gray-700/50 space-y-1.5">
                          <p className="text-xs font-semibold opacity-80">⭐ Recommended for you:</p>
                          {message.suggestedTitles.map((title, idx) => (
                            <div
                              key={idx}
                              className={`rounded-lg p-2 transition-all hover:shadow-md ${
                                message.role === "user"
                                  ? "bg-white/10 dark:bg-gray-900/30 hover:bg-white/20 dark:hover:bg-gray-900/50"
                                  : "bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className="font-semibold text-xs">{title.title}</p>
                                  <p className="text-xs opacity-75 mt-0.5">{title.why}</p>
                                  <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                                    message.role === "user"
                                      ? "bg-white/20"
                                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                                  }`}>
                                    {title.mediaType === "movie" ? "🎬 Movie" : "📺 TV Series"}
                                  </span>
                                </div>
                                <div className="flex gap-1 flex-shrink-0">
                                  <button
                                    onClick={() => handleSuggestedTitle(title.title, title.mediaType)}
                                    className={`text-xs px-2.5 py-1 rounded transition-all hover:scale-105 ${
                                      message.role === "user"
                                        ? "bg-white/20 hover:bg-white/30"
                                        : "bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-300 dark:hover:bg-blue-700"
                                    }`}
                                  >
                                    View
                                  </button>
                                  <button
                                    onClick={() => handleAddToWatchlist(title.title, title.mediaType)}
                                    className={`text-xs px-2.5 py-1 rounded transition-all hover:scale-105 ${
                                      message.role === "user"
                                        ? "bg-white/20 hover:bg-white/30"
                                        : "bg-emerald-200 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-300 dark:hover:bg-emerald-700"
                                    }`}
                                  >
                                    + Add
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {chatMutation.isPending && (
                  <div className="flex justify-start animate-fade-in">
                    <div className="bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-750 rounded-2xl px-5 py-4 shadow-lg">
                      <Loader />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="border-t border-gray-200/50 dark:border-gray-800/50 p-3 sm:p-4 bg-gradient-to-r from-white/50 to-blue-50/30 dark:from-gray-800/50 dark:to-gray-900/50 backdrop-blur-sm flex-shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about movies, shows, recommendations..."
                disabled={chatMutation.isPending}
                className="flex-1 px-3 sm:px-4 py-2.5 text-sm border-2 border-gray-300/50 dark:border-gray-700/50 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all disabled:opacity-50 focus:shadow-lg backdrop-filter"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || chatMutation.isPending}
                className="px-4 sm:px-5 py-2.5 bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 dark:from-blue-500 dark:via-cyan-500 dark:to-emerald-500 hover:from-blue-700 hover:via-cyan-700 hover:to-emerald-700 dark:hover:from-blue-600 dark:hover:via-cyan-600 dark:hover:to-emerald-600 text-white rounded-lg font-semibold text-sm transition-all shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 flex-shrink-0"
              >
                {chatMutation.isPending ? (
                  <Loader />
                ) : (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmDialog
        open={showClearChatConfirm}
        onClose={() => setShowClearChatConfirm(false)}
        onConfirm={confirmClearChat}
        title="Clear Chat"
        message="Are you sure you want to clear the chat history? This action cannot be undone."
        confirmText="Yes, Clear Chat"
        cancelText="No"
        confirmVariant="danger"
      />
    </div>
  );
}

