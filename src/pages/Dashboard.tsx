import { Link } from "react-router-dom";
import Layout from "../components/layout/Layout";
import { useSessionStore } from "../stores/sessionStore";

const projects = [
  {
    name: "신제품 마케팅",
    meta: "09/20 — 10/20 · 8명 참여",
    progress: 72,
    status: "진행 중",
  },
  {
    name: "쇼핑몰 서비스 개편",
    meta: "10/01 — 11/15 · 12명 참여",
    progress: 45,
    status: "기획 중",
  },
  {
    name: "대학 IT 행사",
    meta: "10/08 — 10/28 · 5명 참여",
    progress: 28,
    status: "기획 중",
  },
];

export default function Dashboard() {
  const user = useSessionStore((state) => state.user);
  const dashboardStats = useSessionStore((state) => state.dashboardStats);
  const workforceMembers = useSessionStore((state) => state.workforceMembers);
  const agentActivities = useSessionStore((state) => state.agentActivities);

  return (
    <Layout>
      <div className="mx-auto max-w-[1440px] px-8 py-10 max-md:px-5 max-md:py-7">
        <div className="mb-9 flex items-end justify-between gap-6 max-md:items-start max-md:flex-col">
          <div>
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
        <section className="mb-8 grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {dashboardStats.map(({ label, value, change }) => (
            <div
              className="rounded-lg border border-[#dce3df] bg-white p-5"
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
        <section className="grid grid-cols-[1.35fr_1fr] gap-5 max-xl:grid-cols-1">
          <div className="overflow-hidden rounded-lg border border-[#dce3df] bg-white">
            <div className="flex items-center justify-between border-b border-[#dce3df] px-5 py-4">
              <h2 className="font-bold">Active projects</h2>
              <Link className="text-xs font-bold text-[#657f51]" to="/projects">
                View all →
              </Link>
            </div>
            <div>
              {projects.map((project) => (
                <Link
                  className="grid grid-cols-[1fr_140px_auto] items-center gap-5 border-b border-[#eef1ef] px-5 py-5 transition last:border-b-0 hover:bg-[#f8faf7] max-sm:grid-cols-1 max-sm:gap-3"
                  to="/projects/marketing"
                  key={project.name}
                >
                  <div>
                    <div className="text-sm font-bold">{project.name}</div>
                    <div className="mt-1 text-xs text-[#647278]">
                      {project.meta}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#647278]">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e7ece8]">
                      <i
                        className="block h-full rounded-full bg-[#657f51]"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    {project.progress}%
                  </div>
                  <span
                    className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${project.status === "기획 중" ? "bg-[#fff1d8] text-[#a56a16]" : "bg-[#e7f3d0] text-[#657f51]"}`}
                  >
                    {project.status}
                  </span>
                </Link>
              ))}
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border border-[#dce3df] bg-white">
            <div className="flex items-center justify-between border-b border-[#dce3df] px-5 py-4">
              <h2 className="font-bold">Agent activity</h2>
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
                    className={`mt-1.5 size-2 shrink-0 rounded-full ${tone === "orange" ? "bg-[#d98b2b]" : "bg-[#657f51]"}`}
                  />
                  <div>
                    <strong className="text-sm">{title}</strong>
                    <div className="mt-1 text-xs text-[#647278]">{detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between gap-5 max-md:items-start max-md:flex-col">
            <div>
              <p className="mb-2 font-mono text-xs uppercase tracking-[0.08em] text-[#647278]">
                Capacity overview
              </p>
              <h2 className="text-2xl font-bold">Workforce pulse</h2>
            </div>
            <Link to="/workforce" className="text-sm font-bold text-[#657f51]">
              Open skill matrix →
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-4 max-lg:grid-cols-1">
            {workforceMembers.map(
              ({ name, role, utilization, availability }) => (
                <div
                  className="rounded-lg border border-[#dce3df] bg-white p-5"
                  key={name}
                >
                  <div className="mb-6 flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-full bg-[#d8f36b] font-bold text-[#18252d]">
                      {name.slice(0, 1)}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold">{name}</h3>
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
                    <span>Skill fit high</span>
                  </div>
                </div>
              ),
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}
