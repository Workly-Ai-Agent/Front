import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/layout/Layout";
import { getTasks, getWorkspaceProjects, updateTaskStatus, type Project, type Task, type TaskStatus } from "../lib/api";
import { selectActiveWorkspace, useWorkspaceStore } from "../stores/workspaceStore";

const columns: { status: TaskStatus; label: string }[] = [
  { status: "TODO", label: "할 일" },
  { status: "IN_PROGRESS", label: "진행 중" },
  { status: "COMPLETED", label: "완료" },
  { status: "BLOCKED", label: "차단됨" },
];

export default function TaskBoardDnd() {
  const workspace = useWorkspaceStore(selectActiveWorkspace);
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<number>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const grouped = useMemo(
    () => Object.fromEntries(columns.map((column) => [column.status, tasks.filter((task) => task.status === column.status)])),
    [tasks],
  );

  useEffect(() => {
    if (!workspace) return;
    getWorkspaceProjects(workspace.id)
      .then((items) => {
        if (items.length === 0) {
          navigate("/projects/new");
          return;
        }
        setProjects(items);
        setProjectId(items[0]?.id);
      })
      .catch((e) => setError(e.message));
  }, [workspace, navigate]);

  useEffect(() => {
    if (projectId) getTasks(projectId).then(setTasks).catch((e) => setError(e.message));
  }, [projectId]);

  const drop = async (status: TaskStatus) => {
    if (draggedId === null) return;
    const previous = tasks;
    setTasks((items) => items.map((task) => task.id === draggedId ? { ...task, status } : task));
    try {
      const saved = await updateTaskStatus(draggedId, status);
      setTasks((items) => items.map((task) => task.id === saved.id ? saved : task));
    } catch (e) {
      setTasks(previous);
      setError(e instanceof Error ? e.message : "Task 상태 변경에 실패했습니다.");
    } finally {
      setDraggedId(null);
    }
  };

  return (
    <Layout>
      <main className="mx-auto max-w-[1400px] px-8 py-10 max-md:px-5">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-[#657f51]">Execution</p>
            <h1 className="mt-2 text-3xl font-bold text-[#18252d]">Task Board</h1>
            <p className="mt-2 text-sm text-[#647278]">Task를 드래그해 상태를 변경하고 카드를 눌러 상세 내용을 확인하세요.</p>
          </div>
          <select value={projectId ?? ""} onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : undefined)} className="rounded-md border border-[#cbd4d1] bg-white px-4 py-2.5 text-sm">
            <option value="">프로젝트 선택</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
        </div>
        {error && <p className="mb-4 rounded-md bg-[#fff1f0] p-3 text-sm text-[#b42318]">{error}</p>}
        <div className="grid gap-4 xl:grid-cols-4">
          {columns.map((column) => (
            <section key={column.status} onDragOver={(e) => e.preventDefault()} onDrop={() => drop(column.status)} className="min-h-72 rounded-2xl border border-[#dce3df] bg-[#f8faf7] p-4">
              <div className="mb-4 flex items-center justify-between"><h2 className="font-bold text-[#18252d]">{column.label}</h2><span className="rounded-full bg-white px-2 py-1 text-xs">{grouped[column.status]?.length ?? 0}</span></div>
              <div className="space-y-3">
                {grouped[column.status]?.map((task) => (
                  <Link key={task.id} to={`/tasks/${task.id}`} draggable onDragStart={() => setDraggedId(task.id)} className="block cursor-grab rounded-xl border border-[#dce3df] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#657f51] active:cursor-grabbing">
                    <p className="text-sm font-bold text-[#18252d]">{task.title}</p>
                    {task.description && <p className="mt-2 line-clamp-3 whitespace-pre-line text-xs text-[#647278]">{task.description}</p>}
                    <div className="mt-3 text-[11px] text-[#647278]">담당자: {task.assigneeName || "미지정"}</div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </Layout>
  );
}
