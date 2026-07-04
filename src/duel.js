// Study Duel Combat Engine (Layer D)
// Manages the state machine for consecutive rapid-fire academic challenges.

import { QUESTION_BANK } from './questions.js';
import { addXp } from './session.js';
import { escapeHtml } from './utils.js';

// Global in-memory duel sessions
const activeDuels = new Map();

export function startDuel(userId, field) {
  const allQuestions = QUESTION_BANK[field] || QUESTION_BANK.gs;
  // Clone and shuffle
  const questions = [...allQuestions].sort(() => 0.5 - Math.random()).slice(0, 5);

  const duelState = {
    field,
    questions,
    currentIndex: 0,
    answers: [], // boolean values (true for correct)
    active: true
  };

  activeDuels.set(userId, duelState);
  return duelState;
}

export function getDuel(userId) {
  return activeDuels.get(userId);
}

export function clearDuel(userId) {
  activeDuels.delete(userId);
}

export function renderQuestion(duelState) {
  const q = duelState.questions[duelState.currentIndex];
  const fieldName = {
    quant: "📐 Quantitative Speed Arena",
    gs: "🏰 Core GS Citadel",
    lang: "🔤 Language Mastery Matrix"
  }[duelState.field];

  return `<b>⚔️ STUDY DUEL: COMBAT FIELD</b>
--------------------------------------------
<b>FIELD:</b> <i>${escapeHtml(fieldName)}</i>
<b>QUESTION:</b> <code>${duelState.currentIndex + 1} / 5</code>

❓ <b>Question:</b>
<pre>
${escapeHtml(q.question)}
</pre>

<i>Select one of the options below. A high-stakes countdown is simulated. Accuracy is paramount.</i>`;
}

export function submitAnswer(userId, optionIndex) {
  const duelState = activeDuels.get(userId);
  if (!duelState || !duelState.active) return null;

  const currentQ = duelState.questions[duelState.currentIndex];
  const isCorrect = optionIndex === currentQ.correctIndex;
  
  duelState.answers.push({
    questionNum: duelState.currentIndex + 1,
    questionText: currentQ.question,
    userSelected: currentQ.options[optionIndex],
    correctAnswer: currentQ.options[currentQ.correctIndex],
    explanation: currentQ.explanation,
    isCorrect
  });

  return {
    isCorrect,
    correctAnswerText: currentQ.options[currentQ.correctIndex],
    explanation: currentQ.explanation
  };
}

export function processScorecard(userId, username = "Cadet") {
  const duelState = activeDuels.get(userId);
  if (!duelState) return "";

  const totalQuestions = duelState.questions.length;
  const correctCount = duelState.answers.filter(a => a.isCorrect).length;
  const win = correctCount >= 4; // Victory if 4 or 5 correct

  // XP Calculations
  let xpEarned = correctCount * 10; // +10 XP per correct question
  let victoryBonus = 0;
  if (win) {
    victoryBonus = 50; // +50 XP Study Duel victory
    addXp(userId, xpEarned + victoryBonus);
  } else {
    addXp(userId, xpEarned);
  }

  // Generate Scorecard pre-formatted table
  let tableRows = duelState.answers.map(ans => {
    const statusSymbol = ans.isCorrect ? "✅ Correct" : "❌ Incorrect";
    return `Q${ans.questionNum}       | ${statusSymbol}`;
  }).join("\n");

  let errorBreakdown = "";
  const errors = duelState.answers.filter(a => !a.isCorrect);
  if (errors.length > 0) {
    errorBreakdown = `
--------------------------------------------
<b>🔍 CRITICAL ERROR ANALYSIS</b>\n`;
    errors.forEach(err => {
      errorBreakdown += `⚠️ <b>Q${err.questionNum} Failed:</b>\n`;
      errorBreakdown += `• <i>Your Answer:</i> ${escapeHtml(err.userSelected)}\n`;
      errorBreakdown += `• <i>Correct Answer:</i> <b>${escapeHtml(err.correctAnswer)}</b>\n`;
      errorBreakdown += `• <i>Resolution Logic:</i> <i>${escapeHtml(err.explanation)}</i>\n\n`;
    });
  }

  const resultHeader = win 
    ? `🏆 <b>VICTORY SECURED (+${xpEarned + victoryBonus} XP)</b>` 
    : `💀 <b>DEFEAT - INTELLECTUAL LIMIT REACHED (+${xpEarned} XP)</b>`;

  const report = `<b>⚔️ STUDY DUEL: SCORECARD</b>
--------------------------------------------
👤 <b>CONTENDER:</b> @${escapeHtml(username)}
📊 <b>FINAL SCORE:</b> <code>${correctCount} / ${totalQuestions}</code>
⚡ <b>STATUS:</b> ${resultHeader}

<pre>
Question | Evaluation State
---------------------------
${tableRows}
</pre>

--------------------------------------------
<b>XP DISTRIBUTION MATRIX:</b>
• Correct Blocks (Math/GS/Lang): <code>+${correctCount * 10} XP</code>
• Strategic Victory Bonus: <code>+${victoryBonus} XP</code>
• Net Cumulative Gain: <code>+${xpEarned + victoryBonus} XP</code>
${errorBreakdown}
`;

  clearDuel(userId);
  return report;
}
