import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Layout from "../components/layout/Layout";
import { generateAgentTasks, getChannel, getProject, getWorkspaceProjects, sendMessage, type Message, type Project, type Task } from "../lib/api";
import { selectActiveWorkspace, useWorkspaceStore } from "../stores/workspaceStore";

export default function ProjectAiTasks() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const activeWorkspace = useWorkspaceStore(selectActiveWorkspace);
  const [project, setProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState(projectId ?? "");
  const [messages, setMessages] = useState<Message[]>([]);
  const [request, setRequest] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [createdTasks, setCreatedTasks] = useState<Task[]>([]);
  const [error, setError] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    const projectRequest = projectId
      ? getProject(Number(projectId))
      : activeWorkspace
        ? getWorkspaceProjects(activeWorkspace.id).then((items) => {
            setProjects(items);
            if (items.length === 0) {
              navigate("/projects/new");
              return undefined;
            }
            const selected = selectedProjectId || String(items[0]?.id ?? "");
            setSelectedProjectId(selected);
            return selected ? items.find((item) => item.id === Number(selected)) : undefined;
          })
        : Promise.resolve(undefined);

    projectRequest
      .then((value) => {
        if (!value) throw new Error("선택된 프로젝트가 없습니다.");
        setProject(value);
        return getChannel(value.workspaceId, value.id);
      })
      .then(setMessages)
      .catch((e) => setError(e.message));
  }, [projectId, activeWorkspace, selectedProjectId, navigate]);

  const selectProject = (value: string) => {
    setSelectedProjectId(value);
    setProject(null);
    setMessages([]);
    getProject(Number(value))
      .then((value) => {
        setProject(value);
        return getChannel(value.workspaceId, value.id);
      })
      .then(setMessages)
      .catch((e) => setError(e.message));
  };

  const sendProjectMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!project || !chatInput.trim()) return;
    try {
      const message = await sendMessage(project.workspaceId, null, chatInput.trim(), project.id);
      setMessages((current) => [...current, message]);
      setChatInput("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "프로젝트 채팅 전송에 실패했습니다.");
    }
  };

  const applyFromConversation = async (message?: Message) => {
    if (!project || !request.trim() && !message) return;
    setIsRunning(true);
    setError("");
    try {
      const conversation = messages.map((item) => `${item.senderName}: ${item.content}`).join("\n");
      const instruction = message?.content ?? request.trim();
      const tasks = await generateAgentTasks(project.id, `프로젝트 채팅을 기반으로 Task를 반영해줘.\n[대화]\n${conversation}\n[적용 요청]\n${instruction}`);
      setCreatedTasks(tasks);
      setRequest("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI Task 반영에 실패했습니다.");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Layout>
      <main className="mx-auto max-w-5xl px-8 py-10 max-md:px-5">
        <Link to={`/projects/${projectId}`} className="text-sm font-bold text-[#657f51]">← 프로젝트로 돌아가기</Link>
        <h1 className="mt-3 text-3xl font-bold text-[#18252d]">{project?.name ?? "프로젝트"} · 업무 정리</h1>
        {projects.length > 0 && <select value={selectedProjectId} onChange={(e) => selectProject(e.target.value)} className="mt-5 w-full max-w-md rounded-md border border-[#cbd4d1] bg-white px-3 py-2.5 text-sm"><option value="">프로젝트 선택</option>{projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>}
        <p className="mt-2 text-sm text-[#647278]">프로젝트 채팅을 확인하고 AI가 Task로 반영할 내용을 선택하세요.</p>
        {error && <p className="mt-5 rounded-md bg-[#fff1f0] p-3 text-sm text-[#b42318]">{error}</p>}
        <section className="mt-8 rounded-2xl border border-[#dce3df] bg-white p-6">
          <h2 className="font-bold">Task 반영</h2>
          <p className="mt-1 text-sm text-[#647278]">프로젝트 채팅 전체 또는 정리된 문서를 바탕으로 Task 생성을 요청하세요.</p>
          <div className="mt-4 flex gap-3"><textarea value={request} onChange={(e) => setRequest(e.target.value)} rows={3} placeholder="정리된 문서나 Task 생성 요청을 입력하세요." className="flex-1 rounded-md border border-[#cbd4d1] px-3 py-2.5 text-sm" /><button type="button" onClick={() => applyFromConversation()} disabled={isRunning || !request.trim()} className="self-end rounded-md bg-[#18252d] px-5 py-3 text-sm font-bold text-white disabled:opacity-40">{isRunning ? "AI 처리 중..." : "Task 반영"}</button></div>
        </section>
        <section className="mt-6 rounded-2xl border border-[#dce3df] bg-white p-6">
          <h2 className="font-bold">프로젝트 채팅</h2>
          <div className="mt-4 max-h-96 space-y-3 overflow-y-auto rounded-xl bg-[#f8faf7] p-4">
            {messages.length === 0 && <p className="text-sm text-[#647278]">아직 프로젝트 채팅이 없습니다.</p>}
            {messages.map((message) => <div key={message.id} className="rounded-lg border border-[#dce3df] bg-white p-3"><p className="text-xs font-bold text-[#657f51]">{message.senderName}</p><p className="mt-1 text-sm text-[#304047]">{message.content}</p><button type="button" onClick={() => applyFromConversation(message)} className="mt-3 text-xs font-bold text-[#657f51] hover:underline">이 내용으로 Task 만들기</button></div>)}
          </div>
          <form onSubmit={sendProjectMessage} className="mt-4 flex gap-3"><input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="프로젝트 채팅을 입력하세요" className="min-w-0 flex-1 rounded-md border border-[#cbd4d1] px-3 py-2.5 text-sm" /><button disabled={!chatInput.trim()} className="rounded-md bg-[#18252d] px-5 text-sm font-bold text-white disabled:opacity-40">전송</button></form>
        </section>
        {createdTasks.length > 0 && <section className="mt-6 rounded-2xl border border-[#dce3df] bg-white p-6"><h2 className="font-bold">반영된 Task</h2><div className="mt-4 space-y-2">{createdTasks.map((task) => <Link key={task.id} to={`/tasks/${task.id}`} className="block rounded-lg border border-[#eef1ef] p-3 hover:bg-[#f8faf7]"><p className="font-bold text-[#18252d]">{task.title}</p><p className="mt-1 text-xs text-[#647278]">{task.description || "상세 설명 없음"}</p></Link>)}</div></section>}
      </main>
    </Layout>
  );
}
