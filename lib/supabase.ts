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
//   company     text
//   title       text
//   status      text  (New | Contacted | Qualified | Proposal | Won | Lost)
//   tags        text  (comma-separated string)
//   owner       text
//   created_at  timestamptz (default now())

export interface SupabaseLead {
  id: string;
  name: string;
  email: string;
  company: string;
  title: string;
  status: string;
  tags: string;          // stored as comma-separated string
  owner: string;
  created_at: string;
}

/** Convert a Supabase row to the local Lead shape used by the UI */
import type { Lead } from "@/lib/types";

export function dbLeadToLocal(row: SupabaseLead): Lead {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    company: row.company,
    title: row.title ?? "",
    status: row.status as Lead["status"],
    tags: row.tags ? row.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
    owner: row.owner ?? "",
    createdAt: row.created_at,
  };
}
