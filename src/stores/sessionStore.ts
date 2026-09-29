import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getUserIdFromToken } from "../lib/api";

export type DashboardStat = { label: string; value: string; change: string };
export type WorkforceMember = { name: string; role: string; utilization: string; availability: string };
export type AgentActivity = { title: string; detail: string; tone: "default" | "orange" };
export type UserInfo = { id?: number | null; name: string; email?: string; initials: string };

type SessionState = {
  user: UserInfo; accessToken: string | null; dashboardStats: DashboardStat[];
  workforceMembers: WorkforceMember[]; agentActivities: AgentActivity[];
  setUser: (user: UserInfo) => void; setAccessToken: (token: string | null) => void;
  logout: () => void; setDashboardStats: (stats: DashboardStat[]) => void;
  setWorkforceMembers: (members: WorkforceMember[]) => void;
  setAgentActivities: (activities: AgentActivity[]) => void;
};

export const useSessionStore = create<SessionState>()(persist((set) => ({
  user: { id: null, name: "", email: "", initials: "" }, accessToken: null,
  dashboardStats: [], workforceMembers: [], agentActivities: [],
  setUser: (user) => set({ user }),
  setAccessToken: (accessToken) => {
    if (accessToken) {
      localStorage.setItem("workly-access-token", accessToken);
      const userId = getUserIdFromToken(accessToken);
      set((state) => ({ accessToken, user: { ...state.user, id: userId ?? state.user.id } }));
    } else {
      localStorage.removeItem("workly-access-token"); set({ accessToken });
    }
  },
  logout: () => { localStorage.removeItem("workly-access-token"); localStorage.removeItem("workly-active-workspace-id"); set({ accessToken: null, user: { id: null, name: "", email: "", initials: "" } }); },
  setDashboardStats: (dashboardStats) => set({ dashboardStats }),
  setWorkforceMembers: (workforceMembers) => set({ workforceMembers }),
  setAgentActivities: (agentActivities) => set({ agentActivities }),
}), {
  name: "workly-session",
  version: 2,
  migrate: (persisted) => {
    const state = persisted as Partial<SessionState>;
    return {
      ...state,
      user: { id: null, name: "", email: "", initials: "" },
      dashboardStats: [],
      workforceMembers: [],
      agentActivities: [],
    } as SessionState;
  },
}));
