import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  selectActiveOrganization,
  useOrganizationStore,
} from "../../stores/organizationStore";
import { useSessionStore } from "../../stores/sessionStore";

type Props = { children: React.ReactNode };

export default function Layout({ children }: Props) {
  const location = useLocation();
  const [isOrganizationMenuOpen, setIsOrganizationMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const organizations = useOrganizationStore((state) => state.organizations);
  const activeOrganization = useOrganizationStore(selectActiveOrganization);
  const setActiveOrganization = useOrganizationStore(
    (state) => state.setActiveOrganization,
  );
  const user = useSessionStore((state) => state.user);
  const page = location.pathname.startsWith("/projects")
    ? "프로젝트"
    : location.pathname.startsWith("/workforce")
      ? "인력 현황"
      : location.pathname.startsWith("/team")
        ? "팀 관리"
        : "대시보드";
  return (
    <div className="flex min-h-screen bg-[#f4f6f3] text-[#18252d]">
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="사이드바 닫기"
          className="fixed inset-0 z-30 bg-[#18252d]/45 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 shrink-0 flex-col bg-[#18252d] px-5 py-6 text-[#f4f6f3] shadow-2xl transition-all duration-200 lg:static lg:z-auto lg:flex lg:translate-x-0 lg:shadow-none ${isSidebarOpen ? "translate-x-0 lg:w-64" : "-translate-x-full lg:w-20"}`}
      >
        <div
          className={`mb-12 flex items-center justify-between gap-3 font-mono text-sm uppercase tracking-[0.08em] ${isSidebarOpen ? "" : "lg:justify-center"}`}
        >
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-full bg-[#d8f36b] font-sans text-lg font-extrabold text-[#18252d]">
              W
            </span>
            <span className={isSidebarOpen ? "" : "lg:hidden"}>
              workly / agent
            </span>
          </div>
          <button
            type="button"
            aria-label="사이드바 닫기"
            className="rounded-md p-2 text-xl text-[#b9c4c7] hover:bg-white/10 hover:text-white lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          >
            ×
          </button>
        </div>
        <div
          className={`mb-3 px-3 font-mono text-[11px] uppercase tracking-[0.12em] text-[#8fa0a5] ${isSidebarOpen ? "" : "lg:hidden"}`}
        >
          워크스페이스
        </div>
        <nav className="flex flex-col gap-1">
          <NavLink
            className="flex items-center gap-3 rounded-md px-3 py-3 text-sm text-[#b9c4c7] transition hover:bg-white/10 hover:text-white [&.active]:bg-[#d8f36b] [&.active]:font-bold [&.active]:text-[#18252d]"
            to="/"
            onClick={() => setIsSidebarOpen(false)}
          >
            <span className="text-base">◈</span>
            <span className={isSidebarOpen ? "" : "lg:hidden"}>대시보드</span>
          </NavLink>
          <NavLink
            className="flex items-center gap-3 rounded-md px-3 py-3 text-sm text-[#b9c4c7] transition hover:bg-white/10 hover:text-white [&.active]:bg-[#d8f36b] [&.active]:font-bold [&.active]:text-[#18252d]"
            to="/projects"
            onClick={() => setIsSidebarOpen(false)}
          >
            <span className="text-base">▣</span>
            <span className={isSidebarOpen ? "" : "lg:hidden"}>프로젝트</span>
          </NavLink>
          <NavLink
            className="flex items-center gap-3 rounded-md px-3 py-3 text-sm text-[#b9c4c7] transition hover:bg-white/10 hover:text-white [&.active]:bg-[#d8f36b] [&.active]:font-bold [&.active]:text-[#18252d]"
            to="/workforce"
            onClick={() => setIsSidebarOpen(false)}
          >
            <span className="text-base">♧</span>
            <span className={isSidebarOpen ? "" : "lg:hidden"}>인력 현황</span>
          </NavLink>
          <NavLink
            className="flex items-center gap-3 rounded-md px-3 py-3 text-sm text-[#b9c4c7] transition hover:bg-white/10 hover:text-white [&.active]:bg-[#d8f36b] [&.active]:font-bold [&.active]:text-[#18252d]"
            to="/settings"
            onClick={() => setIsSidebarOpen(false)}
          >
            <span className="text-base">⚙</span>
            <span className={isSidebarOpen ? "" : "lg:hidden"}>설정</span>
          </NavLink>
        </nav>
        <div
          className={`mt-auto border-t border-white/10 pt-5 text-xs leading-6 text-[#8fa0a5] ${isSidebarOpen ? "" : "lg:hidden"}`}
        >
          <strong>AI Workforce Agent</strong>
          <br />
          팀을 위한 계획 수립 인텔리전스
        </div>
      </aside>
      <main className="min-w-0 flex-1">
        <header className="flex min-h-[76px] items-center justify-between border-b border-[#dce3df] bg-white px-6 max-sm:px-4">
          <div className="flex min-w-0 items-center gap-6">
            <button
              type="button"
              aria-label={isSidebarOpen ? "사이드바 접기" : "사이드바 열기"}
              className="flex size-10 shrink-0 flex-col items-center justify-center gap-1.5 rounded-md text-[#18252d] hover:bg-[#f4f6f3]"
              onClick={() => setIsSidebarOpen((isOpen) => !isOpen)}
            >
              <span className="block h-0.5 w-5 rounded-full bg-current" />
              <span className="block h-0.5 w-5 rounded-full bg-current" />
              <span className="block h-0.5 w-5 rounded-full bg-current" />
            </button>
            <div className="relative">
              <button
                type="button"
                aria-expanded={isOrganizationMenuOpen}
                aria-haspopup="listbox"
                className="flex items-center gap-3 rounded-lg p-1.5 text-left transition hover:bg-[#f4f6f3]"
                onClick={() => setIsOrganizationMenuOpen((isOpen) => !isOpen)}
              >
                <span className="grid size-9 place-items-center rounded-md bg-[#d8f36b] text-xs font-extrabold text-[#18252d]">
                  WK
                </span>
                <span>
                  <b className="block text-sm">{activeOrganization.name}</b>
                  <small className="block text-xs text-[#647278]">
                    {activeOrganization.role} · {activeOrganization.memberCount}
                    명
                  </small>
                </span>
                <span
                  className={`text-[#647278] transition-transform ${isOrganizationMenuOpen ? "rotate-180" : ""}`}
                >
                  ⌄
                </span>
              </button>
              {isOrganizationMenuOpen && (
                <div
                  className="absolute left-0 top-[calc(100%+10px)] z-20 w-64 overflow-hidden rounded-xl border border-[#dce3df] bg-white p-2 shadow-[0_16px_40px_rgb(24_37_45/14%)]"
                  role="listbox"
                  aria-label="소속 조직 목록"
                >
                  <p className="px-3 pb-2 pt-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#8fa0a5]">
                    소속 조직
                  </p>
                  {organizations.map((organization) => {
                    const isActive = organization.id === activeOrganization.id;

                    return (
                      <button
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition ${isActive ? "bg-[#f0f7df]" : "hover:bg-[#f4f6f3]"}`}
                        key={organization.id}
                        onClick={() => {
                          setActiveOrganization(organization.id);
                          setIsOrganizationMenuOpen(false);
                        }}
                      >
                        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-[#18252d] text-[10px] font-bold text-[#d8f36b]">
                          {organization.name.slice(0, 2).toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1">
                          <strong className="block truncate text-sm text-[#18252d]">
                            {organization.name}
                          </strong>
                          <small className="mt-0.5 block text-xs text-[#647278]">
                            {organization.role} · {organization.memberCount}명
                          </small>
                        </span>
                        {isActive && (
                          <span className="text-sm font-bold text-[#657f51]">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                  <div className="mt-2 border-t border-[#eef1ef] px-3 pt-2 text-xs text-[#8fa0a5]">
                    조직을 선택하면 대시보드가 전환됩니다.
                  </div>
                </div>
              )}
            </div>
            <span className="hidden text-sm text-[#647278] sm:inline">
              워크스페이스 <span>/</span> <strong>{page}</strong>
            </span>
          </div>
          <div className="flex items-center gap-5 text-sm">
            <span className="text-xl text-[#647278]">◌</span>
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-full bg-[#dce3df] text-xs font-bold">
                {user.initials}
              </span>
              <span className="hidden sm:inline">{user.name}</span>
            </div>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
