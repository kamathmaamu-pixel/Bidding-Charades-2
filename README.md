# 🪔 Bidding Charades – Diwali Edition

A phone-friendly charades game with bidding. Static site, no backend or build step.

- `index.html` – landing page (player vs game master)
- `play.html` – **player team quiz**; ends with a code the player sends to the game master
- `gm.html` – **game master panel**: teams, bidding, timer, skip, scores, settings

## How a round works
1. GM draws a movie. Only language, difficulty and word count are shown.
2. Teams bid **how few seconds** they need. Lowest bid wins and must act it out in that time.
3. The phone goes to the actor, who holds to reveal the title and starts the timer.
4. Guessed = `130 − bid` points (min 10); missed = half of that lost. Skipping a movie costs a small penalty (configurable).

## Team quiz
Players open `play.html` on their own phones, answer 6 questions (languages they follow, movie memory, acting confidence, plus fun Diwali ones) and WhatsApp/copy the code to the GM. The GM pastes codes into the Teams tab and hits **Auto-split** for balanced teams.

## Run / host
Open `index.html`, or enable GitHub Pages on the branch to get a link to share. Game state is saved in the GM's browser (`localStorage`).

Movies live in `js/data.js` (Bollywood, Tamil, Hollywood, Kannada) – easy to add more.
