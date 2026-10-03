import { useEffect, useState } from "react";
import { useRef } from "react";
import Layout from "../components/layout/Layout";
import { API_ORIGIN, getChannel, getUserIdFromToken, getWorkspaceMembers, sendMessage, type Message, type WorkspaceMember } from "../lib/api";
import { selectActiveWorkspace, useWorkspaceStore } from "../stores/workspaceStore";

type Conversation = "workspace" | "project" | "direct";

export default function Messenger() {
  const workspace = useWorkspaceStore(selectActiveWorkspace);
  const [mode, setMode] = useState<Conversation>("workspace");
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [receiverId, setReceiverId] = useState<number>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [realtimeStatus, setRealtimeStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!workspace) return;
    getWorkspaceMembers(workspace.id)
      .then(setMembers)
      .catch((e) => setError(e.message));
  }, [workspace]);

  useEffect(() => {
    if (!workspace) return;
    const channelReceiverId = mode === "direct" ? receiverId : null;
    if (mode === "direct" && !receiverId) return;
    getChannel(workspace.id, null, channelReceiverId)
      .then(setMessages)
      .catch((e) => setError(e.message));
  }, [workspace, mode, receiverId]);

  useEffect(() => {
    if (!workspace || (mode === "direct" && !receiverId)) {
      setRealtimeStatus("disconnected");
      return;
    }
    const token = localStorage.getItem("workly-access-token");
    if (!token) {
      setRealtimeStatus("disconnected");
      return;
    }
    // The server uses the two user ids in sorted order for private channels.
    const userId = mode === "direct" ? getUserIdFromToken(token) : 0;
    if (mode === "direct" && !userId) {
      setError("로그인 정보를 확인할 수 없어 개인 채팅에 연결하지 못했습니다.");
      setRealtimeStatus("disconnected");
      return;
    }
    const destination = mode === "workspace"
      ? `/topic/workspace/${workspace.id}`
      : `/topic/workspace/${workspace.id}/direct/${Math.min(userId!, receiverId!)}/${Math.max(userId!, receiverId!)}`;
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
          nextSocket.send(`SUBSCRIBE\nid:chat-${workspace.id}-${mode}-${receiverId ?? "all"}\ndestination:${destination}\nack:auto\n\n\0`);
          setRealtimeStatus("connected");
          setError("");
          return;
        }
        if (frame.startsWith("ERROR")) {
          setError("채팅 서버가 구독을 거부했습니다. 워크스페이스 멤버 권한과 로그인 상태를 확인해 주세요.");
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
        if (!disposed) setError("채팅 서버에 연결하지 못했습니다. 백엔드와 WebSocket 프록시 설정을 확인해 주세요.");
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
  }, [workspace, mode, receiverId]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!workspace || !content.trim()) return;
    if (mode === "direct" && !receiverId) return;
    try {
      // Persist over HTTP and use WebSocket only for live delivery. Raw STOMP
      // SEND frames have no client acknowledgement, so they can look sent
      // even when the server rejected the session.
      const message = await sendMessage(workspace.id, mode === "direct" ? receiverId! : null, content.trim());
      setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
      setContent("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "메시지 전송에 실패했습니다.");
    }
  };

  const title = mode === "workspace" ? `전체 · ${workspace?.name ?? "워크스페이스"}` : "개인 메시지";

  return (
    <Layout>
      <div className="mx-auto max-w-[1200px] px-8 py-10 max-md:px-5">
        <p className="font-mono text-xs uppercase tracking-wider text-[#657f51]">Workspace / Messenger</p>
        <h1 className="mt-2 text-3xl font-bold text-[#18252d]">메시지</h1>
        <p className="mt-2 text-sm text-[#647278]">전체 대화는 상단에서 선택한 워크스페이스에 연결됩니다.</p>
        {error && <div className="mt-5 rounded-md bg-[#fff1f0] p-3 text-sm text-[#b42318]">{error}</div>}
        <div className="mt-8 grid min-h-[540px] overflow-hidden rounded-2xl border border-[#dce3df] bg-white md:grid-cols-[260px_1fr]">
          <aside className="border-b border-[#dce3df] bg-[#f8faf7] p-4 md:border-b-0 md:border-r">
            <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-white p-1 text-xs font-bold">
              {(["workspace", "direct"] as Conversation[]).map((item) => (
                <button key={item} type="button" onClick={() => setMode(item)} className={`rounded-md px-2 py-2 ${mode === item ? "bg-[#d8f36b]" : "text-[#647278]"}`}>{item === "workspace" ? "전체" : item === "project" ? "프로젝트" : "개인"}</button>
              ))}
            </div>
            {mode === "direct" && <div className="space-y-1">{members.map((member) => <button key={member.userId} type="button" onClick={() => setReceiverId(member.userId)} className={`w-full rounded-lg px-3 py-3 text-left text-sm ${receiverId === member.userId ? "bg-[#d8f36b] font-bold" : "hover:bg-white"}`}>{member.userName}<span className="block text-[10px] text-[#647278]">{member.email}</span></button>)}</div>}
          </aside>
          <section className="flex flex-col">
            <div className="flex items-center justify-between border-b border-[#eef1ef] p-5"><span className="font-bold">{title}</span><span className={`text-xs ${realtimeStatus === "connected" ? "text-[#657f51]" : "text-[#8fa0a5]"}`}>{realtimeStatus === "connected" ? "실시간 연결됨" : realtimeStatus === "connecting" ? "실시간 연결 중…" : "재연결 대기"}</span></div>
            <div className="flex-1 space-y-3 overflow-y-auto bg-[#fbfcfa] p-5">{messages.map((message) => <div key={message.id} className="max-w-[75%] rounded-xl border border-[#dce3df] bg-white p-3 text-sm"><p className="mb-2 text-xs font-bold text-[#657f51]">{message.senderName}</p><p>{message.content}</p><span className="mt-2 block text-[10px] text-[#8fa0a5]">{new Date(message.createdAt).toLocaleString("ko-KR")}</span></div>)}</div>
            <form onSubmit={submit} className="flex gap-3 border-t border-[#eef1ef] p-4"><input disabled={mode === "direct" && !receiverId} value={content} onChange={(e) => setContent(e.target.value)} placeholder="메시지를 입력하세요" className="min-w-0 flex-1 rounded-md border border-[#cbd4d1] px-3 py-2.5 text-sm" /><button disabled={!content.trim()} className="rounded-md bg-[#18252d] px-5 text-sm font-bold text-white disabled:opacity-40">전송</button></form>
          </section>
        </div>
      </div>
    </Layout>
  );
}
