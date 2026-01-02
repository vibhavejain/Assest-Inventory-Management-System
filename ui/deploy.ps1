# Deploy UI to Cloudflare Pages
Write-Host "Building UI..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "Deploying to Cloudflare Pages..." -ForegroundColor Cyan
    npx wrangler pages deploy dist --project-name=aims-ui
} else {
    Write-Host "Build failed!" -ForegroundColor Red
}
