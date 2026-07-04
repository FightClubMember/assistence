// Server Entry Point (index.js)
// Launches Express for health checks/webhook binding and starts the Telegraf bot.

import express from 'express';
import dotenv from 'dotenv';
import { setupBot } from './bot.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

if (!BOT_TOKEN) {
  console.error("FATAL ERROR: BOT_TOKEN is not defined in environment variables.");
  process.exit(1);
}

const bot = setupBot(BOT_TOKEN);

// Body parser middleware for Express
app.use(express.json());

// Render health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: "online",
    system: "AstraOS Core",
    version: "5.0-Enterprise",
    port_binding: PORT,
    timestamp: new Date().toISOString()
  });
});

if (WEBHOOK_URL) {
  // Webhook Mode (For production hosting on Render)
  console.log(`Setting up webhook mode. Target URL: ${WEBHOOK_URL}/webhook`);
  
  // Set webhook endpoint with Telegram
  bot.telegram.setWebhook(`${WEBHOOK_URL}/webhook`)
    .then(() => {
      console.log("Telegram Webhook set successfully.");
    })
    .catch((err) => {
      console.error("Error setting Telegram Webhook:", err);
    });

  // Express route to handle incoming Telegram updates
  app.post('/webhook', (req, res) => {
    bot.handleUpdate(req.body, res);
  });

  // Start express server
  app.listen(PORT, () => {
    console.log(`Express server listening on port ${PORT} with webhook handling active.`);
  });
} else {
  // Polling Mode (For local development/testing)
  console.log("No WEBHOOK_URL found. Launching bot in Long Polling mode...");
  
  bot.launch()
    .then(() => {
      console.log("AstraOS Core Bot launched successfully in Polling Mode.");
    })
    .catch((err) => {
      console.error("Error launching bot in Polling Mode:", err);
    });

  // Express server remains active for local health checks
  app.listen(PORT, () => {
    console.log(`Local Express health check server running on port ${PORT}.`);
  });
}

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
