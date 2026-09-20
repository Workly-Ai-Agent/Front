import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/layout/Layout";
import { getWorkspaceProjects, type Project } from "../lib/api";
import { useSessionStore } from "../stores/sessionStore";
import {
  selectActiveWorkspace,
  useWorkspaceStore,
} from "../stores/workspaceStore";

export default function Dashboard() {
  const user = useSessionStore((state) => state.user);
  const dashboardStats = useSessionStore((state) => state.dashboardStats);
  const workforceMembers = useSessionStore((state) => state.workforceMembers);
  const agentActivities = useSessionStore((state) => state.agentActivities);

  const activeWorkspace = useWorkspaceStore(selectActiveWorkspace);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  useEffect(() => {
    let ignore = false;
    if (!activeWorkspace) return;

    Promise.resolve().then(() => {
      if (!ignore) setIsLoadingProjects(true);
    });

    getWorkspaceProjects(activeWorkspace.id)
      .then((data) => {
        if (!ignore) setProjects(data);
      })
      .catch(() => {
        if (!ignore) setProjects([]);
      })
      .finally(() => {
        if (!ignore) setIsLoadingProjects(false);
      });

    return () => {
      ignore = true;
    };
  }, [activeWorkspace]);

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
                activeProjects.slice(0, 5).map((project, idx) => {
                  const progressPct = ((idx * 27 + 45) % 80) + 20;
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
                          {project.description || `리더 ID: #${project.leaderId}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#647278]">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e7ece8]">
                          <i
                            className="block h-full rounded-full bg-[#657f51]"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        {progressPct}%
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
                LIVE
              </span>
            </div>
            <div className="p-5">
              {agentActivities.map(({ title, detail, tone }) => (
                <div
                  className="flex gap-3 border-b border-[#eef1ef] py-4 first:pt-0 last:border-0 last:pb-0"
                  key={title}
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

        {/* Bottom Section: Capacity Overview */}
        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between gap-5 max-md:items-start max-md:flex-col">
            <div>
              <p className="mb-2 font-mono text-xs uppercase tracking-[0.08em] text-[#647278]">
                Capacity overview
              </p>
              <h2 className="text-2xl font-bold text-[#18252d]">
                Workforce pulse
              </h2>
            </div>
            <Link to="/workspace/settings" className="text-sm font-bold text-[#657f51] hover:underline">
              워크스페이스 멤버 관리 →
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-4 max-lg:grid-cols-1">
            {workforceMembers.map(
              ({ name, role, utilization, availability }) => (
                <div
                  className="rounded-lg border border-[#dce3df] bg-white p-5 shadow-xs"
                  key={name}
                >
                  <div className="mb-6 flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-full bg-[#d8f36b] font-bold text-[#18252d]">
                      {name.slice(0, 1)}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-[#18252d]">{name}</h3>
                      <p className="mt-1 text-xs text-[#647278]">{role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#647278]">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e7ece8]">
                      <i
                        className="block h-full rounded-full bg-[#657f51]"
                        style={{ width: utilization }}
                      />
                    </div>
                    {utilization}
                  </div>
                  <div className="mt-5 flex justify-between border-t border-[#eef1ef] pt-4 text-xs text-[#647278]">
                    <span>{availability}</span>
                    <span className="text-[#657f51] font-semibold">Skill fit high</span>
                  </div>
                </div>
              )
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}
