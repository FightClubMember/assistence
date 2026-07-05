// Groq AI Integration Module (Empathetic Tutor & Dynamic Recall Engine)

import dotenv from 'dotenv';
dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

/**
 * Sends a message to the Groq Chat Completions endpoint.
 */
export async function askGroq(userMessage, systemContext = "") {
  if (!GROQ_API_KEY) {
    return `❤️ <b>Tutor Notification:</b> I would love to help you with your studies, but my AI cognitive center is currently offline. 
    
To activate my brain, please configure the <code>GROQ_API_KEY</code> environment variable on Render or in your local <code>.env</code> file. Let's get it configured so I can support you!`;
  }

  const systemInstructions = `You are an empathetic, encouraging, and highly supportive academic study mentor. 
The student is preparing for competitive Indian national exams (UPSC, SSC CGL, CDS, State SI) or university semester checkpoints. 
Your goal is to explain concepts simply, encourage them, give supportive study advice, and help prevent burnout.
Be warm, understanding, and kind. 

CRITICAL MAPPING RULE: 
You MUST format your entire response in Telegram-compatible HTML tags only. 
Use:
- <b>bold</b> for headings and keywords.
- <i>italic</i> for examples, quotes, and stress support.
- <code>code</code> for inline keywords or equations.
- <pre>pre-formatted code block</pre> for list blocks, tables, or formatted examples.
- <u>underline</u> for emphasis.

DO NOT use any markdown characters like **, *, _, #, or \`\`\` under any circumstances. If you use markdown symbols, the Telegram parser will CRASH. Always close all HTML tags correctly.
${systemContext}`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemInstructions },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq API error:", errorText);
      return `⚠️ <b>Tutor Connection Issue:</b> I had a slight hiccup connecting to my knowledge bank (Groq API returned an error). Let's try again in a moment. I'm here for you!`;
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "I listened carefully, but I couldn't form an answer. Tell me again, how can I help you?";
  } catch (err) {
    console.error("Error calling Groq API:", err);
    return `⚠️ <b>Tutor Offline:</b> I couldn't reach my AI servers. Please check your network connection or API Key settings. I'll be waiting right here to help you!`;
  }
}

/**
 * Reads the user's study logs and generates a personalized active recall quiz.
 */
export async function generateRecallQuiz(studyLogs, username = "Student") {
  if (!studyLogs || studyLogs.length === 0) {
    return `📝 <b>Active Recall System:</b>
I don't see any study sessions logged in your history yet today! 

Once you log a study session (using the <code>⏱️ Log Study Session</code> button), I will read your study topics and dynamically generate a personalized active recall quiz to help test your memory. Go log a study block when you are ready, and we will try this!`;
  }

  // Format logs for the prompt
  const formattedLogs = studyLogs.map((log, index) => {
    return `${index + 1}. Subject: ${log.subject} | Duration: ${log.minutes} mins | Focus Notes: ${log.notes || 'None'}`;
  }).join("\n");

  const prompt = `Here are my recent study logs:
${formattedLogs}

Please generate a personalized 3-question Active Recall quiz based on these study topics. 
Include the questions first, and then list the answers inside a pre-formatted section at the bottom (or hidden under an 'Answers explanation' section) so I can test my memory first before checking.
Encourage me at the start and tell me you've analyzed my study topics.`;

  const context = `You are generating an active recall test. Remind the student that testing their memory (active retrieval) is the best scientific way to consolidate study topics. Ensure answers are placed at the bottom, marked clearly.`;

  return askGroq(prompt, context);
}
