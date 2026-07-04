// Dynamic Syllabus & Cognitive Load Allocator (Layer B)
// Manages study schedules, cognitive load limits, and stage state machines.

export const STAGES = {
  1: {
    name: "Stage 1: Habit Architecture Baseline",
    hours: "3.0 Hours / Day",
    protocol: "Three Strict 1-Hour Blocks",
    description: "Build fundamental habits from absolute zero without cognitive overload.",
    schedule: `| Block | Duration | Domain / Subject | Focus Area |
| :--- | :--- | :--- | :--- |
| **Morning** | 1 Hour | Conceptual GS Storytelling | Video-only concept parsing (No dense manual reads) |
| **Afternoon** | 1 Hour | Arithmetic Foundations | Speed math, tables 1-20, squares 1-30, cubes 1-15, fractions |
| **Evening** | 1 Hour | Language Remediation | 30m English spellings + 30m Hindi text copy & Matra check |`
  },
  2: {
    name: "Stage 2: Daylight Stabilization Core",
    hours: "5.5 Hours / Day",
    protocol: "NCERT & Supervised Solving Integration",
    description: "Unlocked after a 7-day streak. Transition into structured textbook parsing.",
    schedule: `| Block | Duration | Domain / Subject | Focus Area |
| :--- | :--- | :--- | :--- |
| **Morning** | 2 Hours | NCERT Basics | Foundation reading of Geography, History, and Polity manuals |
| **Afternoon** | 2 Hours | Supervised Problem Solving | NCERT back-exercises and elementary math applications |
| **Evening** | 1.5 Hours | Core Language & Vocab | Advanced vocabulary, English error grammar, Hindi spelling grids |`
  },
  3: {
    name: "Stage 3: Elite Warrior Grid",
    hours: "7.5 Hours / Day",
    protocol: "9-to-5 Desk Job Strategy",
    description: "Unlocked after a 21-day streak. High-velocity reference material study.",
    schedule: `| Block | Duration | Domain / Subject | Focus Area |
| :--- | :--- | :--- | :--- |
| **Morning** | 3 Hours | Deep Reference Texts | Laxmikanth (Polity) or Spectrum (Modern History) chapters |
| **Afternoon** | 2.5 Hours | Advanced Quantitative | Algebra transformations, geometry, and CDS/SSC mock sets |
| **Evening** | 2 Hours | Current Affairs & Recovery | Newspaper analysis, monthly magazines, day recovery review |`
  }
};

/**
 * Returns formatted status report of the student's syllabus phase.
 */
export function getSyllabusReport(stageNum, streak = 0) {
  const stage = STAGES[stageNum] || STAGES[1];
  
  let lockStatus = "";
  if (stageNum === 1) {
    lockStatus = `🔓 **Stage 1 Active.** (Streak: **${streak}/7** days to unlock Stage 2)`;
  } else if (stageNum === 2) {
    lockStatus = `🔓 **Stage 2 Active.** (Streak: **${streak}/21** days to unlock Stage 3)`;
  } else {
    lockStatus = `🔥 **Stage 3 ACTIVE - Elite Warrior Mode.** (Streak: **${streak}** days)`;
  }

  return `### **ASTRAOS COGNITIVE LOAD ALLOCATOR**
---
**ACTIVE PHASE:** *${stage.name}*
**DAILY HOURLY LOAD:** \`${stage.hours}\`
**OPERATIONAL PROTOCOL:** *${stage.protocol}*
**STATUS:** ${lockStatus}

**Phase Description:**  
_${stage.description}_

---
### **EXECUTION TIMELINE**
${stage.schedule}
`;
}
