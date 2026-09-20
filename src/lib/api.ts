const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(
  /\/$/,
  "",
);

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
  const token = localStorage.getItem("workly-access-token");
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const body = (await response
    .json()
    .catch(() => null)) as ApiResponse<T> | null;

  if (response.status === 401) {
    localStorage.removeItem("workly-access-token");
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
