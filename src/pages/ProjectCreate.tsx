import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/layout/Layout";
import {
  createProject,
  getWorkspaceMembers,
  type WorkspaceMember,
} from "../lib/api";
import { useSessionStore } from "../stores/sessionStore";
import {
  selectActiveWorkspace,
  useWorkspaceStore,
} from "../stores/workspaceStore";

export default function ProjectCreate() {
  const navigate = useNavigate();
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const activeWorkspace = useWorkspaceStore(selectActiveWorkspace);
  const setActiveWorkspaceId = useWorkspaceStore(
    (state) => state.setActiveWorkspaceId
  );
  const createWorkspace = useWorkspaceStore((state) => state.createWorkspace);
  const currentUser = useSessionStore((state) => state.user);

  // Selected workspace for this project
  const [userSelectedWsId, setUserSelectedWsId] = useState<number | null>(null);
  const selectedWorkspaceId =
    userSelectedWsId ??
    activeWorkspace?.id ??
    (workspaces.length > 0 ? workspaces[0].id : null);

  // Project form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [leaderId, setLeaderId] = useState<number>(currentUser.id ?? 1);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  // New Workspace inline creation state (if needed)
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [newWsName, setNewWsName] = useState("");
  const [newWsDesc, setNewWsDesc] = useState("");
  const [wsCreateError, setWsCreateError] = useState<string | null>(null);
  const [isSubmittingWs, setIsSubmittingWs] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load members when selectedWorkspaceId changes
  useEffect(() => {
    let ignore = false;
    if (!selectedWorkspaceId) {
      return;
    }

    Promise.resolve().then(() => {
      if (!ignore) setIsLoadingMembers(true);
    });

    getWorkspaceMembers(Number(selectedWorkspaceId))
      .then((res) => {
        if (!ignore) {
          setMembers(res);
          if (currentUser.id && res.some((m) => m.userId === currentUser.id)) {
            setLeaderId(currentUser.id);
          } else if (res.length > 0) {
            setLeaderId(res[0].userId);
          }
        }
      })
      .catch(() => {
        if (!ignore) setMembers([]);
      })
      .finally(() => {
        if (!ignore) setIsLoadingMembers(false);
      });

    return () => {
      ignore = true;
    };
  }, [selectedWorkspaceId, currentUser.id]);

  const handleWorkspaceChange = (wsId: number) => {
    setUserSelectedWsId(wsId);
    setActiveWorkspaceId(wsId);
  };

  const handleCreateWorkspaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    setWsCreateError(null);
    setIsSubmittingWs(true);
    try {
      const created = await createWorkspace(
        newWsName.trim(),
        newWsDesc.trim() || undefined
      );
      setUserSelectedWsId(created.id);
      setActiveWorkspaceId(created.id);
      setIsCreatingWorkspace(false);
      setNewWsName("");
      setNewWsDesc("");
    } catch (err) {
      setWsCreateError(
        err instanceof Error
          ? err.message
          : "워크스페이스 생성에 실패했습니다."
      );
    } finally {
      setIsSubmittingWs(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkspaceId) {
      setError("프로젝트가 속할 워크스페이스를 먼저 선택해주세요.");
      return;
    }
    if (!name.trim()) {
      setError("프로젝트 이름을 입력하세요.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const created = await createProject(Number(selectedWorkspaceId), {
        name: name.trim(),
        description: description.trim() || undefined,
        leaderId: Number(leaderId),
      });
      navigate(`/projects/${created.id}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "프로젝트를 생성하지 못했습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentSelectedWorkspace = workspaces.find(
    (w) => w.id === selectedWorkspaceId
  );

  return (
    <Layout>
      <div className="mx-auto max-w-[900px] px-8 py-10 max-md:px-5 max-md:py-7">
        {/* Header Breadcrumb */}
        <div className="mb-8">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.08em] text-[#647278]">
            <Link to="/projects" className="hover:text-[#18252d]">
              PROJECTS
            </Link>
            <span>/</span>
            <span className="font-bold text-[#18252d]">NEW</span>
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#18252d]">
            새 프로젝트 생성
          </h1>
          <p className="mt-2 text-sm text-[#647278]">
            프로젝트는 워크스페이스 안에 속합니다. 워크스페이스를 선택한 후 프로젝트를 생성하세요.
          </p>
        </div>

        {/* If no workspaces exist at all */}
        {workspaces.length === 0 && !isCreatingWorkspace ? (
          <div className="rounded-2xl border border-dashed border-[#cbd4d1] bg-white p-10 text-center shadow-xs">
            <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-[#f0f7df] text-xl text-[#657f51]">
              ◈
            </div>
            <h3 className="text-lg font-bold text-[#18252d]">
              생성된 워크스페이스가 없습니다
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#647278]">
              프로젝트는 반드시 특정 워크스페이스에 속해야 합니다. 프로젝트를 시작하기 전에 먼저 워크스페이스를 생성해주세요.
            </p>
            <button
              type="button"
              onClick={() => setIsCreatingWorkspace(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-md bg-[#18252d] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#304047]"
            >
              <span>+</span> 새 워크스페이스 만들기
            </button>
          </div>
        ) : isCreatingWorkspace ? (
          /* Inline Workspace Creation Card */
          <div className="mb-8 rounded-2xl border border-[#d8f36b] bg-[#f8faf7] p-8 shadow-xs">
            <div className="mb-4 border-b border-[#dce3df] pb-3">
              <p className="font-mono text-xs uppercase tracking-wider text-[#657f51]">
                Step 1: Workspace Setup
              </p>
              <h2 className="text-lg font-bold text-[#18252d]">
                새 워크스페이스 생성하기
              </h2>
              <p className="text-xs text-[#647278]">
                생성된 워크스페이스에 바로 프로젝트가 추가됩니다.
              </p>
            </div>

            {wsCreateError && (
              <div className="mb-4 rounded-md bg-[#fff1f0] p-3 text-xs text-[#b42318]">
                {wsCreateError}
              </div>
            )}

            <form onSubmit={handleCreateWorkspaceSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#304047] mb-1.5">
                  워크스페이스 이름 <span className="text-[#b42318]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: AI Workforce 팀, 마케팅 사업부"
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  className="w-full rounded-md border border-[#cbd4d1] bg-white px-3.5 py-2.5 text-sm text-[#18252d] outline-none transition focus:border-[#657f51] focus:ring-4 focus:ring-[#d8f36b]/35"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#304047] mb-1.5">
                  설명 (선택)
                </label>
                <textarea
                  rows={2}
                  placeholder="워크스페이스에 대한 간략한 설명"
                  value={newWsDesc}
                  onChange={(e) => setNewWsDesc(e.target.value)}
                  className="w-full rounded-md border border-[#cbd4d1] bg-white px-3.5 py-2 text-sm text-[#18252d] outline-none transition focus:border-[#657f51] focus:ring-4 focus:ring-[#d8f36b]/35"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                {workspaces.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsCreatingWorkspace(false)}
                    className="rounded-md border border-[#cbd4d1] bg-white px-4 py-2 text-xs font-bold text-[#304047] hover:bg-[#f4f6f3]"
                  >
                    취소
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmittingWs || !newWsName.trim()}
                  className="rounded-md bg-[#18252d] px-5 py-2 text-xs font-bold text-white hover:bg-[#304047] disabled:opacity-50"
                >
                  {isSubmittingWs ? "생성 중..." : "워크스페이스 생성 후 계속하기 →"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Normal Project Creation Form */
          <div>
            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="rounded-2xl border border-[#dce3df] bg-white p-8 shadow-xs max-sm:p-5">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. Workspace Selection Field (Crucial requirement) */}
                <div className="rounded-xl border border-[#eef1ef] bg-[#f8faf7] p-5">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <label
                      htmlFor="selectWorkspace"
                      className="block text-sm font-bold text-[#18252d]"
                    >
                      소속 워크스페이스 선택 <span className="text-[#b42318]">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCreatingWorkspace(true)}
                      className="text-xs font-bold text-[#657f51] hover:underline"
                    >
                      + 새 워크스페이스 만들기
                    </button>
                  </div>

                  <select
                    id="selectWorkspace"
                    required
                    value={selectedWorkspaceId ?? ""}
                    onChange={(e) =>
                      handleWorkspaceChange(Number(e.target.value))
                    }
                    className="w-full rounded-md border border-[#cbd4d1] bg-white px-4 py-3 text-sm font-semibold text-[#18252d] outline-none transition focus:border-[#657f51] focus:ring-4 focus:ring-[#d8f36b]/35"
                  >
                    <option value="">-- 워크스페이스를 선택하세요 --</option>
                    {workspaces.map((ws) => (
                      <option key={ws.id} value={ws.id}>
                        {ws.name} (ID: #{ws.id})
                        {ws.description ? ` - ${ws.description}` : ""}
                      </option>
                    ))}
                  </select>

                  {currentSelectedWorkspace && (
                    <div className="mt-2.5 flex items-center gap-2 text-xs text-[#647278]">
                      <span className="size-2 rounded-full bg-[#657f51]" />
                      <span>
                        선택된 워크스페이스:{" "}
                        <strong className="text-[#18252d]">
                          {currentSelectedWorkspace.name}
                        </strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* 2. Project Name */}
                <div>
                  <label
                    htmlFor="projectName"
                    className="block text-sm font-bold text-[#304047] mb-2"
                  >
                    프로젝트 이름 <span className="text-[#b42318]">*</span>
                  </label>
                  <input
                    id="projectName"
                    type="text"
                    required
                    maxLength={100}
                    placeholder="예: AI Workforce Agent, 신제품 마케팅"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!selectedWorkspaceId}
                    className="w-full rounded-md border border-[#cbd4d1] bg-white px-4 py-3 text-sm text-[#18252d] outline-none transition focus:border-[#657f51] focus:ring-4 focus:ring-[#d8f36b]/35 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  <p className="mt-1.5 text-xs text-[#647278]">
                    최대 100자까지 입력 가능합니다.
                  </p>
                </div>

                {/* 3. Project Description */}
                <div>
                  <label
                    htmlFor="projectDesc"
                    className="block text-sm font-bold text-[#304047] mb-2"
                  >
                    프로젝트 설명
                  </label>
                  <textarea
                    id="projectDesc"
                    rows={4}
                    maxLength={1000}
                    placeholder="프로젝트의 목적, 주요 목표, 업무 범위 등을 간략히 적어주세요."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={!selectedWorkspaceId}
                    className="w-full rounded-md border border-[#cbd4d1] bg-white px-4 py-3 text-sm text-[#18252d] outline-none transition focus:border-[#657f51] focus:ring-4 focus:ring-[#d8f36b]/35 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  <p className="mt-1.5 text-xs text-[#647278]">
                    최대 1000자까지 입력 가능합니다.
                  </p>
                </div>

                {/* 4. Project Leader Selection */}
                <div>
                  <label
                    htmlFor="leaderId"
                    className="block text-sm font-bold text-[#304047] mb-2"
                  >
                    프로젝트 리더 <span className="text-[#b42318]">*</span>
                  </label>
                  {!selectedWorkspaceId ? (
                    <div className="rounded-md border border-[#cbd4d1] bg-gray-100 px-4 py-3 text-sm text-[#647278]">
                      워크스페이스를 먼저 선택하면 소속 멤버 목록이 표시됩니다.
                    </div>
                  ) : members.length > 0 ? (
                    <div className="space-y-2">
                      <select
                        id="leaderId"
                        value={leaderId}
                        onChange={(e) => setLeaderId(Number(e.target.value))}
                        className="w-full rounded-md border border-[#cbd4d1] bg-white px-4 py-3 text-sm text-[#18252d] outline-none transition focus:border-[#657f51] focus:ring-4 focus:ring-[#d8f36b]/35"
                      >
                        {members.map((member) => (
                          <option key={member.id} value={member.userId}>
                            사용자 ID: #{member.userId} ({member.role}
                            {currentUser.id === member.userId ? " - 나" : ""})
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-[#647278]">
                        선택된 워크스페이스에 참여 중인 멤버 중에서 리더를 지정합니다.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        id="leaderId"
                        type="number"
                        required
                        value={leaderId}
                        onChange={(e) => setLeaderId(Number(e.target.value))}
                        className="w-full rounded-md border border-[#cbd4d1] bg-white px-4 py-3 text-sm text-[#18252d] outline-none transition focus:border-[#657f51] focus:ring-4 focus:ring-[#d8f36b]/35"
                      />
                      <p className="text-xs text-[#647278]">
                        {isLoadingMembers
                          ? "멤버 목록을 조회 중입니다..."
                          : "프로젝트 리더가 될 사용자의 User ID를 입력하세요."}
                      </p>
                    </div>
                  )}
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-3 border-t border-[#eef1ef] pt-6">
                  <Link
                    to="/projects"
                    className="rounded-md border border-[#cbd4d1] bg-white px-5 py-3 text-sm font-bold text-[#304047] transition hover:bg-[#f4f6f3]"
                  >
                    취소
                  </Link>
                  <button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      !name.trim() ||
                      !selectedWorkspaceId
                    }
                    className="rounded-md bg-[#18252d] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#304047] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting
                      ? "생성 중..."
                      : "프로젝트 생성 완료 →"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
