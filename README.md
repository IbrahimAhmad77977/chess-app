# ♟️ Multiplayer Chess App

A real-time multiplayer chess game built using modern web technologies.

## 🔍 Overview

This is a full-stack web application that allows two authenticated users to play chess against each other in real-time. The app enforces turn-based rules, handles legal moves using `chess.js`, supports pawn promotion, and syncs board state using Supabase.

## My Chess Journey

I feel like I finally belong to Chess. It genuinely makes me happy to play now.

Back when I used to play Chess, I didn’t know anything about Chess.com, Lichess.org, Grandmasters, or even how to properly strategize. I used to play casually with my brother (he usually won) and at a school chess club. I did well against some players, but there was always this one person I could never beat. Once, I managed to draw against him — we had equal material and the timer ran out, so we just called it a draw. It wasn’t the most official way, but it worked for us.

Eventually, I hit a plateau. I didn’t know how to improve, and honestly, I got bored. So I left the Chess club.

Later on, I made a Chess.com account and played a timed game against a player — I lost. Months passed. Then one day, someone invited me to a game. I had forgotten my password, so I didn’t play. But when they invited me again, I finally hit “Forgot Password” and jumped back in. We started playing Daily Games, and soon I began playing with others too.

At first, it was casual. But then something shifted. I thought: "Maybe I can actually get better instead of just playing for fun." That was the start of me taking chess seriously — but still keeping the fun by playing with friends.

Then one of my friends suggested that I try playing Daily Games against strangers. I did. That game made me realize: I wasn’t actually "good" — I had just been doing well in a small bubble. So I doubled down, started preparing, learning, and committing to actual improvement.

Chess is no longer just something I played. It's something I'm passionate about.

## 🧠 Approach (High-Level)

- **Game Logic**: I use the `chess.js` library to handle move validation, legal move generation, FEN tracking, game over detection, and turn enforcement.
- **Frontend**: Built with **SvelteKit**, offering a reactive, fast, and modern UI.
- **Real-time Sync**: Supabase Realtime (Postgres + `realtime` subscriptions) is used to keep both players’ views in sync whenever a move is made.
- **Authentication**: Supabase Auth manages user sessions so players can log in, create/join games, and play securely.
- **Promotion & UI**: When a pawn reaches the 8th rank, a modal allows users to choose a promotion piece. Sound effects and clean UI make gameplay immersive.

## 🧰 Tech Stack

| Layer        | Technology             |
|--------------|------------------------|
| Frontend     | SvelteKit              |
| Backend (DB) | Supabase (PostgreSQL)  |
| Auth         | Supabase Auth          |
| Realtime     | Supabase Realtime API  |
| Chess Logic  | [chess.js](https://github.com/jhlywa/chess.js/) |
| Styling      | Tailwind CSS (optional)|
| Hosting      | Supabase               |

## 📁 Project Structure

src/lib/chess.ts — chess.js wrapper & helpers

src/routes/[id]/+page.svelte — game room UI

src/routes/[id]/+page.server.ts — server-side game logic

src/components/ChessBoard.svelte — chessboard UI component

## 🚀 Features

- ✅ Real-time multiplayer
- ✅ Turn enforcement
- ✅ Legal move validation
- ✅ Pawn promotion support
- ✅ Game over detection (checkmate/stalemate)
- ✅ Sound effects
- ✅ Authenticated game rooms

## 📦 Installation

```bash
npm install
npm run dev
Make sure to connect the project to your Supabase instance and configure .env with your credentials.

👥 Credits

Built using:

SvelteKit

Supabase

chess.js

---

Let me know if you want to add screenshots, deployment instructions, or contribution guidelines!
