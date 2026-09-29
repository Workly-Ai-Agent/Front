import { useEffect, useState } from "react";
import { useRef } from "react";
import Layout from "../components/layout/Layout";
import { API_ORIGIN, getChannel, getWorkspaceMembers, sendMessage, type Message, type WorkspaceMember } from "../lib/api";
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
    if (!workspace || (mode === "direct" && !receiverId)) return;
    const token = localStorage.getItem("workly-access-token");
    if (!token) return;
    // The server uses the two user ids in sorted order for private channels.
    const userId = mode === "direct" ? Number(JSON.parse(atob(token.split(".")[1])).sub) : 0;
    const destination = mode === "workspace"
      ? `/topic/workspace/${workspace.id}`
      : `/topic/workspace/${workspace.id}/direct/${Math.min(userId, receiverId!)}/${Math.max(userId, receiverId!)}`;
    const socket = new WebSocket(`${API_ORIGIN.replace(/^http/, "ws")}/ws`);
    socketRef.current = socket;
    socket.onopen = () => {
      socket.send(`CONNECT\naccept-version:1.2\nauthorization:Bearer ${token}\n\n\0`);
      socket.send(`SUBSCRIBE\nid:chat-${workspace.id}\ndestination:${destination}\nack:auto\n\n\0`);
    };
    socket.onmessage = (event) => {
      const body = String(event.data).split("\n\n")[1]?.replace(/\0$/, "");
      if (!body) return;
      try {
        const incoming = JSON.parse(body) as Message;
        setMessages((current) => current.some((item) => item.id === incoming.id) ? current : [...current, incoming]);
      } catch { /* ignore STOMP CONNECTED frames */ }
    };
    return () => { socket.close(); socketRef.current = null; };
  }, [workspace, mode, receiverId]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!workspace || !content.trim()) return;
    if (mode === "direct" && !receiverId) return;
    try {
      const request = { workspaceId: workspace.id, receiverId: mode === "direct" ? receiverId! : null, content: content.trim() };
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(`SEND\ndestination:/app/chat.send\ncontent-type:application/json\n\n${JSON.stringify(request)}\0`);
      } else {
        const message = await sendMessage(workspace.id, mode === "direct" ? receiverId! : null, content.trim());
        setMessages((current) => [...current, message]);
      }
      setContent("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "메시지 전송에 실패했습니다.");
    }
  };

  const title = mode === "workspace" ? "워크스페이스 전체" : "개인 메시지";

  return (
    <Layout>
      <div className="mx-auto max-w-[1200px] px-8 py-10 max-md:px-5">
        <p className="font-mono text-xs uppercase tracking-wider text-[#657f51]">Workspace / Messenger</p>
        <h1 className="mt-2 text-3xl font-bold text-[#18252d]">메시지</h1>
        <p className="mt-2 text-sm text-[#647278]">워크스페이스, 프로젝트, 개인 대화를 한 곳에서 관리하세요.</p>
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
            <div className="border-b border-[#eef1ef] p-5 font-bold">{title}</div>
            <div className="flex-1 space-y-3 overflow-y-auto bg-[#fbfcfa] p-5">{messages.map((message) => <div key={message.id} className="max-w-[75%] rounded-xl border border-[#dce3df] bg-white p-3 text-sm"><p className="mb-2 text-xs font-bold text-[#657f51]">{message.senderName}</p><p>{message.content}</p><span className="mt-2 block text-[10px] text-[#8fa0a5]">{new Date(message.createdAt).toLocaleString("ko-KR")}</span></div>)}</div>
            <form onSubmit={submit} className="flex gap-3 border-t border-[#eef1ef] p-4"><input disabled={mode === "direct" && !receiverId} value={content} onChange={(e) => setContent(e.target.value)} placeholder="메시지를 입력하세요" className="min-w-0 flex-1 rounded-md border border-[#cbd4d1] px-3 py-2.5 text-sm" /><button disabled={!content.trim()} className="rounded-md bg-[#18252d] px-5 text-sm font-bold text-white disabled:opacity-40">전송</button></form>
          </section>
        </div>
      </div>
    </Layout>
  );
}
