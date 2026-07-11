// AstraOS Core Telegram Bot Logic (Empathetic Study Assistant & Pro Engines)

import { Telegraf, Markup } from 'telegraf';
import fs from 'fs';
import path from 'path';
import { scanText } from './src/lexical.js';
import { getSyllabusReport } from './src/syllabus.js';
import { getStatusCard, updateSession, getSession, addXp, toggleSemesterMode, logStudySession, getPerformanceHistory, getLocalDateString } from './src/session.js';
import { askGroq, generateRecallQuiz } from './src/groq.js';
import { downloadVoiceFile, transcribeAudio, evaluateExplanation } from './src/feynman.js';
import { generateFlashcards, updateCardLeitner } from './src/flashcard.js';
import { escapeHtml } from './src/utils.js';

export function setupBot(token) {
  const bot = new Telegraf(token);

  // Friendly Reply Keyboard
  const mainMenu = Markup.keyboard([
    ['📊 Dashboard', '⏱️ Log Study'],
    ['🎙️ Feynman Drill', '🎴 Review Cards'],
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

  // Helper to trigger the next pending flashcard review
  async function sendNextFlashcard(ctx, userId) {
    const session = getSession(userId);
    const today = getLocalDateString();
    const pending = session.flashcards.filter(c => c.nextReviewDate <= today);

    if (pending.length === 0) {
      addXp(userId, 15); // +15 XP Leitner deck completion bonus
      return ctx.reply(`🎉 <b>Outstanding!</b> You have completed your review deck for today. Your Leitner study boxes are fully updated! <code>+15 XP</code> consistency reward added.`, { parse_mode: 'HTML', ...mainMenu });
    }

    const card = pending[0];
    const cardKeyboard = Markup.inlineKeyboard([
      [Markup.button.callback('👁️ Reveal Answer', `reveal_card_${card.id}`)]
    ]);

    return ctx.reply(`🎴 <b>FLASHCARD REVIEW</b>
--------------------------------------------
📚 Subject: <b>${escapeHtml(card.subject)}</b>
📦 Leitner Box: <code>${card.box} / 5</code>

❓ <b>Question:</b>
${escapeHtml(card.question)}`, { parse_mode: 'HTML', ...cardKeyboard });
  }

  // --- COMMAND HANDLERS ---

  bot.start(async (ctx) => {
    const userId = ctx.from.id;
    const username = ctx.from.username || ctx.from.first_name || "friend";
    
    // Initialize session
    getSession(userId);

    const welcomeText = `👋 <b>Hello, @${escapeHtml(username)}! Welcome to your Study Companion!</b>
--------------------------------------------
I am here to help you stay on track, support your learning, and make your study journey less lonely. 

Here are the extraordinary features we can use together:
• 📊 Check your <b>Dashboard</b> for streaks and daily goals.
• ⏱️ Click <b>Log Study</b> after a study session to record your hours.
• 🎙️ Click <b>Feynman Drill</b> to record a voice note teaching a concept and get detailed evaluations on your speech & syllabus gaps.
• 🎴 Click <b>Review Cards</b> to practice spaced-repetition flashcards generated automatically from your study notes.
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

  bot.command('feynman', async (ctx) => {
    const userId = ctx.from.id;
    const session = getSession(userId);

    session.feynmanState = 'AWAITING_TOPIC';
    session.feynmanTopic = null;
    updateSession(userId, session);

    return ctx.reply(`🎙️ <b>Feynman Voice Coach: Step 1</b>
--------------------------------------------
Teaching a concept in simple terms (as if explaining to a 10-year-old child) is the single most powerful way to identify what you actually understand.

What topic or syllabus concept would you like to teach me today? (e.g. <i>Champaran Satyagraha, Inflation, Fundamental Rights</i>)

👉 <i>Type /cancel to abort.</i>`, { parse_mode: 'HTML', reply_markup: { remove_keyboard: true } });
  });

  bot.command('review', async (ctx) => {
    const userId = ctx.from.id;
    return sendNextFlashcard(ctx, userId);
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
      cancelled = true;
    }
    if (session.feynmanState) {
      session.feynmanState = null;
      session.feynmanTopic = null;
      cancelled = true;
    }

    if (cancelled) {
      updateSession(userId, session);
      return ctx.reply("🚫 <b>Operation cancelled.</b> I've brought you back to the main menu.", { parse_mode: 'HTML', ...mainMenu });
    } else {
      return ctx.reply("No active workflow is running. You are in the main menu!", { parse_mode: 'HTML', ...mainMenu });
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

  bot.hears('🎙️ Feynman Drill', async (ctx) => {
    const userId = ctx.from.id;
    const session = getSession(userId);

    session.feynmanState = 'AWAITING_TOPIC';
    session.feynmanTopic = null;
    updateSession(userId, session);

    return ctx.reply(`🎙️ <b>Feynman Voice Coach: Step 1</b>
--------------------------------------------
Teaching a concept in simple terms (as if explaining to a 10-year-old child) is the single most powerful way to identify what you actually understand.

What topic or syllabus concept would you like to teach me today? (e.g. <i>Champaran Satyagraha, Inflation, Fundamental Rights</i>)

👉 <i>Type /cancel to abort.</i>`, { parse_mode: 'HTML', reply_markup: { remove_keyboard: true } });
  });

  bot.hears('🎴 Review Cards', async (ctx) => {
    const userId = ctx.from.id;
    return sendNextFlashcard(ctx, userId);
  });

  bot.hears('📈 History', async (ctx) => {
    const userId = ctx.from.id;
    return replyWithLexicalCheck(ctx, getPerformanceHistory(userId));
  });

  bot.hears('🤖 AI Tutor', async (ctx) => {
    return ctx.reply(`👋 <b>Welcome to your Groq AI Tutor!</b>

I am here to act as your personal academic mentor. You can ask me any study-related question, ask me to explain difficult concepts simply, or ask for encouragement when you are feeling tired.

👉 <b>How to ask me:</b>
Simply type your question directly in the chat! If you aren't in a study logging or Feynman flow, I will automatically analyze it and give you a helpful, detailed, and encouraging response.

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

    // Toggle Reminders
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

    // Reveal Flashcard Answer
    if (data.startsWith('reveal_card_')) {
      const cardId = data.replace('reveal_card_', '');
      const session = getSession(userId);
      const card = session.flashcards.find(c => c.id === cardId);

      if (!card) {
        await ctx.answerCbQuery("Flashcard not found.");
        return ctx.reply("Error: Card session expired or invalid.");
      }

      await ctx.answerCbQuery();
      
      const ratingKeyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback('✅ Yes, got it!', `evaluate_card_${card.id}_yes`),
          Markup.button.callback('❌ No, forgot!', `evaluate_card_${card.id}_no`)
        ]
      ]);

      return ctx.editMessageText(`🎴 <b>FLASHCARD EVALUATION</b>
--------------------------------------------
📚 Subject: <b>${escapeHtml(card.subject)}</b>
📦 Leitner Box: <code>${card.box} / 5</code>

❓ <b>Question:</b>
${escapeHtml(card.question)}

💡 <b>Answer:</b>
<i>${escapeHtml(card.answer)}</i>

--------------------------------------------
<b>Did you recall this correctly?</b>`, { parse_mode: 'HTML', ...ratingKeyboard });
    }

    // Leitner Card evaluation (Yes/No response)
    if (data.startsWith('evaluate_card_')) {
      const parts = data.replace('evaluate_card_', '').split('_');
      const cardId = `fc_${parts[0]}_${parts[1]}_${parts[2]}`;
      const yesNo = parts[3]; // 'yes' or 'no'

      const session = getSession(userId);
      const cardIndex = session.flashcards.findIndex(c => c.id === cardId);

      if (cardIndex === -1) {
        await ctx.answerCbQuery("Flashcard not found.");
        return ctx.reply("Error updating flashcard Leitner rating.");
      }

      const card = session.flashcards[cardIndex];
      updateCardLeitner(card, yesNo === 'yes');
      updateSession(userId, session);

      await ctx.answerCbQuery(yesNo === 'yes' ? "Saved: Box Upgraded!" : "Saved: Reset to Box 1");
      
      // Notify result of this card
      await ctx.reply(yesNo === 'yes' 
        ? `✅ <b>Well done!</b> Card moved to Box <code>${card.box}</code>. Spaced interval extended.`
        : `❌ <b>No worries!</b> Card reset to Box 1. We will review it again tomorrow.`, { parse_mode: 'HTML' });

      // Automatically push next card
      return sendNextFlashcard(ctx, userId);
    }
  });

  // --- GENERAL MESSAGE TEXT / FLOW CAPTURE ---

  bot.on('message', async (ctx) => {
    const userId = ctx.from.id;
    const text = ctx.message.text;
    const session = getSession(userId);
    const username = ctx.from.username || ctx.from.first_name || "friend";

    // A. Handle voice notes (Feynman Drill step 2)
    if (ctx.message.voice || ctx.message.audio) {
      if (session.feynmanState !== 'AWAITING_VOICE') {
        return ctx.reply("🎙️ If you want to run a Feynman active teaching drill, click the <b>🎙️ Feynman Drill</b> button first so I know what topic you are teaching!", { parse_mode: 'HTML' });
      }

      const voice = ctx.message.voice || ctx.message.audio;
      const fileId = voice.file_id;

      const waitMsg = await ctx.reply("📥 <i>Downloading your voice note from Telegram...</i>", { parse_mode: 'HTML' });

      try {
        const file = await ctx.telegram.getFile(fileId);
        const tempFileName = `temp_voice_${userId}_${Date.now()}.ogg`;
        const tempFilePath = path.resolve(tempFileName);

        await downloadVoiceFile(token, file.file_path, tempFilePath);

        await ctx.telegram.editMessageText(ctx.chat.id, waitMsg.message_id, null, "🧠 <i>Transcribing your audio using Groq Whisper-v3 engine...</i>", { parse_mode: 'HTML' });
        const transcription = await transcribeAudio(tempFilePath);

        if (!transcription || transcription.trim().length === 0) {
          fs.unlinkSync(tempFilePath);
          session.feynmanState = null;
          session.feynmanTopic = null;
          updateSession(userId, session);
          return ctx.telegram.editMessageText(ctx.chat.id, waitMsg.message_id, null, "❌ <b>Transcription failed:</b> I couldn't pick up any speech in that recording. Make sure your microphone is clear, and try again!", { parse_mode: 'HTML' });
        }

        await ctx.telegram.editMessageText(ctx.chat.id, waitMsg.message_id, null, `📊 <i>Evaluating explanation metrics for topic: "${escapeHtml(session.feynmanTopic)}"...</i>`, { parse_mode: 'HTML' });
        const evaluation = await evaluateExplanation(session.feynmanTopic, transcription);

        // Delete temporary ogg file
        fs.unlinkSync(tempFilePath);

        // Clear states and allocate XP
        const topic = session.feynmanTopic;
        session.feynmanState = null;
        session.feynmanTopic = null;
        session.xp += 30; // +30 XP Feynman drill reward
        updateSession(userId, session);

        await ctx.telegram.deleteMessage(ctx.chat.id, waitMsg.message_id).catch(() => {});

        const finalReport = `🎙️ <b>FEYNMAN DRILL SCORECARD</b>
--------------------------------------------
👤 <b>Student:</b> @${escapeHtml(username)}
📚 <b>Topic:</b> <i>${escapeHtml(topic)}</i>
💬 <b>Your Transcript:</b> 
"<i>${escapeHtml(transcription)}</i>"

--------------------------------------------
${evaluation}

--------------------------------------------
⚡ <b>Drill Reward:</b> <code>+30 XP</code> completed Feynman drills. Let's keep teaching!`;

        return ctx.reply(finalReport, { parse_mode: 'HTML', ...mainMenu });

      } catch (err) {
        console.error("Feynman voice processing error:", err);
        return ctx.reply("❌ <b>Voice Processing Error:</b> Something went wrong while downloading or transcribing your voice note. Check your environment variables and network state.", { parse_mode: 'HTML', ...mainMenu });
      }
    }

    // B. Log Study Session state machine
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

        ctx.reply(`🎉 <b>Session logged successfully!</b>
--------------------------------------------
📚 Subject: <b>${escapeHtml(subject)}</b>
⏱️ Time: <code>${minutes} minutes</code>
${notes ? `📝 Notes: <i>${escapeHtml(notes)}</i>\n` : ""}${xpText}
${targetAchievedText}

Let's keep up this momentum!`, { parse_mode: 'HTML', ...mainMenu });

        // Trigger background Spaced-Repetition flashcard generation
        ctx.reply("✨ <i>Generating spaced-repetition flashcards in the background...</i>", { parse_mode: 'HTML' })
          .then(async (statusMsg) => {
            try {
              const cards = await generateFlashcards(subject, notes || "General concepts");
              if (cards && cards.length > 0) {
                const latestSession = getSession(userId);
                latestSession.flashcards.push(...cards);
                updateSession(userId, latestSession);

                await ctx.telegram.editMessageText(ctx.chat.id, statusMsg.message_id, null, `🎴 <b>Leitner System:</b> Generated <b>3 custom flashcards</b> from your session on <b>${escapeHtml(subject)}</b>. They are queued in your review deck!`, { parse_mode: 'HTML' });
              } else {
                await ctx.telegram.deleteMessage(ctx.chat.id, statusMsg.message_id).catch(() => {});
              }
            } catch (err) {
              console.error("Error creating cards:", err);
              await ctx.telegram.deleteMessage(ctx.chat.id, statusMsg.message_id).catch(() => {});
            }
          });

        return;
      }
    }

    // C. Feynman Drill step 1 text capture
    if (session.feynmanState === 'AWAITING_TOPIC') {
      if (text === '/cancel') {
        session.feynmanState = null;
        session.feynmanTopic = null;
        updateSession(userId, session);
        return ctx.reply("🚫 <b>Drill cancelled.</b>", { parse_mode: 'HTML', ...mainMenu });
      }

      session.feynmanTopic = text;
      session.feynmanState = 'AWAITING_VOICE';
      updateSession(userId, session);

      return ctx.reply(`Great! Subject topic is set to: <b>${escapeHtml(text)}</b>

👉 <b>Step 2:</b> Now, press the record button and explain this topic to me in your own words. Speak for 30 seconds up to 2 minutes. Explain it as if I'm a total beginner!

<i>Once sent, I will transcribe and critique your explanation, pinpointing facts you got right and key syllabus details you forgot.</i>`, { parse_mode: 'HTML' });
    }

    // D. Default Chat Fallback: Route to Groq AI Tutor
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
