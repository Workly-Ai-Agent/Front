import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  selectActiveWorkspace,
  useWorkspaceStore,
} from "../../stores/workspaceStore";
import { useSessionStore } from "../../stores/sessionStore";

type Props = { children: React.ReactNode };

export default function Layout({ children }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New workspace form state
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newWorkspaceDesc, setNewWorkspaceDesc] = useState("");
  const [createError, setCreateError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const activeWorkspace = useWorkspaceStore(selectActiveWorkspace);
  const setActiveWorkspaceId = useWorkspaceStore(
    (state) => state.setActiveWorkspaceId
  );
  const fetchWorkspaces = useWorkspaceStore((state) => state.fetchWorkspaces);
  const createWorkspace = useWorkspaceStore((state) => state.createWorkspace);

  const user = useSessionStore((state) => state.user);
  const logout = useSessionStore((state) => state.logout);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    setCreateError("");
    setIsCreating(true);
    try {
      await createWorkspace(
        newWorkspaceName.trim(),
        newWorkspaceDesc.trim() || undefined
      );
      setNewWorkspaceName("");
      setNewWorkspaceDesc("");
      setIsCreateModalOpen(false);
      setIsWorkspaceMenuOpen(false);
      navigate(`/projects`);
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "워크스페이스 생성에 실패했습니다."
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const page = location.pathname.startsWith("/projects/new")
    ? "새 프로젝트"
    : location.pathname.startsWith("/projects")
      ? "프로젝트"
      : location.pathname.startsWith("/workspace/settings") ||
          location.pathname.startsWith("/settings")
        ? "설정 및 멤버 관리"
        : "대시보드";

  return (
    <div className="flex min-h-screen bg-[#f4f6f3] text-[#18252d]">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="사이드바 닫기"
          className="fixed inset-0 z-30 bg-[#18252d]/45 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 shrink-0 flex-col bg-[#18252d] px-5 py-6 text-[#f4f6f3] shadow-2xl transition-all duration-200 lg:static lg:z-auto lg:flex lg:translate-x-0 lg:shadow-none ${
          isSidebarOpen ? "translate-x-0 lg:w-64" : "-translate-x-full lg:w-64"
        }`}
      >
        <div className="mb-10 flex items-center justify-between gap-3 font-mono text-sm uppercase tracking-[0.08em]">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-full bg-[#d8f36b] font-sans text-lg font-extrabold text-[#18252d]">
              W
            </span>
            <span className="font-bold tracking-wider">workly / agent</span>
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

        <div className="mb-3 px-3 font-mono text-[11px] uppercase tracking-[0.12em] text-[#8fa0a5]">
          워크스페이스 메뉴
        </div>

        <nav className="flex flex-col gap-1.5">
          <NavLink
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3.5 py-3 text-sm transition ${
                isActive
                  ? "bg-[#d8f36b] font-bold text-[#18252d]"
                  : "text-[#b9c4c7] hover:bg-white/10 hover:text-white"
              }`
            }
            to="/"
            end
            onClick={() => setIsSidebarOpen(false)}
          >
            <span className="text-base">◈</span>
            <span>대시보드</span>
          </NavLink>

          <NavLink
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3.5 py-3 text-sm transition ${
                isActive
                  ? "bg-[#d8f36b] font-bold text-[#18252d]"
                  : "text-[#b9c4c7] hover:bg-white/10 hover:text-white"
              }`
            }
            to="/projects"
            onClick={() => setIsSidebarOpen(false)}
          >
            <span className="text-base">▣</span>
            <span>프로젝트</span>
          </NavLink>

          <NavLink
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3.5 py-3 text-sm transition ${
                isActive
                  ? "bg-[#d8f36b] font-bold text-[#18252d]"
                  : "text-[#b9c4c7] hover:bg-white/10 hover:text-white"
              }`
            }
            to="/workspace/settings"
            onClick={() => setIsSidebarOpen(false)}
          >
            <span className="text-base">⚙</span>
            <span>설정 & 멤버 관리</span>
          </NavLink>
        </nav>

        {/* Workspace Quick Info Widget in Sidebar */}
        {activeWorkspace && (
          <div className="mt-8 rounded-lg border border-white/10 bg-white/5 p-4 text-xs">
            <div className="font-mono text-[10px] uppercase tracking-wider text-[#8fa0a5]">
              Active Workspace
            </div>
            <div className="mt-1 truncate font-bold text-white">
              {activeWorkspace.name}
            </div>
            {activeWorkspace.description && (
              <p className="mt-1 line-clamp-2 text-[11px] text-[#b9c4c7]">
                {activeWorkspace.description}
              </p>
            )}
          </div>
        )}

        <div className="mt-auto border-t border-white/10 pt-5 text-xs leading-6 text-[#8fa0a5]">
          <strong className="text-white">AI Workforce Agent</strong>
          <br />
          워크스페이스 기반 프로젝트 매니지먼트
        </div>
      </aside>

      {/* Main Container */}
      <main className="min-w-0 flex-1 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-20 flex min-h-[76px] items-center justify-between border-b border-[#dce3df] bg-white px-6 max-sm:px-4 shadow-sm">
          <div className="flex min-w-0 items-center gap-4 sm:gap-6">
            <button
              type="button"
              aria-label={isSidebarOpen ? "사이드바 접기" : "사이드바 열기"}
              className="flex size-10 shrink-0 flex-col items-center justify-center gap-1.5 rounded-md text-[#18252d] hover:bg-[#f4f6f3] lg:hidden"
              onClick={() => setIsSidebarOpen((isOpen) => !isOpen)}
            >
              <span className="block h-0.5 w-5 rounded-full bg-current" />
              <span className="block h-0.5 w-5 rounded-full bg-current" />
              <span className="block h-0.5 w-5 rounded-full bg-current" />
            </button>

            {/* Workspace Dropdown */}
            <div className="relative">
              <button
                type="button"
                aria-expanded={isWorkspaceMenuOpen}
                aria-haspopup="listbox"
                className="flex items-center gap-3 rounded-lg border border-[#dce3df] bg-[#f8faf7] px-3 py-2 text-left transition hover:border-[#657f51] hover:bg-white"
                onClick={() => {
                  setIsWorkspaceMenuOpen((isOpen) => !isOpen);
                  setIsUserMenuOpen(false);
                }}
              >
                <span className="grid size-8 place-items-center rounded-md bg-[#18252d] text-xs font-extrabold text-[#d8f36b]">
                  {activeWorkspace
                    ? activeWorkspace.name.slice(0, 2).toUpperCase()
                    : "WK"}
                </span>
                <span className="max-w-[160px] truncate sm:max-w-[220px]">
                  <b className="block truncate text-sm text-[#18252d]">
                    {activeWorkspace ? activeWorkspace.name : "워크스페이스 선택"}
                  </b>
                  <small className="block truncate text-xs text-[#647278]">
                    {activeWorkspace?.description || "프로젝트 관리 공간"}
                  </small>
                </span>
                <span
                  className={`text-xs text-[#647278] transition-transform ${
                    isWorkspaceMenuOpen ? "rotate-180" : ""
                  }`}
                >
                  ▼
                </span>
              </button>

              {isWorkspaceMenuOpen && (
                <div
                  className="absolute left-0 top-[calc(100%+8px)] z-30 w-72 overflow-hidden rounded-xl border border-[#dce3df] bg-white p-2 shadow-[0_16px_40px_rgb(24_37_45/14%)]"
                  role="listbox"
                  aria-label="워크스페이스 목록"
                >
                  <div className="flex items-center justify-between px-3 pb-2 pt-1 border-b border-[#eef1ef]">
                    <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8fa0a5]">
                      내 워크스페이스
                    </span>
                    <span className="text-xs text-[#647278]">
                      {workspaces.length}개
                    </span>
                  </div>

                  <div className="max-h-60 overflow-y-auto py-1">
                    {workspaces.length === 0 ? (
                      <div className="px-3 py-4 text-center text-xs text-[#647278]">
                        생성된 워크스페이스가 없습니다.
                      </div>
                    ) : (
                      workspaces.map((workspace) => {
                        const isActive =
                          activeWorkspace?.id === workspace.id;
                        return (
                          <button
                            type="button"
                            role="option"
                            aria-selected={isActive}
                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                              isActive
                                ? "bg-[#f0f7df] text-[#18252d]"
                                : "hover:bg-[#f4f6f3] text-[#18252d]"
                            }`}
                            key={workspace.id}
                            onClick={() => {
                              setActiveWorkspaceId(workspace.id);
                              setIsWorkspaceMenuOpen(false);
                            }}
                          >
                            <span className="grid size-7 shrink-0 place-items-center rounded-md bg-[#18252d] text-[10px] font-bold text-[#d8f36b]">
                              {workspace.name.slice(0, 2).toUpperCase()}
                            </span>
                            <span className="min-w-0 flex-1">
                              <strong className="block truncate text-sm font-semibold">
                                {workspace.name}
                              </strong>
                              {workspace.description && (
                                <small className="block truncate text-xs text-[#647278]">
                                  {workspace.description}
                                </small>
                              )}
                            </span>
                            {isActive && (
                              <span className="text-sm font-bold text-[#657f51]">
                                ✓
                              </span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>

                  <div className="mt-1 border-t border-[#eef1ef] pt-2">
                    <button
                      type="button"
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#18252d] px-3 py-2.5 text-xs font-bold text-[#f4f6f3] transition hover:bg-[#304047]"
                      onClick={() => {
                        setIsWorkspaceMenuOpen(false);
                        setIsCreateModalOpen(true);
                      }}
                    >
                      <span>+</span> 새 워크스페이스 생성
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Breadcrumb indicator */}
            <span className="hidden text-sm text-[#647278] md:inline">
              워크스페이스 <span>/</span> <strong className="text-[#18252d]">{page}</strong>
            </span>
          </div>

          {/* Right Header: User Menu */}
          <div className="relative flex items-center gap-4 text-sm">
            <button
              type="button"
              className="flex items-center gap-2.5 rounded-lg border border-transparent p-1.5 transition hover:border-[#dce3df] hover:bg-[#f8faf7]"
              onClick={() => {
                setIsUserMenuOpen((prev) => !prev);
                setIsWorkspaceMenuOpen(false);
              }}
            >
              <span className="grid size-8 place-items-center rounded-full bg-[#18252d] text-xs font-bold text-[#d8f36b]">
                {user.initials || "US"}
              </span>
              <div className="hidden text-left sm:block">
                <span className="block text-xs font-bold text-[#18252d]">
                  {user.name}
                </span>
                <span className="block text-[11px] text-[#647278]">
                  {user.email || "사용자"}
                </span>
              </div>
              <span className="text-xs text-[#647278]">▼</span>
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-56 rounded-xl border border-[#dce3df] bg-white p-2 shadow-[0_16px_40px_rgb(24_37_45/14%)]">
                <div className="px-3 py-2 border-b border-[#eef1ef]">
                  <p className="text-xs font-bold text-[#18252d]">{user.name}</p>
                  <p className="text-[11px] text-[#647278] truncate">{user.email}</p>
                </div>
                <div className="py-1">
                  <NavLink
                    to="/workspace/settings"
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-[#18252d] hover:bg-[#f4f6f3]"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <span>⚙</span> 워크스페이스 설정
                  </NavLink>
                </div>
                <div className="border-t border-[#eef1ef] pt-1">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-bold text-[#b42318] hover:bg-[#fff1f0]"
                    onClick={handleLogout}
                  >
                    <span>→</span> 로그아웃
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1">{children}</div>
      </main>

      {/* New Workspace Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#18252d]/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[#dce3df] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#eef1ef] pb-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-[#647278]">
                  Workspace
                </p>
                <h3 className="text-lg font-bold text-[#18252d]">
                  새 워크스페이스 만들기
                </h3>
              </div>
              <button
                type="button"
                className="size-8 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700 text-lg"
                onClick={() => setIsCreateModalOpen(false)}
              >
                ×
              </button>
            </div>

            {createError && (
              <div className="mt-4 rounded-md bg-[#fff1f0] p-3 text-xs text-[#b42318]">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateWorkspace} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#304047] mb-1.5">
                  워크스페이스 이름 <span className="text-[#b42318]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: Workly 개발팀, 글로벌 마케팅 등"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  className="w-full rounded-md border border-[#cbd4d1] bg-white px-3.5 py-2.5 text-sm text-[#18252d] outline-none transition focus:border-[#657f51] focus:ring-4 focus:ring-[#d8f36b]/35"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#304047] mb-1.5">
                  설명 (선택)
                </label>
                <textarea
                  rows={3}
                  placeholder="워크스페이스의 목적이나 설명을 작성하세요."
                  value={newWorkspaceDesc}
                  onChange={(e) => setNewWorkspaceDesc(e.target.value)}
                  className="w-full rounded-md border border-[#cbd4d1] bg-white px-3.5 py-2 text-sm text-[#18252d] outline-none transition focus:border-[#657f51] focus:ring-4 focus:ring-[#d8f36b]/35"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isCreating}
                  className="rounded-md border border-[#cbd4d1] bg-white px-4 py-2.5 text-xs font-bold text-[#304047] transition hover:bg-[#f4f6f3]"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newWorkspaceName.trim()}
                  className="rounded-md bg-[#18252d] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#304047] disabled:opacity-50"
                >
                  {isCreating ? "생성 중..." : "워크스페이스 생성"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
