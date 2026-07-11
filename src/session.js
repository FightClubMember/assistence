// Session & State Manager (Empathetic Companion)
// Provides persistence for study logs, levels, streaks, flashcards, and university isolation status.

import fs from 'fs';
import path from 'path';
import { escapeHtml } from './utils.js';

const SESSIONS_FILE = path.resolve('sessions.json');

const DEFAULT_SESSION = {
  xp: 0,
  level: 1,
  streak: 0,
  stage: 1,
  semesterExamMode: false,
  lastActivityDate: null,
  studyLogs: [], // Array of { date: 'YYYY-MM-DD', subject: string, minutes: number, notes: string }
  flashcards: [], // Array of { id, subject, question, answer, box, nextReviewDate }
  remindersEnabled: true,
  reminderTime: "09:00"
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

export function saveDB() {
  try {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error("Error writing sessions.json:", err);
  }
}

export function getLocalDateString() {
  const d = new Date();
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(Date.now() - tzOffset).toISOString().slice(0, 10);
}

export function getSession(userId) {
  if (!db[userId]) {
    db[userId] = { ...DEFAULT_SESSION, studyLogs: [], flashcards: [] };
    saveDB();
  }
  // Safety migrations for existing session stores
  if (!db[userId].studyLogs) db[userId].studyLogs = [];
  if (!db[userId].flashcards) db[userId].flashcards = [];
  if (db[userId].remindersEnabled === undefined) db[userId].remindersEnabled = true;
  if (!db[userId].reminderTime) db[userId].reminderTime = "09:00";
  
  return db[userId];
}

export function updateSession(userId, updates) {
  const session = getSession(userId);
  Object.assign(session, updates);
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

/**
 * Log a study session into database
 */
export function logStudySession(userId, subject, minutes, notes) {
  const session = getSession(userId);
  const today = getLocalDateString();
  
  const logEntry = {
    date: today,
    subject,
    minutes: parseInt(minutes, 10) || 0,
    notes: notes || ""
  };
  
  session.studyLogs.push(logEntry);
  
  // XP rewards: +10 XP per session logged + additional XP based on minutes
  const xpReward = 10 + Math.floor(logEntry.minutes / 15);
  session.xp += xpReward;
  session.level = Math.floor(session.xp / 100) + 1;
  
  // Calculate today's total study minutes
  const todayLogs = session.studyLogs.filter(l => l.date === today);
  const totalMinutesToday = todayLogs.reduce((acc, curr) => acc + curr.minutes, 0);
  
  // Target minutes per stage: Stage 1 = 3H (180m), Stage 2 = 5.5H (330m), Stage 3 = 7.5H (450m)
  const targetMinutes = session.stage === 1 ? 180 : session.stage === 2 ? 330 : 450;
  
  // Manage streak progress
  if (session.lastActivityDate !== today) {
    if (totalMinutesToday >= targetMinutes) {
      session.streak += 1;
      session.lastActivityDate = today;
      session.xp += 20; // +20 XP streak consistency bonus
      
      // Auto-stage upgrades
      if (session.streak >= 21 && session.stage < 3) {
        session.stage = 3;
      } else if (session.streak >= 7 && session.stage < 2) {
        session.stage = 2;
      }
    }
  }
  
  saveDB();
  return { session, xpReward, totalMinutesToday, targetMinutes };
}

/**
 * Generates a visual progress bar
 */
function makeProgressBar(percent) {
  const totalBlocks = 10;
  const filledBlocks = Math.min(totalBlocks, Math.round(percent / 10));
  const emptyBlocks = totalBlocks - filledBlocks;
  return "[" + "■".repeat(filledBlocks) + "□".repeat(emptyBlocks) + `] ${Math.round(percent)}%`;
}

export function getStatusCard(userId, username = "Student") {
  const session = getSession(userId);
  const rank = getRankTier(session.level);
  const today = getLocalDateString();
  
  if (session.semesterExamMode) {
    return `🎓 <b>ACADEMIC BANK ISOLATION MODE: ACTIVE</b>
--------------------------------------------
👤 <b>Student:</b> @${escapeHtml(username)}
📚 <b>Focus:</b> 100% University Semester Exam Prep.
⚡ <b>Competitive track:</b> Temporarily paused.

<i>"I have paused your competitive tracking so you can focus entirely on securing excellent college marks. Good luck with your semester exams! You've got this. Let me know when you finish to resume your normal schedule."</i>

👉 Type <code>/semester off</code> or click the button below when you are ready to resume.`;
  }

  // Today's stats
  const todayLogs = session.studyLogs.filter(l => l.date === today);
  const totalMinutesToday = todayLogs.reduce((acc, curr) => acc + curr.minutes, 0);
  const targetMinutes = session.stage === 1 ? 180 : session.stage === 2 ? 330 : 450;
  const compliancePercent = Math.min(100, (totalMinutesToday / targetMinutes) * 100);
  const progressHtml = makeProgressBar(compliancePercent);

  // Spaced repetition stats
  const pendingFlashcardsCount = session.flashcards.filter(c => c.nextReviewDate <= today).length;

  let logsListHtml = "";
  if (todayLogs.length > 0) {
    logsListHtml = todayLogs.map((log, idx) => {
      return `  ${idx + 1}. <b>${escapeHtml(log.subject)}</b>: <code>${log.minutes} mins</code>${log.notes ? ` (<i>${escapeHtml(log.notes)}</i>)` : ""}`;
    }).join("\n");
  } else {
    logsListHtml = "  <i>No study blocks logged yet today. You can start by clicking '⏱️ Log Study'!</i>";
  }

  return `❤️ <b>STUDY DASHBOARD & STATS</b>
--------------------------------------------
👤 <b>Student:</b> @${escapeHtml(username)}
⚔️ <b>Rank:</b> <i>${escapeHtml(rank)}</i>
📊 <b>Level:</b> <code>${session.level}</code> | <b>XP:</b> <code>${session.xp} XP</code>
🔥 <b>Study Streak:</b> <code>${session.streak} Days</code>
📈 <b>Active Schedule:</b> <code>Stage ${session.stage}</code>
🎴 <b>Pending Cards:</b> <code>${pendingFlashcardsCount} Reviews today</code>

<b>TODAY'S PROGRESS:</b>
<code>${progressHtml}</code>
⏱️ Logged Today: <code>${(totalMinutesToday / 60).toFixed(1)}h</code> / <code>${(targetMinutes / 60).toFixed(1)}h</code> target.

<b>TODAY'S LOGS:</b>
${logsListHtml}

--------------------------------------------
<i>Keep going! Consistent micro-habits lead to macro-results. Let's make today count!</i>
`;
}

/**
 * Returns a scannable report of study history
 */
export function getPerformanceHistory(userId) {
  const session = getSession(userId);
  if (session.studyLogs.length === 0) {
    return `📈 <b>Performance History:</b>
You haven't logged any study sessions yet! Once you log your studies, I'll compile a historical chart of your hours here.`;
  }

  // Group by date
  const grouped = {};
  session.studyLogs.forEach(log => {
    grouped[log.date] = (grouped[log.date] || 0) + log.minutes;
  });

  // Get last 7 entries
  const dates = Object.keys(grouped).sort().slice(-7);
  let chartRows = dates.map(d => {
    const hours = (grouped[d] / 60).toFixed(1);
    const bars = "■".repeat(Math.min(10, Math.round(grouped[d] / 60)));
    return `${d} | ${hours}h | ${bars}`;
  }).join("\n");

  return `📈 <b>YOUR RECENT STUDY HISTORY (Last 7 Days)</b>
--------------------------------------------
<pre>
Date       | Hours| Progress Chart
--------------------------------------------
${chartRows}
</pre>

<b>Total Study Sessions:</b> <code>${session.studyLogs.length}</code>
<i>Keep building that chart up! Your future self will thank you.</i>
`;
}
