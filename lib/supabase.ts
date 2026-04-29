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
//   linkedin    text  (nullable)
//   instagram   text  (nullable)
//   facebook    text  (nullable)
//   status      text  (nullable)  New | Contacted | Qualified | Proposal | Won | Lost
//   tags        text  (nullable)  comma-separated string
//   created_at  timestamptz (default now())

/**
 * Raw shape returned by Supabase — every non-PK column can be null.
 */
export interface SupabaseLead {
  id:          string;
  first_name:  string | null;
  last_name:   string | null;
  email:       string | null;
  company:     string | null;
  website:     string | null;
  linkedin:    string | null;
  instagram:   string | null;
  facebook:    string | null;
  status:      string | null;
  tags:        string | null;
  created_at:  string | null;
}

import type { Lead } from "@/lib/types";

/**
 * Safely converts a raw Supabase row into the Lead shape used by the UI.
 * Every field is guarded against null / undefined — no runtime crashes.
 */
export function dbLeadToLocal(row: SupabaseLead): Lead {
  return {
    id:        row.id,

    firstName: row.first_name  || "",
    lastName:  row.last_name   || "",

    email:     row.email       || "",
    company:   row.company     || "",

    website:   row.website     || "",
    linkedin:  row.linkedin    || "",
    instagram: row.instagram   || "",
    facebook:  row.facebook    || "",

    status:    row.status      || "New",
    tags:      (row.tags || "").split(",").map(t => t.trim()).filter(Boolean),

    createdAt: row.created_at  || new Date().toISOString(),
  };
}

// ─── Campaigns ──────────────────────────────────────────────────────────────────
// Supabase "campaigns" table columns:
//   id                   uuid (primary key)
//   name                 text
//   sending_email        text   (primary/compat inbox email)
//   inbox_ids            text[] (array of InboxAccount IDs)
//   from_name            text
//   domain               text
//   status               text
//   emails_per_day       integer
//   emails_per_day_per_inbox integer
//   batch_delay_minutes  integer
//   start_date           text
//   created_at           timestamptz

/**
 * Raw shape of a campaign row from Supabase.
 */
export interface SupabaseCampaign {
  id:                       string;
  name:                     string | null;
  sending_email:            string | null;
  inbox_ids:                string[] | null;
  from_name:                string | null;
  domain:                   string | null;
  status:                   string | null;
  emails_per_day:           number | null;
  emails_per_day_per_inbox: number | null;
  batch_delay_minutes:      number | null;
  start_date:               string | null;
  sequences:                unknown | null;  // JSONB []
  lead_ids:                 unknown | null;  // JSONB []
  analytics:                unknown | null;  // JSONB {}
  ramp_settings:            unknown | null;  // JSONB {}
  created_at:               string | null;
}

import type { Campaign } from "@/lib/types";

/**
 * Converts a raw Supabase campaign row to the Campaign shape used by the UI.
 * inbox_ids is safely coerced to an array (handles null / undefined).
 */
const EMPTY_ANALYTICS = {
  openRate: 0, replyRate: 0, bounceRate: 0,
  interestedRate: 0, notInterestedRate: 0,
  bookedRate: 0, notRepliedRate: 0,
  sequenceStats: [], timeSeries: [],
};

/** Safely parse a JSONB value — returns fallback on any error. */
function safeJson<T>(val: unknown, fallback: T): T {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "object") return val as T;   // Supabase already parsed it
  try { return JSON.parse(val as string) as T; } catch { return fallback; }
}

/**
 * Converts a raw Supabase campaign row to the Campaign shape used by the UI.
 * All JSONB fields (sequences, lead_ids, analytics) parsed safely.
 */
export function dbCampaignToLocal(row: SupabaseCampaign): Campaign {
  return {
    id:                   row.id,
    name:                 row.name                     || "",
    sendingEmail:         row.sending_email            || "",
    inboxIds:             Array.isArray(row.inbox_ids) ? row.inbox_ids : [],
    fromName:             row.from_name                || "",
    domain:               row.domain                   || "",
    status:               (row.status as Campaign["status"]) || "Draft",
    emailsPerDay:         row.emails_per_day           ?? 50,
    emailsPerDayPerInbox: row.emails_per_day_per_inbox ?? 50,
    batchDelayMinutes:    row.batch_delay_minutes      ?? 0,
    startDate:            row.start_date               || "",
    sequences:            safeJson<Campaign["sequences"]>(row.sequences, []),
    leadIds:              safeJson<string[]>(row.lead_ids, []),
    analytics:            safeJson<Campaign["analytics"]>(row.analytics, EMPTY_ANALYTICS),
    rampSettings:         safeJson<Campaign["rampSettings"]>(row.ramp_settings, { enabled: false, start: 5, step: 5, max: 50 }),
    createdAt:            row.created_at               || new Date().toISOString(),
  };
}

/**
 * Builds the Supabase-safe insert/update payload for a campaign.
 * sequences and analytics stored as JSONB.
 */
export function campaignToDb(c: Omit<Campaign, "id" | "createdAt">) {
  return {
    name:                     c.name,
    sending_email:            c.sendingEmail,
    inbox_ids:                c.inboxIds.length > 0 ? c.inboxIds : [],
    from_name:                c.fromName,
    domain:                   c.domain,
    status:                   c.status,
    emails_per_day:           c.emailsPerDay,
    emails_per_day_per_inbox: c.emailsPerDayPerInbox,
    batch_delay_minutes:      c.batchDelayMinutes,
    start_date:               c.startDate || null,
    sequences:                c.sequences  ?? [],
    lead_ids:                 c.leadIds    ?? [],
    analytics:                c.analytics  ?? EMPTY_ANALYTICS,
    ramp_settings:            c.rampSettings ?? { enabled: false, start: 5, step: 5, max: 50 },
  };
}

// ─── Inboxes ─────────────────────────────────────────────────────────────────
// Supabase "inboxes" table columns:
//   id              uuid (primary key, default gen_random_uuid())
//   email           text
//   domain          text  (nullable)
//   smtp_host       text
//   smtp_port       integer
//   password        text  (nullable)
//   daily_cap       integer
//   warmup_enabled  boolean (nullable)
//   status          text  (nullable)   Connected | Error | Connecting
//   last_sync_at    timestamptz (nullable)
//   created_at      timestamptz (default now())

export interface SupabaseInbox {
  id:             string;
  email:          string | null;
  domain:         string | null;
  smtp_host:      string | null;
  smtp_port:      number | null;
  password:       string | null;
  daily_cap:      number | null;
  warmup_enabled: boolean | null;
  status:         string | null;
  last_sync_at:   string | null;
  created_at:     string | null;
}

import type { InboxAccount } from "@/lib/types";

/** Converts a raw Supabase inbox row → InboxAccount used by the UI. All nulls coerced safely. */
export function dbInboxToLocal(row: SupabaseInbox): InboxAccount {
  return {
    id:         row.id,
    email:      row.email     || "",
    smtpHost:   row.smtp_host || "",
    smtpPort:   row.smtp_port ?? 587,
    password:   row.password  || "",
    dailyCap:   row.daily_cap ?? 200,
    status:     (row.status as InboxAccount["status"]) || "Connecting",
    lastSyncAt: row.last_sync_at || new Date().toISOString(),
    createdAt:  row.created_at   || new Date().toISOString(),
  };
}

/** Builds the Supabase-safe insert/update payload for an inbox. */
export function inboxToDb(data: {
  email: string;
  smtpHost: string;
  smtpPort: number;
  password?: string;
  dailyCap: number;
  domain?: string;
  warmupEnabled?: boolean;
}) {
  const base: Record<string, unknown> = {
    email:          data.email,
    domain:         data.domain ?? data.email.split("@")[1] ?? null,
    smtp_host:      data.smtpHost,
    smtp_port:      data.smtpPort,
    daily_cap:      data.dailyCap,
    warmup_enabled: data.warmupEnabled ?? false,
    last_sync_at:   new Date().toISOString(),
  };
  if (data.password) base.password = data.password;
  return base;
}

