// ─── TypeScript Interfaces ─────────────────────────────────────────────────

export type CampaignStatus = "Draft" | "Scheduled" | "Running" | "Paused" | "Completed";
export type LeadStatus = "New" | "Contacted" | "Qualified" | "Proposal" | "Won" | "Lost";
export type InboxStatus = "Connected" | "Error" | "Connecting";

// ── Sequence ────────────────────────────────────────────────────────────────
export type DelayUnit = "minutes" | "hours" | "days";

export interface Sequence {
  id: string;
  subject: string;
  body: string;
  delayDays: number;
  delayUnit: DelayUnit;
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
  sendingEmail: string;
  fromName: string;
  domain: string;
  status: CampaignStatus;
  sequences: Sequence[];
  leadIds: string[];
  emailsPerDay: number;
  startDate: string;
  createdAt: string;
  analytics: CampaignAnalytics;
  rampSettings: RampSettings;
}

// ── Lead ────────────────────────────────────────────────────────────────────
export interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  title: string;
  status: LeadStatus;
  tags: string[];
  owner: string;
  createdAt: string;
}

// ── InboxAccount ────────────────────────────────────────────────────────────
export interface InboxAccount {
  id: string;
  email: string;
  smtpHost: string;
  smtpPort: number;
  password: string;
  status: InboxStatus;
  lastSyncAt: string;  // ISO timestamp
  dailyCap: number;    // daily sending limit
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
