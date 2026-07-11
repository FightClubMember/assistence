// Spaced Repetition Flashcard Module (Leitner System)

import dotenv from 'dotenv';
import { getLocalDateString } from './session.js';

dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Leitner Box Intervals (in days)
const LEITNER_INTERVALS = {
  1: 1,  // Box 1: Review every 1 day
  2: 3,  // Box 2: Review every 3 days
  3: 7,  // Box 3: Review every 7 days
  4: 14, // Box 4: Review every 14 days
  5: 30  // Box 5: Review every 30 days (fully mastered)
};

export function addDays(dateStr, days) {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Calls Groq AI to generate 3 Q&A flashcards from logged topic
 */
export async function generateFlashcards(subject, notes) {
  if (!GROQ_API_KEY) {
    return [];
  }

  const prompt = `Based on a student's study session on the subject: "${subject}" and their study notes: "${notes}", extract exactly 3 core Q&A flashcards.
Respond ONLY in a valid JSON array format, containing objects with "question" and "answer" properties.
Do not wrap your response in markdown code blocks or add any conversational introductory or concluding text.

Example structure:
[
  {"question": "What was the main purpose of the Champaran Satyagraha of 1917?", "answer": "To protest against the exploitative tinkathia system, where peasants were forced by British planters to grow indigo on 3/20th of their land."},
  {"question": "...", "answer": "..."}
]`;

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
          { role: 'user', content: prompt }
        ],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      console.error("Groq API error in flashcard generator:", await response.text());
      return [];
    }

    const data = await response.json();
    let content = data.choices[0]?.message?.content || "";
    
    // Clean up content in case it has markdown ticks
    content = content.replace(/```json/gi, "").replace(/```/gi, "").trim();
    
    const cards = JSON.parse(content);
    if (Array.isArray(cards)) {
      return cards.map((card, idx) => ({
        id: `fc_${Date.now()}_${idx}_${Math.floor(Math.random() * 1000)}`,
        subject,
        question: card.question,
        answer: card.answer,
        box: 1,
        nextReviewDate: getLocalDateString()
      }));
    }
    return [];
  } catch (err) {
    console.error("Error generating flashcards:", err);
    return [];
  }
}

/**
 * Updates a card's box level and calculates the next review date based on the Leitner system.
 */
export function updateCardLeitner(card, gotItRight) {
  const today = getLocalDateString();
  
  if (gotItRight) {
    // Correct -> move to next box (max 5)
    card.box = Math.min(5, card.box + 1);
  } else {
    // Incorrect -> reset back to box 1
    card.box = 1;
  }
  
  const daysInterval = LEITNER_INTERVALS[card.box] || 1;
  card.nextReviewDate = addDays(today, daysInterval);
  return card;
}
