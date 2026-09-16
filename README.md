# N-FIT V6

Personal, mobile-first fitness tracker. 100% free to run — static site, no
backend, no paid services. Deploy it anywhere that serves static files
(GitHub Pages, Vercel, Netlify, Cloudflare Pages all have free tiers).

## V5 changes

- **Fixed a day-boundary bug**: the app used to compute "today" from UTC
  time, so logging late in the evening could silently save to the wrong
  calendar day depending on your timezone. Now uses your device's local date.
- **Recipes are actually reusable now**: previously "Build a recipe" just
  logged one meal and threw the recipe away. Now recipes save to a
  "Saved recipes" list on the Food page — one tap adds them again later.
- **Workout history**: the Progress page now lists your past finished
  workouts (date, time, exercises, sets) with a tap-to-expand set-by-set
  breakdown, instead of only ever showing today.
- **"Last time" reference while logging a set**: each exercise shows your
  top set and how many days ago you last did it, so you know what to beat.
- **Exercises now use stable IDs internally**, not their display name.
  Renaming or deleting an exercise no longer orphans or breaks the link to
  sets you've already logged for it.
- **Data export/import**: Settings → Backup lets you download a JSON backup
  and restore it later. Previously everything only lived in this browser's
  localStorage — clearing site data or switching devices meant losing
  everything permanently.
- **Weight/rep entry is now +/- steppers** instead of long native dropdowns
  — faster to use mid-set on a phone.
- **PWA fixes**: added real app icons and a `public/` folder (the manifest
  file wasn't actually reachable at `/manifest.webmanifest` before, since it
  lived outside Vite's public directory), plus a small service worker so the
  app keeps working offline after the first load. Wired up the
  `@vitejs/plugin-react` dependency that was already in `package.json` but
  never referenced from a `vite.config.js`.
- Deleting a food entry now asks for confirmation, matching exercise delete.

Existing data in your browser is migrated automatically the first time you
load this version — nothing needs to be done manually. Still, export a
backup from Settings once you're on V5, just in case.

## Older changelog

V4 changes:
- Compact, clearer exercise form illustrations beside each exercise.
- Finish Workout now saves the current exercise data first and shows an in-app "Workout saved" confirmation.
- Exercise library remains editable by body part: add, rename, delete.
- Weight selector uses 2.5 kg steps.
- Food recipes calculate calories, protein, fat and carbs from ingredients automatically.
- Added more common ingredients such as paneer, oats, potato, dal, bread, apple and peanut butter.
- Data is stored locally on the device with localStorage.

## V6 changes

- Exercise library expanded to ~100 exercises across 8 muscle groups
  (added Forearms and Core as new groups), based on your reference lists.
  Existing saved data migrates automatically — nothing added replaces
  exercises you already customized.
- Every exercise now gets its own custom-drawn illustration (squat, hinge/
  deadlift, row, hanging leg raise, plank, glute bridge, etc. — ~20 distinct
  poses) matched by exercise name, instead of the old 6-category fallback.
  These are original line-art drawings in the app's own style — not copies
  of any reference chart, since those are copyrighted.
