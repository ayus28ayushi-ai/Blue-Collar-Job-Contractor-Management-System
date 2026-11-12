import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/auth";
import Shell from "@/components/Shell";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Jobs from "@/pages/Jobs";
import Applications from "@/pages/Applications";
import Workers from "@/pages/Workers";
import Insights from "@/pages/Insights";
import Profile from "@/pages/Profile";
import AdminUsers from "@/pages/AdminUsers";
import type { Role } from "@/types";

const Guard = ({ roles, children }: { roles: Role[]; children: JSX.Element }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/jobs" replace />;
  return children;
};

const PublicOnly = ({ children }: { children: JSX.Element }) => {
  const { user } = useAuth();
  if (user) return <Navigate to="/jobs" replace />;
  return children;
};

export default function App() {
  const { user } = useAuth();
  const location = useLocation();

  // Public marketing + auth pages (no app shell)
  if (!user && (location.pathname === "/" || location.pathname === "/login" || location.pathname === "/register")) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
        <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Routes>
      <Route element={<Shell />}>
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/applications" element={<Guard roles={["worker"]}><Applications /></Guard>} />
        <Route path="/workers" element={<Guard roles={["contractor", "admin"]}><Workers /></Guard>} />
        <Route path="/insights" element={<Guard roles={["admin"]}><Insights /></Guard>} />
        <Route path="/admin/users" element={<Guard roles={["admin"]}><AdminUsers /></Guard>} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/" element={<Navigate to="/jobs" replace />} />
        <Route path="*" element={<Navigate to="/jobs" replace />} />
      </Route>
    </Routes>
  );
}
