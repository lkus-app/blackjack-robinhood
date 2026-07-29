UPLOAD SEMUA FILE KE GITHUB

cd C:\\Users\\Lenovo\\Projects\\BlackJack
$env:GITHUB_TOKEN = "ghp_your_token"
powershell -ExecutionPolicy Bypass -File .\\UPLOAD_TO_GITHUB.ps1

Token: https://github.com/settings/tokens (centang repo)
Lalu Redeploy Vercel.
