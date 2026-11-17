# Store listing (recommended text)

Copy these into App Store Connect and the Google Play Console. Only claims what the app does today. Limits are in parentheses. The name and subtitle carry the words people actually search for ("four in a row"). Do not use the name "Connect 4": it is a trademark.

## Names and short text

| Field | Text |
| --- | --- |
| Apple name (30) | Diagonal Duel: 4 in a Row |
| Apple subtitle (30) | Strategy board game for two |
| Google title (30) | Diagonal Duel: Four in a Row |
| Google short description (80) | Four-in-a-row strategy on a diamond board. Play the computer or a friend. |
| Apple promotional text (170) | Line up four on an 8x8 diamond board. Play the computer at any level from 0 to 100, pass the phone to a friend, or take on other players online. |
| Apple keywords (100) | strategy,board game,puzzle,two player,2 player,offline,abstract,logic,vs computer,brain,classic,duel |
| Category | Games, then Board (Apple primary; Strategy secondary) and Google "Board" |

## Full description (use for both stores)

Diagonal Duel is a quick strategy game for two: take turns placing pieces on an 8x8 board, and be the first to line up four in a row, across, down or diagonally.

A DIFFERENT KIND OF FOUR IN A ROW
- The board is a diamond, and you build outward from the corner. A piece can only go next to the pieces already in play, so every move opens some lines and closes others.
- Not sure where you can play? Show Valid Moves lights up every legal square.

PLAY HOWEVER YOU LIKE
- Play the computer at any level from 0 to 100, from a friendly opponent to one that thinks several moves ahead.
- Pass and play: two players on one phone, no account needed.
- Play online: matchmaking against another player. Games are asynchronous, with a time limit on each move, so nobody has to be online at the same time.
- Climb the leaderboard, by online rating and by computer points.

EASY TO LEARN
- A short How to Play screen, and the rules fit in one sentence.

YOUR DATA
- Playing the computer or a friend on one phone needs no account.
- You can delete your account and data inside the app at any time.

## Screenshots

Upload the images in this folder. They are real screens from the running app with a short headline each.

- App Store: `ios/` (1290 x 2796, accepted for the 6.9-inch and 6.7-inch iPhone slots). Order: 1 to 5.
- Google Play: `android/` (1080 x 1920). Same order.

To remake them after the app changes: capture new screens into `raw/`, then run `node scripts/make-store-art.js <path to a Chromium>` (needs `playwright-core`).

## Icon

`icon-compare.png` shows the current icon next to a simpler option (`icon-simple-1024.png`: five rows instead of eight, bigger discs, the winning line kept) at the sizes a phone uses. The simpler one reads better small. The current icon is already good, so this is optional. Changing the icon needs a new store build.
