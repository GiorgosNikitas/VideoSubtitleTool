import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppToaster } from "./components/AppToaster";
import { Loader2 } from "lucide-react";
import { useAuth } from "./hooks/useAuth";
import { AuthPage } from "./pages/AuthPage";
import { EditorPage } from "./pages/EditorPage";

function RequireAuth() {
  const auth = useAuth();
  const location = useLocation();

  if (auth.loading) {
    return (
      <div className="grid min-h-dvh place-items-center bg-[#0a0a0a] text-[#00ff85]">
        <Loader2 className="animate-spin" size={36} />
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return <Navigate replace state={{ from: location }} to={`/login?next=${encodeURIComponent(`${location.pathname}${location.search}`)}`} />;
  }

  return <EditorPage />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RequireAuth />} path="/" />
        <Route element={<AuthPage mode="login" />} path="/login" />
        <Route element={<AuthPage mode="signup" />} path="/signup" />
        <Route element={<Navigate replace to="/login" />} path="*" />
      </Routes>
      <AppToaster />
    </BrowserRouter>
  );
}

export default App;
