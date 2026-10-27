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
- `api/track.js` — added 2026-10-23: visitor/interaction tracking endpoint. `index.html` POSTs `site_open`, `site_click` (with `site_name`), `wheel_spin`, `chest_open` here instead of writing to Firestore directly, so this function can stamp the event with the real client IP (`x-forwarded-for`) and `user_agent` before writing — the client-side Firestore SDK had no way to see the visitor's IP. `bot_start` still comes from the webhook above and has no IP (Telegram doesn't expose the user's real IP to bots — platform limit, not fixable).
- `firestore.rules` / `firebase.json` / `.firebaserc` — Firestore config; rules are wide open (`allow read, write: if true`) — "test mode", same risk tolerance as BonusRota (also open Firestore rules now).
- `README.md` — Turkish runbook (Firebase, bot, webhook, env vars, source tracking).

## Architecture / data flow

- `index.html` and `admin/index.html` hardcode `firebaseConfig` (apiKey, projectId, etc.) at the top of their `<script>` block and call `firebase.initializeApp(...)` directly in the browser. There is no server/API layer besides the Telegram webhook function.
- `sites` Firestore collection documents: `name, bonus, type, tag ('trend'|'popular'), link, logo, display_order, active`. Document IDs are Firestore's auto-generated string IDs (no numeric ids).
- `events` Firestore collection documents: `event_type ('bot_start'|'site_open'|'site_click'|'wheel_spin'|'chest_open'), telegram_user_id, source, site_name, ip, user_agent, created_at` (ISO string). `source` is parsed from a `/start <param>` deep-link payload for ad/referral tracking; `site_name` is set on `site_click` (which bonus link was opened); `ip`/`user_agent` are only present on events that went through `api/track.js` (everything except `bot_start`).
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

## Live state (as of 2026-10-27)

- Site `https://bonusufku.vercel.app`, bot `@bonusufku_webbot`, Mini App link `t.me/bonusufku_webbot/appweb`. Webhook points at `/api/telegram-webhook` with a secret token.
- Firestore `sites` holds the same 9 real tikobey sites as BonusRota: Stake, 1xBet, Grand Pasha, Roma Bet, CasinoDior, BayConti, Gamdom (`https://shr.pn/tikobeygamdom`), GoneBET, Bizbet. The fallback `SITES` array in `index.html` should be kept in sync with that list.
- Sister project BonusRota lives in `C:\Users\Pepe\Projects\bonusrota` (`@bonusrota_webbot`, purple/gold theme). Changes to shared behavior (webhook, stats, privacy, Telegram SDK) usually need to be applied to both. BonusRota does **not** have the IP/click tracking (`api/track.js`) yet — it's BonusUfku-only so far.
- Tokens (bot, Vercel) live only in Vercel env vars and local memory, never in this public repo.
- **Traffic reality check (2026-10-27):** real volume is very low. Lifetime `events` total is ~39 docs since 2026-08-30. Only 3 distinct Telegram users have ever pressed `/start`; the most recent genuine user `site_open` was 2026-10-22. Since `api/track.js` shipped (2026-10-23 00:21 UTC) there have been exactly 4 new `site_open` docs, all from the same two AWS us-west-1 IPs (`54.183.149.156`, `13.57.148.235`) with a headless-Chrome user agent and no Telegram context — almost certainly an automated crawler/Vercel-side fetch, not a real visitor. Zero `site_click`/`wheel_spin`/`chest_open` events have been recorded yet by anyone. Don't read the IP/click dashboard as "no bugs" until a real human visit with a plausible residential IP shows up — the pipeline is verified working (see api/track.js test above), there's just no real traffic yet.

## Open items

- No custom domain yet. When bought: add it in Vercel, update `WEBAPP_URL` in `api/telegram-webhook.js`, and change the Web App URL in BotFather (`/myapps`).
- Telegram Ads: the official platform prohibits gambling, so sponsored posts via marketplaces are the realistic route. Use `t.me/bonusufku_webbot?start=<source>` links per placement and read results in `admin/stats.html`.
