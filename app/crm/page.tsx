"use client";

import { useState } from "react";
import { useAppState, useAppDispatch } from "@/context/AppContext";
import type { Lead, LeadStatus } from "@/lib/types";
import ConfirmModal from "@/components/shared/ConfirmModal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MoreVertical, Pencil, Trash2, Plus, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import LeadFormModal from "@/components/leads/LeadFormModal";

const STAGES: LeadStatus[] = ["New", "Contacted", "Qualified", "Proposal", "Won"];

const STAGE_COLORS: Record<string, string> = {
  New: "text-slate-400 border-slate-600/50",
  Contacted: "text-indigo-400 border-indigo-600/50",
  Qualified: "text-amber-400 border-amber-600/50",
  Proposal: "text-violet-400 border-violet-600/50",
  Won: "text-emerald-400 border-emerald-600/50",
};

export default function CRMPage() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  function onDragEnd(result: DropResult) {
    if (!result.destination) return;
    const leadId = result.draggableId;
    const newStatus = result.destination.droppableId as LeadStatus;
    dispatch({ type: "UPDATE_LEAD_STATUS", payload: { id: leadId, status: newStatus } });
    toast.success(`Lead moved to ${newStatus}`);
  }

  function handleDelete() {
    if (!deleteId) return;
    dispatch({ type: "DELETE_LEAD", payload: deleteId });
    toast.success("Lead deleted");
    setDeleteId(null);
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-100">CRM Pipeline</h2>
          <p className="text-sm text-slate-400 mt-0.5">Drag leads between stages</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Add Lead
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 flex-1 overflow-x-auto pb-4">
          {STAGES.map(stage => {
            const leads = state.leads.filter(l => l.status === stage);
            return (
              <div key={stage} className="flex-shrink-0 w-64 flex flex-col">
                <div className={cn("flex items-center justify-between mb-3 pb-2 border-b", STAGE_COLORS[stage])}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider">{stage}</span>
                    <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded-full font-medium">{leads.length}</span>
                  </div>
                </div>
                <Droppable droppableId={stage}>
                  {(provided, snapshot) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}
                      className={cn("flex-1 rounded-xl p-2 space-y-2 min-h-[200px] transition-colors", snapshot.isDraggingOver ? "bg-indigo-600/10 border border-indigo-600/20" : "bg-[#0d1424]")}>
                      {leads.map((lead, index) => (
                        <Draggable key={lead.id} draggableId={lead.id} index={index}>
                          {(prov, snap) => (
                            <div ref={prov.innerRef} {...prov.draggableProps}
                              className={cn("bg-[#111827] border border-[#1f2d45] rounded-xl p-3 group transition-all", snap.isDragging && "shadow-xl border-indigo-500/30 rotate-1")}>
                              <div className="flex items-start justify-between">
                                <div {...prov.dragHandleProps} className="mt-0.5 text-slate-700 hover:text-slate-500 cursor-grab active:cursor-grabbing">
                                  <GripVertical className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex-1 mx-2 min-w-0">
                                  <p className="text-sm font-semibold text-slate-200 truncate">{[lead.firstName, lead.lastName].filter(Boolean).join(" ") || "—"}</p>
                                  <p className="text-xs text-slate-500 truncate">{lead.company}</p>

                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                  <button onClick={() => setEditLead(lead)} className="p-1 rounded text-slate-600 hover:text-slate-300 transition-colors"><Pencil className="w-3 h-3" /></button>
                                  <button onClick={() => setDeleteId(lead.id)} className="p-1 rounded text-slate-600 hover:text-rose-400 transition-colors"><Trash2 className="w-3 h-3" /></button>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {leads.length === 0 && !snapshot.isDraggingOver && (
                        <div className="flex items-center justify-center h-20 text-xs text-slate-700 rounded-lg border border-dashed border-[#1f2d45]">
                          No leads
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Modals */}
      {showCreate && <LeadFormModal onClose={() => setShowCreate(false)} />}
      {editLead && <LeadFormModal lead={editLead} onClose={() => setEditLead(null)} />}
      <ConfirmModal open={!!deleteId} title="Delete Lead" description="Remove this lead from the pipeline?" confirmLabel="Delete" destructive onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}
