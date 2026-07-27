# BlackJack — Robinhood Chain Casino

2D blackjack game built with **Phaser 3 + Vite + TypeScript**.  
Offline MVP — ready for **GitHub** + **Vercel**.

Repo: [github.com/lkus-app/blackjack-robinhood](https://github.com/lkus-app/blackjack-robinhood)

---

## Deploy to Vercel (recommended)

1. Open [vercel.com/new](https://vercel.com/new)
2. **Import** `lkus-app/blackjack-robinhood`
3. Settings (auto from `vercel.json`):
   - Framework: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
4. Click **Deploy**

After deploy you get a live URL like `https://blackjack-robinhood.vercel.app`.

### CLI alternative

```bash
npm i -g vercel
cd BlackJack
vercel
```

---

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:5173

```bash
npm run build    # → dist/
npm run preview  # test production build
```

**Node.js 18+** required.

---

## How to play

| Control | Action |
|--------|--------|
| Chips | Bet $1 / $5 / $25 / $100 |
| **DEAL** | Start hand |
| **HIT** | Draw a card |
| **STAND** | End turn |
| **DOUBLE** | Double bet + one card |
| **INSURE** | When dealer shows Ace |
| **HELP** / `H` | Rules |
| **NEW** | Next round |

- Bankroll: **$100** virtual  
- Reward: **$10 profit = 5 BJ** coins  
- Rules: International **S17**, BJ **3:2**, 6-deck shoe  

---

## Project structure

```
├── public/assets/     # Optional art (dealer, table, chips)
├── src/
│   ├── main.ts
│   ├── scenes/        # Boot + Game
│   ├── game/          # Engine, rules, procedural cards
│   └── web3/          # Wallet stub (Robinhood Chain)
├── vercel.json        # Vercel config
├── package.json
└── index.html
```

---

## Tech

| | |
|--|--|
| Game | Phaser 3 |
| Bundler | Vite 6 + TypeScript |
| Deploy | Vercel (static) |
| Web3 | Stub only (offline bets) |

---

## License

MIT
