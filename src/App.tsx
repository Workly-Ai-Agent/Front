import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PublicOnlyRoute from "./components/auth/PublicOnlyRoute";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import ProjectCreate from "./pages/ProjectCreate";
import ProjectDetail from "./pages/ProjectDetail";
import Projects from "./pages/Projects";
import Signup from "./pages/Signup";
import WorkspaceSettings from "./pages/WorkspaceSettings";
import TaskBoard from "./pages/TaskBoardDnd";
import SkillsProfile from "./pages/SkillsProfile";
import Messenger from "./pages/Messenger";
import TaskDetail from "./pages/TaskDetail";
import ProjectAiTasks from "./pages/ProjectAiTasks";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Protected Routes: 로그인 필요 */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <Projects />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/new"
          element={
            <ProtectedRoute>
              <ProjectCreate />
            </ProtectedRoute>
          }
        />
        <Route path="/projects/ai-tasks" element={<ProtectedRoute><ProjectAiTasks /></ProtectedRoute>} />
        <Route
          path="/projects/:projectId"
          element={
            <ProtectedRoute>
              <ProjectDetail />
            </ProtectedRoute>
          }
        />
        <Route path="/projects/:projectId/ai-tasks" element={<ProtectedRoute><ProjectAiTasks /></ProtectedRoute>} />
        <Route
          path="/workspace/settings"
          element={
            <ProtectedRoute>
              <WorkspaceSettings />
            </ProtectedRoute>
          }
        />
        <Route path="/tasks" element={<ProtectedRoute><TaskBoard /></ProtectedRoute>} />
        <Route path="/tasks/:taskId" element={<ProtectedRoute><TaskDetail /></ProtectedRoute>} />
        <Route path="/skills" element={<ProtectedRoute><SkillsProfile /></ProtectedRoute>} />
        <Route path="/skills/profile" element={<ProtectedRoute><SkillsProfile /></ProtectedRoute>} />
        <Route path="/messenger" element={<ProtectedRoute><Messenger /></ProtectedRoute>} />
        <Route
          path="/settings"
          element={<Navigate to="/workspace/settings" replace />}
        />

        {/* Public Routes: 이미 로그인된 경우 대시보드로 이동 */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicOnlyRoute>
              <Signup />
            </PublicOnlyRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
