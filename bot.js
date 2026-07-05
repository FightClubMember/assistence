// AstraOS Core Telegram Bot Logic (Empathetic Companion)

import { Telegraf, Markup } from 'telegraf';
import { scanText } from './src/lexical.js';
import { getSyllabusReport } from './src/syllabus.js';
import { getStatusCard, updateSession, getSession, addXp, toggleSemesterMode, logStudySession, getPerformanceHistory, getLocalDateString } from './src/session.js';
import { askGroq, generateRecallQuiz } from './src/groq.js';
import { escapeHtml } from './src/utils.js';

export function setupBot(token) {
  const bot = new Telegraf(token);

  // Friendly Reply Keyboard
  const mainMenu = Markup.keyboard([
    ['📊 Dashboard', '⏱️ Log Study'],
    ['📈 History', '🧠 Recall Quiz'],
    ['🤖 AI Tutor', '🔔 Reminders'],
    ['🎓 Semester Mode']
  ]).resize();

  // Helper to send message with lexical repair appended
  async function replyWithLexicalCheck(ctx, text, extra = {}) {
    const userText = ctx.message && ctx.message.text ? ctx.message.text : "";
    const repairs = scanText(userText);
    const finalMsg = text + repairs;
    return ctx.reply(finalMsg, { parse_mode: 'HTML', ...extra });
  }

  // --- COMMAND HANDLERS ---

  bot.start(async (ctx) => {
    const userId = ctx.from.id;
    const username = ctx.from.username || ctx.from.first_name || "friend";
    
    // Initialize session
    getSession(userId);

    const welcomeText = `👋 <b>Hello, @${escapeHtml(username)}! Welome to your Study Companion!</b>
--------------------------------------------
I am here to help you stay on track, support your learning, and make your study journey less lonely. 

Here is what we can do together:
• 📊 Check your <b>Dashboard</b> for streaks and daily goals.
• ⏱️ Click <b>Log Study</b> after a study session to record your hours.
• 📈 View your study charts in <b>History</b>.
• 🧠 Generate a personalized <b>Recall Quiz</b> based on what you studied today.
• 🤖 Chat with your friendly <b>AI Tutor</b> for explanations or motivational support.

Let's do this together, one day at a time! ❤️`;
    return replyWithLexicalCheck(ctx, welcomeText, mainMenu);
  });

  bot.command('status', async (ctx) => {
    const userId = ctx.from.id;
    const username = ctx.from.username || ctx.from.first_name || "friend";
    return replyWithLexicalCheck(ctx, getStatusCard(userId, username));
  });

  bot.command('history', async (ctx) => {
    const userId = ctx.from.id;
    return replyWithLexicalCheck(ctx, getPerformanceHistory(userId));
  });

  bot.command('syllabus', async (ctx) => {
    const userId = ctx.from.id;
    const session = getSession(userId);
    return replyWithLexicalCheck(ctx, getSyllabusReport(session.stage, session.streak));
  });

  bot.command('log', async (ctx) => {
    const userId = ctx.from.id;
    const session = getSession(userId);

    if (session.semesterExamMode) {
      return ctx.reply("🎓 <b>Semester Mode is active.</b> Competitive logs are paused, but if you want to record college study hours, tell me to turn /semester off first!", { parse_mode: 'HTML' });
    }

    session.loggingState = 'AWAITING_SUBJECT';
    session.tempLog = {};
    updateSession(userId, session);

    return ctx.reply("⏱️ <b>Let's log your study session!</b>\n\nWhat subject or topic did you focus on? (e.g. <i>Indian Polity, Speed Math, Geography NCERT</i>)", { parse_mode: 'HTML', reply_markup: { remove_keyboard: true } });
  });

  bot.command('ask', async (ctx) => {
    const query = ctx.message.text.substring(5).trim();
    if (!query) {
      return ctx.reply("🤖 <b>AI Tutor:</b> Please write your question after the command. For example: <code>/ask explain photosynthesis simply</code>", { parse_mode: 'HTML' });
    }

    const waitMsg = await ctx.reply("🤔 <i>Thinking and compiling explanation...</i>", { parse_mode: 'HTML' });
    const response = await askGroq(query, `The student asked via /ask command. Keep the response highly supportive.`);
    
    return ctx.telegram.editMessageText(ctx.chat.id, waitMsg.message_id, null, response, { parse_mode: 'HTML' });
  });

  bot.command('recall', async (ctx) => {
    const userId = ctx.from.id;
    const session = getSession(userId);
    const today = getLocalDateString();
    const todayLogs = session.studyLogs.filter(l => l.date === today);

    const waitMsg = await ctx.reply("🧠 <i>Analyzing today's study topics and generating your active recall quiz... Please wait a few seconds.</i>", { parse_mode: 'HTML' });
    const username = ctx.from.username || ctx.from.first_name || "friend";
    const quizResponse = await generateRecallQuiz(todayLogs, username);

    return ctx.telegram.editMessageText(ctx.chat.id, waitMsg.message_id, null, quizResponse, { parse_mode: 'HTML' });
  });

  bot.command('semester', async (ctx) => {
    const userId = ctx.from.id;
    const parts = ctx.message.text.split(" ");
    const action = parts[1]?.toLowerCase();

    if (action === 'on') {
      toggleSemesterMode(userId, true);
      return ctx.reply(getStatusCard(userId), { parse_mode: 'HTML', ...mainMenu });
    } else if (action === 'off') {
      toggleSemesterMode(userId, false);
      return ctx.reply("✅ <b>Semester Mode deactivated!</b> Welcome back to your competitive study timeline. Let's do this! ❤️", { parse_mode: 'HTML', ...mainMenu });
    } else {
      const session = getSession(userId);
      toggleSemesterMode(userId, !session.semesterExamMode);
      return ctx.reply(getStatusCard(userId), { parse_mode: 'HTML', ...mainMenu });
    }
  });

  bot.command('cancel', async (ctx) => {
    const userId = ctx.from.id;
    const session = getSession(userId);
    let cancelled = false;

    if (session.loggingState) {
      session.loggingState = null;
      session.tempLog = null;
      updateSession(userId, session);
      cancelled = true;
    }

    if (cancelled) {
      return ctx.reply("🚫 <b>Logging process cancelled.</b> I've brought you back to the main menu.", { parse_mode: 'HTML', ...mainMenu });
    } else {
      return ctx.reply("No active logging flow is running. You are in the main menu!", { parse_mode: 'HTML', ...mainMenu });
    }
  });

  bot.command('remind', async (ctx) => {
    const userId = ctx.from.id;
    const session = getSession(userId);

    const inlineKeyboard = Markup.inlineKeyboard([
      [Markup.button.callback(session.remindersEnabled ? '🔔 Disable Reminders' : '🔕 Enable Reminders', 'toggle_reminders')]
    ]);

    return ctx.reply(`🔔 <b>Reminders Configuration</b>
--------------------------------------------
Status: <b>${session.remindersEnabled ? 'Enabled' : 'Disabled'}</b>
We will send you friendly support prompts to help keep you consistent!`, { parse_mode: 'HTML', ...inlineKeyboard });
  });

  // --- BUTTON/KEYBOARD TEXT HANDLERS ---

  bot.hears('📊 Dashboard', async (ctx) => {
    const userId = ctx.from.id;
    const username = ctx.from.username || ctx.from.first_name || "friend";
    return replyWithLexicalCheck(ctx, getStatusCard(userId, username));
  });

  bot.hears('⏱️ Log Study', async (ctx) => {
    const userId = ctx.from.id;
    const session = getSession(userId);

    if (session.semesterExamMode) {
      return ctx.reply("🎓 <b>Semester Mode is active.</b> Competitive tracking is paused. If you want to log study, turn /semester off first!", { parse_mode: 'HTML' });
    }

    session.loggingState = 'AWAITING_SUBJECT';
    session.tempLog = {};
    updateSession(userId, session);

    return ctx.reply("⏱️ <b>Let's log your study session!</b>\n\nWhat subject or topic did you focus on? (e.g. <i>Indian Polity, Speed Math, Geography NCERT</i>)\n\n👉 <i>Type /cancel to abort at any time.</i>", { parse_mode: 'HTML', reply_markup: { remove_keyboard: true } });
  });

  bot.hears('📈 History', async (ctx) => {
    const userId = ctx.from.id;
    return replyWithLexicalCheck(ctx, getPerformanceHistory(userId));
  });

  bot.hears('📚 Study Syllabus', async (ctx) => {
    const userId = ctx.from.id;
    const session = getSession(userId);
    return replyWithLexicalCheck(ctx, getSyllabusReport(session.stage, session.streak));
  });

  bot.hears('🧠 Recall Quiz', async (ctx) => {
    const userId = ctx.from.id;
    const session = getSession(userId);
    const today = getLocalDateString();
    const todayLogs = session.studyLogs.filter(l => l.date === today);

    const waitMsg = await ctx.reply("🧠 <i>Analyzing today's study topics and generating your active recall quiz... Please wait a few seconds.</i>", { parse_mode: 'HTML' });
    const username = ctx.from.username || ctx.from.first_name || "friend";
    const quizResponse = await generateRecallQuiz(todayLogs, username);

    return ctx.telegram.editMessageText(ctx.chat.id, waitMsg.message_id, null, quizResponse, { parse_mode: 'HTML' });
  });

  bot.hears('🤖 AI Tutor', async (ctx) => {
    return ctx.reply(`👋 <b>Welcome to your Groq AI Tutor!</b>

I am here to act as your personal academic mentor. You can ask me any study-related question, ask me to explain difficult concepts simply, or ask for encouragement when you are feeling tired.

👉 <b>How to ask me:</b>
Simply type your question directly in the chat! If you aren't in a study logging flow, I will automatically analyze it and give you a helpful, detailed, and encouraging response.

<i>Try it! Send a message like: "Explain Champaran Satyagraha in simple terms" or "I am feeling overwhelmed, what should I do?"</i>`, { parse_mode: 'HTML' });
  });

  bot.hears('🔔 Reminders', async (ctx) => {
    const userId = ctx.from.id;
    const session = getSession(userId);

    const inlineKeyboard = Markup.inlineKeyboard([
      [Markup.button.callback(session.remindersEnabled ? '🔔 Disable Reminders' : '🔕 Enable Reminders', 'toggle_reminders')]
    ]);

    return ctx.reply(`🔔 <b>Reminders Configuration</b>
--------------------------------------------
Status: <b>${session.remindersEnabled ? 'Enabled' : 'Disabled'}</b>

We will send you friendly support prompts to help keep you consistent! You can toggle them using the button below.`, { parse_mode: 'HTML', ...inlineKeyboard });
  });

  bot.hears('🎓 Semester Mode', async (ctx) => {
    const userId = ctx.from.id;
    const session = getSession(userId);
    toggleSemesterMode(userId, !session.semesterExamMode);
    return ctx.reply(getStatusCard(userId), { parse_mode: 'HTML', ...mainMenu });
  });

  // --- CALLBACK QUERY HANDLERS ---

  bot.on('callback_query', async (ctx) => {
    const userId = ctx.from.id;
    const data = ctx.callbackQuery.data;

    if (data === 'toggle_reminders') {
      const session = getSession(userId);
      session.remindersEnabled = !session.remindersEnabled;
      updateSession(userId, session);

      await ctx.answerCbQuery(session.remindersEnabled ? "Reminders Enabled" : "Reminders Disabled");

      const inlineKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback(session.remindersEnabled ? '🔔 Disable Reminders' : '🔕 Enable Reminders', 'toggle_reminders')]
      ]);

      return ctx.editMessageText(`🔔 <b>Reminders Configuration</b>
--------------------------------------------
Status: <b>${session.remindersEnabled ? 'Enabled' : 'Disabled'}</b>

We will send you friendly support prompts to help keep you consistent! You can toggle them using the button below.`, { parse_mode: 'HTML', ...inlineKeyboard });
    }
  });

  // --- GENERAL MESSAGE TEXT / FLOW CAPTURE ---

  bot.on('message', async (ctx) => {
    const userId = ctx.from.id;
    const text = ctx.message.text;
    const session = getSession(userId);
    const username = ctx.from.username || ctx.from.first_name || "friend";

    // 1. Log Study Session state machine
    if (session.loggingState) {
      if (text === '/cancel') {
        session.loggingState = null;
        session.tempLog = null;
        updateSession(userId, session);
        return ctx.reply("🚫 <b>Logging process cancelled.</b>", { parse_mode: 'HTML', ...mainMenu });
      }

      if (session.loggingState === 'AWAITING_SUBJECT') {
        session.tempLog.subject = text;
        session.loggingState = 'AWAITING_MINUTES';
        updateSession(userId, session);
        return ctx.reply("⏱️ <b>Got it!</b>\n\nHow many minutes did you study this topic? (Please reply with a number, e.g. <i>45, 60, 90</i>)", { parse_mode: 'HTML' });
      }

      if (session.loggingState === 'AWAITING_MINUTES') {
        const mins = parseInt(text, 10);
        if (isNaN(mins) || mins <= 0) {
          return ctx.reply("⚠️ <b>Oops!</b> Please enter a valid positive number of minutes (e.g. <i>45, 60, 120</i>).", { parse_mode: 'HTML' });
        }
        session.tempLog.minutes = mins;
        session.loggingState = 'AWAITING_NOTES';
        updateSession(userId, session);
        return ctx.reply("📝 <b>Almost done!</b>\n\nAny quick notes on what you achieved or benchmarks hit? (e.g. <i>Read Laxmikanth Chapter 3, solved 30 Speed Math drills</i>. Or reply 'none' to skip.)", { parse_mode: 'HTML' });
      }

      if (session.loggingState === 'AWAITING_NOTES') {
        const notes = text.toLowerCase() === 'none' ? "" : text;
        const subject = session.tempLog.subject;
        const minutes = session.tempLog.minutes;

        // Clear logging states
        session.loggingState = null;
        session.tempLog = null;
        updateSession(userId, session);

        // Record session and calculate targets
        const result = logStudySession(userId, subject, minutes, notes);

        const xpText = `⚡ <b>XP Earned:</b> <code>+${result.xpReward} XP</code>`;
        let targetAchievedText = "";
        
        if (result.totalMinutesToday >= result.targetMinutes) {
          targetAchievedText = `\n🔥 <b>Target Achieved!</b> You have completed your stage target of <code>${(result.targetMinutes/60).toFixed(1)}h</code> today! Streak updated to <b>${result.session.streak} days</b>. Level upgraded to <b>Lvl ${result.session.level}</b>. Great job! ❤️`;
        } else {
          targetAchievedText = `\n⏱️ Total studied today: <code>${(result.totalMinutesToday/60).toFixed(1)}h</code> / <code>${(result.targetMinutes/60).toFixed(1)}h</code> target.`;
        }

        return ctx.reply(`🎉 <b>Session logged successfully!</b>
--------------------------------------------
📚 Subject: <b>${escapeHtml(subject)}</b>
⏱️ Time: <code>${minutes} minutes</code>
${notes ? `📝 Notes: <i>${escapeHtml(notes)}</i>\n` : ""}${xpText}
${targetAchievedText}

Let's keep up this momentum!`, { parse_mode: 'HTML', ...mainMenu });
      }
    }

    // 2. Default Chat Fallback: Route to Groq AI Tutor
    if (text) {
      // Background spelling scanner
      const repairs = scanText(text);
      
      const waitMsg = await ctx.reply("🤖 <i>Let me think about that...</i>", { parse_mode: 'HTML' });
      
      let systemPrompt = `The student username is ${username}. Give a warm, empathetic, and encouraging response. Explain academic details clearly.`;
      const response = await askGroq(text, systemPrompt);
      
      // Append lexical scan repairs if any
      const finalMsg = response + repairs;

      return ctx.telegram.editMessageText(ctx.chat.id, waitMsg.message_id, null, finalMsg, { parse_mode: 'HTML' });
    }
  });

  return bot;
}
