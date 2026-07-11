// Feynman Voice Coach Module (transcription & evaluation)

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { escapeHtml } from './utils.js';

dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;

/**
 * Downloads a voice file from Telegram and saves it locally
 */
export async function downloadVoiceFile(botToken, filePath, destPath) {
  const url = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download file from Telegram: ${response.statusText}`);
  }
  const buffer = await response.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(buffer));
}

/**
 * Transcribes audio file using Groq Whisper API
 */
export async function transcribeAudio(filePath) {
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not defined in environment variables.");
  }

  const fileBuffer = fs.readFileSync(filePath);
  const fileBlob = new Blob([fileBuffer], { type: 'audio/ogg' });

  const formData = new FormData();
  formData.append('file', fileBlob, 'voice.ogg');
  formData.append('model', 'whisper-large-v3');
  formData.append('response_format', 'json');

  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: formData
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq Whisper API error: ${errorText}`);
  }

  const data = await response.json();
  return data.text || "";
}

/**
 * Evaluates the transcription using Groq LLM
 */
export async function evaluateExplanation(topic, transcription) {
  if (!GROQ_API_KEY) {
    return "⚠️ <b>Tutor Notification:</b> I cannot evaluate your speech because my Groq API Key is not set.";
  }

  const systemInstructions = `You are an elite academic evaluator and mentor. 
The student is practicing the Feynman Technique (teaching a concept in simple terms to check their own understanding) for the topic: "${topic}".
Analyze their transcription:
"${transcription}"

Do the following:
1. Rate their explanation clarity on a scale of 1 to 10 (with brief comments).
2. List the **Core Facts Stated Correctly** (using bullet points).
3. Identify **Syllabus Gaps & Missing Information** (crucial facts relevant to UPSC/SSC CGL/CDS exams that they failed to mention).
4. Provide **Advice for Improvement** (2-3 concrete tips).

Ensure your output is structured in clean HTML tags only (<b>, <i>, <code>, <pre>, <u>, <s>). Do NOT use any markdown characters like **, *, _, #, or \`\`\` under any circumstances.`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemInstructions },
          { role: 'user', content: `Please evaluate my explanation for the topic: "${topic}"` }
        ],
        temperature: 0.5
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq completions error:", errorText);
      return "⚠️ <b>Evaluation Error:</b> I transcribed your explanation, but failed to connect to the evaluation engine. Let's try again in a moment.";
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "I listened to your recording, but could not produce a scorecard. Try teaching it to me again!";
  } catch (err) {
    console.error("Error evaluating explanation:", err);
    return "⚠️ <b>Evaluation Error:</b> An unexpected error occurred while analyzing your explanation.";
  }
}
