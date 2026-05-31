import { create } from "zustand";
import { ChatSessionSummary } from "./types";

interface AppState {
  sessions: ChatSessionSummary[];
  sessionsLoading: boolean;
  sessionsVersion: number;
  setSessions: (sessions: ChatSessionSummary[]) => void;
  setSessionsLoading: (loading: boolean) => void;
  invalidateSessions: () => void;
  online: boolean;
  setOnline: (online: boolean) => void;
  errors: { id: string; message: string; timestamp: string }[];
  addError: (message: string) => void;
  clearErrors: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  sessions: [],
  sessionsLoading: false,
  sessionsVersion: 0,
  setSessions: (sessions) => set({ sessions }),
  setSessionsLoading: (loading) => set({ sessionsLoading: loading }),
  invalidateSessions: () =>
    set((state) => ({ sessionsVersion: state.sessionsVersion + 1 })),
  online: true,
  setOnline: (online) => set({ online }),
  errors: [],
  addError: (message) =>
    set((state) => ({
      errors: [
        { id: Date.now().toString(), message, timestamp: new Date().toISOString() },
        ...state.errors,
      ].slice(0, 50),
    })),
  clearErrors: () => set({ errors: [] }),
}));
