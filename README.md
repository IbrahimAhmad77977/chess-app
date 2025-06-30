# ♟️ Multiplayer Chess App

A real-time multiplayer chess game built using modern web technologies.

## 🔍 Overview

This is a full-stack web application that allows two authenticated users to play chess against each other in real-time. The app enforces turn-based rules, handles legal moves using `chess.js`, supports pawn promotion, and syncs board state using Supabase.

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
