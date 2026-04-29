import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. " +
    "Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Leads ─────────────────────────────────────────────────────────────────────
// Matches the "leads" table schema in Supabase:
//   id          uuid (primary key, default gen_random_uuid())
//   name        text
//   email       text
//   company     text          (nullable)
//   title       text          (nullable)
//   status      text          (nullable)  New | Contacted | Qualified | Proposal | Won | Lost
//   tags        text          (nullable)  comma-separated string
//   owner       text          (nullable)
//   created_at  timestamptz   (default now())

/**
 * Reflects the *actual* shape Supabase returns — every non-PK column can be
 * null if the column is nullable or if the row was inserted without that field.
 */
export interface SupabaseLead {
  id: string;
  name: string | null;
  email: string | null;
  company: string | null;
  title: string | null;
  status: string | null;
  tags: string | null;
  owner: string | null;
  created_at: string | null;
}

import type { Lead } from "@/lib/types";

/**
 * Safely converts a raw Supabase row into the Lead shape used by the UI.
 * Every field is guarded against null / undefined — no runtime crashes.
 */
export function dbLeadToLocal(row: SupabaseLead): Lead {
  return {
    id: row.id,

    // String fields — fall back to empty string when null/undefined
    name:    row.name    ?? "",
    email:   row.email   ?? "",
    company: row.company ?? "",
    title:   row.title   ?? "",
    owner:   row.owner   ?? "",

    // Enum field — fall back to "New" so the badge always renders
    status: (row.status ?? "New") as Lead["status"],

    // tags: stored as a nullable comma-separated string → string[]
    // (row.tags || "") ensures null/undefined both become ""
    // .map(t => t.trim()) removes surrounding whitespace per tag
    // .filter(Boolean) drops empty strings that result from leading/trailing commas
    tags: (row.tags || "")
      .split(",")
      .map(t => t.trim())
      .filter(Boolean),

    // Timestamp — fall back to current time so date-fns never receives null
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}
