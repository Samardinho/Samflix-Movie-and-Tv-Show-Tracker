import { Routes, Route } from "react-router-dom";
import { Shell } from "./components/layout/Shell";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { HomePage } from "./routes/HomePage";
import { LoginPage } from "./routes/LoginPage";
import { RegisterPage } from "./routes/RegisterPage";
import { ForgotPasswordPage } from "./routes/ForgotPasswordPage";
import { SearchPage } from "./routes/SearchPage";
import { MovieDetailPage } from "./routes/MovieDetailPage";
import { TvDetailPage } from "./routes/TvDetailPage";
import { WatchlistPage } from "./routes/WatchlistPage";
import { ProfilePage } from "./routes/ProfilePage";
import { AssistantPage } from "./routes/AssistantPage";
import { NotFoundPage } from "./routes/NotFoundPage";

function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/movie/:id" element={<MovieDetailPage />} />
        <Route path="/tv/:id" element={<TvDetailPage />} />
        <Route
          path="/watchlist"
          element={
            <ProtectedRoute>
              <WatchlistPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assistant"
          element={
            <ProtectedRoute>
              <AssistantPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Shell>
  );
}

export default App;

