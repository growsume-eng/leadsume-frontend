import type {
  Campaign,
  Lead,
  InboxAccount,
  MailThread,
  TimeSeriesPoint,
  CampaignBarPoint,
  AppState,
  CampaignAnalytics,
  RampSettings,
} from "./types";

// ─── Default helpers ──────────────────────────────────────────────────────────
const defaultRamp: RampSettings = { enabled: false, start: 5, step: 5, max: 50 };

function makeAnalytics(
  openRate: number,
  replyRate: number,
  bounceRate: number,
  interestedRate: number,
  notInterestedRate: number,
  bookedRate: number,
  notRepliedRate: number,
  seqIds: string[],
): CampaignAnalytics {
  return {
    openRate,
    replyRate,
    bounceRate,
    interestedRate,
    notInterestedRate,
    bookedRate,
    notRepliedRate,
    sequenceStats: seqIds.map((id, i) => ({
      sequenceId: id,
      sent: [120, 85, 40][i] ?? 30,
      openRate: [openRate, openRate * 0.85, openRate * 0.7][i] ?? openRate * 0.6,
      replyRate: [replyRate, replyRate * 0.8, replyRate * 0.6][i] ?? replyRate * 0.5,
      bounceRate: bounceRate,
    })),
    timeSeries: [
      { date: "Apr 01", sent: 42, replies: 5 },
      { date: "Apr 05", sent: 78, replies: 9 },
      { date: "Apr 10", sent: 65, replies: 7 },
      { date: "Apr 15", sent: 110, replies: 14 },
      { date: "Apr 20", sent: 95, replies: 12 },
      { date: "Apr 24", sent: 130, replies: 18 },
      { date: "Apr 27", sent: 155, replies: 22 },
    ],
  };
}

// ─── Campaigns ────────────────────────────────────────────────────────────────
export const mockCampaigns: Campaign[] = [
  {
    id: "c1",
    name: "SaaS Founders Outreach Q2",
    sendingEmail: "alex@growsume.io",
    inboxIds: ["i1", "i2"],
    fromName: "Alex Rivera",
    domain: "growsume.io",
    status: "Running",
    sequences: [
      { id: "s1", subject: "Quick question about {your startup|your company}", body: "Hi {{first_name}},\n\nI came across {{company}} and was really impressed by what you're building.\n\nWe help {startups|SaaS companies} automate cold outreach at scale — curious if you'd be open to a 15-min chat?\n\nBest,\nAlex", delayDays: 0, delayUnit: "days" },
      { id: "s2", subject: "Re: Quick question", body: "Hi {{first_name}},\n\nJust bumping this up — did you get a chance to look at my previous note?\n\nWould love to explore how we can help {{company}} grow.\n\nAlex", delayDays: 3, delayUnit: "days" },
      { id: "s3", subject: "Last touch", body: "Hi {{first_name}},\n\nI'll keep this short — is cold email something you're actively investing in right now?\n\nIf yes, let's talk. If not, no worries at all.\n\nAlex", delayDays: 5, delayUnit: "days" },
    ],
    leadIds: ["l1", "l2", "l3", "l4", "l5"],
    emailsPerDay: 50,
    emailsPerDayPerInbox: 25,
    batchDelayMinutes: 5,
    startDate: "2026-04-01",
    createdAt: "2026-03-25T10:00:00Z",
    analytics: makeAnalytics(32.4, 11.2, 3.1, 8.5, 5.2, 4.1, 56.8, ["s1", "s2", "s3"]),
    rampSettings: { enabled: true, start: 10, step: 10, max: 50 },
  },
  {
    id: "c2",
    name: "E-commerce Brand Outreach",
    sendingEmail: "sarah@growsume.io",
    inboxIds: ["i2"],
    fromName: "Sarah Chen",
    domain: "growsume.io",
    status: "Scheduled",
    sequences: [
      { id: "s4", subject: "Boost your {email|outreach} ROI", body: "Hey {{first_name}},\n\nLooking at {{company}}'s growth trajectory — I think we can help you add another revenue channel.\n\nWorth 20 minutes?\n\nSarah", delayDays: 0, delayUnit: "days" },
    ],
    leadIds: ["l6", "l7", "l8"],
    emailsPerDay: 30,
    emailsPerDayPerInbox: 30,
    batchDelayMinutes: 3,
    startDate: "2026-05-01",
    createdAt: "2026-04-10T09:00:00Z",
    analytics: makeAnalytics(28.6, 9.4, 2.8, 6.1, 4.8, 3.2, 60.6, ["s4"]),
    rampSettings: defaultRamp,
  },
  {
    id: "c3",
    name: "Agency Partnership Drive",
    sendingEmail: "alex@growsume.io",
    inboxIds: ["i1"],
    fromName: "Alex Rivera",
    domain: "growsume.io",
    status: "Paused",
    sequences: [
      { id: "s5", subject: "Partnership opportunity for {Agency|your team}", body: "Hi {{first_name}},\n\nWe're looking for {agencies|partners} to white-label our AI email platform.\n\nInterested in exploring?\n\nAlex", delayDays: 0, delayUnit: "days" },
      { id: "s6", subject: "Following up on partnership", body: "Hi {{first_name}},\n\nJust circling back — did you get a chance to review my last email?\n\nAlex", delayDays: 4, delayUnit: "days" },
    ],
    leadIds: ["l9", "l10"],
    emailsPerDay: 20,
    emailsPerDayPerInbox: 20,
    batchDelayMinutes: 0,
    startDate: "2026-03-15",
    createdAt: "2026-03-10T11:00:00Z",
    analytics: makeAnalytics(24.1, 7.8, 4.2, 5.5, 6.3, 2.9, 61.5, ["s5", "s6"]),
    rampSettings: defaultRamp,
  },
  {
    id: "c4",
    name: "Investor Cold Outreach",
    sendingEmail: "alex@growsume.io",
    inboxIds: ["i1"],
    fromName: "Alex Rivera",
    domain: "growsume.io",
    status: "Completed",
    sequences: [
      { id: "s7", subject: "Seed round — {AI email|outreach automation} startup", body: "Hi {{first_name}},\n\nWe're raising a $2M seed for GrowSume — an AI-powered cold email platform.\n\nWould love to share our deck.\n\nAlex", delayDays: 0, delayUnit: "days" },
    ],
    leadIds: ["l11", "l12"],
    emailsPerDay: 10,
    emailsPerDayPerInbox: 10,
    batchDelayMinutes: 0,
    startDate: "2026-02-01",
    createdAt: "2026-01-28T08:00:00Z",
    analytics: makeAnalytics(18.3, 5.6, 5.8, 3.2, 7.1, 1.8, 72.5, ["s7"]),
    rampSettings: defaultRamp,
  },
  {
    id: "c5",
    name: "Content Marketing Leads",
    sendingEmail: "sarah@growsume.io",
    inboxIds: ["i2"],
    fromName: "Sarah Chen",
    domain: "growsume.io",
    status: "Draft",
    sequences: [],
    leadIds: [],
    emailsPerDay: 40,
    emailsPerDayPerInbox: 40,
    batchDelayMinutes: 2,
    startDate: "",
    createdAt: "2026-04-20T14:00:00Z",
    analytics: makeAnalytics(0, 0, 0, 0, 0, 0, 0, []),
    rampSettings: defaultRamp,
  },
];

// ─── Leads ────────────────────────────────────────────────────────────────────
export const mockLeads: Lead[] = [
  { id: "l1",  firstName: "Jordan",  lastName: "Williams", email: "jordan@acmecorp.io",   company: "Acme Corp",    status: "Contacted", createdAt: "2026-03-20T10:00:00Z" },
  { id: "l2",  firstName: "Morgan",  lastName: "Lee",      email: "morgan@nexustech.com", company: "Nexus Tech",   status: "Qualified", createdAt: "2026-03-21T10:00:00Z" },
  { id: "l3",  firstName: "Taylor",  lastName: "Brooks",   email: "taylor@prismhq.co",    company: "Prism HQ",     status: "New",       createdAt: "2026-03-22T10:00:00Z" },
  { id: "l4",  firstName: "Casey",   lastName: "Morgan",   email: "casey@sparkflow.io",   company: "SparkFlow",    status: "Proposal",  createdAt: "2026-03-23T10:00:00Z" },
  { id: "l5",  firstName: "Riley",   lastName: "Jordan",   email: "riley@zenithsaas.com", company: "Zenith SaaS",  status: "Won",       createdAt: "2026-03-24T10:00:00Z" },
  { id: "l6",  firstName: "Drew",    lastName: "Nguyen",   email: "drew@shopwave.io",     company: "ShopWave",     status: "New",       createdAt: "2026-04-01T10:00:00Z" },
  { id: "l7",  firstName: "Sam",     lastName: "Patel",    email: "sam@brandboost.co",    company: "BrandBoost",   status: "Contacted", createdAt: "2026-04-02T10:00:00Z" },
  { id: "l8",  firstName: "Quinn",   lastName: "Davis",    email: "quinn@reachretail.com",company: "Reach Retail", status: "New",       createdAt: "2026-04-03T10:00:00Z" },
  { id: "l9",  firstName: "Avery",   lastName: "Kim",      email: "avery@pixelage.agency",company: "Pixel Age",    status: "Qualified", createdAt: "2026-03-10T10:00:00Z" },
  { id: "l10", firstName: "Blake",   lastName: "Turner",   email: "blake@fusionmktg.com", company: "Fusion Mktg",  status: "Lost",      createdAt: "2026-03-11T10:00:00Z" },
  { id: "l11", firstName: "Parker",  lastName: "Singh",    email: "parker@vcventures.vc", company: "VC Ventures",  status: "Contacted", createdAt: "2026-01-15T10:00:00Z" },
  { id: "l12", firstName: "Reese",   lastName: "Chen",     email: "reese@angelcap.io",    company: "Angel Capital",status: "Won",       createdAt: "2026-01-16T10:00:00Z" },
  { id: "l13", firstName: "Kai",     lastName: "Johnson",  email: "kai@devhive.tech",     company: "DevHive",      status: "New",       createdAt: "2026-04-15T10:00:00Z" },
  { id: "l14", firstName: "Skylar",  lastName: "Ross",     email: "skylar@cloudbase.io",  company: "CloudBase",    status: "New",       createdAt: "2026-04-16T10:00:00Z" },
  { id: "l15", firstName: "Emery",   lastName: "Walsh",    email: "emery@launchpad.co",   company: "LaunchPad",    status: "Contacted", createdAt: "2026-04-17T10:00:00Z" },
  { id: "l16", firstName: "Rowan",   lastName: "Bell",     email: "rowan@scaledge.io",    company: "ScalEdge",     status: "Qualified", createdAt: "2026-04-18T10:00:00Z" },
  { id: "l17", firstName: "Finley",  lastName: "Cooper",   email: "finley@marketwise.com",company: "MarketWise",   status: "Proposal",  createdAt: "2026-04-19T10:00:00Z" },
  { id: "l18", firstName: "Hayden",  lastName: "Mills",    email: "hayden@growfast.io",   company: "GrowFast",     status: "Won",       createdAt: "2026-04-20T10:00:00Z" },
  { id: "l19", firstName: "Lennox",  lastName: "Gray",     email: "lennox@datapulse.co",  company: "DataPulse",    status: "New",       createdAt: "2026-04-21T10:00:00Z" },
  { id: "l20", firstName: "Noel",    lastName: "Rivera",   email: "noel@outreachly.com",  company: "Outreachly",   status: "Lost",      createdAt: "2026-04-22T10:00:00Z" },
];

// ─── Inboxes (no warmup) ──────────────────────────────────────────────────────
export const mockInboxes: InboxAccount[] = [
  {
    id: "i1",
    email: "alex@growsume.io",
    smtpHost: "smtp.gmail.com",
    smtpPort: 587,
    password: "••••••••",
    status: "Connected",
    lastSyncAt: "2026-04-27T18:00:00Z",
    dailyCap: 200,
    createdAt: "2026-02-01T10:00:00Z",
  },
  {
    id: "i2",
    email: "sarah@growsume.io",
    smtpHost: "smtp.gmail.com",
    smtpPort: 587,
    password: "••••••••",
    status: "Connected",
    lastSyncAt: "2026-04-27T17:30:00Z",
    dailyCap: 150,
    createdAt: "2026-03-01T10:00:00Z",
  },
  {
    id: "i3",
    email: "outreach@growsume.io",
    smtpHost: "smtp.sendgrid.net",
    smtpPort: 465,
    password: "••••••••",
    status: "Error",
    lastSyncAt: "2026-04-26T09:00:00Z",
    dailyCap: 100,
    createdAt: "2026-04-01T10:00:00Z",
  },
];

// ─── Mail Threads ─────────────────────────────────────────────────────────────
export const mockThreads: MailThread[] = [
  {
    id: "t1",
    subject: "Re: Quick question about your company",
    contact: "Jordan Williams",
    contactEmail: "jordan@acmecorp.io",
    unread: 2,
    lastAt: "2026-04-27T09:30:00Z",
    sentiment: "Positive",
    aiSummary: "Lead is interested in a demo. Mentioned budget approval next week. High intent.",
    messages: [
      { id: "m1", from: "alex@growsume.io", fromName: "Alex Rivera", body: "Hi Jordan,\n\nI came across Acme Corp and was really impressed by what you're building.\n\nWe help SaaS companies automate cold outreach at scale — curious if you'd be open to a 15-min chat?\n\nBest,\nAlex", timestamp: "2026-04-24T10:00:00Z", isMe: true },
      { id: "m2", from: "jordan@acmecorp.io", fromName: "Jordan Williams", body: "Hey Alex,\n\nThanks for reaching out! Yes, we're definitely interested in improving our outreach. Could you share more details about pricing?\n\nJordan", timestamp: "2026-04-25T11:00:00Z", isMe: false },
      { id: "m3", from: "alex@growsume.io", fromName: "Alex Rivera", body: "Hi Jordan,\n\nGreat to hear! Our plans start at $99/mo. Happy to jump on a call and walk you through everything.\n\nWhen works best for you this week?\n\nAlex", timestamp: "2026-04-26T09:00:00Z", isMe: true },
      { id: "m4", from: "jordan@acmecorp.io", fromName: "Jordan Williams", body: "Thursday 3pm EST works. Let me know if that's good!\n\nJordan", timestamp: "2026-04-27T09:30:00Z", isMe: false },
    ],
  },
  {
    id: "t2",
    subject: "Re: Boost your outreach ROI",
    contact: "Sam Patel",
    contactEmail: "sam@brandboost.co",
    unread: 0,
    lastAt: "2026-04-26T14:00:00Z",
    sentiment: "Neutral",
    aiSummary: "Lead asked about integrations. Not yet committed — needs follow-up around CRM compatibility.",
    messages: [
      { id: "m5", from: "sarah@growsume.io", fromName: "Sarah Chen", body: "Hey Sam,\n\nLooking at BrandBoost's growth trajectory — I think we can help you add another revenue channel.\n\nWorth 20 minutes?\n\nSarah", timestamp: "2026-04-25T08:00:00Z", isMe: true },
      { id: "m6", from: "sam@brandboost.co", fromName: "Sam Patel", body: "Hi Sarah, thanks for the note. Does your platform integrate with HubSpot?\n\nSam", timestamp: "2026-04-26T14:00:00Z", isMe: false },
    ],
  },
  {
    id: "t3",
    subject: "Partnership opportunity — follow up",
    contact: "Avery Kim",
    contactEmail: "avery@pixelage.agency",
    unread: 1,
    lastAt: "2026-04-27T07:00:00Z",
    sentiment: "Positive",
    aiSummary: "Agency lead wants to white-label the platform. Strong buying signal — send proposal ASAP.",
    messages: [
      { id: "m7", from: "alex@growsume.io", fromName: "Alex Rivera", body: "Hi Avery,\n\nWe're looking for agencies to white-label our AI email platform.\n\nInterested in exploring?\n\nAlex", timestamp: "2026-04-20T10:00:00Z", isMe: true },
      { id: "m8", from: "avery@pixelage.agency", fromName: "Avery Kim", body: "Alex, this sounds interesting. We manage outreach for 20+ clients. Could we see a partnership proposal?\n\nAvery", timestamp: "2026-04-27T07:00:00Z", isMe: false },
    ],
  },
  {
    id: "t4",
    subject: "Re: Seed round — AI email startup",
    contact: "Parker Singh",
    contactEmail: "parker@vcventures.vc",
    unread: 0,
    lastAt: "2026-04-22T16:00:00Z",
    sentiment: "Negative",
    aiSummary: "Investor passed — not their investment stage. Archive this thread.",
    messages: [
      { id: "m9", from: "alex@growsume.io", fromName: "Alex Rivera", body: "Hi Parker,\n\nWe're raising a $2M seed for GrowSume — an AI-powered cold email platform.\n\nWould love to share our deck.\n\nAlex", timestamp: "2026-04-20T09:00:00Z", isMe: true },
      { id: "m10", from: "parker@vcventures.vc", fromName: "Parker Singh", body: "Thanks Alex. We're focused on Series A+ right now — not the right fit for us. Good luck!\n\nParker", timestamp: "2026-04-22T16:00:00Z", isMe: false },
    ],
  },
  {
    id: "t5",
    subject: "Re: Quick question — Last touch",
    contact: "Morgan Lee",
    contactEmail: "morgan@nexustech.com",
    unread: 0,
    lastAt: "2026-04-23T11:00:00Z",
    sentiment: "Neutral",
    aiSummary: "No response to first two emails. Last-touch email sent. Consider removing from sequence.",
    messages: [
      { id: "m11", from: "alex@growsume.io", fromName: "Alex Rivera", body: "Hi Morgan,\n\nI'll keep this short — is cold email something you're actively investing in right now?\n\nIf yes, let's talk. If not, no worries at all.\n\nAlex", timestamp: "2026-04-23T11:00:00Z", isMe: true },
    ],
  },
];

// ─── Analytics Time Series ────────────────────────────────────────────────────
export const mockTimeSeriesData: TimeSeriesPoint[] = [
  { date: "Apr 01", sent: 120, opens: 36, replies: 8 },
  { date: "Apr 05", sent: 210, opens: 70, replies: 15 },
  { date: "Apr 10", sent: 180, opens: 62, replies: 12 },
  { date: "Apr 15", sent: 340, opens: 105, replies: 28 },
  { date: "Apr 18", sent: 290, opens: 95, replies: 22 },
  { date: "Apr 21", sent: 450, opens: 148, replies: 40 },
  { date: "Apr 24", sent: 380, opens: 120, replies: 33 },
  { date: "Apr 27", sent: 510, opens: 175, replies: 55 },
];

export const mockCampaignBarData: CampaignBarPoint[] = [
  { name: "SaaS Founders", responses: 55 },
  { name: "E-commerce", responses: 22 },
  { name: "Agency Drive", responses: 18 },
  { name: "Investor Reach", responses: 7 },
  { name: "Content Mktg", responses: 0 },
];

// ─── Campaign Breakdown (STATIC — no Math.random()) ──────────────────────────
export const campaignBreakdown = [
  { id: "c1", openRate: 32 },
  { id: "c2", openRate: 28 },
  { id: "c3", openRate: 24 },
  { id: "c4", openRate: 18 },
  { id: "c5", openRate: 0 },
];

// ─── Initial App State ────────────────────────────────────────────────────────
export const initialState: AppState = {
  campaigns: mockCampaigns,
  leads: mockLeads,
  inboxes: mockInboxes,
  threads: mockThreads,
  profile: {
    name: "Alex Rivera",
    email: "alex@growsume.io",
    avatar: "",
  },
  settings: {
    defaultSignature: "Best regards,\nAlex Rivera\nGrowSume",
    defaultDomain: "growsume.io",
    defaultInboxId: "i1",
    apiKey: "gs_live_aX9kLmN3pQ7rSt2uVw5y",
  },
};
