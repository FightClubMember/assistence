// Syntax and Module Import verification script

import { scanText } from './src/lexical.js';
import { getSyllabusReport } from './src/syllabus.js';
import { getStatusCard, updateSession } from './src/session.js';
import { startDuel } from './src/duel.js';
import { startResume } from './src/resume.js';
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
  if (status.includes("Aspirant Cadet")) {
    console.log("✅ Session state module: VALID");
  } else {
    throw new Error("Status card invalid");
  }

  // Test duel initialization
  const duel = startDuel("user123", "gs");
  if (duel && duel.questions.length === 5) {
    console.log("✅ Duel engine module: VALID");
  } else {
    throw new Error("Duel initialization failed");
  }

  // Test resume phase
  const resumeText = startResume("user123");
  if (resumeText.includes("PHASE 1 OF 6")) {
    console.log("✅ Resume builder module: VALID");
  } else {
    throw new Error("Resume prompt invalid");
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
