import { z } from "zod";

// ── Sequence schema ──────────────────────────────────────────────────────────
export const sequenceSchema = z.object({
  id: z.string(),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
  delayDays: z.number().min(0, "Delay must be ≥ 0"),
});

// ── Campaign schemas ─────────────────────────────────────────────────────────
export const campaignDetailsSchema = z.object({
  name:         z.string().min(1, "Campaign name is required"),
  sendingEmail: z.string(), // set via setValue from inbox selection; defaultValues=""
  fromName:     z.string().min(1, "From name is required"),
  domain:       z.string().min(1, "Domain is required"),
});

export const campaignScheduleSchema = z.object({
  emailsPerDay: z.number().min(1).max(500),
  startDate:    z.string().optional().default(""),
});

// ── Lead schema ──────────────────────────────────────────────────────────────
export const leadSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName:  z.string().min(1, "Last name is required"),
  email:     z.string().email("Invalid email address"),
  company:   z.string().optional(),
  website:   z.string().optional(),
  linkedin:  z.string().optional(),
  instagram: z.string().optional(),
  facebook:  z.string().optional(),
  status:    z.enum(["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"]),
});

// ── Inbox schema ─────────────────────────────────────────────────────────────
export const inboxSchema = z.object({
  email: z.string().email("Invalid email address"),
  smtpHost: z.string().min(1, "SMTP host is required"),
  smtpPort: z.number().min(1).max(65535),
  password: z.string().min(1, "Password is required"),
  dailyCap: z.number().min(1, "Daily cap must be at least 1").max(10000),
});

// ── Profile schema ───────────────────────────────────────────────────────────
export const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
});

// ── Reply schema ─────────────────────────────────────────────────────────────
export const replySchema = z.object({
  body: z.string().min(1, "Reply cannot be empty"),
});

// ── Email settings schema ─────────────────────────────────────────────────────
export const emailSettingsSchema = z.object({
  defaultSignature: z.string(),
  defaultDomain: z.string(),
  defaultInboxId: z.string(),
});

export type SequenceFormValues = z.infer<typeof sequenceSchema>;
export type CampaignDetailsValues = z.infer<typeof campaignDetailsSchema>;
export type CampaignScheduleValues = z.infer<typeof campaignScheduleSchema>;
export type LeadFormValues = z.infer<typeof leadSchema>;
export type InboxFormValues = z.infer<typeof inboxSchema>;
export type ProfileFormValues = z.infer<typeof profileSchema>;
export type ReplyFormValues = z.infer<typeof replySchema>;
export type EmailSettingsFormValues = z.infer<typeof emailSettingsSchema>;
