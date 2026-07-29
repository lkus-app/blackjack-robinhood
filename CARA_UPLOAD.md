# Cara upload ke GitHub + deploy Vercel

Folder project: `C:\\Users\\Lenovo\\Projects\\BlackJack`

## Upload SEMUA file (disarankan)

Pakai script API (bukan web UI — menghindari limit 100 file):

```powershell
cd C:\\Users\\Lenovo\\Projects\\BlackJack
$env:GITHUB_TOKEN = "ghp_your_token"
powershell -ExecutionPolicy Bypass -File .\\UPLOAD_TO_GITHUB.ps1
```

Token: https://github.com/settings/tokens (scope **repo**)

## Vercel

1. https://vercel.com/new → import `lkus-app/blackjack-robinhood`
2. Build: `npm run build` · Output: `dist`
3. Deploy

`vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```
