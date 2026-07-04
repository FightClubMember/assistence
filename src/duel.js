// Study Duel Combat Engine (Layer D)
// Manages the state machine for consecutive rapid-fire academic challenges.

import { QUESTION_BANK } from './questions.js';
import { addXp } from './session.js';

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

  return `### **⚔️ STUDY DUEL: COMBAT FIELD**
---
**FIELD:** *${fieldName}*
**QUESTION:** \`${duelState.currentIndex + 1} / 5\`

❓ **Question:**
\`\`\`text
${q.question}
\`\`\`

*Select one of the options below. A high-stakes countdown is simulated. Accuracy is paramount.*`;
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

  // Generate Scorecard markdown table
  let tableRows = duelState.answers.map(ans => {
    const statusSymbol = ans.isCorrect ? "✅ Correct" : "❌ Incorrect";
    return `| Q${ans.questionNum} | ${statusSymbol} |`;
  }).join("\n");

  let errorBreakdown = "";
  const errors = duelState.answers.filter(a => !a.isCorrect);
  if (errors.length > 0) {
    errorBreakdown = `\n---\n### **🔍 CRITICAL ERROR ANALYSIS**\n`;
    errors.forEach(err => {
      errorBreakdown += `⚠️ **Q${err.questionNum} Failed:**\n`;
      errorBreakdown += `• *Your Answer:* ${err.userSelected}\n`;
      errorBreakdown += `• *Correct Answer:* **${err.correctAnswer}**\n`;
      errorBreakdown += `• *Resolution Logic:* _${err.explanation}_\n\n`;
    });
  }

  const resultHeader = win 
    ? `🏆 **VICTORY SECURED (+${xpEarned + victoryBonus} XP)**` 
    : `💀 **DEFEAT - INTELLECTUAL LIMIT REACHED (+${xpEarned} XP)**`;

  const report = `### **⚔️ STUDY DUEL: SCORECARD**
---
👤 **CONTENDER:** @${username}
📊 **FINAL SCORE:** \`${correctCount} / ${totalQuestions}\`
⚡ **STATUS:** ${resultHeader}

| Question | Evaluation State |
| :--- | :--- |
${tableRows}

---
### **XP DISTRIBUTION MATRIX**
- Correct Blocks (Math/GS/Lang): \`+${correctCount * 10} XP\`
- Strategic Victory Bonus: \`+${victoryBonus} XP\`
- Net Cumulative Gain: \`+${xpEarned + victoryBonus} XP\`
${errorBreakdown}
`;

  clearDuel(userId);
  return report;
}
