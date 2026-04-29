// ─── TypeScript Interfaces ─────────────────────────────────────────────────

export type CampaignStatus = "Draft" | "Scheduled" | "Running" | "Paused" | "Completed";
export type LeadStatus = "New" | "Contacted" | "Qualified" | "Proposal" | "Won" | "Lost";
export type InboxStatus = "Connected" | "Error" | "Connecting";

// ── Sequence A/B Variant ────────────────────────────────────────────────────
export interface ABVariant {
  subjectB: string;
  bodyB: string;
  splitPct: number; // 0-100, % sent to variant B
}

// ── Sequence ────────────────────────────────────────────────────────────────
export type DelayUnit = "hours" | "days";

export interface SequenceVariants {
  A: { subject: string; body: string };
  B: { subject: string; body: string };
  split: number; // 0-100, % of sends going to variant B
}

export interface Sequence {
  id: string;
  subject: string;
  body: string;
  delayValue?: number;  // preferred — falls back to delayDays
  delayUnit: DelayUnit; // "hours" | "days"
  /** @deprecated use delayValue — kept for backward compat */
  delayDays?: number;
  variants?: SequenceVariants; // A/B test (UI only)
}

// ── Campaign Analytics ────────────────────────────────────────────────────────
export interface SequenceStat {
  sequenceId: string;
  sent: number;
  openRate: number;
  replyRate: number;
  bounceRate: number;
}

export interface CampaignAnalytics {
  openRate: number;
  replyRate: number;
  bounceRate: number;
  interestedRate: number;
  notInterestedRate: number;
  bookedRate: number;
  notRepliedRate: number;
  sequenceStats: SequenceStat[];
  timeSeries: Array<{ date: string; sent: number; replies: number }>;
}

// ── Ramp Settings ─────────────────────────────────────────────────────────────
export interface RampSettings {
  enabled: boolean;
  start: number;
  step: number;
  max: number;
}

// ── Campaign ────────────────────────────────────────────────────────────────
export interface Campaign {
  id: string;
  name: string;
  sendingEmail: string;          // primary inbox email (kept for backward compat)
  inboxIds: string[];            // multi-inbox: array of InboxAccount IDs
  domain: string;
  status: CampaignStatus;
  sequences: Sequence[];
  leadIds: string[];
  emailsPerDay: number;
  emailsPerDayPerInbox: number;  // per-inbox daily cap (10-100)
  batchDelayMinutes: number;     // delay between batches (0-15 min)
  startDate: string;
  createdAt: string;
  analytics: CampaignAnalytics;
  rampSettings: RampSettings;
}

// ── Lead ────────────────────────────────────────────────────────────────────
export interface Lead {
  id: string;

  firstName: string;
  lastName: string;

  email: string;
  company?: string;

  website?:   string;
  linkedin?:  string;
  instagram?: string;
  facebook?:  string;

  city?:         string;
  state?:        string;

  status?:       string;
  tags?:         string[];
  customFields?: Record<string, string>; // {{token}} variables from CSV import

  createdAt?: string;
}

// ── InboxAccount ────────────────────────────────────────────────────────────
export interface InboxAccount {
  id: string;
  email: string;
  smtpHost: string;
  smtpPort: number;
  password: string;
  status: InboxStatus;
  lastSyncAt: string;   // ISO timestamp
  dailyCap: number;     // daily sending limit
  // Sender identity — used as {{sender_first_name}}, {{sender_last_name}}, {{sender_position}}
  firstName?: string;
  lastName?:  string;
  position?:  string;
  createdAt: string;
}

// ── MailMessage ──────────────────────────────────────────────────────────────
export interface MailMessage {
  id: string;
  from: string;
  fromName: string;
  body: string;
  timestamp: string;
  isMe: boolean;
}

// ── MailThread ───────────────────────────────────────────────────────────────
export interface MailThread {
  id: string;
  subject: string;
  contact: string;
  contactEmail: string;
  unread: number;
  messages: MailMessage[];
  sentiment: "Positive" | "Neutral" | "Negative";
  aiSummary: string;
  lastAt: string;
}

// ── Analytics ───────────────────────────────────────────────────────────────
export interface AnalyticsMetric {
  label: string;
  value: number;
  change: number; // percentage change
  unit?: string;
}

export interface TimeSeriesPoint {
  date: string;
  sent: number;
  opens: number;
  replies: number;
}

export interface CampaignBarPoint {
  name: string;
  responses: number;
}

export interface LeadPiePoint {
  name: LeadStatus;
  value: number;
}

// ── Settings ─────────────────────────────────────────────────────────────────
export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
}

export interface AppSettings {
  defaultSignature: string;
  defaultDomain: string;
  defaultInboxId: string;
  apiKey: string;
}

// ── App State ────────────────────────────────────────────────────────────────
export interface AppState {
  campaigns: Campaign[];
  leads: Lead[];
  inboxes: InboxAccount[];
  threads: MailThread[];
  profile: UserProfile;
  settings: AppSettings;
}
