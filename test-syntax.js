// Syntax and Module Import verification script

import { scanText } from './src/lexical.js';
import { getSyllabusReport } from './src/syllabus.js';
import { getStatusCard, updateSession, logStudySession, getPerformanceHistory, getLocalDateString } from './src/session.js';
import { askGroq, generateRecallQuiz } from './src/groq.js';
import { downloadVoiceFile, transcribeAudio, evaluateExplanation } from './src/feynman.js';
import { generateFlashcards, updateCardLeitner, addDays } from './src/flashcard.js';
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
  if (status.includes("STUDY DASHBOARD") && status.includes("Pending Cards")) {
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

  // Test Leitner system card calculations
  const sampleCard = {
    id: "fc_test",
    subject: "History",
    question: "Who led Champaran?",
    answer: "Gandhi",
    box: 1,
    nextReviewDate: getLocalDateString()
  };
  
  const updatedCardCorrect = updateCardLeitner({ ...sampleCard }, true);
  if (updatedCardCorrect.box === 2 && updatedCardCorrect.nextReviewDate === addDays(getLocalDateString(), 3)) {
    console.log("✅ Leitner spaced progression math: VALID");
  } else {
    throw new Error("Leitner Box 2 progression failed");
  }

  const updatedCardIncorrect = updateCardLeitner({ ...sampleCard, box: 3 }, false);
  if (updatedCardIncorrect.box === 1 && updatedCardIncorrect.nextReviewDate === addDays(getLocalDateString(), 1)) {
    console.log("✅ Leitner spaced reset math: VALID");
  } else {
    throw new Error("Leitner Box reset failed");
  }

  // Test Feynman module exports
  if (typeof downloadVoiceFile === 'function' && typeof transcribeAudio === 'function' && typeof evaluateExplanation === 'function') {
    console.log("✅ Feynman active evaluation engine exports: VALID");
  } else {
    throw new Error("Feynman exports invalid");
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
