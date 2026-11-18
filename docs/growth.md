# Growth: invites that work for a friend without the app, and a home page

The best way Diagonal Duel spreads is one player challenging a friend. Until now the invite message carried a link in
the app's own scheme (`diagonalduel://...`), which does nothing for a friend who does not have the game: the person most
worth reaching got a dead link. This fixes that and gives the game a home page. Nothing is added to the app or the site
to track anyone (no script that calls out, no analytics); the App Store counts installs itself.

## How an invite works now

1. A player taps Share on a challenge. The message holds an ordinary web link
   (`https://bsav0016.github.io/DiagonalDuelFrontend/join.html?code=ABCD2345`), the code, and the time per move.
2. The friend taps it. The page (`site/join.html`) shows the code, a button that opens the app on the join screen, and the
   App Store link for a friend who does not have the app. Once they have installed it and signed in, they tap the same
   button again or type the code under Play Online > Join with a Code.
3. The page reads the code from the link in the browser and never sends it anywhere. It only accepts a code of the shape
   the backend makes (8 characters, no I, O, 0 or 1), so nothing odd from a link ends up in the page or the app link.

`inviteLink` and `inviteMessage` are in `features/challenges/invite.ts`; `site/join.js` is the page's code. Tests in
`features/challenges/__tests__/invite.test.ts` check that the two agree and that the page's app link goes to the join
screen the app listens for.

## The home page

`site/index.html` (https://bsav0016.github.io/DiagonalDuelFrontend/): what the game is, the ways to play, two screenshots
and the App Store button. It is plain HTML, published by `.github/workflows/pages.yml` when `site/` changes on `master`.
**Pages has to be switched on once:** repository Settings > Pages > Source: GitHub Actions. Until then the invite link
leads nowhere, so switch it on and open the home page before releasing an app version that sends the new links.

## Tagged links

| Where | Campaign |
| --- | --- |
| Home page | `web-home` |
| Invite page | `invite-page` |

The App Store reports first-time downloads per campaign in App Analytics, Campaigns. It only reports a campaign link that
also carries the account's provider token (`pt`): build one campaign link in App Store Connect, and add `pt=<number>&` before
`ct=` in the two App Store links in `site/index.html` and `site/join.html`. It is public and the same for every app on the
account. Until then the links work but the campaign is not reported.

Android: there is no Play listing, so the pages offer iPhone and iPad only. When there is one, add a Google Play button
with an install referrer (`&referrer=utm_source%3Dinvite-page%26utm_medium%3Dorganic%26utm_campaign%3Dinvite-page`).

## Order of release

1. Merge this, switch Pages on, and open `.../join.html?code=ABCD2345` on a phone to check the page.
2. Release the app version that has challenges and invites (3.2.0). It is a store build: the live 3.1.0 has no invites, so
   nobody has been sent the old scheme link, and the first invites out will already use the web link.

## Next, not done here

- **Daily puzzles** (in progress on this repo) are the strongest hook for strangers: a shareable result for the day's
  puzzle spreads without anyone needing a friend to play. Design the share text with a tagged link when that stage lands.
- **Ask for a rating** after a win or a finished challenge. The app has no rating prompt and `expo-store-review` is a native
  module, so it ships with the next store build, not over the air.
- **Where to post:** board-game and abstract-strategy communities (r/abstractgames, BoardGameGeek forums) with a game
  position or a puzzle, not a bare link. Read each community's self-promotion rules first.
