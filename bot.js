// AstraOS Core Telegram Bot Logic (Main router)

import { Telegraf, Markup } from 'telegraf';
import { scanText } from './src/lexical.js';
import { getSyllabusReport } from './src/syllabus.js';
import { getStatusCard, updateSession, getSession, addXp, toggleSemesterMode } from './src/session.js';
import { startDuel, getDuel, submitAnswer, renderQuestion, processScorecard, clearDuel } from './src/duel.js';
import { startResume, getResumeState, savePhaseData, clearResume } from './src/resume.js';
import { escapeHtml } from './src/utils.js';

export function setupBot(token) {
  const bot = new Telegraf(token);

  // Global menu reply keyboard
  const mainMenu = Markup.keyboard([
    ['📊 Status / Profile', '📚 Study Syllabus'],
    ['⚔️ Study Duel', '📄 ATS Resume'],
    ['🚫 Semester Mode ON', '✅ Semester Mode OFF']
  ]).resize();

  // Helper to send message with lexical repair appended
  async function replyWithLexicalCheck(ctx, text, extra = {}) {
    const userText = ctx.message && ctx.message.text ? ctx.message.text : "";
    const repairs = scanText(userText);
    const finalMsg = text + repairs;
    return ctx.reply(finalMsg, { parse_mode: 'HTML', ...extra });
  }

  // Helper for ambiguity elimination checklist
  function getAmbiguityChecklist() {
    return `<b>ASTRAOS CORE: AMBIGUITY ELIMINATION CHECKLIST</b>
--------------------------------------------
The system detected an ambiguous text entry. Select a command from the keyboard below or use one of these precise options:

1. <b>Option 1:</b> Type <code>/status</code> or click <code>📊 Status / Profile</code> to review your learning profile and log study blocks.
2. <b>Option 2:</b> Type <code>/duel</code> or click <code>⚔️ Study Duel</code> to initiate an interactive 5-question mock exam.
3. <b>Option 3:</b> Type <code>/makeresume</code> or click <code>📄 ATS Resume</code> to begin generating an ATS-friendly CV.
`;
  }

  // --- COMMAND HANDLERS ---

  bot.start(async (ctx) => {
    const userId = ctx.from.id;
    const username = ctx.from.username || ctx.from.first_name || "Cadet";
    
    // Initialize session
    getSession(userId);

    const welcomeText = `<b>ASTRAOS CORE v5.0-ENTERPRISE</b>
--------------------------------------------
<b>PEDAGOGICAL SYSTEM DEPLOYED</b>
Welcome, @${escapeHtml(username)}. The Academic Operating System is online.

Use the clinical menu buttons below to allocate cognitive load, run study duels, and evaluate syntax.
`;
    return replyWithLexicalCheck(ctx, welcomeText, mainMenu);
  });

  bot.command('status', async (ctx) => {
    const userId = ctx.from.id;
    const username = ctx.from.username || ctx.from.first_name || "Cadet";
    const statusCard = getStatusCard(userId, username);
    return replyWithLexicalCheck(ctx, statusCard);
  });

  bot.command('syllabus', async (ctx) => {
    const userId = ctx.from.id;
    const session = getSession(userId);
    const report = getSyllabusReport(session.stage, session.streak);
    return replyWithLexicalCheck(ctx, report);
  });

  bot.command('duel', async (ctx) => {
    const userId = ctx.from.id;
    const session = getSession(userId);
    
    if (session.semesterExamMode) {
      return replyWithLexicalCheck(ctx, `⚠️ <b>ACCESS DENIED:</b> Competitive study duels are locked while the <b>Academic Bank Isolation Protocol</b> is active. Disable semester mode to unlock.`);
    }

    const inlineKeyboard = Markup.inlineKeyboard([
      [Markup.button.callback('📐 Quantitative Speed Arena', 'select_duel_quant')],
      [Markup.button.callback('🏰 Core GS Citadel', 'select_duel_gs')],
      [Markup.button.callback('🔤 Language Mastery Matrix', 'select_duel_lang')]
    ]);

    return replyWithLexicalCheck(ctx, `<b>⚔️ STUDY DUEL: FIELD SELECT</b>\n--------------------------------------------\nChoose your academic combat arena:`, inlineKeyboard);
  });

  bot.command('makeresume', async (ctx) => {
    const userId = ctx.from.id;
    const prompt = startResume(userId);
    return replyWithLexicalCheck(ctx, prompt);
  });

  bot.command('cancel', async (ctx) => {
    const userId = ctx.from.id;
    let cancelled = false;

    if (getResumeState(userId)) {
      clearResume(userId);
      cancelled = true;
    }
    if (getDuel(userId)) {
      clearDuel(userId);
      cancelled = true;
    }

    if (cancelled) {
      return ctx.reply("🚫 <b>Operation Aborted.</b> Main menu active.", { parse_mode: 'HTML', ...mainMenu });
    } else {
      return ctx.reply("No active duel or resume process running.", { parse_mode: 'HTML' });
    }
  });

  // Log completion of study blocks
  bot.command('complete', async (ctx) => {
    const userId = ctx.from.id;
    const session = getSession(userId);
    
    if (session.semesterExamMode) {
      return ctx.reply("⚠️ <b>Academic Bank Isolation Protocol</b> is active. Track semester work directly.", { parse_mode: 'HTML' });
    }

    const parts = ctx.message.text.split(" ");
    const block = parts[1]?.toLowerCase();

    if (!block || !['morning', 'afternoon', 'evening'].includes(block)) {
      return ctx.reply(`Use syntax: <code>/complete morning</code>, <code>/complete afternoon</code>, or <code>/complete evening</code>`, { parse_mode: 'HTML' });
    }

    if (session.activeStudyBlocks[block]) {
      return ctx.reply(`Block <b>${escapeHtml(block)}</b> has already been completed today.`, { parse_mode: 'HTML' });
    }

    session.activeStudyBlocks[block] = true;
    addXp(userId, 10); // +10 XP per study block logged
    
    // Check if all blocks are complete
    const allDone = Object.values(session.activeStudyBlocks).every(Boolean);
    let streakText = "";
    if (allDone) {
      session.streak += 1;
      streakText = `\n🔥 <b>Streak Updated:</b> <code>${session.streak} Days</code>`;
      
      // Auto-unlock stages based on streak
      if (session.streak >= 21 && session.stage < 3) {
        session.stage = 3;
        streakText += `\n🏆 <b>STAGE 3 UNLOCKED! Elite Warrior Grid active.</b>`;
      } else if (session.streak >= 7 && session.stage < 2) {
        session.stage = 2;
        streakText += `\n📈 <b>STAGE 2 UNLOCKED! Daylight Stabilization active.</b>`;
      }
    }
    updateSession(userId, session);

    return ctx.reply(`✅ <b>Block ${escapeHtml(block)} verified.</b> logged +10 XP.${streakText}\nUse /status to see checklist.`, { parse_mode: 'HTML' });
  });

  // Semester mode command
  bot.command('semester', async (ctx) => {
    const userId = ctx.from.id;
    const parts = ctx.message.text.split(" ");
    const action = parts[1]?.toLowerCase();

    if (action === 'on') {
      toggleSemesterMode(userId, true);
      const card = getStatusCard(userId);
      return ctx.reply(card, { parse_mode: 'HTML' });
    } else if (action === 'off') {
      toggleSemesterMode(userId, false);
      return ctx.reply("✅ <b>Semester Mode Deactivated.</b> Competitive exam tracks and Study Duels restored.", { parse_mode: 'HTML' });
    } else {
      return ctx.reply("Use syntax: <code>/semester on</code> or <code>/semester off</code>", { parse_mode: 'HTML' });
    }
  });

  // Reset daily study blocks (for testing or cron)
  bot.command('reset_blocks', async (ctx) => {
    const userId = ctx.from.id;
    const session = getSession(userId);
    session.activeStudyBlocks = { morning: false, afternoon: false, evening: false };
    updateSession(userId, session);
    return ctx.reply("🔄 Daily study blocks reset. Use /status to view.");
  });

  // --- BUTTON/KEYBOARD TEXT HANDLERS ---

  bot.hears('📊 Status / Profile', async (ctx) => {
    const userId = ctx.from.id;
    const username = ctx.from.username || ctx.from.first_name || "Cadet";
    return replyWithLexicalCheck(ctx, getStatusCard(userId, username));
  });

  bot.hears('📚 Study Syllabus', async (ctx) => {
    const userId = ctx.from.id;
    const session = getSession(userId);
    return replyWithLexicalCheck(ctx, getSyllabusReport(session.stage, session.streak));
  });

  bot.hears('⚔️ Study Duel', async (ctx) => {
    return ctx.reply("Type <code>/duel</code> to select field and launch.", { parse_mode: 'HTML' });
  });

  bot.hears('📄 ATS Resume', async (ctx) => {
    const userId = ctx.from.id;
    const prompt = startResume(userId);
    return replyWithLexicalCheck(ctx, prompt);
  });

  bot.hears('🚫 Semester Mode ON', async (ctx) => {
    const userId = ctx.from.id;
    toggleSemesterMode(userId, true);
    const card = getStatusCard(userId);
    return ctx.reply(card, { parse_mode: 'HTML' });
  });

  bot.hears('✅ Semester Mode OFF', async (ctx) => {
    const userId = ctx.from.id;
    toggleSemesterMode(userId, false);
    return ctx.reply("✅ <b>Semester Mode Deactivated.</b> Competitive exam tracks and Study Duels restored.", { parse_mode: 'HTML' });
  });

  // --- CALLBACK QUERY HANDLERS (INLINE BUTTONS) ---

  bot.on('callback_query', async (ctx) => {
    const userId = ctx.from.id;
    const data = ctx.callbackQuery.data;
    const username = ctx.from.username || ctx.from.first_name || "Cadet";

    // Duel arena selection
    if (data.startsWith('select_duel_')) {
      const field = data.split('_')[2];
      const duelState = startDuel(userId, field);
      const rendered = renderQuestion(duelState);

      const q = duelState.questions[0];
      const inlineButtons = Markup.inlineKeyboard([
        [Markup.button.callback(`A) ${q.options[0]}`, 'duel_ans_0'), Markup.button.callback(`B) ${q.options[1]}`, 'duel_ans_1')],
        [Markup.button.callback(`C) ${q.options[2]}`, 'duel_ans_2'), Markup.button.callback(`D) ${q.options[3]}`, 'duel_ans_3')]
      ]);

      await ctx.answerCbQuery("Duel initiated.");
      return ctx.editMessageText(rendered, { parse_mode: 'HTML', ...inlineButtons });
    }

    // Duel answer submitting
    if (data.startsWith('duel_ans_')) {
      const optionIndex = parseInt(data.split('_')[2], 10);
      const duelState = getDuel(userId);

      if (!duelState) {
        await ctx.answerCbQuery("Error: Duel session not found.");
        return ctx.reply("No active duel running. Start a new one using /duel.");
      }

      const result = submitAnswer(userId, optionIndex);
      await ctx.answerCbQuery(result.isCorrect ? "Correct!" : "Incorrect!");

      let resultHeader = result.isCorrect ? "✅ <b>CORRECT VERIFICATION</b>" : "❌ <b>INCORRECT SUBMISSION</b>";
      let feedback = `${resultHeader}\n\n• <b>Correct Option:</b> ${escapeHtml(result.correctAnswerText)}\n• <b>Resolution Logic:</b> <i>${escapeHtml(result.explanation)}</i>\n\n`;

      if (duelState.currentIndex + 1 < duelState.questions.length) {
        const nextBtn = Markup.inlineKeyboard([
          [Markup.button.callback('➡️ Next Question', 'duel_next')]
        ]);
        return ctx.editMessageText(feedback + "<i>Click below to advance to the next combat question.</i>", { parse_mode: 'HTML', ...nextBtn });
      } else {
        const finishBtn = Markup.inlineKeyboard([
          [Markup.button.callback('📊 View Final Scorecard', 'duel_finish')]
        ]);
        return ctx.editMessageText(feedback + "<i>All 5 challenges completed.</i>", { parse_mode: 'HTML', ...finishBtn });
      }
    }

    // Duel next question advancement
    if (data === 'duel_next') {
      const duelState = getDuel(userId);
      if (!duelState) {
        await ctx.answerCbQuery("Error: Session invalid.");
        return ctx.reply("Use /duel to start a new game.");
      }

      duelState.currentIndex += 1;
      const rendered = renderQuestion(duelState);
      const q = duelState.questions[duelState.currentIndex];

      const inlineButtons = Markup.inlineKeyboard([
        [Markup.button.callback(`A) ${q.options[0]}`, 'duel_ans_0'), Markup.button.callback(`B) ${q.options[1]}`, 'duel_ans_1')],
        [Markup.button.callback(`C) ${q.options[2]}`, 'duel_ans_2'), Markup.button.callback(`D) ${q.options[3]}`, 'duel_ans_3')]
      ]);

      await ctx.answerCbQuery();
      return ctx.editMessageText(rendered, { parse_mode: 'HTML', ...inlineButtons });
    }

    // Duel finish scorecard render
    if (data === 'duel_finish') {
      const scorecard = processScorecard(userId, username);
      await ctx.answerCbQuery("Scorecard loaded.");
      return ctx.editMessageText(scorecard, { parse_mode: 'HTML' });
    }
  });

  // --- GENERAL MESSAGE TEXT / FLOW CAPTURE ---

  bot.on('message', async (ctx) => {
    const userId = ctx.from.id;
    const text = ctx.message.text;

    // Check if resume architect flow is active
    const resumeState = getResumeState(userId);
    if (resumeState) {
      const result = savePhaseData(userId, text);
      if (result) {
        if (result.done) {
          await ctx.reply("🎉 <b>ATS Resume compilation completed!</b> Here is your Markdown format:", { parse_mode: 'HTML' });
          await ctx.reply(`<pre><code class="language-markdown">${escapeHtml(result.resumeMarkdown)}</code></pre>`, { parse_mode: 'HTML' });
          await ctx.reply("Below is your raw LaTeX code. Copy it directly into Overleaf:", { parse_mode: 'HTML' });
          return ctx.reply(`<pre><code class="language-latex">${escapeHtml(result.resumeLatex)}</code></pre>`, { parse_mode: 'HTML' });
        } else {
          return ctx.reply(result.nextPrompt, { parse_mode: 'HTML' });
        }
      }
    }

    // Default chat fallback (performs Lexical scan + Ambiguity checklist)
    if (text) {
      const repairs = scanText(text);
      if (repairs) {
        return ctx.reply(`<b>ASTRAOS COGNITIVE CORE SCAN</b>\n--------------------------------------------\nAnalysis of text complete.${repairs}`, { parse_mode: 'HTML' });
      } else {
        // Clear text, no typos, no active command -> trigger ambiguity elimination checklist
        const checklist = getAmbiguityChecklist();
        return ctx.reply(checklist, { parse_mode: 'HTML', ...mainMenu });
      }
    }
  });

  return bot;
}
