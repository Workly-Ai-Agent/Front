import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Layout from "../components/layout/Layout";
import {
  addProjectMember,
  deleteProject,
  getProject,
  getProjectMembers,
  getWorkspaceMembers,
  removeProjectMember,
  updateProject,
  updateProjectMemberRole,
  type Project,
  type ProjectMember,
  type WorkspaceMember,
} from "../lib/api";

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editLeaderId, setEditLeaderId] = useState<number>(1);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Add Member state
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | "">("");
  const [selectedRole, setSelectedRole] = useState<"MEMBER" | "LEADER">("MEMBER");
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);

  const [reloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    if (!projectId) return;

    const pId = Number(projectId);
    Promise.all([
      getProject(pId),
      getProjectMembers(pId),
    ])
      .then(async ([projData, memberData]) => {
        if (!ignore) {
          setProject(projData);
          setEditName(projData.name);
          setEditDesc(projData.description || "");
          setEditLeaderId(projData.leaderId);
          setMembers(memberData);
          setError(null);
        }

        try {
          const wsMembers = await getWorkspaceMembers(projData.workspaceId);
          if (!ignore) {
            setWorkspaceMembers(wsMembers);
          }
        } catch {
          // ignore
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(
            err instanceof Error
              ? err.message
              : "프로젝트 정보를 불러올 수 없습니다."
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
  }, [projectId, reloadKey]);

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    setIsUpdating(true);
    setUpdateSuccess(false);
    try {
      const updated = await updateProject(Number(projectId), {
        name: editName.trim(),
        description: editDesc.trim() || undefined,
        leaderId: Number(editLeaderId),
      });
      setProject(updated);
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "프로젝트 수정 중 오류가 발생했습니다."
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!project || !projectId) return;
    if (
      !confirm(
        `정말로 '${project.name}' 프로젝트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`
      )
    ) {
      return;
    }

    try {
      await deleteProject(Number(projectId));
      navigate("/projects");
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "프로젝트 삭제 중 오류가 발생했습니다."
      );
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !selectedUserId) return;
    setIsAddingMember(true);
    setMemberError(null);
    try {
      const added = await addProjectMember(Number(projectId), {
        userId: Number(selectedUserId),
        role: selectedRole,
      });
      setMembers((prev) => [...prev, added]);
      setIsAddMemberModalOpen(false);
      setSelectedUserId("");
      setSelectedRole("MEMBER");
    } catch (err) {
      setMemberError(
        err instanceof Error
          ? err.message
          : "멤버 추가 중 오류가 발생했습니다."
      );
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRoleChange = async (
    userId: number,
    newRole: "MEMBER" | "LEADER"
  ) => {
    if (!projectId) return;
    try {
      const updated = await updateProjectMemberRole(
        Number(projectId),
        userId,
        newRole
      );
      setMembers((prev) =>
        prev.map((m) => (m.userId === userId ? updated : m))
      );
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "멤버 역할 수정 중 오류가 발생했습니다."
      );
    }
  };

  const handleRemoveMember = async (userId: number, userName: string) => {
    if (!projectId) return;
    if (!confirm(`'${userName}' 멤버를 프로젝트에서 제외하시겠습니까?`)) {
      return;
    }
    try {
      await removeProjectMember(Number(projectId), userId);
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "멤버 삭제 중 오류가 발생했습니다."
      );
    }
  };

  // Candidates for adding to project (workspace members not yet in this project)
  const candidateMembers = workspaceMembers.filter(
    (wm) => !members.some((pm) => pm.userId === wm.userId)
  );

  if (isLoading) {
    return (
      <Layout>
        <div className="mx-auto max-w-[1200px] px-8 py-16 text-center">
          <div className="inline-block size-8 animate-spin rounded-full border-4 border-[#cbd4d1] border-t-[#657f51]" />
          <p className="mt-4 text-sm text-[#647278]">
            프로젝트 정보를 불러오고 있습니다...
          </p>
        </div>
      </Layout>
    );
  }

  if (error || !project) {
    return (
      <Layout>
        <div className="mx-auto max-w-[1200px] px-8 py-16 text-center">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8">
            <h2 className="text-lg font-bold text-red-800">
              프로젝트를 찾을 수 없습니다
            </h2>
            <p className="mt-2 text-sm text-red-600">
              {error || "존재하지 않는 프로젝트이거나 접근 권한이 없습니다."}
            </p>
            <Link
              to="/projects"
              className="mt-6 inline-block rounded-md bg-[#18252d] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#304047]"
            >
              ← 프로젝트 목록으로 돌아가기
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-[1200px] px-8 py-10 max-md:px-5 max-md:py-7">
        {/* Top Header */}
        <div className="mb-8 flex items-start justify-between gap-4 max-md:flex-col">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.08em] text-[#647278]">
              <Link to="/projects" className="hover:text-[#18252d]">
                PROJECTS
              </Link>
              <span>/</span>
              <span className="font-bold text-[#18252d]">
                PROJ-{project.id}
              </span>
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#18252d]">
              {project.name}
            </h1>
            <p className="mt-1 text-sm text-[#647278]">
              리더 ID: #{project.leaderId} · 워크스페이스 ID: #
              {project.workspaceId}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/projects"
              className="rounded-md border border-[#cbd4d1] bg-white px-4 py-2 text-xs font-bold text-[#304047] transition hover:bg-[#f4f6f3]"
            >
              ← 목록으로
            </Link>
            <button
              type="button"
              onClick={handleDeleteProject}
              className="rounded-md border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50"
            >
              프로젝트 삭제
            </button>
          </div>
        </div>

        {/* Two-Column Grid: Left (Settings Form) / Right (Member Management) */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Column: Project Info & Settings (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-[#dce3df] bg-white p-6 shadow-xs">
              <div className="mb-4 border-b border-[#eef1ef] pb-3">
                <h2 className="text-base font-bold text-[#18252d]">
                  프로젝트 기본 설정
                </h2>
                <p className="text-xs text-[#647278]">
                  프로젝트의 이름, 설명 및 리더 정보를 수정합니다.
                </p>
              </div>

              {updateSuccess && (
                <div className="mb-4 rounded-md bg-[#e7f3d0] p-3 text-xs font-bold text-[#657f51]">
                  ✓ 프로젝트 정보가 성공적으로 저장되었습니다.
                </div>
              )}

              <form onSubmit={handleUpdateProject} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#304047] mb-1.5">
                    프로젝트 이름
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-md border border-[#cbd4d1] bg-white px-3.5 py-2.5 text-sm text-[#18252d] outline-none transition focus:border-[#657f51] focus:ring-4 focus:ring-[#d8f36b]/35"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#304047] mb-1.5">
                    프로젝트 설명
                  </label>
                  <textarea
                    rows={4}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full rounded-md border border-[#cbd4d1] bg-white px-3.5 py-2 text-sm text-[#18252d] outline-none transition focus:border-[#657f51] focus:ring-4 focus:ring-[#d8f36b]/35"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#304047] mb-1.5">
                    프로젝트 리더 ID
                  </label>
                  <input
                    type="number"
                    required
                    value={editLeaderId}
                    onChange={(e) => setEditLeaderId(Number(e.target.value))}
                    className="w-full rounded-md border border-[#cbd4d1] bg-white px-3.5 py-2.5 text-sm text-[#18252d] outline-none transition focus:border-[#657f51] focus:ring-4 focus:ring-[#d8f36b]/35"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isUpdating || !editName.trim()}
                    className="w-full rounded-md bg-[#18252d] py-2.5 text-xs font-bold text-white transition hover:bg-[#304047] disabled:opacity-50"
                  >
                    {isUpdating ? "저장 중..." : "변경 사항 저장"}
                  </button>
                </div>
              </form>

              <div className="mt-6 border-t border-[#eef1ef] pt-4 text-xs text-[#647278] space-y-1">
                <div>
                  생성일:{" "}
                  <span className="font-mono text-[#18252d]">
                    {new Date(project.createdAt).toLocaleString("ko-KR")}
                  </span>
                </div>
                <div>
                  최종 수정:{" "}
                  <span className="font-mono text-[#18252d]">
                    {new Date(project.updatedAt).toLocaleString("ko-KR")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Member Management (7 cols) */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-[#dce3df] bg-white p-6 shadow-xs">
              <div className="mb-6 flex items-center justify-between border-b border-[#eef1ef] pb-4">
                <div>
                  <h2 className="text-base font-bold text-[#18252d]">
                    프로젝트 멤버 ({members.length})
                  </h2>
                  <p className="text-xs text-[#647278]">
                    이 프로젝트에 할당된 팀원과 역할을 관리합니다.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddMemberModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-md bg-[#18252d] px-3.5 py-2 text-xs font-bold text-[#f4f6f3] transition hover:bg-[#304047]"
                >
                  <span>+</span> 멤버 추가
                </button>
              </div>

              {/* Member list */}
              {members.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#cbd4d1] p-8 text-center">
                  <p className="text-xs font-bold text-[#18252d]">
                    배정된 프로젝트 멤버가 없습니다.
                  </p>
                  <p className="mt-1 text-xs text-[#647278]">
                    우측 상단의 '+ 멤버 추가' 버튼을 눌러 팀원을 참여시키세요.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#eef1ef]">
                  {members.map((member) => {
                    const isLeader = member.role === "LEADER";
                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#18252d] text-xs font-bold text-[#d8f36b]">
                            {member.userName
                              ? member.userName.slice(0, 2).toUpperCase()
                              : "M"}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-sm font-bold text-[#18252d]">
                                {member.userName}
                              </span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  isLeader
                                    ? "bg-[#e7f3d0] text-[#657f51]"
                                    : "bg-[#f0f7df] text-[#18252d]"
                                }`}
                              >
                                {member.role}
                              </span>
                            </div>
                            <p className="truncate text-xs text-[#647278]">
                              {member.email} · ID #{member.userId}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Role switch toggle/select */}
                          <select
                            value={member.role}
                            onChange={(e) =>
                              handleRoleChange(
                                member.userId,
                                e.target.value as "MEMBER" | "LEADER"
                              )
                            }
                            className="rounded border border-[#cbd4d1] bg-white px-2 py-1 text-xs font-semibold text-[#18252d] outline-none transition focus:border-[#657f51]"
                          >
                            <option value="MEMBER">MEMBER</option>
                            <option value="LEADER">LEADER</option>
                          </select>

                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveMember(
                                member.userId,
                                member.userName
                              )
                            }
                            className="rounded p-1 text-xs text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
                            title="멤버 제외"
                          >
                            × 제외
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Member Modal */}
      {isAddMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#18252d]/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[#dce3df] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#eef1ef] pb-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-[#647278]">
                  Project Team
                </p>
                <h3 className="text-lg font-bold text-[#18252d]">
                  프로젝트 멤버 추가
                </h3>
              </div>
              <button
                type="button"
                className="size-8 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700 text-lg"
                onClick={() => {
                  setIsAddMemberModalOpen(false);
                  setMemberError(null);
                }}
              >
                ×
              </button>
            </div>

            {memberError && (
              <div className="mt-4 rounded-md bg-[#fff1f0] p-3 text-xs text-[#b42318]">
                {memberError}
              </div>
            )}

            <form onSubmit={handleAddMember} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#304047] mb-1.5">
                  추가할 멤버 선택 <span className="text-[#b42318]">*</span>
                </label>
                {candidateMembers.length > 0 ? (
                  <select
                    required
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(Number(e.target.value))}
                    className="w-full rounded-md border border-[#cbd4d1] bg-white px-3.5 py-2.5 text-sm text-[#18252d] outline-none transition focus:border-[#657f51] focus:ring-4 focus:ring-[#d8f36b]/35"
                  >
                    <option value="">-- 워크스페이스 멤버 선택 --</option>
                    {candidateMembers.map((m) => (
                      <option key={m.id} value={m.userId}>
                        User ID #{m.userId} ({m.role})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-1">
                    <input
                      type="number"
                      required
                      placeholder="추가할 사용자의 User ID 입력"
                      value={selectedUserId}
                      onChange={(e) =>
                        setSelectedUserId(
                          e.target.value ? Number(e.target.value) : ""
                        )
                      }
                      className="w-full rounded-md border border-[#cbd4d1] bg-white px-3.5 py-2.5 text-sm text-[#18252d] outline-none transition focus:border-[#657f51] focus:ring-4 focus:ring-[#d8f36b]/35"
                    />
                    <p className="text-[11px] text-[#647278]">
                      워크스페이스에 등록된 사용자의 User ID를 입력하세요.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#304047] mb-1.5">
                  프로젝트 역할
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${
                      selectedRole === "MEMBER"
                        ? "border-[#657f51] bg-[#f0f7df] text-[#18252d]"
                        : "border-[#cbd4d1] bg-white text-[#647278] hover:bg-[#f4f6f3]"
                    }`}
                    onClick={() => setSelectedRole("MEMBER")}
                  >
                    MEMBER
                  </button>
                  <button
                    type="button"
                    className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${
                      selectedRole === "LEADER"
                        ? "border-[#657f51] bg-[#f0f7df] text-[#18252d]"
                        : "border-[#cbd4d1] bg-white text-[#647278] hover:bg-[#f4f6f3]"
                    }`}
                    onClick={() => setSelectedRole("LEADER")}
                  >
                    LEADER
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isAddingMember}
                  className="rounded-md border border-[#cbd4d1] bg-white px-4 py-2 text-xs font-bold text-[#304047] transition hover:bg-[#f4f6f3]"
                  onClick={() => setIsAddMemberModalOpen(false)}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isAddingMember || !selectedUserId}
                  className="rounded-md bg-[#18252d] px-5 py-2 text-xs font-bold text-white transition hover:bg-[#304047] disabled:opacity-50"
                >
                  {isAddingMember ? "추가 중..." : "멤버 추가"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
