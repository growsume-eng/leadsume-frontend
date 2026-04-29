// ─── Simulator Types ──────────────────────────────────────────────────────────

export interface SequenceStep {
  dayOffset: number;          // working-days offset from lead start (0 = cold email)
  type: "cold" | "follow-up";
  label: string;
}

export interface SimDayResult {
  day: number;           // simulation day number (1-based)
  calendarDay: number;   // absolute calendar day (skips weekends when enabled)
  label: string;         // "Day 1", "Day 2", …
  newLeads: number;
  followUps: number;
  totalEmails: number;
  phase: "Ramp" | "Equilibrium";
}

export interface SimulationOutput {
  dailyData: SimDayResult[];
  equilibriumValue: number;   // new leads per day at steady-state
  monthlyLeadsEstimate: number;
  rampEndDay: number;         // simulation day index (0-based) where equilibrium starts
}

export interface SimulationParams {
  numberOfInboxes: number;
  dailyLimitPerInbox: number;
  totalLeads?: number | null;
  steps: SequenceStep[];
  excludeWeekends: boolean;
  simDays?: number;           // default 60
}

// ─── Working-day calendar ────────────────────────────────────────────────────
// Returns the Nth working day offset from day 0 (Mon=0, Tue=1, … Sun=6).
// If excludeWeekends is false, working day === calendar day.
function workingDayOffset(simDay: number, excludeWeekends: boolean): number {
  if (!excludeWeekends) return simDay;
  // Map simDay → calendar day, skipping Sat (5) & Sun (6) in a 7-day week
  let cal = 0;
  let wd  = 0;
  while (wd < simDay) {
    cal++;
    const dow = cal % 7; // 1=Mon … 5=Fri … 6=Sat … 0=Sun
    if (dow !== 0 && dow !== 6) wd++;
  }
  return cal;
}

// ─── Core simulation engine ───────────────────────────────────────────────────
export function runSimulation(params: SimulationParams): SimulationOutput {
  const {
    numberOfInboxes,
    dailyLimitPerInbox,
    totalLeads = null,
    steps,
    excludeWeekends,
    simDays = 60,
  } = params;

  const capacity = numberOfInboxes * dailyLimitPerInbox;
  if (capacity <= 0 || steps.length === 0) {
    return { dailyData: [], equilibriumValue: 0, monthlyLeadsEstimate: 0, rampEndDay: 0 };
  }

  // Sort steps by offset; first step must be day 0
  const sorted   = [...steps].sort((a, b) => a.dayOffset - b.dayOffset);
  const offsets  = sorted.map(s => s.dayOffset);
  const maxOffset = offsets[offsets.length - 1];
  const seqLen    = sorted.length;

  // Steady-state new leads per day
  const equilibrium = Math.floor(capacity / seqLen);
  // Ramp phase ends when system has enough follow-up backlog to fill capacity
  const rampEndSimDay = maxOffset;   // conservative: once the longest follow-up has fired

  // Per-simulation-day accounting
  const newLeadsStarted: number[] = new Array(simDays + maxOffset + 10).fill(0);
  // Overflow queue: follow-ups that could not be sent due to capacity and must spill to next day
  let overflowFollowUps = 0;

  let totalLeadsSent = 0;
  const dailyData: SimDayResult[] = [];

  for (let d = 0; d < simDays; d++) {
    const calendarDay = workingDayOffset(d, excludeWeekends);
    const isEquilibrium = d >= rampEndSimDay;

    // ── 1. Count follow-ups due today ────────────────────────────────────────
    let followUpsDue = overflowFollowUps; // carry-over from yesterday
    overflowFollowUps = 0;

    for (let past = 0; past < d; past++) {
      if (newLeadsStarted[past] === 0) continue;
      const delta = d - past; // working-day gap
      if (offsets.includes(delta)) {
        followUpsDue += newLeadsStarted[past];
      }
    }

    // ── 2. Reserve capacity for follow-ups first ─────────────────────────────
    const followUpsSent = Math.min(followUpsDue, capacity);
    const overflow      = followUpsDue - followUpsSent;
    overflowFollowUps  += overflow;  // push unsent follow-ups to tomorrow

    // ── 3. Remaining capacity → new leads ────────────────────────────────────
    const remaining = Math.max(0, capacity - followUpsSent);

    // During equilibrium, cap new leads to equilibrium value to model steady state
    const maxNew   = isEquilibrium ? Math.min(equilibrium, remaining) : remaining;
    let   newLeads = Math.floor(maxNew);

    // Apply lead-pool cap
    if (totalLeads != null) {
      newLeads = Math.min(newLeads, Math.max(0, totalLeads - totalLeadsSent));
    }

    newLeadsStarted[d]  = newLeads;
    totalLeadsSent     += newLeads;

    dailyData.push({
      day:         d + 1,
      calendarDay: calendarDay + 1,
      label:       `Day ${d + 1}`,
      newLeads,
      followUps:   Math.round(followUpsSent),
      totalEmails: Math.round(newLeads + followUpsSent),
      phase:       isEquilibrium ? "Equilibrium" : "Ramp",
    });

    // Early exit if lead pool exhausted
    if (totalLeads != null && totalLeadsSent >= totalLeads) {
      // Fill remaining days with 0 new leads (follow-ups may still fire)
      for (let rem = d + 1; rem < simDays; rem++) {
        let fu = 0;
        for (let past = 0; past <= rem; past++) {
          if (newLeadsStarted[past] === 0) continue;
          const delta = rem - past;
          if (offsets.includes(delta)) fu += newLeadsStarted[past];
        }
        const fuSent = Math.min(fu, capacity);
        dailyData.push({
          day:         rem + 1,
          calendarDay: workingDayOffset(rem, excludeWeekends) + 1,
          label:       `Day ${rem + 1}`,
          newLeads:    0,
          followUps:   Math.round(fuSent),
          totalEmails: Math.round(fuSent),
          phase:       rem >= rampEndSimDay ? "Equilibrium" : "Ramp",
        });
        newLeadsStarted[rem] = 0;
      }
      break;
    }
  }

  // ── Derived outputs ─────────────────────────────────────────────────────────
  const rampIdx            = dailyData.findIndex(d => d.phase === "Equilibrium");
  const rampEndDay         = rampIdx >= 0 ? rampIdx : dailyData.length;
  const monthlyLeads       = dailyData.slice(0, 30).reduce((s, d) => s + d.newLeads, 0);

  return {
    dailyData,
    equilibriumValue:      equilibrium,
    monthlyLeadsEstimate:  monthlyLeads,
    rampEndDay,
  };
}
