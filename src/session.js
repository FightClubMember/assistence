// Session & State Manager (Layer C & Academic Bank Isolation Protocol)
// Provides JSON-file persistence for user academic levels, XP, streak, and semester modes.

import fs from 'fs';
import path from 'path';
import { escapeHtml } from './utils.js';

const SESSIONS_FILE = path.resolve('sessions.json');

// Default session state schema
const DEFAULT_SESSION = {
  xp: 0,
  level: 1,
  streak: 0,
  stage: 1,
  semesterExamMode: false,
  lastActivityDate: null,
  activeStudyBlocks: { morning: false, afternoon: false, evening: false }
};

let db = {};

// Load existing database
try {
  if (fs.existsSync(SESSIONS_FILE)) {
    const data = fs.readFileSync(SESSIONS_FILE, 'utf8');
    db = JSON.parse(data);
  }
} catch (err) {
  console.error("Error reading sessions.json, starting fresh:", err);
}

function saveDB() {
  try {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error("Error writing sessions.json:", err);
  }
}

export function getSession(userId) {
  if (!db[userId]) {
    db[userId] = { ...DEFAULT_SESSION, activeStudyBlocks: { ...DEFAULT_SESSION.activeStudyBlocks } };
    saveDB();
  }
  return db[userId];
}

export function updateSession(userId, updates) {
  const session = getSession(userId);
  Object.assign(session, updates);
  
  // Recalculate level and rank
  session.level = Math.floor(session.xp / 100) + 1;
  saveDB();
  return session;
}

export function addXp(userId, amount) {
  const session = getSession(userId);
  session.xp = Math.max(0, session.xp + amount);
  session.level = Math.floor(session.xp / 100) + 1;
  saveDB();
  return session;
}

export function getRankTier(level) {
  if (level <= 5) return "Aspirant Cadet (Lvl 1–5)";
  if (level <= 15) return "Master Scholar (Lvl 6–15)";
  if (level <= 30) return "Strategic Vanguard (Lvl 16–30)";
  return "Apex Commander (Lvl 31+)";
}

export function toggleSemesterMode(userId, enable) {
  const session = getSession(userId);
  session.semesterExamMode = enable;
  saveDB();
  return session;
}

export function getStatusCard(userId, username = "Cadet") {
  const session = getSession(userId);
  const rank = getRankTier(session.level);
  
  if (session.semesterExamMode) {
    return `<b>ASTRAOS INTERFACE: STATUS REPORT</b>
--------------------------------------------
👤 <b>USER:</b> @${escapeHtml(username)}
⚠️ <b>ACADEMIC BANK ISOLATION PROTOCOL: ACTIVE</b>
🚩 <b>STATUS:</b> competitive training tracks SUSPENDED.
⚡ <b>ALLOCATED CAPACITY:</b> 100% University Semester Exam Prep.

--------------------------------------------
<i>Competitive tracking is paused. Focus on obtaining maximum GPA. Tell the bot '/semester off' to resume competitive mode.</i>`;
  }

  const completedCount = Object.values(session.activeStudyBlocks).filter(Boolean).length;
  
  return `<b>ASTRAOS INTERFACE: STATUS REPORT</b>
--------------------------------------------
👤 <b>USER:</b> @${escapeHtml(username)}
⚔️ <b>RANK:</b> <i>${escapeHtml(rank)}</i>
📊 <b>LEVEL:</b> <code>${session.level}</code> | <b>XP:</b> <code>${session.xp} XP</code>
🔥 <b>CONSISTENCY STREAK:</b> <code>${session.streak} Days</code>
📈 <b>ACTIVE STAGE:</b> <code>Stage ${session.stage}</code>

--------------------------------------------
<b>TODAY'S COMPLIANCE CHECKLIST:</b>
- [${session.activeStudyBlocks.morning ? 'x' : ' '}] <b>Morning Block</b> (Conceptual GS Video)
- [${session.activeStudyBlocks.afternoon ? 'x' : ' '}] <b>Afternoon Block</b> (Arithmetic Drill)
- [${session.activeStudyBlocks.evening ? 'x' : ' '}] <b>Evening Block</b> (Language Remediation)

📊 <b>Daily Compliance:</b> <code>${completedCount}/3</code> Blocks Logged.
`;
}
