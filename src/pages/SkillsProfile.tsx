import { useEffect, useState } from "react";
import Layout from "../components/layout/Layout";
import { addUserSkill, createSkill, deleteUserSkill, extractProfileSkills, getSkills, getUserSkills, type ExtractedSkill, type UserSkill } from "../lib/api";
import { useSessionStore } from "../stores/sessionStore";

export default function SkillsProfile() {
  const userId = useSessionStore((state) => state.user.id);
  const [mySkills, setMySkills] = useState<UserSkill[]>([]);
  const [customSkillName, setCustomSkillName] = useState("");
  const [isCreatingSkill, setIsCreatingSkill] = useState(false);
  const [profileText, setProfileText] = useState("");
  const [extractedSkills, setExtractedSkills] = useState<ExtractedSkill[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (userId) getUserSkills(userId).then(setMySkills).catch((e) => setError(e.message));
  }, [userId]);

  const removeSkill = async (skill: UserSkill) => {
    if (!userId) return;
    try {
      await deleteUserSkill(userId, skill.id);
      setMySkills((current) => current.filter((item) => item.id !== skill.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "스킬 삭제에 실패했습니다.");
    }
  };

  const addCustomSkill = async () => {
    if (!userId || !customSkillName.trim()) return;
    setIsCreatingSkill(true);
    setError("");

    try {
      const skill = await createSkill(customSkillName.trim());
      const userSkill = await addUserSkill(userId, skill.id);
      setMySkills((current) => [...current, userSkill]);
      setCustomSkillName("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "새 스킬 등록에 실패했습니다.");
    } finally {
      setIsCreatingSkill(false);
    }
  };

  const extractSkills = async () => {
    if (!profileText.trim()) return;
    setIsExtracting(true);
    setError("");
    try {
      const result = await extractProfileSkills(profileText.trim());
      const owned = new Set(mySkills.map((item) => item.skillName.toLocaleLowerCase()));
      setExtractedSkills(result.skills.filter((item) => !owned.has(item.name.toLocaleLowerCase())));
    } catch (e) {
      setError(e instanceof Error ? e.message : "프로필에서 스킬을 추출하지 못했습니다.");
    } finally {
      setIsExtracting(false);
    }
  };

  const addExtractedSkill = async (candidate: ExtractedSkill) => {
    if (!userId) return;
    setIsCreatingSkill(true);
    setError("");
    try {
      const catalog = await getSkills();
      const existing = catalog.find((item) => item.name.toLocaleLowerCase() === candidate.name.toLocaleLowerCase());
      const skill = existing ?? await createSkill(candidate.name);
      const userSkill = await addUserSkill(userId, skill.id);
      setMySkills((current) => [...current, userSkill]);
      setExtractedSkills((current) => current.filter((item) => item.name !== candidate.name));
    } catch (e) {
      setError(e instanceof Error ? e.message : "추출한 스킬을 프로필에 추가하지 못했습니다.");
    } finally {
      setIsCreatingSkill(false);
    }
  };

  return (
    <Layout>
      <main className="mx-auto max-w-4xl px-8 py-10 max-md:px-5">
        <p className="font-mono text-xs uppercase tracking-wider text-[#657f51]">People / Skill Profile</p>
        <h1 className="mt-2 text-3xl font-bold text-[#18252d]">나의 스킬 프로필</h1>
        <p className="mt-2 text-sm text-[#647278]">등록한 스킬은 AI 업무 배정과 프로젝트 추천에 활용됩니다.</p>
        {error && <p className="mt-5 rounded-md bg-[#fff1f0] p-3 text-sm text-[#b42318]">{error}</p>}
        <section className="mt-8 rounded-2xl border border-[#dce3df] bg-white p-6">
          <h2 className="font-bold text-[#18252d]">경력·소개에서 스킬 추출</h2>
          <p className="mt-1 text-sm text-[#647278]">이력서나 자기소개를 붙여 넣으면 근거와 함께 스킬 후보를 제안합니다. 추가할 항목을 직접 선택하세요.</p>
          <textarea value={profileText} onChange={(event) => setProfileText(event.target.value)} rows={4} placeholder="예: Kotlin과 Spring Boot로 REST API를 개발했고, Figma로 앱 화면을 설계했습니다." className="mt-4 w-full rounded-md border border-[#cbd4d1] px-3 py-2.5 text-sm" />
          <button type="button" onClick={extractSkills} disabled={isExtracting || !profileText.trim()} className="mt-3 rounded-md bg-[#18252d] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40">{isExtracting ? "분석 중..." : "스킬 추출"}</button>
          {extractedSkills.length > 0 && <div className="mt-4 space-y-2">{extractedSkills.map((candidate) => <div key={candidate.name} className="flex items-center justify-between gap-3 rounded-lg border border-[#eef1ef] p-3"><div><p className="text-sm font-bold">{candidate.name}</p><p className="mt-1 text-xs text-[#647278]">근거: {candidate.evidence || "입력한 프로필에서 확인"}</p></div><button type="button" onClick={() => addExtractedSkill(candidate)} disabled={isCreatingSkill} className="rounded-md border px-3 py-2 text-xs font-bold">프로필에 추가</button></div>)}</div>}
        </section>
        <section className="mt-8 rounded-2xl border border-[#dce3df] bg-white p-6">
          <h2 className="font-bold text-[#18252d]">보유 스킬</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {mySkills.map((skill) => (
              <button key={skill.id} type="button" onClick={() => removeSkill(skill)} className="rounded-full bg-[#d8f36b] px-3 py-1.5 text-sm" title="클릭해서 삭제">
                {skill.skillName} ×
              </button>
            ))}
            {mySkills.length === 0 && <span className="text-sm text-[#647278]">아직 등록한 스킬이 없습니다.</span>}
          </div>
          <div className="mt-6 border-t border-[#eef1ef] pt-5">
            <p className="text-sm font-bold text-[#304047]">스킬 직접 등록</p>
            <div className="mt-3 flex gap-3">
              <input
                value={customSkillName}
                onChange={(event) => setCustomSkillName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void addCustomSkill();
                  }
                }}
                placeholder="예: LangChain, Figma, 프로젝트 리딩"
                className="flex-1 rounded-md border border-[#cbd4d1] px-3 py-2.5 text-sm"
              />
              <button
                type="button"
                onClick={addCustomSkill}
                disabled={isCreatingSkill || !customSkillName.trim()}
                className="rounded-md border border-[#18252d] px-5 text-sm font-bold text-[#18252d] disabled:opacity-40"
              >
                {isCreatingSkill ? "등록 중..." : "직접 등록"}
              </button>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
