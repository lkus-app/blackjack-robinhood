# Deploy checklist — GitHub + Vercel

## 1. GitHub

Repo already created:

**https://github.com/lkus-app/blackjack-robinhood**

### If you need to re-push from this PC

```powershell
cd C:\Users\Lenovo\Projects\BlackJack
git remote -v
# should show: origin https://github.com/lkus-app/blackjack-robinhood.git

git add .
git commit -m "Update BlackJack game"
git push -u origin main
```

Login with GitHub when prompted (browser / PAT).

### Create a Personal Access Token (if push asks password)

1. GitHub → Settings → Developer settings → Personal access tokens  
2. Generate token with `repo` scope  
3. Use token as password when `git push` asks

---

## 2. Vercel

1. https://vercel.com/new  
2. Import **lkus-app/blackjack-robinhood**  
3. Leave defaults (Vite / `npm run build` / `dist`)  
4. Deploy  

### Build settings (must match)

| Setting | Value |
|--------|--------|
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |
| Node version | 18.x or 20.x |

`vercel.json` in the repo already encodes this.

---

## 3. Verify after deploy

- Open the Vercel URL  
- Game loads (felt table / cards / buttons)  
- Place bet → DEAL works  
- HELP panel opens  

If cards are blank, hard-refresh (`Ctrl+F5`). Cards are generated procedurally in-browser.

---

## 4. Optional: CLI only deploy (no GitHub)

```bash
npm run build
npx vercel --prod
```

Uploads `dist` (or full project with build on Vercel).
