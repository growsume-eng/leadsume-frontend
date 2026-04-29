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
// Supabase "leads" table columns:
//   id          uuid (primary key, default gen_random_uuid())
//   first_name  text  (nullable)
//   last_name   text  (nullable)
//   email       text  (nullable)
//   company     text  (nullable)
//   website     text  (nullable)
//   status      text  (nullable)  New | Contacted | Qualified | Proposal | Won | Lost
//   created_at  timestamptz (default now())

/**
 * Raw shape returned by Supabase — every non-PK column can be null.
 */
export interface SupabaseLead {
  id: string;
  first_name:  string | null;
  last_name:   string | null;
  email:       string | null;
  company:     string | null;
  website:     string | null;
  status:      string | null;
  created_at:  string | null;
}

import type { Lead } from "@/lib/types";

/**
 * Safely converts a raw Supabase row into the Lead shape used by the UI.
 * Every field is guarded against null / undefined.
 */
export function dbLeadToLocal(row: SupabaseLead): Lead {
  return {
    id:        row.id,
    firstName: row.first_name  || "",
    lastName:  row.last_name   || "",
    email:     row.email       || "",
    company:   row.company     || "",
    website:   row.website     || "",
    status:    (row.status     || "New") as Lead["status"],
    createdAt: row.created_at  || new Date().toISOString(),
  };
}
