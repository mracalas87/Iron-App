# Iron

A minimal strength training tracker: log sets/reps/weight, browse history, chart estimated 1RM and volume over time per exercise.

All data is stored locally on-device (IndexedDB) — no login, no cloud, works offline once installed. Data does not sync between devices; it's tied to whichever browser/device you install it on.

## Run locally

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`.

## Build for production

```bash
npm run build
```

Output goes to `dist/`.

## Deploy (free options)

**Vercel** (recommended, easiest):
1. Push this folder to a GitHub repo
2. Go to vercel.com → New Project → import the repo
3. Framework preset: Vite. Deploy.

**Netlify**:
1. Push to GitHub, or drag the `dist/` folder into netlify.com/drop after running `npm run build`
2. Done — you get a URL immediately

## Install on your phone

Once deployed, open the URL on your phone in Safari (iOS) or Chrome (Android):
- **iOS**: Share button → "Add to Home Screen"
- **Android**: Menu (⋮) → "Install app" / "Add to Home screen"

It'll behave like a native app: own icon, no browser chrome, works offline.

## How it works

- **Log**: search or add an exercise, enter sets (reps × kg), save
- **History**: per exercise, chronological list of past sessions, with PR (personal record) tags on new estimated-1RM highs
- **Progress**: charts of estimated 1RM and total volume per exercise over time

Estimated 1RM uses the Epley formula: `weight × (1 + reps/30)`. It's an estimate, not a measured max — treat it as a trend indicator, not gospel.

## Known limitations (v1, by design)

- No cloud sync — single device only
- No programmes/templates, RPE tracking, or body measurements
- No auth — anyone with physical access to the device can see your data

These were deliberately left out of v1. Add them once the core logging habit is established.
