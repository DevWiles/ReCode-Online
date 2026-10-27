# ReCode Online - Your Professional Coding Practice Companion

[中文版](./README_CN.md)

> This repository is a modified fork of [CoisiniIce/ReCode](https://github.com/CoisiniIce/ReCode). The design and core features of ReCode are the work of the original author, **CCoisini ([@CoisiniIce](https://github.com/CoisiniIce))**. I have only deployed it to a server and added some personal touches on top.

---

## Credits to the Original Author

This repository would not exist without the original work. Everything below was already in ReCode, and is why I picked it:

- 🧠 **Improved SRS Algorithm**: The next review is scheduled from your self-assessed mastery (Level 0-5) and the problem's difficulty.
- 📝 **Built-in Monaco Editor**: Syntax highlighting for all major languages, plus dual-pane Markdown notes with live preview.
- 🔢 **LaTeX Support**: Write down complexity analysis and mathematical derivations with ease.
- 📊 **Visualized Insights**: Mastery distribution chart, today's focus and progress tracking.
- ✨ A polished glassmorphism UI, LeetCode problem auto-fill, a bilingual (Chinese / English) interface and one-click start scripts.

CCoisini's commits are kept as they were in the history. The original project does not declare a license, so this repository is for learning and personal use only, with **no commercial use**. If the original author has any concern, please contact me and I will take it down right away.

## Why This Fork

At first I only wanted to run ReCode on a server, for two reasons:

1. **Switching smoothly between computers.** The original runs locally and keeps its data in a SQLite file on that machine. I practice on both the laptop I carry around and the desktop at home, and copying the database back and forth was a hassle. With ReCode on a server, both machines open the same progress in a browser.
2. **Adding things that suit me.** After using it for a while, small wishes came up, such as keeping several solutions for one problem or splitting the "study day" around my own schedule, and I added them bit by bit.

## What This Fork Adds

**Running on a server**

- Login with an audit log, so it can safely face the public internet.
- Every push to `main` is built and deployed by GitHub Actions, with the database backed up before each migration.
- Fetching problems from `leetcode.cn` falls back to a real browser when a bot challenge appears, then to `leetcode.com`.

**Multiple users**

- Each account's problems, progress and code are fully isolated; an admin creates accounts and hands out invite codes.
- Invite-code sign-up, email verification, password reset by email, "remember me" and signing out everywhere.

**Practice**

- Notes became a list of named solutions: keep several approaches per problem and open each in a window.
- A new solution starts from LeetCode's own code skeleton.
- The study day rolls over at 4 am instead of at midnight, so late-night practice still counts for today.
- Once today's reviews are done, the home page shows tomorrow's count and lets you review ahead.
- The home page counts due problems below level 4, and clicking a bar in the mastery chart lists that level's problems.
- Multi-solution challenge: draw a random problem with several solutions and recall each one, without touching the review schedule.

**Public demo**

- With `DEMO_MODE=1` the app runs as a demo: each visitor gets a private sandbox account with sample problems, cleaned up after 6 hours.
- Try it: <https://demo.recode.devwiles.online>

---

The screenshots below show the original UI:

![Home](./public/images/home.png)
![Questions](./public/images/questions.png)
![Review](./public/images/review.png)

## Tech Stack

- **Framework**: `Next.js 16`
- **UI**: `Tailwind CSS 4`, `Framer Motion`
- **Database**: `SQLite` + `Prisma`
- **Core Components**: `Monaco Editor`, `React Markdown`, `KaTeX`, etc.
- **Added in this fork**: `nodemailer` (verification emails), `playwright-core` (problem fetching)

## Getting Started (Local)

### Prerequisites

1. `Node.js` 20.x or higher
   - Download: [Node.js Official Website](https://nodejs.org/) - LTS Version
2. `Git`
   - Download: [Git Official Website](https://git-scm.com/)

### Quick Start

- Windows: double-click `start_windows.bat` in the root directory.
- Mac / Linux: run `chmod +x start_mac.sh && ./start_mac.sh` in a terminal.

The script installs dependencies, creates `.env`, initializes the database and starts the app. After the first run, create an account as in step 4 below.

### Manual Setup

#### 1. Clone the Repository

```bash
git clone https://github.com/DevWiles/ReCode-Online
cd ReCode-Online
```

For the original single-machine version, use the upstream project: `git clone https://github.com/CoisiniIce/ReCode`.

#### 2. Install Dependencies

```bash
npm install
```

Note: This may take some time. If the installation fails due to network issues, please consider using a mirror registry.

#### 3. Create the Config and Initialize the Database

```bash
node scripts/init-env.mjs
npx prisma generate
npx prisma db push
```

`init-env.mjs` creates `.env` from `.env.example` with a random `AUTH_SECRET`. The other settings are explained in `.env.example`.

#### 4. Create an Account

```bash
node --env-file=.env scripts/set-account.mjs your-username
```

Without a password argument, a strong one is generated and printed once. Keep it somewhere safe.

#### 5. Launch the Application

```bash
npm run dev
```

Open `http://localhost:3000` and sign in. The first sign-in asks you to bind an email address: without SMTP settings in `.env`, the verification code is printed in the terminal running `npm run dev`.

## FAQ

### Q1: Where is my data stored?

When running locally, all notes, code and review progress live in `prisma/dev.db`.

- Backup: copy `dev.db` to a safe place from time to time.
- Migration: when switching computers, copy the file into the `prisma/` directory of the new setup.

### Q2: Can I view the database content directly?

The schema is in `prisma/schema.prisma`. To browse or edit the data directly, run:

```bash
npx prisma studio
```

This opens a database manager in your browser (manual editing is not recommended).

### Q3: What should I do if I encounter a `Module not found` error?

This is usually caused by an incomplete installation due to network issues. Delete the `node_modules` folder and run `npm install` again.

### Q4: How do I deploy it to my own server?

`.github/workflows/deploy.yml` builds on every push to `main` and deploys over SSH. Set the repository secrets `SSH_PRIVATE_KEY`, `SERVER_HOST` and `SERVER_USER`. On the server the app runs `server.js` under systemd, with its environment in `/home/recode/app.env` (the path can be changed in the workflow). See `scripts/setup-demo-server.sh` for setting up the demo instance.

---

If you run into a problem, feel free to open an issue on GitHub. For questions about the original version, see [CoisiniIce/ReCode](https://github.com/CoisiniIce/ReCode).
