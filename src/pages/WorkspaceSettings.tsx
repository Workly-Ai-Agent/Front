import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/Layout";
import {
  addWorkspaceMember,
  getWorkspaceMembers,
  removeWorkspaceMember,
  updateWorkspaceMemberRole,
  type WorkspaceMember,
  type WorkspaceRole,
} from "../lib/api";
import {
  selectActiveWorkspace,
  useWorkspaceStore,
} from "../stores/workspaceStore";

export default function WorkspaceSettings() {
  const navigate = useNavigate();
  const activeWorkspace = useWorkspaceStore(selectActiveWorkspace);
  const updateWorkspace = useWorkspaceStore((state) => state.updateWorkspace);
  const deleteWorkspace = useWorkspaceStore((state) => state.deleteWorkspace);

  // Workspace Info State
  const [name, setName] = useState(() => activeWorkspace?.name ?? "");
  const [description, setDescription] = useState(
    () => activeWorkspace?.description ?? ""
  );
  const [loadedWorkspaceId, setLoadedWorkspaceId] = useState<number | null>(
    null
  );

  if (activeWorkspace && activeWorkspace.id !== loadedWorkspaceId) {
    setLoadedWorkspaceId(activeWorkspace.id);
    setName(activeWorkspace.name);
    setDescription(activeWorkspace.description || "");
  }

  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const [infoSuccess, setInfoSuccess] = useState(false);

  // Members State
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);

  // Add Member State
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>("MEMBER");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // Delete Workspace State
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let ignore = false;
    if (!activeWorkspace) return;

    Promise.resolve().then(() => {
      if (!ignore) setIsLoadingMembers(true);
    });

    getWorkspaceMembers(activeWorkspace.id)
      .then((data) => {
        if (!ignore) {
          setMembers(data);
          setMemberError(null);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setMemberError(
            err instanceof Error
              ? err.message
              : "멤버 목록을 불러오지 못했습니다."
          );
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoadingMembers(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [activeWorkspace]);

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace || !name.trim()) return;
    setIsSavingInfo(true);
    setInfoSuccess(false);
    try {
      await updateWorkspace(activeWorkspace.id, name.trim(), description.trim());
      setInfoSuccess(true);
      setTimeout(() => setInfoSuccess(false), 3000);
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "워크스페이스 정보 수정 중 오류가 발생했습니다."
      );
    } finally {
      setIsSavingInfo(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace || !inviteEmail.trim()) return;
    setIsInviting(true);
    setMemberError(null);
    setInviteSuccess(false);
    try {
      const newMember = await addWorkspaceMember(activeWorkspace.id, {
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      setMembers((prev) => [...prev, newMember]);
      setInviteEmail("");
      setInviteSuccess(true);
      setTimeout(() => setInviteSuccess(false), 3000);
    } catch (err) {
      setMemberError(
        err instanceof Error
          ? err.message
          : "멤버 추가 중 오류가 발생했습니다. 이메일을 확인해주세요."
      );
    } finally {
      setIsInviting(false);
    }
  };

  const handleUpdateMemberRole = async (
    memberId: number,
    newRole: WorkspaceRole
  ) => {
    if (!activeWorkspace) return;
    try {
      const updated = await updateWorkspaceMemberRole(
        activeWorkspace.id,
        memberId,
        newRole
      );
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? updated : m))
      );
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "멤버 역할 수정 중 오류가 발생했습니다."
      );
    }
  };

  const handleRemoveMember = async (memberId: number, userId: number) => {
    if (!activeWorkspace) return;
    if (
      !confirm(
        `User ID #${userId} 멤버를 워크스페이스에서 제외하시겠습니까?`
      )
    ) {
      return;
    }
    try {
      await removeWorkspaceMember(activeWorkspace.id, memberId);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "멤버 삭제 중 오류가 발생했습니다."
      );
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!activeWorkspace) return;
    if (
      !confirm(
        `경고: 정말로 '${activeWorkspace.name}' 워크스페이스를 영구 삭제하시겠습니까? 속한 모든 프로젝트와 멤버 데이터가 삭제됩니다.`
      )
    ) {
      return;
    }
    setIsDeleting(true);
    try {
      await deleteWorkspace(activeWorkspace.id);
      alert("워크스페이스가 삭제되었습니다.");
      navigate("/");
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "워크스페이스 삭제 중 오류가 발생했습니다."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (!activeWorkspace) {
    return (
      <Layout>
        <div className="mx-auto max-w-[1200px] px-8 py-16 text-center">
          <div className="rounded-2xl border border-dashed border-[#cbd4d1] bg-white p-12">
            <h2 className="text-lg font-bold text-[#18252d]">
              선택된 워크스페이스가 없습니다
            </h2>
            <p className="mt-2 text-sm text-[#647278]">
              상단 드롭다운에서 워크스페이스를 선택하거나 새 워크스페이스를 생성해주세요.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-[1200px] px-8 py-10 max-md:px-5 max-md:py-7">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.08em] text-[#647278]">
            <span>{activeWorkspace.name}</span>
            <span>/</span>
            <span className="font-bold text-[#18252d]">SETTINGS</span>
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#18252d] sm:text-4xl">
            워크스페이스 설정 & 멤버 관리
          </h1>
          <p className="mt-2 text-sm text-[#647278]">
            워크스페이스 기본 정보 및 소속 팀원의 권한을 통합 관리합니다.
          </p>
        </div>

        <div className="space-y-8">
          {/* Section 1: Basic Information */}
          <section className="rounded-2xl border border-[#dce3df] bg-white p-6 shadow-xs sm:p-8">
            <div className="mb-6 border-b border-[#eef1ef] pb-4">
              <h2 className="text-lg font-bold text-[#18252d]">
                워크스페이스 기본 정보
              </h2>
              <p className="text-xs text-[#647278]">
                이름과 설명을 변경할 수 있습니다.
              </p>
            </div>

            {infoSuccess && (
              <div className="mb-4 rounded-md bg-[#e7f3d0] p-3 text-xs font-bold text-[#657f51]">
                ✓ 워크스페이스 정보가 성공적으로 업데이트되었습니다.
              </div>
            )}

            <form onSubmit={handleUpdateInfo} className="max-w-2xl space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#304047] mb-1.5">
                  워크스페이스 이름 <span className="text-[#b42318]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border border-[#cbd4d1] bg-white px-3.5 py-2.5 text-sm text-[#18252d] outline-none transition focus:border-[#657f51] focus:ring-4 focus:ring-[#d8f36b]/35"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#304047] mb-1.5">
                  설명
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-md border border-[#cbd4d1] bg-white px-3.5 py-2 text-sm text-[#18252d] outline-none transition focus:border-[#657f51] focus:ring-4 focus:ring-[#d8f36b]/35"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingInfo || !name.trim()}
                  className="rounded-md bg-[#18252d] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#304047] disabled:opacity-50"
                >
                  {isSavingInfo ? "저장 중..." : "정보 변경 저장"}
                </button>
              </div>
            </form>
          </section>

          {/* Section 2: Member Management */}
          <section className="rounded-2xl border border-[#dce3df] bg-white p-6 shadow-xs sm:p-8">
            <div className="mb-6 border-b border-[#eef1ef] pb-4">
              <h2 className="text-lg font-bold text-[#18252d]">
                팀 멤버 초대 및 관리 ({members.length}명)
              </h2>
              <p className="text-xs text-[#647278]">
                이메일로 사용자를 워크스페이스에 초대하고 관리자(ADMIN) 또는 일반 멤버(MEMBER) 권한을 부여합니다.
              </p>
            </div>

            {/* Invite Form */}
            <div className="mb-8 rounded-xl border border-[#dce3df] bg-[#f8faf7] p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#18252d] mb-3">
                + 새 멤버 추가하기
              </h3>

              {memberError && (
                <div className="mb-3 rounded-md bg-[#fff1f0] p-3 text-xs text-[#b42318]">
                  {memberError}
                </div>
              )}
              {inviteSuccess && (
                <div className="mb-3 rounded-md bg-[#e7f3d0] p-3 text-xs font-bold text-[#657f51]">
                  ✓ 멤버가 성공적으로 추가되었습니다.
                </div>
              )}

              <form
                onSubmit={handleInviteMember}
                className="flex flex-wrap items-end gap-3"
              >
                <div className="flex-1 min-w-[240px]">
                  <label className="block text-[11px] font-bold text-[#647278] mb-1">
                    사용자 이메일
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full rounded-md border border-[#cbd4d1] bg-white px-3.5 py-2 text-sm text-[#18252d] outline-none transition focus:border-[#657f51]"
                  />
                </div>

                <div className="w-36">
                  <label className="block text-[11px] font-bold text-[#647278] mb-1">
                    권한 (Role)
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) =>
                      setInviteRole(e.target.value as WorkspaceRole)
                    }
                    className="w-full rounded-md border border-[#cbd4d1] bg-white px-3 py-2 text-sm text-[#18252d] outline-none transition focus:border-[#657f51]"
                  >
                    <option value="MEMBER">MEMBER (일반)</option>
                    <option value="ADMIN">ADMIN (관리자)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isInviting || !inviteEmail.trim()}
                  className="rounded-md bg-[#18252d] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#304047] disabled:opacity-50"
                >
                  {isInviting ? "추가 중..." : "멤버 추가"}
                </button>
              </form>
            </div>

            {/* Members List Table */}
            {isLoadingMembers ? (
              <div className="py-8 text-center text-xs text-[#647278]">
                멤버 목록을 불러오고 있습니다...
              </div>
            ) : members.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#647278]">
                등록된 멤버가 없습니다.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#eef1ef] text-[11px] font-bold uppercase tracking-wider text-[#8fa0a5]">
                      <th className="pb-3">멤버 정보</th>
                      <th className="pb-3">User ID</th>
                      <th className="pb-3">권한 (Role)</th>
                      <th className="pb-3">가입일</th>
                      <th className="pb-3 text-right">작업</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eef1ef]">
                    {members.map((member) => {
                      const isAdmin = member.role === "ADMIN";
                      return (
                        <tr key={member.id} className="hover:bg-[#f8faf7]/60">
                          <td className="py-3.5">
                            <div className="flex items-center gap-3">
                              <span className="grid size-8 place-items-center rounded-full bg-[#18252d] text-xs font-bold text-[#d8f36b]">
                                #{member.id}
                              </span>
                              <span className="font-semibold text-[#18252d]">
                                멤버 #{member.id}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 font-mono text-xs text-[#647278]">
                            #{member.userId}
                          </td>
                          <td className="py-3.5">
                            <select
                              value={member.role}
                              onChange={(e) =>
                                handleUpdateMemberRole(
                                  member.id,
                                  e.target.value as WorkspaceRole
                                )
                              }
                              className={`rounded-md border px-2.5 py-1 text-xs font-bold outline-none transition ${
                                isAdmin
                                  ? "border-[#18252d] bg-[#18252d] text-[#d8f36b]"
                                  : "border-[#cbd4d1] bg-white text-[#18252d]"
                              }`}
                            >
                              <option value="MEMBER">MEMBER</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                          </td>
                          <td className="py-3.5 text-xs text-[#647278]">
                            {new Date(member.joinedAt).toLocaleDateString(
                              "ko-KR"
                            )}
                          </td>
                          <td className="py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveMember(member.id, member.userId)
                              }
                              className="rounded px-2.5 py-1 text-xs text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
                            >
                              내보내기
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Section 3: Danger Zone */}
          <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-xs sm:p-8">
            <div className="mb-4 border-b border-red-100 pb-3">
              <h2 className="text-lg font-bold text-red-700">
                위험 구역 (Danger Zone)
              </h2>
              <p className="text-xs text-[#647278]">
                이 워크스페이스를 완전히 삭제합니다.
              </p>
            </div>

            <div className="flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-start">
              <div>
                <p className="text-sm font-semibold text-[#18252d]">
                  이 워크스페이스 삭제
                </p>
                <p className="text-xs text-[#647278] mt-0.5">
                  삭제 시 속한 모든 프로젝트, 멤버 설정이 영구적으로 제거되며 복구할 수 없습니다.
                </p>
              </div>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteWorkspace}
                className="rounded-md bg-red-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-red-700 disabled:opacity-50 shrink-0"
              >
                {isDeleting ? "삭제 중..." : "워크스페이스 삭제"}
              </button>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
