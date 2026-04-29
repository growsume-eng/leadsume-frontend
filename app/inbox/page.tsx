"use client";

import { useState } from "react";
import { useAppState, useAppDispatch } from "@/context/AppContext";
import type { MailThread } from "@/lib/types";
import { format } from "date-fns";
import { Search, Send, Brain, ChevronRight, MessageSquare } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { replySchema, type ReplyFormValues } from "@/lib/schemas";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const SENTIMENT_STYLES: Record<string, string> = {
  Positive: "text-emerald-400 bg-emerald-400/10",
  Neutral: "text-amber-400 bg-amber-400/10",
  Negative: "text-rose-400 bg-rose-400/10",
};

export default function InboxPage() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const [selectedId, setSelectedId] = useState<string | null>(state.threads[0]?.id ?? null);
  const [query, setQuery] = useState("");

  const filtered = state.threads.filter(t =>
    t.subject.toLowerCase().includes(query.toLowerCase()) ||
    t.contact.toLowerCase().includes(query.toLowerCase())
  );
  const thread = state.threads.find(t => t.id === selectedId) ?? null;

  function selectThread(t: MailThread) {
    setSelectedId(t.id);
    if (t.unread > 0) dispatch({ type: "MARK_THREAD_READ", payload: t.id });
  }

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ReplyFormValues>({
    resolver: zodResolver(replySchema), defaultValues: { body: "" },
  });

  function onSend(data: ReplyFormValues) {
    if (!selectedId) return;
    dispatch({
      type: "SEND_REPLY",
      payload: {
        threadId: selectedId,
        message: { from: state.profile.email, fromName: state.profile.name, body: data.body, timestamp: new Date().toISOString(), isMe: true },
      },
    });
    toast.success("Reply sent");
    reset();
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Thread List */}
      <div className="w-72 border-r border-[#1f2d45] flex flex-col shrink-0 bg-[#0d1424]">
        <div className="p-3 border-b border-[#1f2d45]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search threads…"
              className="w-full pl-8 pr-3 py-2 text-xs bg-[#111827] border border-[#1f2d45] rounded-lg text-slate-300 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-[#1f2d45]">
          {filtered.map(t => (
            <button key={t.id} onClick={() => selectThread(t)} className={cn("w-full text-left px-4 py-3.5 hover:bg-white/3 transition-colors", selectedId === t.id && "bg-indigo-600/10 border-r-2 border-indigo-500")}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className={cn("text-xs font-semibold truncate", t.unread ? "text-slate-100" : "text-slate-400")}>{t.contact}</p>
                <div className="flex items-center gap-1 shrink-0">
                  {t.unread > 0 && <span className="w-4 h-4 text-xs bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">{t.unread}</span>}
                  <span className="text-xs text-slate-600">{format(new Date(t.lastAt), "MMM d")}</span>
                </div>
              </div>
              <p className={cn("text-xs truncate mb-0.5", t.unread ? "text-slate-200" : "text-slate-500")}>{t.subject}</p>
              <p className="text-xs text-slate-600 truncate">{t.messages[t.messages.length - 1]?.body.slice(0, 50)}…</p>
            </button>
          ))}
        </div>
      </div>

      {/* Thread View */}
      {thread ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Thread header */}
          <div className="px-6 py-4 border-b border-[#1f2d45] bg-[#0d1424] flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-200 mb-0.5">{thread.subject}</h3>
              <p className="text-xs text-slate-500">{thread.contact} · {thread.contactEmail}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </div>

          {/* AI Insights */}
          <div className="px-6 py-3 border-b border-[#1f2d45] bg-indigo-600/5 flex items-start gap-3">
            <Brain className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-indigo-400">AI Insights</span>
                <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", SENTIMENT_STYLES[thread.sentiment])}>
                  {thread.sentiment}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{thread.aiSummary}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {thread.messages.map(msg => (
              <div key={msg.id} className={cn("flex gap-3", msg.isMe && "flex-row-reverse")}>
                <div className={cn("w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold",
                  msg.isMe ? "bg-indigo-700 text-white" : "bg-slate-700 text-slate-200")}>
                  {msg.fromName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div className={cn("max-w-[70%]", msg.isMe && "items-end flex flex-col")}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-slate-300">{msg.fromName}</span>
                    <span className="text-xs text-slate-600">{format(new Date(msg.timestamp), "MMM d, h:mm a")}</span>
                  </div>
                  <div className={cn("rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
                    msg.isMe ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-[#1a2236] text-slate-200 border border-[#1f2d45] rounded-tl-sm")}>
                    {msg.body}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Reply box */}
          <form onSubmit={handleSubmit(onSend)} className="border-t border-[#1f2d45] bg-[#0d1424] p-4">
            <textarea {...register("body")} rows={3} placeholder="Write a reply…"
              className="w-full px-4 py-3 bg-[#111827] border border-[#1f2d45] rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none mb-3" />
            {errors.body && <p className="text-xs text-rose-400 mb-2">{errors.body.message}</p>}
            <div className="flex justify-end">
              <button type="submit" className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors">
                <Send className="w-3.5 h-3.5" /> Send Reply
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageSquare className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Select a thread to view</p>
          </div>
        </div>
      )}
    </div>
  );
}
