import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/hooks/auth";
import Shell from "@/components/Shell";
import Login from "@/pages/Login";
import Jobs from "@/pages/Jobs";
import Applications from "@/pages/Applications";
import Workers from "@/pages/Workers";
import Insights from "@/pages/Insights";
import type { Role } from "@/types";

const Guard = ({ roles, children }: { roles: Role[]; children: JSX.Element }) => { const { user } = useAuth(); return user && roles.includes(user.role) ? children : <Navigate to="/jobs" replace />; };

export default function App() {
  const { user } = useAuth();
  if (!user) return <Login />;
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/applications" element={<Guard roles={["worker"]}><Applications /></Guard>} />
        <Route path="/workers" element={<Guard roles={["contractor", "admin"]}><Workers /></Guard>} />
        <Route path="/insights" element={<Guard roles={["admin"]}><Insights /></Guard>} />
        <Route path="*" element={<Navigate to="/jobs" replace />} />
      </Route>
    </Routes>
  );
}
