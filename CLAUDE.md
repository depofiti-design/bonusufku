# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

BonusUfku is a Turkish-language "deneme bonusu" (betting/casino trial-bonus) affiliate listing site — the sister project to BonusRota, sharing the same concept and layout but with a distinct cyan/green "signal/horizon" theme instead of BonusRota's purple/gold theme. It is a static, no-build, no-framework project: self-contained HTML files (each with inline `<style>` and `<script>`) backed directly by Firebase Firestore via the `firebase-app-compat`/`firebase-firestore-compat` CDN clients. There is no package.json, no bundler, no build step, and no test suite.

**Backend history:** BonusUfku moved from Supabase to **Firebase Firestore** first (Supabase org's free-tier project limit was hit). BonusRota followed on 2026-09-17 after its Supabase project was deleted outright, so both sites now share the same Firebase architecture (BonusUfku = Firebase project `bonusufku`, BonusRota = `bonusrota`).

## Repository structure

- `index.html` — the public-facing site. Single page, mobile-first (max-width 460px container), dark cyan/green theme. Lists bonus sites in "Trend" / "Popüler" sections with filter pills, plus a gamified "wheel spin" ("Çarkı Çevir") and "signal chest" ("Sinyali Yakala") modal that reveal a bonus site/amount. Also logs a `site_open` analytics event to Firestore on load (see Analytics below).
- `privacy.html` — static privacy policy / responsible-gaming / +18 notice page (TR + EN), used as the URL for the Telegram bot's BotFather Privacy Policy field.
- `admin/index.html` — password-gated admin panel (`ADMIN_PASSWORD` = `bonusufku2025`) for managing the `sites` Firestore collection (add/edit/delete docs, reorder, toggle active). No real auth: password check happens entirely client-side in JS.
- `admin/stats.html` — password-gated (same password) live analytics dashboard reading the `events` Firestore collection: total bot starts, site opens, unique users, per-source breakdown, live event feed. Polls every 5s.
- `api/telegram-webhook.js` — Vercel serverless function (no npm deps, uses global `fetch`) acting on the Telegram bot's webhook. On `/start`, sends a welcome message with an inline `web_app` button opening the site, and logs a `bot_start` event to Firestore via the REST API (no service account needed — Firestore rules are open, see below). Reads `TELEGRAM_BOT_TOKEN` and `TELEGRAM_WEBHOOK_SECRET` from Vercel environment variables (never hardcoded — repo is public). Validates the `X-Telegram-Bot-Api-Secret-Token` header against `TELEGRAM_WEBHOOK_SECRET`. The bot is `@bonusufku_webbot`; both env vars are set in Vercel and the webhook is registered.
- `firestore.rules` / `firebase.json` / `.firebaserc` — Firestore config; rules are wide open (`allow read, write: if true`) — "test mode", same risk tolerance as BonusRota (also open Firestore rules now).
- `README.md` — Turkish runbook (Firebase, bot, webhook, env vars, source tracking).

## Architecture / data flow

- `index.html` and `admin/index.html` hardcode `firebaseConfig` (apiKey, projectId, etc.) at the top of their `<script>` block and call `firebase.initializeApp(...)` directly in the browser. There is no server/API layer besides the Telegram webhook function.
- `sites` Firestore collection documents: `name, bonus, type, tag ('trend'|'popular'), link, logo, display_order, active`. Document IDs are Firestore's auto-generated string IDs (no numeric ids).
- `events` Firestore collection documents: `event_type ('bot_start'|'site_open'), telegram_user_id, source, created_at` (ISO string). `source` is parsed from a `/start <param>` deep-link payload for ad/referral tracking.
- `index.html` fetches `sites` on load (`loadSites()`); if Firestore is unreachable or returns no rows, it silently falls back to a hardcoded `SITES` array in the JS so the page is never empty.
- `admin/index.html` writes directly to Firestore on every field change — changes are live immediately, no separate publish step.
- The wheel and treasure-chest features pick a random entry from the currently loaded `SITES`/`wheelData` array purely client-side (not tied to real odds or backend state).
- Both `index.html` and `admin/stats.html` load `https://telegram.org/js/telegram-web-app.js` so `window.Telegram.WebApp.initDataUnsafe` (user id, start_param) is available when opened as a Telegram Mini App — without this script the WebApp bridge does not reliably exist.

## Working in this repo

- There is no build, lint, or test command — edit the HTML files directly and open them in a browser (or run any static file server, e.g. `python3 -m http.server`) to preview.
- Deployment target is Vercel as a static site (`bonusufku.vercel.app`, no build command, "Other/Static" framework preset).
- Because Firebase config is embedded directly in the HTML `<script>` tags, any change to `firebaseConfig` must be made identically across `index.html`, `admin/index.html`, and `admin/stats.html`.
- Firestore rules changes must be applied with `npx firebase deploy --only firestore:rules --project bonusufku` (Firebase CLI is installed and already authenticated as depofiti@gmail.com on this machine) and kept in sync with `firestore.rules` in this repo.
- Vercel env vars/redeploys for this project can be managed via the Vercel REST API instead of the dashboard — see the `project_bonus_sites_vercel_automation` memory for the token and exact calls.
- All UI copy/strings are in Turkish; keep new UI text consistent with the existing tone and language.

## Live state (as of 2026-09-21)

- Site `https://bonusufku.vercel.app`, bot `@bonusufku_webbot`, Mini App link `t.me/bonusufku_webbot/appweb`. Webhook points at `/api/telegram-webhook` with a secret token.
- Firestore `sites` holds the same 9 real tikobey sites as BonusRota: Stake, 1xBet, Grand Pasha, Roma Bet, CasinoDior, BayConti, Gamdom (`https://shr.pn/tikobeygamdom`), GoneBET, Bizbet. The fallback `SITES` array in `index.html` should be kept in sync with that list.
- Sister project BonusRota lives in `C:\Users\Pepe\Projects\bonusrota` (`@bonusrota_webbot`, purple/gold theme). Changes to shared behavior (webhook, stats, privacy, Telegram SDK) usually need to be applied to both.
- Tokens (bot, Vercel) live only in Vercel env vars and local memory, never in this public repo.

## Open items

- No custom domain yet. When bought: add it in Vercel, update `WEBAPP_URL` in `api/telegram-webhook.js`, and change the Web App URL in BotFather (`/myapps`).
- Telegram Ads: the official platform prohibits gambling, so sponsored posts via marketplaces are the realistic route. Use `t.me/bonusufku_webbot?start=<source>` links per placement and read results in `admin/stats.html`.
