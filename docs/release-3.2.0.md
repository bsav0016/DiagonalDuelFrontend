# Release 3.2.0 (iPhone)

The store has 3.1.0 (released 2026-10-18). This release adds the daily puzzle, challenges, resign and rematch, invite links that work without the app, forgot password, optional turn notifications, and the move to Expo SDK 58. It is the first build that can receive over-the-air updates (see over-the-air-updates.md).

## Before you build

- [x] Backend is live: `/api/devices/`, `/api/challenges/` and `/api/password-reset/request/` answer on production.
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
- Your games list loads faster: it shows your 20 most recent finished games, with a Load More button.
```

## App Store Connect

- **App Privacy:** notifications add a push token tied to the account (so the server can tell you when it is your turn). Confirm how Apple wants a push token declared before you submit. Nothing else new is collected.
- **Screenshots and text:** after this build is live, upload the images in `docs/store/ios` (1 to 7) and paste the text from `docs/store/listing.md`. Not before: they show features that are not in the store until then.

## After approval

- [ ] Open the daily puzzle on a real phone and play a few days.
- [ ] Check a challenge, resign and rematch between two accounts, and a turn notification, then tick the Live items in backend issues #27 and #20.
- [ ] Optional: set a repository variable or tell me the Play Store link when Android exists, so shared puzzle results link to it.
