const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(
  /\/$/,
  "",
);

export const API_ORIGIN = API_BASE_URL.startsWith("http")
  ? new URL(API_BASE_URL).origin
  : window.location.origin;

export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

// --- Auth Types ---
export type AuthResponse = {
  token: string;
  email: string;
  name: string;
};

export type AuthMeResponse = {
  email: string;
  authenticated: boolean;
};

// --- Workspace Types ---
export type WorkspaceRole = "ADMIN" | "MEMBER";

export type Workspace = {
  id: number;
  name: string;
  description: string | null;
  adminId: number;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceCreatePayload = {
  name: string;
  description?: string;
};

export type WorkspaceUpdatePayload = {
  name: string;
  description?: string;
};

export type WorkspaceMember = {
  id: number;
  workspaceId: number;
  userId: number;
  userName: string;
  email: string;
  role: WorkspaceRole;
  joinedAt: string;
};

export type WorkspaceMemberAddPayload = {
  email: string;
  role?: WorkspaceRole;
};

// --- Project Types ---
export type ProjectRole = "LEADER" | "MEMBER";

export type Project = {
  id: number;
  name: string;
  description: string | null;
  workspaceId: number;
  createdById: number;
  leaderId: number;
  createdAt: string;
  updatedAt: string;
};

export type ProjectCreatePayload = {
  name: string;
  description?: string;
  leaderId: number;
};

export type ProjectUpdatePayload = {
  name: string;
  description?: string;
  leaderId: number;
};

export type ProjectMember = {
  id: number;
  userId: number;
  userName: string;
  email: string;
  role: ProjectRole | string;
};

export type ProjectMemberAddPayload = {
  userId: number;
  role?: ProjectRole | string;
};

// --- Helper to parse user id from JWT ---
export function getUserIdFromToken(token?: string | null): number | null {
  const currentToken = token || localStorage.getItem("workly-access-token");
  if (!currentToken) return null;
  try {
    const payloadPart = currentToken.split(".")[1];
    if (!payloadPart) return null;
    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const parsed = JSON.parse(jsonPayload);
    const sub = parsed.sub;
    return sub ? Number(sub) : null;
  } catch {
    return null;
  }
}

// --- Generic Request Function ---
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (path.includes("NaN")) {
    throw new Error("유효하지 않은 식별자입니다. 항목을 다시 선택해주세요.");
  }
  const token = localStorage.getItem("workly-access-token");
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 120000);
  let response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    signal: options.signal ?? controller.signal,
  });
  window.clearTimeout(timeout);

  let body = (await response
    .json()
    .catch(() => null)) as ApiResponse<T> | null;

  const isAuthEndpoint = ["/auth/login", "/auth/signup", "/auth/refresh"].includes(path);
  if (response.status === 401 && !isAuthEndpoint) {
    const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    }).catch(() => null);
    const refreshBody = refreshResponse
      ? ((await refreshResponse.json().catch(() => null)) as ApiResponse<AuthResponse> | null)
      : null;
    const refreshedToken = refreshResponse?.ok && refreshBody?.success
      ? refreshBody.data?.token
      : undefined;

    if (refreshedToken) {
      localStorage.setItem("workly-access-token", refreshedToken);
      const retryHeaders = new Headers(options.headers);
      retryHeaders.set("Content-Type", "application/json");
      retryHeaders.set("Authorization", `Bearer ${refreshedToken}`);
      response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        credentials: "include",
        headers: retryHeaders,
        signal: options.signal ?? controller.signal,
      });
      body = (await response.json().catch(() => null)) as ApiResponse<T> | null;
    }
  }

  if (response.status === 401) {
    localStorage.removeItem("workly-access-token");
    localStorage.removeItem("workly-session");
    if (
      typeof window !== "undefined" &&
      !window.location.pathname.startsWith("/login") &&
      !window.location.pathname.startsWith("/signup")
    ) {
      window.location.href = "/login";
    }
  }

  if (!response.ok || !body?.success) {
    throw new Error(body?.message ?? "요청을 처리하지 못했습니다.");
  }

  return body.data as T;
}

// ==========================================
// 1. Auth APIs
// ==========================================
export function login(email: string, password: string) {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function signup(name: string, email: string, password: string) {
  return request<void>("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export function getMe() {
  return request<AuthMeResponse>("/auth/me", {
    method: "GET",
  });
}

// ==========================================
// 2. Workspace APIs
// ==========================================
export function getWorkspaces() {
  return request<Workspace[]>("/workspaces", {
    method: "GET",
  });
}

export function getWorkspace(workspaceId: number) {
  return request<Workspace>(`/workspaces/${workspaceId}`, {
    method: "GET",
  });
}

export function createWorkspace(payload: WorkspaceCreatePayload) {
  return request<Workspace>("/workspaces", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateWorkspace(workspaceId: number, payload: WorkspaceUpdatePayload) {
  return request<Workspace>(`/workspaces/${workspaceId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteWorkspace(workspaceId: number) {
  return request<void>(`/workspaces/${workspaceId}`, {
    method: "DELETE",
  });
}

// --- Workspace Member APIs ---
export function getWorkspaceMembers(workspaceId: number) {
  return request<WorkspaceMember[]>(`/workspaces/${workspaceId}/members`, {
    method: "GET",
  });
}

export function getWorkspaceMember(workspaceId: number, memberId: number) {
  return request<WorkspaceMember>(`/workspaces/${workspaceId}/members/${memberId}`, {
    method: "GET",
  });
}

export function addWorkspaceMember(
  workspaceId: number,
  payload: WorkspaceMemberAddPayload
) {
  return request<WorkspaceMember>(`/workspaces/${workspaceId}/members`, {
    method: "POST",
    body: JSON.stringify({
      email: payload.email,
      role: payload.role ?? "MEMBER",
    }),
  });
}

export function updateWorkspaceMemberRole(
  workspaceId: number,
  memberId: number,
  role: WorkspaceRole
) {
  return request<WorkspaceMember>(
    `/workspaces/${workspaceId}/members/${memberId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }
  );
}

export function removeWorkspaceMember(workspaceId: number, memberId: number) {
  return request<void>(`/workspaces/${workspaceId}/members/${memberId}`, {
    method: "DELETE",
  });
}

// ==========================================
// 3. Project APIs
// ==========================================
export function getWorkspaceProjects(workspaceId: number) {
  return request<Project[]>(`/workspaces/${workspaceId}/projects`, {
    method: "GET",
  });
}

export function getProject(projectId: number) {
  return request<Project>(`/projects/${projectId}`, {
    method: "GET",
  });
}

export function createProject(
  workspaceId: number,
  payload: ProjectCreatePayload
) {
  return request<Project>(`/workspaces/${workspaceId}/projects`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateProject(
  projectId: number,
  payload: ProjectUpdatePayload
) {
  return request<Project>(`/projects/${projectId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteProject(projectId: number) {
  return request<void>(`/projects/${projectId}`, {
    method: "DELETE",
  });
}

// --- Project Member APIs ---
export function getProjectMembers(projectId: number) {
  return request<ProjectMember[]>(`/projects/${projectId}/members`, {
    method: "GET",
  });
}

export function addProjectMember(
  projectId: number,
  payload: ProjectMemberAddPayload
) {
  return request<ProjectMember>(`/projects/${projectId}/members`, {
    method: "POST",
    body: JSON.stringify({
      userId: payload.userId,
      role: payload.role ?? "MEMBER",
    }),
  });
}

export function updateProjectMemberRole(
  projectId: number,
  userId: number,
  role: ProjectRole | string
) {
  return request<ProjectMember>(`/projects/${projectId}/members/${userId}`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export function removeProjectMember(projectId: number, userId: number) {
  return request<void>(`/projects/${projectId}/members/${userId}`, {
    method: "DELETE",
  });
}

// ==========================================
// 4. Task APIs
// ==========================================
export type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED" | "CANCELLED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type Task = {
  id: number; projectId: number; title: string; description: string | null;
  assigneeId: number | null; assigneeName?: string | null; status: TaskStatus; priority: TaskPriority;
  dependsOn: number[]; dependencyTitles: string[];
  startAt: string | null; dueAt: string | null; overdue: boolean; createdAt: string; updatedAt: string;
};

export function updateTaskStatus(id: number, status: TaskStatus) {
  return request<Task>(`/tasks/${id}/status?status=${status}`, { method: "PATCH" });
}
export function updateTask(id: number, payload: { title: string; description?: string; assigneeId?: number | null; status: TaskStatus; priority: TaskPriority; startAt?: string | null; dueAt?: string | null }) {
  return request<Task>(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}
export function getTask(id: number) { return request<Task>(`/tasks/${id}`, { method: "GET" }); }
export type TaskCreatePayload = { projectId: number; title: string; description?: string; assigneeId?: number; priority?: TaskPriority };
export function getTasks(projectId?: number) {
  return request<Task[]>(`/tasks${projectId ? `?projectId=${projectId}` : ""}`, { method: "GET" });
}
export type TaskMonitor = { overdue: Task[]; unassigned: Task[]; dependencyBlocked: Array<{ taskId: number; taskTitle: string; blockedBy: string[] }> };
export function getTaskMonitor(projectId: number) { return request<TaskMonitor>(`/tasks/monitor?projectId=${projectId}`); }
export type WorkspaceTaskSummary = { workspaceId: number; active: number; completed: number; overdue: number; unassigned: number; projects: Array<{ projectId: number; projectName: string; active: number; completed: number; overdue: number; unassigned: number }> };
export function getWorkspaceTaskSummary(workspaceId: number) { return request<WorkspaceTaskSummary>(`/tasks/workspace-summary?workspaceId=${workspaceId}`); }
export function createTask(payload: TaskCreatePayload) {
  return request<Task>("/tasks", { method: "POST", body: JSON.stringify(payload) });
}

// ==========================================
// 5. Skill APIs
// ==========================================
export type Skill = { id: number; name: string; description: string | null };
export type UserSkill = { id: number; skillId: number; skillName: string };
export function getSkills() { return request<Skill[]>("/skills", { method: "GET" }); }
export function createSkill(name: string, description?: string) { return request<Skill>("/skills", { method: "POST", body: JSON.stringify({ name, description }) }); }
export function getUserSkills(userId: number) { return request<UserSkill[]>(`/users/${userId}/skills`, { method: "GET" }); }
export function addUserSkill(userId: number, skillId: number) { return request<UserSkill>(`/users/${userId}/skills`, { method: "POST", body: JSON.stringify({ skillId }) }); }
export function deleteUserSkill(userId: number, userSkillId: number) { return request<void>(`/users/${userId}/skills/${userSkillId}`, { method: "DELETE" }); }

// ==========================================
// 6. Messenger APIs
// ==========================================
export type Message = { id: number; workspaceId: number; senderId: number; senderName: string; receiverId: number | null; projectId: number | null; content: string; createdAt: string };
export function getConversation(workspaceId: number, userId: number) { return request<Message[]>(`/chat/conversations/${userId}?workspaceId=${workspaceId}`, { method: "GET" }); }
export function sendMessage(workspaceId: number, receiverId: number | null, content: string, projectId?: number | null) { return request<Message>("/chat/messages", { method: "POST", body: JSON.stringify({ workspaceId, receiverId, projectId, content }) }); }
export function getChannel(workspaceId: number, projectId?: number | null, receiverId?: number | null) { const params = new URLSearchParams({ workspaceId: String(workspaceId) }); if (projectId) params.set("projectId", String(projectId)); if (receiverId) params.set("receiverId", String(receiverId)); return request<Message[]>(`/chat/channels?${params}`, { method: "GET" }); }

export type AgentWorkflow = { status: string; projectName: string; tasks: Array<Record<string, unknown>>; assignments: Array<Record<string, unknown>>; violations: string[]; monitoring: string[]; approved: boolean; log: string[] };
export function runAgentWorkflow(projectId: number, planText: string) {
  return request<AgentWorkflow>(`/projects/${projectId}/agent/workflow`, { method: "POST", body: JSON.stringify({ planText }) });
}
export function generateAgentTasks(projectId: number, planText: string) {
  return request<Task[]>(`/projects/${projectId}/agent/generate`, { method: "POST", body: JSON.stringify({ planText }) });
}
export type AgentIntent = { intent: string; taskReference: string | null; requestedChange: string | null; requiresReplanning: boolean; confidence: number };
export function classifyAgentMessage(message: string) { return request<AgentIntent>("/chat/agent-intent", { method: "POST", body: JSON.stringify({ message }) }); }
export type ExtractedSkill = { name: string; evidence: string };
export function extractProfileSkills(profileText: string) { return request<{ skills: ExtractedSkill[] }>("/agent/extract-skills", { method: "POST", body: JSON.stringify({ profileText }) }); }
