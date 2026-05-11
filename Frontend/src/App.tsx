import { useState, useEffect } from "react";
import "./index.css";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import { authService, type UserResponse } from "./services/authService";

export default function App() {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(() => authService.isAuthenticated());

  useEffect(() => {
    if (!authService.isAuthenticated()) return;

    let isMounted = true;

    const loadUser = async () => {
      try {
        const me = await authService.getMe();
        if (isMounted) setUser(me);
      } catch {
        authService.logout();
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLoginSuccess = async () => {
    const me = await authService.getMe();
    setUser(me);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0B1120",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            border: "3px solid rgba(139, 92, 246, 0.2)",
            borderTopColor: "#8B5CF6",
            borderRadius: "50%",
            animation: "spin 0.7s linear infinite",
          }}
        />
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return <DashboardPage user={user} onLogout={handleLogout} />;
}
