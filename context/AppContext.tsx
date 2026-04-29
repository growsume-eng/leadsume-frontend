"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
} from "react";
import type {
  AppState,
  Campaign,
  Lead,
  InboxAccount,
  MailMessage,
  MailThread,
  UserProfile,
  AppSettings,
} from "@/lib/types";
import { initialState } from "@/lib/data";
import { generateId } from "@/lib/utils";

// ─── Action Types ─────────────────────────────────────────────────────────────
type Action =
  // Campaigns
  | { type: "ADD_CAMPAIGN"; payload: Omit<Campaign, "id" | "createdAt"> }
  | { type: "UPDATE_CAMPAIGN"; payload: Campaign }
  | { type: "DELETE_CAMPAIGN"; payload: string }
  // Leads
  | { type: "ADD_LEAD"; payload: Omit<Lead, "id" | "createdAt"> }
  | { type: "ADD_LEADS_BULK"; payload: Array<Omit<Lead, "id" | "createdAt">> }
  | { type: "UPDATE_LEAD"; payload: Lead }
  | { type: "UPDATE_LEAD_STATUS"; payload: { id: string; status: Lead["status"] } }
  | { type: "DELETE_LEAD"; payload: string }
  // Inboxes
  | { type: "ADD_INBOX"; payload: Omit<InboxAccount, "id" | "createdAt" | "status" | "lastSyncAt"> }
  | { type: "UPDATE_INBOX"; payload: InboxAccount }
  | { type: "UPDATE_INBOX_STATUS"; payload: { id: string; status: InboxAccount["status"] } }
  | { type: "DELETE_INBOX"; payload: string }
  // Threads
  | { type: "MARK_THREAD_READ"; payload: string }
  | { type: "SEND_REPLY"; payload: { threadId: string; message: Omit<MailMessage, "id"> } }
  | { type: "ADD_THREAD"; payload: MailThread }
  // Settings
  | { type: "UPDATE_PROFILE"; payload: Partial<UserProfile> }
  | { type: "UPDATE_SETTINGS"; payload: Partial<AppSettings> }
  | { type: "REGENERATE_API_KEY" };

// ─── Reducer ──────────────────────────────────────────────────────────────────
function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    // ── Campaigns ───────────────────────────────────────────────────────────
    case "ADD_CAMPAIGN":
      return {
        ...state,
        campaigns: [
          ...state.campaigns,
          { ...action.payload, id: generateId(), createdAt: new Date().toISOString() },
        ],
      };
    case "UPDATE_CAMPAIGN":
      return {
        ...state,
        campaigns: state.campaigns.map((c) =>
          c.id === action.payload.id ? action.payload : c
        ),
      };
    case "DELETE_CAMPAIGN":
      return {
        ...state,
        campaigns: state.campaigns.filter((c) => c.id !== action.payload),
      };

    // ── Leads ────────────────────────────────────────────────────────────────
    case "ADD_LEAD":
      return {
        ...state,
        leads: [
          ...state.leads,
          { ...action.payload, id: generateId(), createdAt: new Date().toISOString() },
        ],
      };
    case "ADD_LEADS_BULK":
      return {
        ...state,
        leads: [
          ...state.leads,
          ...action.payload.map((l) => ({
            ...l,
            id: generateId(),
            createdAt: new Date().toISOString(),
          })),
        ],
      };
    case "UPDATE_LEAD":
      return {
        ...state,
        leads: state.leads.map((l) =>
          l.id === action.payload.id ? action.payload : l
        ),
      };
    case "UPDATE_LEAD_STATUS":
      return {
        ...state,
        leads: state.leads.map((l) =>
          l.id === action.payload.id ? { ...l, status: action.payload.status } : l
        ),
      };
    case "DELETE_LEAD":
      return {
        ...state,
        leads: state.leads.filter((l) => l.id !== action.payload),
      };

    // ── Inboxes ──────────────────────────────────────────────────────────────
    case "ADD_INBOX":
      return {
        ...state,
        inboxes: [
          ...state.inboxes,
          {
            ...action.payload,
            id: generateId(),
            status: "Connecting",
            lastSyncAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          },
        ],
      };
    case "UPDATE_INBOX":
      return {
        ...state,
        inboxes: state.inboxes.map((i) =>
          i.id === action.payload.id ? action.payload : i
        ),
      };
    case "UPDATE_INBOX_STATUS":
      return {
        ...state,
        inboxes: state.inboxes.map((i) =>
          i.id === action.payload.id ? { ...i, status: action.payload.status } : i
        ),
      };
    case "DELETE_INBOX":
      return {
        ...state,
        inboxes: state.inboxes.filter((i) => i.id !== action.payload),
      };

    // ── Threads ──────────────────────────────────────────────────────────────
    case "MARK_THREAD_READ":
      return {
        ...state,
        threads: state.threads.map((t) =>
          t.id === action.payload ? { ...t, unread: 0 } : t
        ),
      };
    case "SEND_REPLY":
      return {
        ...state,
        threads: state.threads.map((t) =>
          t.id === action.payload.threadId
            ? {
                ...t,
                messages: [
                  ...t.messages,
                  { ...action.payload.message, id: generateId() },
                ],
                lastAt: new Date().toISOString(),
              }
            : t
        ),
      };
    case "ADD_THREAD":
      return { ...state, threads: [action.payload, ...state.threads] };

    // ── Settings ─────────────────────────────────────────────────────────────
    case "UPDATE_PROFILE":
      return { ...state, profile: { ...state.profile, ...action.payload } };
    case "UPDATE_SETTINGS":
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case "REGENERATE_API_KEY":
      return {
        ...state,
        settings: {
          ...state.settings,
          apiKey: `gs_live_${generateId()}${generateId()}`,
        },
      };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AppStateContext = createContext<AppState | undefined>(undefined);
const AppDispatchContext = createContext<React.Dispatch<Action> | undefined>(
  undefined
);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppState {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be inside AppProvider");
  return ctx;
}

export function useAppDispatch(): React.Dispatch<Action> {
  const ctx = useContext(AppDispatchContext);
  if (!ctx) throw new Error("useAppDispatch must be inside AppProvider");
  return ctx;
}
