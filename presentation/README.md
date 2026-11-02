# PopUpGp IT Project 700 deck

Presentations:

- `PopUpGp_IT_Project_700.pptx`: detailed 12–15 minute version.
- `PopUpGp_IT_Project_700_5_Minute.pptx`: concise assessment version with 9 slides and speaker notes.

To regenerate it after editing `generate-deck.mjs` or the screenshots:

```bash
npm install
npm run build
npm run build:5min
```

The deck uses Manrope and Inter. Their licensed font files are included in `fonts/`; install them on the presentation computer if those fonts are not already available. The deck does not embed fonts.

Screenshots are from the local Expo and admin web previews. The Browse screenshot captures an emulator query error and the deck labels that limitation. The admin queue on slide 6 is a schematic, not a populated screenshot.

See `LIVE_DEMO_3_TERMINALS.md` for the short demo setup and order.
