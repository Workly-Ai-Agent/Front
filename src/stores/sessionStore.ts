import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DashboardStat = {
  label: string;
  value: string;
  change: string;
};

export type WorkforceMember = {
  name: string;
  role: string;
  utilization: string;
  availability: string;
};

export type AgentActivity = {
  title: string;
  detail: string;
  tone: "default" | "orange";
};

type SessionState = {
  user: {
    name: string;
    initials: string;
  };
  accessToken: string | null;
  dashboardStats: DashboardStat[];
  workforceMembers: WorkforceMember[];
  agentActivities: AgentActivity[];
  setUser: (user: SessionState["user"]) => void;
  setAccessToken: (accessToken: string | null) => void;
  setDashboardStats: (stats: DashboardStat[]) => void;
  setWorkforceMembers: (members: WorkforceMember[]) => void;
  setAgentActivities: (activities: AgentActivity[]) => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      user: {
        name: "Sarah Choi",
        initials: "SC",
      },
      accessToken: null,
      dashboardStats: [
        { label: "진행 중인 프로젝트", value: "08", change: "이번 달 +2" },
        { label: "전체 구성원", value: "32", change: "가용 인력 +4" },
        { label: "Skill Gap", value: "04", change: "검토 필요 2건" },
        { label: "평균 업무량", value: "76%", change: "지난주 대비 +8%" },
      ],
      workforceMembers: [
        {
          name: "김철수",
          role: "Product Strategy",
          utilization: "82%",
          availability: "Available",
        },
        {
          name: "이영희",
          role: "Content Design",
          utilization: "91%",
          availability: "On project",
        },
        {
          name: "박민수",
          role: "Performance Marketing",
          utilization: "64%",
          availability: "Available",
        },
      ],
      agentActivities: [
        {
          title: "Project analysis completed",
          detail: "신제품 마케팅 · 2m ago",
          tone: "default",
        },
        {
          title: "12 tasks generated",
          detail: "신제품 마케팅 · 8m ago",
          tone: "default",
        },
        {
          title: "8 members evaluated",
          detail: "신제품 마케팅 · 11m ago",
          tone: "default",
        },
        {
          title: "Skill gap detected",
          detail: "광고 운영 · needs review",
          tone: "orange",
        },
      ],
      setUser: (user) => set({ user }),
      setAccessToken: (accessToken) => {
        if (accessToken) {
          localStorage.setItem("workly-access-token", accessToken);
        } else {
          localStorage.removeItem("workly-access-token");
        }
        set({ accessToken });
      },
      setDashboardStats: (dashboardStats) => set({ dashboardStats }),
      setWorkforceMembers: (workforceMembers) => set({ workforceMembers }),
      setAgentActivities: (agentActivities) => set({ agentActivities }),
    }),
    { name: "workly-session" },
  ),
);
