import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { ArticlePage } from "./pages/ArticlePage";
import { LoginPage, RegisterPage } from "./pages/AuthPages";
import { EditorPage } from "./pages/EditorPage";
import { HomePage } from "./pages/HomePage";
import { ProfilePage } from "./pages/ProfilePage";
import { SettingsPage } from "./pages/SettingsPage";

function RequireAuth({ children }: { children: React.ReactElement }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="container hint">Loading…</p>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/article/:slug" element={<ArticlePage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route
            path="/editor"
            element={
              <RequireAuth>
                <EditorPage />
              </RequireAuth>
            }
          />
          <Route
            path="/editor/:slug"
            element={
              <RequireAuth>
                <EditorPage />
              </RequireAuth>
            }
          />
          <Route
            path="/settings"
            element={
              <RequireAuth>
                <SettingsPage />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
