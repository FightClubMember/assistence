# AstraOS Core - Academic Operating System Telegram Bot

AstraOS Core is an advanced, enterprise-grade academic operating system Telegram bot designed to manage cognitive loads, check orthography, facilitate rapid study duels, and compile ATS-compliant CVs.

---

## 🛠️ Local Development Setup

To run the bot locally on your machine, follow these instructions:

1. **Prerequisites:**
   Ensure you have Node.js (v18+) installed on your local operating system.

2. **Configure Environment Variables:**
   - Copy `.env.example` to a new file named `.env`:
     ```bash
     cp .env.example .env
     ```
   - Request a Bot Token from Telegram's `@BotFather` and insert it into `.env`:
     ```text
     BOT_TOKEN=123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ
     ```
   - Keep `WEBHOOK_URL` empty to default the bot into **Long Polling Mode** (ideal for local testing).

3. **Install Dependencies:**
   ```bash
   npm install
   ```

4. **Launch Bot:**
   ```bash
   npm run dev
   ```

---

## 🐙 Push to GitHub

To prepare for deployment to Render, host your code on a GitHub repository:

1. **Initialize Git Repository:**
   ```bash
   git init
   ```

2. **Create `.gitignore`:**
   Ensure you exclude your private credentials and node modules. Save a `.gitignore` with the following content:
   ```text
   node_modules/
   .env
   sessions.json
   ```

3. **Stage and Commit Code:**
   ```bash
   git add .
   git commit -m "Initial commit: AstraOS Core Bot implementation"
   ```

4. **Link and Push to GitHub:**
   - Create a new repository on GitHub (e.g., `astraos-core-bot`).
   - Run the following (replace with your repository coordinates):
     ```bash
     git branch -M main
     git remote add origin https://github.com/YOUR_GITHUB_USERNAME/astraos-core-bot.git
     git push -u origin main
     ```

---

## 🚀 Deploying to Render (Free Tier)

Render requires a web service setup to host dynamic code. Follow these steps:

1. **Sign in to Render:** Go to [Render](https://render.com) and link your GitHub account.
2. **Create a Web Service:**
   - Click **New +** ➔ **Web Service**.
   - Select the GitHub repository you just pushed (`astraos-core-bot`).
3. **Configure Settings:**
   - **Name:** `astraos-core`
   - **Language/Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free` (suitable for polling/webhook setups)
4. **Configure Environment Variables:**
   Under the **Environment** tab, add the following variables:
   - `BOT_TOKEN` = `[Your Telegram Bot Token]`
   - `WEBHOOK_URL` = `https://[your-render-app-subdomain].onrender.com` *(e.g., https://astraos-core.onrender.com)*
   - `PORT` = `10000` (Render binds this automatically, but manually adding it is safe)
5. **Deploy:** Click **Deploy Web Service**. Render will build the node modules and spin up the Express server. The bot will automatically register the webhook endpoint with Telegram upon initialization!

---

## ⚡ Functional Specifications

- **📊 Status / Profile (`/status`):** Tracks consistency streaks, academic levels, XP gains, and active daily tasks.
- **📚 Syllabus Allocator (`/syllabus`):** Provides a 3-stage adaptive schedule mapped inside scannable tables.
- **🚫 Semester Mode (`/semester [on/off]`):** Academic Bank Isolation Protocol. Suspends competitive trackers for university prep.
- **⚔️ Study Duel (`/duel`):** Shuffles 5 MCQs across math, general studies, and grammar. Ends with a detailed error report and XP reward.
- **📄 ATS Resume Architect (`/makeresume`):** 6-Phase extraction interview compiling resume data directly to Markdown and compilable Overleaf LaTeX templates.
- **🔍 Lexical diagnostic:** Background scans user text for common English and Hindi spelling traps, automatically appending correction templates at response ends.
