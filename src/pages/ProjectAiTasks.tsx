import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import Layout from "../components/layout/Layout";
import { API_ORIGIN, approveAgentProposal, evaluateAgentProposal, generateAgentTasks, getAgentProposals, getChannel, getProject, getProjectAgentMetrics, getTasks, getWorkspaceProjects, rejectAgentProposal, sendMessage, type AgentProposal, type Message, type Project, type ProjectAgentMetrics, type Task } from "../lib/api";
import { selectActiveWorkspace, useWorkspaceStore } from "../stores/workspaceStore";

export default function ProjectAiTasks() {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const activeWorkspace = useWorkspaceStore(selectActiveWorkspace);
  const [project, setProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState(projectId ?? "");
  const [messages, setMessages] = useState<Message[]>([]);
  const [request, setRequest] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [createdTasks, setCreatedTasks] = useState<Task[]>([]);
  const [proposal, setProposal] = useState<AgentProposal | null>(null);
  const [metrics, setMetrics] = useState<ProjectAgentMetrics | null>(null);
  const [evaluation, setEvaluation] = useState({ requirementsStructuredCorrectly: true, skillMatchingCorrect: true, impactDetectionCorrect: true, replanningSuccessful: true });
  const [error, setError] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isGeneratingProposal, setIsGeneratingProposal] = useState(false);
  const [openMessageMenuId, setOpenMessageMenuId] = useState<number | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const requestFromMessenger = (location.state as { request?: string } | null)?.request;
    if (requestFromMessenger) setRequest(requestFromMessenger);
  }, [location.state]);

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
        getAgentProposals(value.id).then((items) => setProposal(items.find((item) => item.status === "PENDING") ?? items[0] ?? null)).catch(() => undefined);
        getProjectAgentMetrics(value.id).then(setMetrics).catch(() => undefined);
        return getChannel(value.workspaceId, value.id);
      })
      .then((history) => setMessages((current) => {
        const knownIds = new Set(history.map((message) => message.id));
        return [...history, ...current.filter((message) => !knownIds.has(message.id))];
      }))
      .catch((e) => setError(e.message));
  }, [projectId, activeWorkspace, selectedProjectId, navigate]);

  useEffect(() => {
    if (!project) {
      setRealtimeStatus("disconnected");
      return;
    }
    const token = localStorage.getItem("workly-access-token");
    if (!token) {
      setRealtimeStatus("disconnected");
      return;
    }
    let disposed = false;
    let reconnectTimer: number | undefined;
    let retryCount = 0;
    let socket: WebSocket | null = null;
    setRealtimeStatus("connecting");
    const connect = () => {
      if (disposed) return;
      const nextSocket = new WebSocket(`${API_ORIGIN.replace(/^http/, "ws")}/ws`);
      socket = nextSocket;
      socketRef.current = nextSocket;
      nextSocket.onopen = () => {
        retryCount = 0;
        nextSocket.send(`CONNECT\naccept-version:1.2\nhost:localhost\nheart-beat:10000,10000\nAuthorization:Bearer ${token}\n\n\0`);
      };
      nextSocket.onmessage = (event) => {
        const frame = String(event.data);
        if (frame.startsWith("CONNECTED")) {
          nextSocket.send(`SUBSCRIBE\nid:project-chat-${project.id}\ndestination:/topic/workspace/${project.workspaceId}/project/${project.id}\nack:auto\n\n\0`);
          setRealtimeStatus("connected");
          setError("");
          return;
        }
        if (frame.startsWith("ERROR")) {
          setError("프로젝트 채팅 구독이 거부되었습니다. 프로젝트 멤버 권한과 로그인을 확인해 주세요.");
          setRealtimeStatus("disconnected");
          nextSocket.close();
          return;
        }
        const body = frame.split("\n\n").slice(1).join("\n\n").replace(/\0$/, "");
        if (!body) return;
        try {
          const incoming = JSON.parse(body) as Message;
          setMessages((current) => current.some((item) => item.id === incoming.id) ? current : [...current, incoming]);
        } catch { /* Ignore heartbeat and non-JSON STOMP frames. */ }
      };
      nextSocket.onerror = () => {
        if (!disposed) setError("프로젝트 채팅 실시간 연결에 실패했습니다. 백엔드와 WebSocket 프록시를 확인해 주세요.");
      };
      nextSocket.onclose = () => {
        if (disposed) return;
        setRealtimeStatus("disconnected");
        retryCount += 1;
        reconnectTimer = window.setTimeout(connect, Math.min(1000 * 2 ** (retryCount - 1), 10000));
      };
    };
    connect();
    return () => {
      disposed = true;
      if (reconnectTimer !== undefined) window.clearTimeout(reconnectTimer);
      socket?.close();
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [project?.id, project?.workspaceId]);

  useEffect(() => {
    if (!proposal || proposal.requirementsStructuredCorrectly === null) return;
    setEvaluation({
      requirementsStructuredCorrectly: proposal.requirementsStructuredCorrectly,
      skillMatchingCorrect: proposal.skillMatchingCorrect ?? true,
      impactDetectionCorrect: proposal.impactDetectionCorrect ?? true,
      replanningSuccessful: proposal.replanningSuccessful ?? true,
    });
  }, [proposal?.id, proposal?.requirementsStructuredCorrectly, proposal?.skillMatchingCorrect, proposal?.impactDetectionCorrect, proposal?.replanningSuccessful]);

  const selectProject = (value: string) => {
    setSelectedProjectId(value);
    setProject(null);
    setMessages([]);
    getProject(Number(value))
      .then((value) => {
        setProject(value);
        return getChannel(value.workspaceId, value.id);
      })
      .then((history) => setMessages((current) => {
        const knownIds = new Set(history.map((message) => message.id));
        return [...history, ...current.filter((message) => !knownIds.has(message.id))];
      }))
      .catch((e) => setError(e.message));
  };

  const sendProjectMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!project || !chatInput.trim()) return;
    try {
      const message = await sendMessage(project.workspaceId, null, chatInput.trim(), project.id);
      setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
      setChatInput("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "프로젝트 채팅 전송에 실패했습니다.");
    }
  };

  const applyFromConversation = async (message?: Message) => {
    if (!project || !request.trim() && !message) return;
    setIsRunning(true);
    setIsGeneratingProposal(true);
    setError("");
    try {
      const instruction = message?.content ?? request.trim();
      const planText = message
        ? `사용자가 아래 프로젝트 채팅 메시지를 직접 선택해 Task 반영을 요청했습니다. 현재 Task 목록과 대조해 새 업무 추가인지 기존 업무 수정인지 판단하세요. 변경이 필요한 Task만 제안하고, 기존 Task를 수정할 때는 task_reference에 현재 제목을 넣으세요. 제목 변경이 요청되지 않았다면 task는 현재 제목을 유지하세요. changes에는 제목, 설명, 담당자, 우선순위, 시작일, 기한, 선행 업무, 상태 중 사용자가 명시한 항목만 넣으세요. 나머지 값은 그대로 유지하세요. 새 업무라면 새 Task로 제안하세요. 메시지 작성자가 자신이 담당하겠다고 명확히 말하면 그 작성자를 담당자로 추천하세요.\n[요청 작성자: ${message.senderName}]\n[선택한 메시지]\n${instruction}`
        : `프로젝트 채팅을 바탕으로 Task를 반영해줘.\n[대화]\n${messages.map((item) => `${item.senderName}: ${item.content}`).join("\n")}\n[적용 요청]\n${instruction}`;
      const existing = await getTasks(project.id);
      const existingTaskContext = existing.map((task) => `#${task.id} ${task.title} | ${task.status} | 담당: ${task.assigneeName ?? "미지정"} | 우선순위: ${task.priority} | 시작: ${task.startAt ?? "미정"} | 기한: ${task.dueAt ?? "미정"} | 설명: ${task.description ?? "없음"} | 선행 업무: ${task.dependencyTitles.join(", ") || "없음"}`).join("\n");
      const planTextWithExisting = message
        ? `${planText}\n\n[현재 Task 목록: 변경 대상 식별 및 중복 방지용]\n${existingTaskContext || "현재 등록된 Task 없음"}\n\n현재 Task를 수정하는 요청이면 해당 Task만 변경 제안에 포함하세요. 새 업무 요청이면 기존 업무와 겹치지 않는 새 Task만 포함하세요. 요청과 무관한 기존 Task는 결과에서 제외하세요.`
        : `${planText}\n\n[현재 Task 및 담당 상태]\n${existing.map((task) => `#${task.id} ${task.title} | ${task.status} | 담당: ${task.assigneeName ?? "미배정"} | 기한: ${task.dueAt ?? "미정"}`).join("\n")}\n\n기존 Task의 영향을 분석하고, 변경 요청을 반영한 전체 계획안을 제안하세요. 변경이 필요 없는 기존 업무도 포함해 재계획안을 만들고, 분석 근거와 영향 범위를 설명하세요.`;
      const nextProposal = await generateAgentTasks(project.id, planTextWithExisting, message ? "CHAT_UPDATE" : "REPLAN");
      setProposal(nextProposal);
      setCreatedTasks([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI Task 반영에 실패했습니다.");
    } finally {
      setIsGeneratingProposal(false);
      setIsRunning(false);
    }
  };

  const approve = async () => {
    if (!proposal) return;
    setIsRunning(true);
    try {
      setCreatedTasks(await approveAgentProposal(proposal.id));
      setProposal({ ...proposal, status: "APPROVED" });
    } catch (e) { setError(e instanceof Error ? e.message : "승인에 실패했습니다."); }
    finally { setIsRunning(false); }
  };

  const reject = async () => {
    if (!proposal) return;
    setIsRunning(true);
    try { await rejectAgentProposal(proposal.id); setProposal({ ...proposal, status: "REJECTED" }); }
    catch (e) { setError(e instanceof Error ? e.message : "거절에 실패했습니다."); }
    finally { setIsRunning(false); }
  };

  const submitEvaluation = async () => {
    if (!proposal) return;
    setIsRunning(true);
    try {
      await evaluateAgentProposal(proposal.id, evaluation);
      const [updatedProposals, updatedMetrics] = await Promise.all([getAgentProposals(proposal.projectId), getProjectAgentMetrics(proposal.projectId)]);
      setProposal(updatedProposals.find((item) => item.id === proposal.id) ?? proposal);
      setMetrics(updatedMetrics);
    } catch (e) { setError(e instanceof Error ? e.message : "평가 저장에 실패했습니다."); }
    finally { setIsRunning(false); }
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
          <h2 className="font-bold">전체 계획 제안</h2>
          <p className="mt-1 text-sm text-[#647278]">초기 기획서나 프로젝트 방향을 크게 바꿀 때 전체 계획을 입력하세요. 아래 채팅 메시지의 ⋮ 메뉴는 대화에서 나온 특정 Task의 추가나 수정을 제안합니다. 모든 제안은 Leader 승인 후 반영됩니다.</p>
          <div className="mt-4 flex gap-3"><textarea value={request} onChange={(e) => setRequest(e.target.value)} rows={3} placeholder="초기 기획서 또는 전체 재계획 내용을 입력하세요." className="flex-1 rounded-md border border-[#cbd4d1] px-3 py-2.5 text-sm" /><button type="button" onClick={() => applyFromConversation()} disabled={isRunning || !request.trim()} className="self-end rounded-md bg-[#18252d] px-5 py-3 text-sm font-bold text-white disabled:opacity-40">{isRunning ? "AI 처리 중..." : "전체 계획 제안"}</button></div>
        </section>
        {proposal && <section className="mt-6 rounded-2xl border border-[#dce3df] bg-white p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold">{proposal.mode === "ADD_TASKS" ? "새 Task 추가 제안" : proposal.mode === "CHAT_UPDATE" ? "채팅 반영 제안" : "AI 전체 재계획 제안"} · {proposal.status === "PENDING" ? "Leader 승인 대기" : proposal.status === "APPROVED" ? "승인됨" : "거절됨"}</h2><p className="mt-1 text-xs text-[#647278]">{proposal.mode === "ADD_TASKS" ? "승인하면 새 Task만 추가되고 기존 Task는 유지됩니다." : proposal.mode === "CHAT_UPDATE" ? "승인하면 제안에 나온 Task만 추가하거나 수정하고 나머지는 유지됩니다." : "전체 계획 변경은 Leader가 승인한 뒤 반영됩니다."}</p></div>{proposal.status === "PENDING" && <div className="flex gap-2"><button type="button" onClick={reject} disabled={isRunning} className="rounded-md border px-4 py-2 text-sm">거절</button><button type="button" onClick={approve} disabled={isRunning} className="rounded-md bg-[#657f51] px-4 py-2 text-sm font-bold text-white">승인 후 반영</button></div>}</div><div className="mt-4 space-y-3">{proposal.result.tasks.map((task, index) => { const assignment = proposal.result.assignments.find((item) => item.task === task.task); const changes = Array.isArray(task.changes) ? task.changes as string[] : []; const changeLabels: Record<string, string> = { description: "설명", assignee: "담당자", priority: "우선순위", start_at: "시작일", due_at: "기한", depends_on: "선행 업무" }; return <article key={`${String(task.task)}-${index}`} className="rounded-lg border border-[#eef1ef] p-3"><p className="font-bold">{String(task.task)}</p>{proposal.mode === "CHAT_UPDATE" && <p className="mt-1 text-xs font-bold text-[#657f51]">{changes.length > 0 ? "기존 Task 수정" : "새 Task 추가"}{changes.length > 0 ? ` · 변경 항목: ${changes.map((change) => changeLabels[change] ?? change).join(", ")}` : ""}</p>}<p className="mt-1 text-xs font-bold text-[#647278]">우선순위: {String(task.priority ?? "MEDIUM")}</p><p className="mt-1 text-sm text-[#647278]">{String(task.description ?? "")}</p><p className="mt-2 text-xs">담당 제안: {String(assignment?.assignee ?? "미지정")} · 근거: {String(assignment?.reason ?? "- ")}</p>{Array.isArray(task.depends_on) && task.depends_on.length > 0 && <p className="mt-1 text-xs text-[#657f51]">선행 Task: {task.depends_on.join(", ")}</p>}</article>; })}</div>{proposal.result.monitoring.length > 0 && <p className="mt-3 text-sm text-amber-700">영향 점검: {proposal.result.monitoring.join(" · ")}</p>}</section>}
        {proposal && proposal.status !== "PENDING" && <section className="mt-4 rounded-2xl border border-[#dce3df] bg-white p-6"><h2 className="font-bold">Leader 결과 평가</h2><p className="mt-1 text-xs text-[#647278]">평가 결과를 기록해 목표 정확도를 측정합니다.</p><div className="mt-4 grid gap-2 sm:grid-cols-2">{([["requirementsStructuredCorrectly", "요구사항 구조화 정확"], ["skillMatchingCorrect", "담당자 Skill 매칭 정확"], ["impactDetectionCorrect", "변경 영향 탐지 정확"], ["replanningSuccessful", "재계획 결과 성공"]] as const).map(([key, label]) => <label key={key} className="flex items-center gap-2 rounded border border-[#eef1ef] p-3 text-sm"><input type="checkbox" checked={evaluation[key]} onChange={(event) => setEvaluation((value) => ({ ...value, [key]: event.target.checked }))} />{label}</label>)}</div><button type="button" onClick={submitEvaluation} disabled={isRunning} className="mt-4 rounded-md bg-[#18252d] px-4 py-2 text-sm font-bold text-white">평가 저장</button></section>}
        {metrics && <section className="mt-4 rounded-2xl border border-[#dce3df] bg-white p-6"><h2 className="font-bold">프로젝트 AI 품질 지표</h2><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{([["요구사항 구조화", metrics.requirementStructuring], ["Task 생성", metrics.taskCreation], ["Skill 매칭", metrics.skillMatching], ["변경 영향 탐지", metrics.changeImpactDetection], ["AI 재계획", metrics.replanning]] as const).map(([label, value]) => <div key={label} className="rounded-lg bg-[#f8faf7] p-3"><p className="text-xs text-[#647278]">{label}</p><p className="mt-1 font-bold">{value.ratePercent === null ? "평가 대기" : `${value.ratePercent.toFixed(1)}%`} <span className="text-xs font-normal text-[#647278]">({value.successful}/{value.evaluated})</span></p></div>)}</div><p className="mt-3 text-[11px] text-[#8fa0a5]">Task 생성률은 결정된 제안 중 Leader가 승인한 비율입니다. 나머지 정확도는 Leader 평가 표본을 기준으로 계산합니다.</p></section>}
        <section className="mt-6 rounded-2xl border border-[#dce3df] bg-white p-6">
          <h2 className="font-bold">프로젝트 채팅</h2>
          {isGeneratingProposal && <p role="status" className="mt-3 rounded-md bg-[#f1f6e8] p-3 text-sm text-[#526b3f]">채팅 내용을 확인하고 AI Agent에 Task 반영안을 요청하는 중입니다. 완료되면 승인 대기 제안으로 표시됩니다.</p>}
          <div className="mt-4 max-h-96 space-y-3 overflow-y-auto rounded-xl bg-[#f8faf7] p-4">
            {messages.length === 0 && <p className="text-sm text-[#647278]">아직 프로젝트 채팅이 없습니다.</p>}
            {messages.map((message) => <div key={message.id} className="relative rounded-lg border border-[#dce3df] bg-white p-3"><div className="flex items-start justify-between gap-3"><p className="text-xs font-bold text-[#657f51]">{message.senderName}</p><div className="relative"><button type="button" aria-label="메시지 메뉴 열기" aria-expanded={openMessageMenuId === message.id} onClick={() => setOpenMessageMenuId((current) => current === message.id ? null : message.id)} className="-mr-1 -mt-2 rounded-md px-2 py-1 text-xl leading-none text-[#647278] hover:bg-[#f1f4ef]">⋮</button>{openMessageMenuId === message.id && <div className="absolute right-0 top-8 z-10 min-w-48 rounded-lg border border-[#dce3df] bg-white p-1 shadow-lg"><button type="button" onClick={() => { setOpenMessageMenuId(null); void applyFromConversation(message); }} disabled={isRunning} className="w-full rounded-md px-3 py-2 text-left text-xs font-bold text-[#304047] hover:bg-[#f8faf7] disabled:opacity-40">이 메시지로 Task 반영</button></div>}</div></div><p className="mt-1 whitespace-pre-wrap text-sm text-[#304047]">{message.content}</p><span className="mt-2 block text-[10px] text-[#8fa0a5]">{new Date(message.createdAt).toLocaleString("ko-KR")}</span></div>)}
          </div>
          <div className="mt-3 text-right text-xs text-[#8fa0a5]">{realtimeStatus === "connected" ? "실시간 연결됨" : realtimeStatus === "connecting" ? "실시간 연결 중…" : "재연결 대기"}</div>
          <form onSubmit={sendProjectMessage} className="mt-2 flex gap-3"><input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="프로젝트 채팅을 입력하세요" className="min-w-0 flex-1 rounded-md border border-[#cbd4d1] px-3 py-2.5 text-sm" /><button disabled={!chatInput.trim()} className="rounded-md bg-[#18252d] px-5 text-sm font-bold text-white disabled:opacity-40">전송</button></form>
        </section>
        {createdTasks.length > 0 && <section className="mt-6 rounded-2xl border border-[#dce3df] bg-white p-6"><h2 className="font-bold">반영된 Task</h2><div className="mt-4 space-y-2">{createdTasks.map((task) => <Link key={task.id} to={`/tasks/${task.id}`} className="block rounded-lg border border-[#eef1ef] p-3 hover:bg-[#f8faf7]"><p className="font-bold text-[#18252d]">{task.title}</p><p className="mt-1 text-xs text-[#647278]">{task.description || "상세 설명 없음"}</p></Link>)}</div></section>}
      </main>
    </Layout>
  );
}
