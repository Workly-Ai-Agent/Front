const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(
  /\/$/,
  "",
);

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

export type AuthResponse = {
  token: string;
  email: string;
  name: string;
};

async function request<T>(path: string, options: RequestInit = {}) {
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

  if (!response.ok || !body?.success) {
    throw new Error(body?.message ?? "요청을 처리하지 못했습니다.");
  }

  return body.data as T;
}

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
