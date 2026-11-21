# Release 3.2.0 (iPhone)

The store has 3.1.0 (released 2026-10-18). This release adds the daily puzzle, challenges, resign and rematch, invite links that work without the app, forgot password, optional turn notifications, a fairer computer leaderboard (wins are checked by the server, with a daily point limit and your own rank), and the move to Expo SDK 58. It is the first build that can receive over-the-air updates (see over-the-air-updates.md).

## Before you build

- [x] Backend is live: `/api/devices/`, `/api/challenges/` and `/api/password-reset/request/` answer on production.
- [x] The computer leaderboard checks are live too (backend release v26, migrations 0010 and 0011); the old score endpoint is still on so 3.1.0 players keep earning points until this release is out.
- [ ] **Privacy policy:** the current policy (Weebly, effective 2020) says nothing is collected, but the app has accounts, online games and, from 3.2.0, push tokens. The new policy is `site/privacy.html` (published at https://bsav0016.github.io/DiagonalDuelFrontend/privacy.html); the app opens it from Support. Update the **Privacy Policy URL** in App Store Connect to that page before you submit.
- [ ] Try Forgot password once with your own account on the new build: the endpoint answers, but only a real reset proves the email is sent.
- [ ] iPhone only for now. Android has no package name or push credentials yet (Firebase key, `google-services.json`); do Android as its own step.

## Build and submit (run in the repo folder, signed in with `npx eas-cli login`)

```
git checkout master
git pull
npx eas-cli build --platform ios --profile production
npx eas-cli submit --platform ios --profile production --latest
```

The build number is managed by EAS (`appVersionSource: remote`, `autoIncrement`). The first build with notifications asks you to sign in to your Apple account so EAS can create the push credentials. Then open App Store Connect, add 3.2.0, choose the build, paste the text below as What's New, and submit for review.

## What's New (paste into App Store Connect)

```
What's new in 3.2.0:

- Daily Puzzle: a new four-in-a-row puzzle every day. Find the winning move, keep your streak going and share your result. Puzzles get harder through the week.
- Challenge a friend by username or with an invite link, answer challenges, resign a game and ask for a rematch.
- Invite links now work for a friend who has not installed the game yet.
- Forgot your password? Reset it with a code sent to your email.
- Optional notifications when it is your turn. The app asks once, the first time you start an online game.
- Fairer computer leaderboard: wins against the computer are now checked by the server, you can earn up to 1,000 computer points a day, and the leaderboard shows the top 100 and your own place.
- Your games list loads faster: it shows your 20 most recent finished games, with a Load More button.
```

## App Store Connect

- **App Privacy:** declare what the app collects for an account and online play: email address and username (account, sign-in and password reset), user ID, gameplay content (games, moves, ratings and computer-game records, for the leaderboard and fair play), and Device ID (the push token, only if notifications are allowed). All linked to the user, none used for tracking. Check the current answers in App Store Connect against this list.
- **Screenshots and text:** after this build is live, upload the images in `docs/store/ios` (1 to 7) and paste the text from `docs/store/listing.md`. Not before: they show features that are not in the store until then.

## After approval

- [ ] **Turn off the old score endpoint** once 3.2.0 is live: `heroku config:set LEGACY_COMPUTER_SCORE_ENABLED=false -a diagonal-duel` (it then answers 410). Do not do it earlier; 3.1.0 players would stop earning points.
- [ ] Live check of the leaderboard: a real signed-in win against the computer in the 3.2.0 app adds points and shows your rank; a forged finish is refused.
- [ ] Open the daily puzzle on a real phone and play a few days.
- [ ] Check a challenge, resign and rematch between two accounts, and a turn notification, then tick the Live items in backend issues #27 and #20.
- [ ] Optional: set a repository variable or tell me the Play Store link when Android exists, so shared puzzle results link to it.
