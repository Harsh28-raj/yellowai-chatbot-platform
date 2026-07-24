import { Routes, Route } from "react-router-dom";
import { Landing } from "../features/auth/Landing";
import { ProtectedRoute } from "../features/auth/ProtectedRoute";
import { Dashboard } from "../features/projects/Dashboard";
import { ChatWindow } from "../features/chat/ChatWindow";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/projects" element={<Dashboard />} />
        <Route path="/chat/:projectId" element={<ChatWindow />} />
      </Route>
      <Route path="*" element={<Landing />} />
    </Routes>
  );
}
