"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Lightbulb, Copy } from "lucide-react";
import { toast } from "sonner";

const SPINTAX_EXAMPLES = [
  { pattern: "{Hi|Hello|Hey}", result: "Randomises greeting" },
  { pattern: "{your company|your business}", result: "Randomises reference" },
  { pattern: "{a quick call|15 minutes}", result: "Randomises CTA" },
  { pattern: "{I noticed|I saw|I came across}", result: "Randomises opener" },
];

const VARIABLES = [
  { key: "{{first_name}}",  desc: "Lead's first name"         },
  { key: "{{last_name}}",   desc: "Lead's last name"          },
  { key: "{{company}}",     desc: "Company name"              },
  { key: "{{website}}",     desc: "Company website URL"       },
  { key: "{{email}}",       desc: "Lead's email address"      },
  { key: "{{linkedin}}",    desc: "Lead's LinkedIn profile"   },
  { key: "{{instagram}}",   desc: "Lead's Instagram"          },
];

export default function SpintaxHelper() {
  const [open, setOpen] = useState(false);

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success(`Copied: ${text}`);
  }

  return (
    <div className="bg-[#0d1424] border border-[#1f2d45] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-300 hover:text-slate-100 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          Spintax &amp; Variables Helper
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>

      {open && (
        <div className="border-t border-[#1f2d45] p-4 space-y-4">
          {/* Spintax */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Spintax <span className="font-normal normal-case text-slate-600">— random variation per send</span>
            </p>
            <div className="space-y-1.5">
              {SPINTAX_EXAMPLES.map(ex => (
                <div key={ex.pattern} className="flex items-center justify-between bg-[#111827] border border-[#1f2d45] rounded-lg px-3 py-2">
                  <div>
                    <code className="text-xs text-amber-400">{ex.pattern}</code>
                    <span className="text-xs text-slate-600 ml-2">→ {ex.result}</span>
                  </div>
                  <button onClick={() => copyToClipboard(ex.pattern)} className="text-slate-600 hover:text-slate-300 transition-colors p-1">
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Variables */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Variables <span className="font-normal normal-case text-slate-600">— replaced per lead</span>
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {VARIABLES.map(v => (
                <button
                  key={v.key}
                  onClick={() => copyToClipboard(v.key)}
                  className="flex items-center justify-between bg-[#111827] border border-[#1f2d45] hover:border-indigo-500/50 rounded-lg px-3 py-2 text-left group transition-colors"
                >
                  <div>
                    <code className="text-xs text-indigo-400">{v.key}</code>
                    <p className="text-[10px] text-slate-600">{v.desc}</p>
                  </div>
                  <Copy className="w-3 h-3 text-slate-700 group-hover:text-slate-400 transition-colors shrink-0" />
                </button>
              ))}
            </div>
          </div>

          <p className="text-[10px] text-slate-600 border-t border-[#1f2d45] pt-3">
            Tip: Click any item to copy it to your clipboard, then paste into the subject or body field above.
          </p>
        </div>
      )}
    </div>
  );
}
