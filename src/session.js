// Session & State Manager (Layer C & Academic Bank Isolation Protocol)
// Provides JSON-file persistence for user academic levels, XP, streak, and semester modes.

import fs from 'fs';
import path from 'path';

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
    return `### **ASTRAOS INTERFACE: STATUS REPORT**
---
👤 **USER:** @${username}
⚠️ **ACADEMIC BANK ISOLATION PROTOCOL: ACTIVE**
🚩 **STATUS:** competitive training tracks SUSPENDED.
⚡ **ALLOCATED CAPACITY:** 100% University Semester Exam Prep.

---
*Competitive tracking is paused. Focus on obtaining maximum GPA. Tell the bot '/semester off' to resume competitive mode.*`;
  }

  const completedCount = Object.values(session.activeStudyBlocks).filter(Boolean).length;
  
  return `### **ASTRAOS INTERFACE: STATUS REPORT**
---
👤 **USER:** @${username}
⚔️ **RANK:** *${rank}*
📊 **LEVEL:** \`${session.level}\` | **XP:** \`${session.xp} XP\`
🔥 **CONSISTENCY STREAK:** \`${session.streak} Days\`
📈 **ACTIVE STAGE:** \`Stage ${session.stage}\`

---
### **TODAY'S COMPLIANCE CHECKLIST**
- [${session.activeStudyBlocks.morning ? 'x' : ' '}] **Morning Block** (Conceptual GS Video)
- [${session.activeStudyBlocks.afternoon ? 'x' : ' '}] **Afternoon Block** (Arithmetic Drill)
- [${session.activeStudyBlocks.evening ? 'x' : ' '}] **Evening Block** (Language Remediation)

📊 **Daily Compliance:** \`${completedCount}/3\` Blocks Logged.
`;
}
