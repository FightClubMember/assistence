// Dynamic Syllabus & Cognitive Load Allocator (Layer B)
// Manages study schedules, cognitive load limits, and stage state machines.

import { escapeHtml } from './utils.js';

export const STAGES = {
  1: {
    name: "Stage 1: Habit Architecture Baseline",
    hours: "3.0 Hours / Day",
    protocol: "Three Strict 1-Hour Blocks",
    description: "Build fundamental habits from absolute zero without cognitive overload.",
    schedule: `<pre>
Block     | Dur | Subject        | Focus
--------------------------------------------------------
Morning   | 1H  | GS Story       | Video-only concept parsing
Afternoon | 1H  | Speed Math     | Tables 1-20, squares 1-30
Evening   | 1H  | Lang Remed     | 30m English + 30m Hindi
</pre>`
  },
  2: {
    name: "Stage 2: Daylight Stabilization Core",
    hours: "5.5 Hours / Day",
    protocol: "NCERT & Supervised Solving Integration",
    description: "Unlocked after a 7-day streak. Transition into structured textbook parsing.",
    schedule: `<pre>
Block     | Dur  | Subject        | Focus
--------------------------------------------------------
Morning   | 2H   | NCERT Basics   | Geography, History, Polity
Afternoon | 2H   | Solving        | NCERT exercises + math
Evening   | 1.5H | Lang & Vocab   | Vocab + Hindi spelling grids
</pre>`
  },
  3: {
    name: "Stage 3: Elite Warrior Grid",
    hours: "7.5 Hours / Day",
    protocol: "9-to-5 Desk Job Strategy",
    description: "Unlocked after a 21-day streak. High-velocity reference material study.",
    schedule: `<pre>
Block     | Dur  | Subject        | Focus
--------------------------------------------------------
Morning   | 3H   | Deep Reference | Laxmikanth or Spectrum
Afternoon | 2.5H | Advanced Quant | Algebra, geometry, mocks
Evening   | 2H   | Current/Recov  | Newspaper + review recovery
</pre>`
  }
};

/**
 * Returns formatted status report of the student's syllabus phase.
 */
export function getSyllabusReport(stageNum, streak = 0) {
  const stage = STAGES[stageNum] || STAGES[1];
  
  let lockStatus = "";
  if (stageNum === 1) {
    lockStatus = `🔓 <b>Stage 1 Active.</b> (Streak: <b>${streak}/7</b> days to unlock Stage 2)`;
  } else if (stageNum === 2) {
    lockStatus = `🔓 <b>Stage 2 Active.</b> (Streak: <b>${streak}/21</b> days to unlock Stage 3)`;
  } else {
    lockStatus = `🔥 <b>Stage 3 ACTIVE - Elite Warrior Mode.</b> (Streak: <b>${streak}</b> days)`;
  }

  return `<b>ASTRAOS COGNITIVE LOAD ALLOCATOR</b>
--------------------------------------------
<b>ACTIVE PHASE:</b> <i>${escapeHtml(stage.name)}</i>
<b>DAILY HOURLY LOAD:</b> <code>${escapeHtml(stage.hours)}</code>
<b>OPERATIONAL PROTOCOL:</b> <i>${escapeHtml(stage.protocol)}</i>
<b>STATUS:</b> ${lockStatus}

<b>Phase Description:</b>  
<i>${escapeHtml(stage.description)}</i>

--------------------------------------------
<b>EXECUTION TIMELINE:</b>
${stage.schedule}
`;
}
