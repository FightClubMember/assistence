// Syntax and Module Import verification script

import { scanText } from './src/lexical.js';
import { getSyllabusReport } from './src/syllabus.js';
import { getStatusCard, updateSession, logStudySession, getPerformanceHistory } from './src/session.js';
import { askGroq, generateRecallQuiz } from './src/groq.js';
import { setupBot } from './bot.js';

console.log("Starting verification...");

try {
  // Test lexical
  const res = scanText("This accomodation is seperate.");
  if (res.includes("accommodation") && res.includes("separate")) {
    console.log("✅ Lexical analyzer module: VALID");
  } else {
    throw new Error("Lexical scan failed to identify errors");
  }

  // Test syllabus
  const report = getSyllabusReport(1, 0);
  if (report.includes("Habit Architecture Baseline")) {
    console.log("✅ Syllabus allocator module: VALID");
  } else {
    throw new Error("Syllabus report invalid");
  }

  // Test session status card
  const status = getStatusCard("user123", "test_user");
  if (status.includes("Aspirant Cadet") || status.includes("STUDY DASHBOARD")) {
    console.log("✅ Session state module: VALID");
  } else {
    throw new Error("Status card invalid");
  }

  // Test study logging
  const logResult = logStudySession("user123", "Polity Basics", 60, "Read Chapter 1");
  if (logResult && logResult.xpReward > 0 && logResult.totalMinutesToday === 60) {
    console.log("✅ Study session logging engine: VALID");
  } else {
    throw new Error("Study session logging failed");
  }

  // Test performance history chart
  const history = getPerformanceHistory("user123");
  if (history.includes("Polity Basics") || history.includes("Progress Chart")) {
    console.log("✅ Performance history chart: VALID");
  } else {
    throw new Error("Performance history chart invalid");
  }

  // Test Groq AI exports
  if (typeof askGroq === 'function' && typeof generateRecallQuiz === 'function') {
    console.log("✅ Groq AI module exports: VALID");
  } else {
    throw new Error("Groq module exports invalid");
  }

  // Test bot router exports
  if (typeof setupBot === 'function') {
    console.log("✅ Bot router module: VALID");
  } else {
    throw new Error("setupBot is not a function");
  }

  console.log("\n🚀 ALL MODULE INTEGRITY TESTS PASSED SUCCESSFULLY.");
  process.exit(0);

} catch (err) {
  console.error("❌ MODULE INTEGRITY TEST FAILED:");
  console.error(err);
  process.exit(1);
}
