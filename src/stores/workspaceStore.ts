import { create } from "zustand";
import {
  createWorkspace as apiCreateWorkspace,
  deleteWorkspace as apiDeleteWorkspace,
  getWorkspaces as apiGetWorkspaces,
  updateWorkspace as apiUpdateWorkspace,
  type Workspace,
} from "../lib/api";

type WorkspaceState = {
  workspaces: Workspace[];
  activeWorkspaceId: number | null;
  isLoading: boolean;
  error: string | null;

  fetchWorkspaces: () => Promise<Workspace[]>;
  setActiveWorkspaceId: (id: number) => void;
  createWorkspace: (name: string, description?: string) => Promise<Workspace>;
  updateWorkspace: (
    id: number,
    name: string,
    description?: string
  ) => Promise<Workspace>;
  deleteWorkspace: (id: number) => Promise<void>;
};

const getStoredWorkspaceId = (): number | null => {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("workly-active-workspace-id");
  return stored ? Number(stored) : null;
};

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  activeWorkspaceId: getStoredWorkspaceId(),
  isLoading: false,
  error: null,

  fetchWorkspaces: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiGetWorkspaces();
      const currentActiveId = get().activeWorkspaceId;
      let nextActiveId = currentActiveId;

      if (!currentActiveId || !data.some((w) => w.id === currentActiveId)) {
        nextActiveId = data.length > 0 ? data[0].id : null;
      }

      if (nextActiveId) {
        localStorage.setItem(
          "workly-active-workspace-id",
          nextActiveId.toString()
        );
      }

      set({
        workspaces: data,
        activeWorkspaceId: nextActiveId,
        isLoading: false,
      });
      return data;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "워크스페이스 목록을 불러오지 못했습니다.";
      set({ error: message, isLoading: false });
      return [];
    }
  },

  setActiveWorkspaceId: (id: number) => {
    localStorage.setItem("workly-active-workspace-id", id.toString());
    set({ activeWorkspaceId: id });
  },

  createWorkspace: async (name: string, description?: string) => {
    set({ isLoading: true, error: null });
    try {
      const newWs = await apiCreateWorkspace({ name, description });
      const nextList = [...get().workspaces, newWs];
      set({
        workspaces: nextList,
        activeWorkspaceId: newWs.id,
        isLoading: false,
      });
      localStorage.setItem("workly-active-workspace-id", newWs.id.toString());
      return newWs;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  updateWorkspace: async (
    id: number,
    name: string,
    description?: string
  ) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await apiUpdateWorkspace(id, { name, description });
      const nextList = get().workspaces.map((w) =>
        w.id === id ? updated : w
      );
      set({
        workspaces: nextList,
        isLoading: false,
      });
      return updated;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  deleteWorkspace: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await apiDeleteWorkspace(id);
      const nextList = get().workspaces.filter((w) => w.id !== id);
      const nextActiveId = nextList.length > 0 ? nextList[0].id : null;
      if (nextActiveId) {
        localStorage.setItem(
          "workly-active-workspace-id",
          nextActiveId.toString()
        );
      } else {
        localStorage.removeItem("workly-active-workspace-id");
      }
      set({
        workspaces: nextList,
        activeWorkspaceId: nextActiveId,
        isLoading: false,
      });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },
}));

export const selectActiveWorkspace = (state: WorkspaceState) => {
  return (
    state.workspaces.find((w) => w.id === state.activeWorkspaceId) ??
    state.workspaces[0] ??
    null
  );
};
