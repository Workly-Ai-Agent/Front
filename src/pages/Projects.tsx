import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/layout/Layout";
import {
  deleteProject,
  getWorkspaceProjects,
  type Project,
} from "../lib/api";
import {
  selectActiveWorkspace,
  useWorkspaceStore,
} from "../stores/workspaceStore";

export default function Projects() {
  const activeWorkspace = useWorkspaceStore(selectActiveWorkspace);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const setActiveWorkspaceId = useWorkspaceStore(
    (state) => state.setActiveWorkspaceId
  );
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    let ignore = false;
    if (!activeWorkspace) return;

    Promise.resolve().then(() => {
      if (!ignore) setIsLoading(true);
    });

    getWorkspaceProjects(activeWorkspace.id)
      .then((data) => {
        if (!ignore) {
          setProjects(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(
            err instanceof Error
              ? err.message
              : "프로젝트 목록을 불러오는 중 오류가 발생했습니다."
          );
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [activeWorkspace, reloadKey]);

  const handleDelete = async (projectId: number, projectName: string) => {
    if (!confirm(`'${projectName}' 프로젝트를 삭제하시겠습니까?`)) {
      return;
    }
    setDeletingId(projectId);
    try {
      await deleteProject(projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "프로젝트 삭제 중 오류가 발생했습니다."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const projectsToFilter = activeWorkspace ? projects : [];
  const filteredProjects = projectsToFilter.filter((p) => {
    const matchName = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDesc = p.description
      ? p.description.toLowerCase().includes(searchQuery.toLowerCase())
      : false;
    return matchName || matchDesc;
  });

  return (
    <Layout>
      <div className="mx-auto max-w-[1440px] px-8 py-10 max-md:px-5 max-md:py-7">
        {/* Header section */}
        <div className="mb-8 flex items-end justify-between gap-6 max-md:flex-col max-md:items-start">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.08em] text-[#647278]">
              <span>{activeWorkspace?.name ?? "워크스페이스"}</span>
              <span>/</span>
              <span className="font-bold text-[#18252d]">PROJECTS</span>
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#18252d] sm:text-4xl">
              프로젝트 목록
            </h1>
            <p className="mt-2 text-sm text-[#647278]">
              {activeWorkspace
                ? `현재 '${activeWorkspace.name}' 워크스페이스에 등록된 프로젝트를 관리합니다.`
                : "워크스페이스를 먼저 생성하거나 선택해주세요."}
            </p>
          </div>

          {activeWorkspace && (
            <div className="flex items-center gap-3">
              <Link
                to="/projects/new"
                className="flex items-center gap-2 rounded-md bg-[#18252d] px-5 py-2.5 text-sm font-bold text-[#f4f6f3] transition hover:bg-[#304047]"
              >
                <span>+</span> 새 프로젝트 생성
              </Link>
            </div>
          )}
        </div>

        {/* Filter bar */}
        {activeWorkspace && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-[#dce3df] bg-white p-4 shadow-xs max-sm:flex-col max-sm:items-stretch">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="프로젝트 이름이나 설명 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-[#cbd4d1] bg-[#f8faf7] px-4 py-2 text-sm text-[#18252d] outline-none transition focus:border-[#657f51] focus:bg-white focus:ring-2 focus:ring-[#d8f36b]/40"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-[#647278]">
              <span>총</span>
              <span className="font-bold text-[#18252d]">
                {filteredProjects.length}
              </span>
              <span>개 프로젝트</span>
            </div>
          </div>
        )}

        {/* State rendering */}
        {!activeWorkspace ? (
          <div className="rounded-2xl border border-dashed border-[#cbd4d1] bg-white p-12 text-center">
            <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-[#f0f7df] text-xl text-[#657f51]">
              ◈
            </div>
            <h3 className="text-lg font-bold text-[#18252d]">
              선택된 워크스페이스가 없습니다
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#647278]">
              프로젝트는 특정 워크스페이스에 속합니다. 워크스페이스를 선택하여 소속 프로젝트를 확인하거나 새 프로젝트를 시작하세요.
            </p>

            {workspaces.length > 0 ? (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <span className="text-xs text-[#647278] mr-2">워크스페이스 선택:</span>
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    type="button"
                    onClick={() => setActiveWorkspaceId(ws.id)}
                    className="rounded-md border border-[#cbd4d1] bg-[#f8faf7] px-4 py-2 text-xs font-bold text-[#18252d] hover:border-[#657f51] hover:bg-white"
                  >
                    {ws.name}
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-6">
                <Link
                  to="/projects/new"
                  className="inline-flex items-center gap-2 rounded-md bg-[#18252d] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#304047]"
                >
                  <span>+</span> 워크스페이스 및 프로젝트 만들기
                </Link>
              </div>
            )}
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-3 gap-5 max-lg:grid-cols-2 max-sm:grid-cols-1">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="animate-pulse rounded-xl border border-[#dce3df] bg-white p-6"
              >
                <div className="h-5 w-3/4 rounded bg-gray-200" />
                <div className="mt-3 h-4 w-full rounded bg-gray-100" />
                <div className="mt-6 flex justify-between">
                  <div className="h-4 w-20 rounded bg-gray-200" />
                  <div className="h-4 w-16 rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm font-semibold text-red-700">{error}</p>
            <button
              onClick={() => setReloadKey((k) => k + 1)}
              className="mt-3 rounded-md bg-[#18252d] px-4 py-2 text-xs font-bold text-white hover:bg-[#304047]"
            >
              다시 시도
            </button>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="rounded-2xl border border-[#dce3df] bg-white p-12 text-center">
            <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-[#f0f7df] text-xl font-bold text-[#657f51]">
              ▣
            </div>
            <h3 className="text-lg font-bold text-[#18252d]">
              {searchQuery
                ? "검색된 프로젝트가 없습니다."
                : "아직 등록된 프로젝트가 없습니다."}
            </h3>
            <p className="mt-2 text-sm text-[#647278]">
              {searchQuery
                ? "다른 검색어로 다시 시도해보세요."
                : "새로운 프로젝트를 생성하고 팀원들과 협업을 시작하세요."}
            </p>
            {!searchQuery && (
              <Link
                to="/projects/new"
                className="mt-6 inline-flex items-center gap-2 rounded-md bg-[#18252d] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#304047]"
              >
                <span>+</span> 첫 프로젝트 만들기
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-5 max-lg:grid-cols-2 max-sm:grid-cols-1">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="group relative flex flex-col justify-between rounded-xl border border-[#dce3df] bg-white p-6 transition duration-150 hover:border-[#657f51] hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-md bg-[#f0f7df] px-2.5 py-1 font-mono text-[11px] font-bold text-[#657f51]">
                      PROJ-{project.id}
                    </span>
                    <button
                      type="button"
                      disabled={deletingId === project.id}
                      onClick={() => handleDelete(project.id, project.name)}
                      className="text-xs text-gray-400 hover:text-red-600 transition"
                      title="프로젝트 삭제"
                    >
                      {deletingId === project.id ? "삭제중..." : "삭제"}
                    </button>
                  </div>

                  <h3 className="mt-3 text-lg font-bold text-[#18252d] group-hover:text-[#657f51] transition">
                    <Link to={`/projects/${project.id}`}>{project.name}</Link>
                  </h3>

                  <p className="mt-2 text-xs leading-relaxed text-[#647278] line-clamp-3">
                    {project.description || "등록된 설명이 없습니다."}
                  </p>
                </div>

                <div className="mt-6 border-t border-[#eef1ef] pt-4">
                  <div className="flex items-center justify-between text-xs text-[#647278] mb-3">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-[#657f51]" />
                      <span>리더 ID: #{project.leaderId}</span>
                    </span>
                    <span>
                      {new Date(project.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <Link
                      to={`/projects/${project.id}`}
                      className="flex-1 rounded-md bg-[#f4f6f3] px-3 py-2 text-center text-xs font-bold text-[#18252d] transition hover:bg-[#e7f3d0] hover:text-[#657f51]"
                    >
                      상세 및 멤버 관리 →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
