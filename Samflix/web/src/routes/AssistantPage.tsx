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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/30 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-800">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent">
                Samflix Ai Assistant
              </h1>
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
                Get personalized movie and TV show recommendations
              </p>
            </div>
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors self-start sm:self-auto"
              >
                Clear Chat
              </button>
            )}
          </div>
        </div>

        {/* Chat Container */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col" style={{ height: "calc(100vh - 200px)", minHeight: "400px" }}>
          {/* Messages */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-6 space-y-4"
          >
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                  <div className="mb-4 text-6xl">🎬</div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Welcome to Samflix!
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Ask me anything about movies and TV shows. I can help you discover new content, manage your watchlist, and find the perfect show for your mood.
                  </p>
                  <div className="space-y-2 text-left">
                    <p className="text-sm text-gray-500 dark:text-gray-500">Try asking:</p>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• "What should I watch tonight?"</li>
                      <li>• "Recommend a good thriller movie"</li>
                      <li>• "What's a good TV show for a weekend binge?"</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 ${
                        message.role === "user"
                          ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{message.content}</p>
                      
                      {/* Follow-up questions */}
                      {message.followUpQuestions && message.followUpQuestions.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-700">
                          <p className="text-xs font-semibold mb-2 opacity-80">Quick questions:</p>
                          <div className="flex flex-wrap gap-2">
                            {message.followUpQuestions.map((q, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleFollowUpQuestion(q)}
                                className="text-xs px-3 py-1.5 bg-white/20 dark:bg-gray-700/50 hover:bg-white/30 dark:hover:bg-gray-700 rounded-full transition-colors"
                              >
                                {q}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Suggested search queries */}
                      {message.suggestedSearchQueries && message.suggestedSearchQueries.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-700">
                          <p className="text-xs font-semibold mb-2 opacity-80">Try searching:</p>
                          <div className="flex flex-wrap gap-2">
                            {message.suggestedSearchQueries.map((query, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleSuggestedQuery(query)}
                                className="text-xs px-3 py-1.5 bg-white/20 dark:bg-gray-700/50 hover:bg-white/30 dark:hover:bg-gray-700 rounded-full transition-colors"
                              >
                                🔍 {query}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Suggested titles */}
                      {message.suggestedTitles && message.suggestedTitles.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-700 space-y-2">
                          <p className="text-xs font-semibold mb-2 opacity-80">Suggested titles:</p>
                          {message.suggestedTitles.map((title, idx) => (
                            <div
                              key={idx}
                              className="bg-white/10 dark:bg-gray-700/30 rounded-lg p-2"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className="text-sm font-semibold">{title.title}</p>
                                  <p className="text-xs opacity-80 mt-1">{title.why}</p>
                                </div>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleSuggestedTitle(title.title, title.mediaType)}
                                    className="text-xs px-2 py-1 bg-white/20 dark:bg-gray-700/50 hover:bg-white/30 dark:hover:bg-gray-700 rounded transition-colors"
                                  >
                                    View
                                  </button>
                                  <button
                                    onClick={() => handleAddToWatchlist(title.title, title.mediaType)}
                                    className="text-xs px-2 py-1 bg-white/20 dark:bg-gray-700/50 hover:bg-white/30 dark:hover:bg-gray-700 rounded transition-colors"
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
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
                      <Loader />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="border-t border-gray-200 dark:border-gray-800 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about movies, TV shows, recommendations..."
                disabled={chatMutation.isPending}
                className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || chatMutation.isPending}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 dark:from-blue-500 dark:to-emerald-500 dark:hover:from-blue-600 dark:hover:to-emerald-600 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {chatMutation.isPending ? (
                  <Loader />
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

