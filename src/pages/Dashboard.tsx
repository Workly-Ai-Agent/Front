import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/layout/Layout";
import {
  getAgentProposals,
  getWorkspaceProjects,
  type AgentProposal,
  type Project,
} from "../lib/api";
import { useSessionStore, type AgentActivity } from "../stores/sessionStore";
import {
  selectActiveWorkspace,
  useWorkspaceStore,
} from "../stores/workspaceStore";

function toAgentActivity(proposal: AgentProposal): AgentActivity {
  const modeLabel = proposal.mode === "CHAT_UPDATE"
    ? "채팅 Task 반영"
    : proposal.mode === "ADD_TASKS"
      ? "새 Task 제안"
      : "전체 계획 제안";
  const statusLabel = proposal.status === "PENDING"
    ? "승인 대기"
    : proposal.status === "APPROVED" ? "승인됨" : "거절됨";
  const date = new Date(proposal.createdAt).toLocaleString("ko-KR", {
    month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
  const request = proposal.requestText.trim();
  const shortRequest = request.length > 72 ? `${request.slice(0, 72)}…` : request;
  return {
    title: `${modeLabel} · ${statusLabel}`,
    detail: `${date}${shortRequest ? ` — ${shortRequest}` : ""}`,
    tone: proposal.status === "PENDING" ? "orange" : "default",
  };
}

export default function Dashboard() {
  const user = useSessionStore((state) => state.user);
  const dashboardStats = useSessionStore((state) => state.dashboardStats);
  const activeWorkspace = useWorkspaceStore(selectActiveWorkspace);
  const [projects, setProjects] = useState<Project[]>([]);
  const [agentActivities, setAgentActivities] = useState<AgentActivity[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);

  useEffect(() => {
    let ignore = false;
    if (!activeWorkspace) {
      setProjects([]);
      return;
    }
    setProjects([]);

    Promise.resolve().then(() => {
      if (!ignore) setIsLoadingProjects(true);
    });

    getWorkspaceProjects(activeWorkspace.id)
      .then((data) => { if (!ignore) setProjects(data); })
      .catch(() => { if (!ignore) setProjects([]); })
      .finally(() => { if (!ignore) setIsLoadingProjects(false); });

    return () => {
      ignore = true;
    };
  }, [activeWorkspace]);

  useEffect(() => {
    let ignore = false;
    if (projects.length === 0) {
      setAgentActivities([]);
      setIsLoadingOverview(false);
      return;
    }
    setIsLoadingOverview(true);
    Promise.all(projects.map(async (project) => {
      return getAgentProposals(project.id).catch(() => []);
    })).then((results) => {
      if (ignore) return;
      const recentProposals = results
        .flat()
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
        .slice(0, 5);
      setAgentActivities(recentProposals.map(toAgentActivity));
    }).finally(() => {
      if (!ignore) setIsLoadingOverview(false);
    });
    return () => { ignore = true; };
  }, [projects]);

  const activeProjects = activeWorkspace ? projects : [];

  // Compute active stats
  const activeStats = dashboardStats.map((stat) => {
    if (stat.label === "진행 중인 프로젝트") {
      return {
        ...stat,
        value: activeProjects.length.toString().padStart(2, "0"),
      };
    }
    return stat;
  });

  return (
    <Layout>
      <div className="mx-auto max-w-[1440px] px-8 py-10 max-md:px-5 max-md:py-7">
        <div className="mb-9 flex items-end justify-between gap-6 max-md:items-start max-md:flex-col">
          <div>
            <div className="font-mono text-xs uppercase tracking-wider text-[#657f51] mb-1">
              {activeWorkspace ? `WORKSPACE: ${activeWorkspace.name}` : "WORKLY"}
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-[#18252d] max-md:text-3xl">
              좋은 아침이에요, {user.name.split(" ")[0]}.
            </h1>
            <p className="mt-3 text-sm text-[#647278]">
              오늘 팀과 프로젝트에서 일어나고 있는 일을 한눈에 확인하세요.
            </p>
          </div>
          <Link
            className="rounded-md bg-[#18252d] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#304047]"
            to="/projects/new"
          >
            + 프로젝트 생성
          </Link>
        </div>

        {/* Stats Grid */}
        <section className="mb-8 grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {activeStats.map(({ label, value, change }) => (
            <div
              className="rounded-lg border border-[#dce3df] bg-white p-5 shadow-xs"
              key={label}
            >
              <div className="flex items-center justify-between text-xs text-[#647278]">
                <span>{label}</span>
                <span className="text-base text-[#657f51]">↗</span>
              </div>
              <div className="mt-5 text-3xl font-bold text-[#18252d]">
                {value}
              </div>
              <div className="mt-2 text-xs font-bold text-[#657f51]">
                {change}
              </div>
            </div>
          ))}
        </section>

        {/* Middle Section: Active Projects + Agent Activity */}
        <section className="grid grid-cols-[1.35fr_1fr] gap-5 max-xl:grid-cols-1">
          <div className="overflow-hidden rounded-lg border border-[#dce3df] bg-white shadow-xs">
            <div className="flex items-center justify-between border-b border-[#dce3df] px-5 py-4">
              <div>
                <h2 className="font-bold text-[#18252d]">Active projects</h2>
                <p className="text-xs text-[#647278]">
                  {activeWorkspace
                    ? `'${activeWorkspace.name}' 워크스페이스`
                    : "워크스페이스를 선택하세요"}
                </p>
              </div>
              <Link className="text-xs font-bold text-[#657f51] hover:underline" to="/projects">
                View all →
              </Link>
            </div>

            <div>
              {!activeWorkspace ? (
                <div className="p-8 text-center text-xs text-[#647278]">
                  선택된 워크스페이스가 없습니다.
                </div>
              ) : isLoadingProjects ? (
                <div className="p-8 text-center text-xs text-[#647278]">
                  프로젝트를 불러오고 있습니다...
                </div>
              ) : activeProjects.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm font-bold text-[#18252d]">
                    진행 중인 프로젝트가 없습니다.
                  </p>
                  <p className="mt-1 text-xs text-[#647278]">
                    새 프로젝트를 시작해보세요.
                  </p>
                  <Link
                    to="/projects/new"
                    className="mt-4 inline-block rounded-md bg-[#18252d] px-4 py-2 text-xs font-bold text-white hover:bg-[#304047]"
                  >
                    + 새 프로젝트 생성
                  </Link>
                </div>
              ) : (
                activeProjects.slice(0, 5).map((project) => {
                  return (
                    <Link
                      className="grid grid-cols-[1fr_140px_auto] items-center gap-5 border-b border-[#eef1ef] px-5 py-5 transition last:border-b-0 hover:bg-[#f8faf7] max-sm:grid-cols-1 max-sm:gap-3"
                      to={`/projects/${project.id}`}
                      key={project.id}
                    >
                      <div>
                        <div className="text-sm font-bold text-[#18252d]">
                          {project.name}
                        </div>
                        <div className="mt-1 text-xs text-[#647278] line-clamp-1">
                          {project.description || "프로젝트 설명이 아직 없습니다."}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#647278]">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e7ece8]">
                          <i
                            className="block h-full rounded-full bg-[#657f51]"
                            style={{ width: "0%" }}
                          />
                        </div>
                        —
                      </div>
                      <span className="whitespace-nowrap rounded-full bg-[#e7f3d0] px-2.5 py-1 text-[11px] font-bold text-[#657f51]">
                        진행 중
                      </span>
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-[#dce3df] bg-white shadow-xs">
            <div className="flex items-center justify-between border-b border-[#dce3df] px-5 py-4">
              <h2 className="font-bold text-[#18252d]">Agent activity</h2>
              <span className="font-mono text-[10px] font-bold tracking-widest text-[#657f51]">
                최근 제안
              </span>
            </div>
            <div className="p-5">
              {isLoadingOverview ? (
                <p className="py-6 text-sm text-[#647278]">Agent 활동을 불러오고 있습니다...</p>
              ) : agentActivities.length === 0 ? (
                <p className="py-6 text-sm text-[#647278]">아직 기록된 Agent 활동이 없습니다.</p>
              ) : agentActivities.map(({ title, detail, tone }) => (
                <div
                  className="flex gap-3 border-b border-[#eef1ef] py-4 first:pt-0 last:border-0 last:pb-0"
                  key={`${title}-${detail}`}
                >
                  <span
                    className={`mt-1.5 size-2 shrink-0 rounded-full ${
                      tone === "orange" ? "bg-[#d98b2b]" : "bg-[#657f51]"
                    }`}
                  />
                  <div>
                    <strong className="text-sm text-[#18252d]">{title}</strong>
                    <div className="mt-1 text-xs text-[#647278]">{detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </Layout>
  );
}
