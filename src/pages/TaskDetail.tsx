import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "../components/layout/Layout";
import { getTask, updateTask, updateTaskStatus, type Task, type TaskStatus } from "../lib/api";

const statuses: { value: TaskStatus; label: string }[] = [
  { value: "TODO", label: "할 일" },
  { value: "IN_PROGRESS", label: "진행 중" },
  { value: "COMPLETED", label: "완료" },
  { value: "BLOCKED", label: "차단됨" },
  { value: "CANCELLED", label: "계획 제외" },
];

export default function TaskDetail() {
  const { taskId } = useParams();
  const [task, setTask] = useState<Task | null>(null);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (taskId) getTask(Number(taskId)).then((value) => { setTask(value); setTitle(value.title); setDescription(value.description ?? ""); }).catch((e) => setError(e.message));
  }, [taskId]);

  const changeStatus = async (status: TaskStatus) => {
    if (!task) return;
    try {
      setTask(await updateTaskStatus(task.id, status));
    } catch (e) {
      setError(e instanceof Error ? e.message : "상태 변경에 실패했습니다.");
    }
  };

  const saveTask = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!task || !title.trim()) return;
    setIsSaving(true);
    try {
      const updated = await updateTask(task.id, { title: title.trim(), description: description.trim() || undefined, assigneeId: task.assigneeId, status: task.status, priority: task.priority, startAt: task.startAt, dueAt: task.dueAt });
      setTask(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Task 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  if (error) return <Layout><main className="mx-auto max-w-3xl px-8 py-10"><p className="rounded-md bg-[#fff1f0] p-4 text-sm text-[#b42318]">{error}</p></main></Layout>;
  if (!task) return <Layout><main className="mx-auto max-w-3xl px-8 py-10 text-sm text-[#647278]">Task를 불러오는 중입니다...</main></Layout>;

  return (
    <Layout>
      <main className="mx-auto max-w-3xl px-8 py-10 max-md:px-5">
        <Link to="/tasks" className="text-sm font-bold text-[#657f51]">← Task Board</Link>
        <div className="mt-6 rounded-2xl border border-[#dce3df] bg-white p-7">
          <p className="font-mono text-xs text-[#8fa0a5]">TASK DETAIL</p>
          <form onSubmit={saveTask} className="mt-5 space-y-4">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-md border border-[#cbd4d1] px-3 py-2.5 text-2xl font-bold text-[#18252d]" />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={8} placeholder="이 Task에서 수행할 업무를 구체적으로 작성하세요." className="w-full rounded-md border border-[#cbd4d1] px-3 py-2.5 text-sm leading-7 text-[#647278]" />
            <button disabled={isSaving || !title.trim()} className="rounded-md bg-[#657f51] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40">{isSaving ? "저장 중..." : "업무 내용 저장"}</button>
          </form>
          <div className="mt-8 border-t border-[#eef1ef] pt-6">
            <label className="text-xs font-bold text-[#647278]">상태</label>
            <div className="mt-3 flex flex-wrap gap-2">
              {statuses.map((status) => <button key={status.value} onClick={() => changeStatus(status.value)} className={`rounded-md px-4 py-2 text-sm font-bold ${task.status === status.value ? "bg-[#18252d] text-white" : "border border-[#cbd4d1] text-[#647278]"}`}>{status.label}</button>)}
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-xs text-[#8fa0a5]">담당자</span><p className="mt-1 font-bold">{task.assigneeName || (task.assigneeId ? "배정된 멤버" : "미배정")}</p></div>
            <div><span className="text-xs text-[#8fa0a5]">우선순위</span><p className="mt-1 font-bold">{task.priority}</p></div>
            <div><span className="text-xs text-[#8fa0a5]">선행 Task</span><p className="mt-1 font-bold">{task.dependencyTitles.length ? task.dependencyTitles.join(", ") : "없음"}</p></div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
