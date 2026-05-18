# Felt — Poker Night Co-pilot

> Single-device web app that runs on the dealer's phone during a home poker game. Tracks positions, action flow, and resolves showdowns with a plain-language verdict.

Felt is a referee, not a casino. It does **state and rules**, never money. No chip counters, no odds calculator, no stack tracking — just the things humans are bad at: remembering whose turn it is after the flop, resolving showdown disputes, and rotating the dealer button.

## Tech stack

- **Next.js 16** (App Router, Turbopack) + TypeScript
- **Tailwind CSS v4** (CSS-based theme tokens via `@theme`)
- **Zustand** with `persist` middleware → localStorage
- **pokersolver** for hand evaluation
- **Framer Motion** for screen transitions and reveals
- **Lucide React** for icons
- **Fraunces / JetBrains Mono / Inter Tight** via `next/font/google`
- Deployed on **Vercel** (auto-deploy from `main`)

## Local development

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

Other useful scripts:

```bash
npm run build         # production build
npm run lint          # eslint
node scripts/generate-icons.mjs   # regenerate PWA icons (requires sharp)
```

## Routes

| Route        | Purpose                                                    |
| ------------ | ---------------------------------------------------------- |
| `/`          | Setup — add players, pick first dealer, start the night    |
| `/hand`      | Live hand — track action across preflop → river            |
| `/showdown`  | Card picker — board + remaining hole cards                 |
| `/verdict`   | Winner reveal with plain-language explainer                |

## Deployment

Vercel auto-deploys every push to `main`. No CLI deployment needed. Connect the GitHub repo at [vercel.com/new](https://vercel.com/new) once, then it tracks the branch.

## Installing as a PWA

Open the deployed URL in iOS Safari → Share → **Add to Home Screen**. Felt has a standalone manifest, dark theme color, and portrait orientation.

## Roadmap (post-v1)

- **End-of-night settlement tracker** — buy-ins, cash-outs, who owes whom
- **Hand history view** — scroll through tonight's hands, replay verdicts
- **AI hand-read mode** — opt-in "show my hand" with OpenRouter for a casual read
- **Blinds timer** — tournament-style nights, auto-incrementing levels
- **Photo card recognition** — point camera at cards instead of tapping the grid
- **Multi-device mode** — each player on their own phone, sees only their cards (Supabase realtime + auth)
- **Stats over time** — across nights: who wins most, biggest pots, etc.
- **Custom card decks / table themes** — Raidage edition, etc.
- **Croatian translation** — for the explainer text

## Credits

Designed and built by Domagoj Martinko. Initial scaffolding drafted with Claude.
