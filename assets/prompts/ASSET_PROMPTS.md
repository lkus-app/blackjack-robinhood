# BlackJack — Imagine Asset Prompts

Use these prompts to re-render or extend assets.  
**Style anchor:** clean modern 2D game art, slight anime-realistic hybrid, soft neon purple–gold, dark elegant casino.

**Engine defaults:** solid flat magenta `#FF00FF` chroma key for sprites; no baked UI text on buttons (labels are drawn in Phaser); exact card ranks stay procedural.

Dealer name badge in renders: **LUNA**.

---

## 1. Dealer — idle (BASE)

```
Beautiful young female blackjack dealer for a 2D casino game sprite, waist-up portrait, long dark wavy hair, elegant black vest over crisp white shirt, small gold name badge on vest, professional friendly smile, hands resting lightly on the bottom edge of frame as if on a table ready to deal, slight anime-realistic hybrid 2D game art style with clean lines and soft cel shading, soft neon purple and gold rim lighting, solid flat pure magenta background #FF00FF for chroma key, centered full figure from head to waist, high detail face and hands, no text, no watermark, game character sprite ready.
```

**Aspect:** `2:3`  
**File:** `public/assets/dealer-idle.jpg`  
**Always edit-chain variants from this base.**

---

## 2. Dealer — dealing (edit from idle)

```
Keep this exact same female blackjack dealer character — same face, long dark wavy hair, black vest, white shirt, gold LUNA name tag, same anime-realistic 2D game style, same solid pure magenta background. Change only pose: her right arm is extended forward and slightly to the side as if dealing a card, natural lean of the body, friendly focused expression looking toward the dealt card, left hand still near the table edge. Waist-up, high detail hands, clean sprite for animation.
```

**File:** `public/assets/dealer-deal.jpg`

---

## 3. Dealer — win / clap (edit from idle)

```
Keep this exact same female blackjack dealer character — same face, long dark wavy hair, black vest, white shirt, gold LUNA name tag, same anime-realistic 2D game style, same solid pure magenta background. Change only expression and pose: she smiles happily and claps her hands together at chest height celebrating a player win, joyful bright eyes, warm soft neon purple-gold lighting. Waist-up game sprite.
```

**File:** `public/assets/dealer-win.jpg`

---

## 4. Dealer — lose / pout (edit from idle)

```
Keep this exact same female blackjack dealer character — same face, long dark wavy hair, black vest, white shirt, gold LUNA name tag, same anime-realistic 2D game style, same solid pure magenta background. Change only expression: slight disappointed soft pout, gentle sad eyes, hands still resting on the table edge, professional but sorry look when the player loses. Waist-up game sprite.
```

**File:** `public/assets/dealer-sad.jpg`

---

## 5. Table

```
Classic green felt blackjack casino table for a 2D game, elegant top-down three-quarter view of a single semi-circular blackjack table, deep casino green felt with yellow curved betting circles, yellow rail outline, decorative arc, card shoe on the right, empty chip rack, soft neon purple and gold ambient accents, dark elegant atmosphere around the table edges, clean modern 2D game art, sharp readable layout, no people, no cards on table, solid dark charcoal background, game asset ready.
```

**Aspect:** `16:9`  
**File:** `public/assets/table-felt.jpg`  
**Note:** AI text may garble “BLACK JACK PAYS 3 TO 2” — Phaser overlays correct labels.

---

## 6. Card back

```
Classic playing card back design for a 2D blackjack game sprite, single vertical card, deep navy and purple geometric diamond lattice pattern with thin gold border and small gold diamond monogram in the center, slight 3D card thickness and soft edge shadow, clean modern 2D game art, solid flat pure magenta background #FF00FF, centered, sharp edges, no text, no watermark, flip-animation ready.
```

**Aspect:** `2:3`  
**File:** `public/assets/card-back.jpg`  
**Faces:** all 52 ranks stay procedural in `AssetFactory` (exact rank/suit text).

---

## 7. Chips sheet

```
Premium casino poker chip set for a 2D game, four large circular chips in a horizontal row on solid flat pure magenta background #FF00FF: white chip, red chip, blue chip, black chip, each with gold metallic edge rings and engraved center circle, smooth stackable 3D-ish thickness, subtle soft glow, clean modern 2D game sprite style, evenly spaced, high contrast, no text numbers, no watermark, physics-ready game assets.
```

**Aspect:** `16:9`  
**File:** `public/assets/chips-sheet.jpg`  
**Split in runtime to:** `chip-1`, `chip-5`, `chip-25`, `chip-100`

---

## 8. UI chrome (shells only)

```
Clean modern mobile game UI chrome set on solid flat pure magenta background #FF00FF for a casino game: five rounded rectangular button shells in a row with soft neon gold and purple glowing outlines and dark translucent glass fill, no text on buttons; plus a tall dark glass leaderboard panel with gold border on the left; plus a wide thin balance bar panel with purple neon edge at the bottom; soft neon gold-purple theme, 2D game HUD assets, evenly laid out, high contrast, no letters no numbers no watermark.
```

**Aspect:** `16:9`  
**File:** `public/assets/ui-chrome.jpg`  
**Labels (Deal/Hit/Stand…)** drawn in Phaser for accuracy.

---

## Future prompts (optional)

### Dealer animation frames (sheet)

```
Same Luna blackjack dealer character sheet, horizontal strip of four equal frames on solid magenta: idle hands on table, arm halfway dealing, arm fully extended deal, recover to idle. Identical face and outfit every cell, same scale and hip position, clean 2D game sprite sheet, no divider lines.
```

### Gold chip variant

```
Single premium gold casino chip with ornate edge, solid magenta background, same style as the red/blue chip set, 2D game sprite, no text.
```

### Table theme unlock — cyber

```
Same blackjack table layout as reference, recolor to deep midnight blue felt with cyan neon rail and holographic seat circles, 2D game art, dark background.
```
