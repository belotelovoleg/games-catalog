# Quick deployment check script for Windows PowerShell
# This script helps verify your app is ready for Amplify deployment

Write-Host "🚀 Checking deployment readiness..." -ForegroundColor Green

# Check if required files exist
Write-Host "📁 Checking required files..." -ForegroundColor Blue
if (Test-Path "amplify.yml") {
    Write-Host "✅ amplify.yml found" -ForegroundColor Green
} else {
    Write-Host "❌ amplify.yml missing" -ForegroundColor Red
    exit 1
}

if (Test-Path ".env.example") {
    Write-Host "✅ .env.example found" -ForegroundColor Green
} else {
    Write-Host "❌ .env.example missing" -ForegroundColor Yellow
}

if (Test-Path "prisma/schema.prisma") {
    Write-Host "✅ Prisma schema found" -ForegroundColor Green
} else {
    Write-Host "❌ Prisma schema missing" -ForegroundColor Red
    exit 1
}

# Check package.json scripts
Write-Host "📦 Checking package.json scripts..." -ForegroundColor Blue
$packageJson = Get-Content "package.json" -Raw
if ($packageJson -match '"build":') {
    Write-Host "✅ Build script found" -ForegroundColor Green
} else {
    Write-Host "❌ Build script missing" -ForegroundColor Red
    exit 1
}

if ($packageJson -match '"postinstall":') {
    Write-Host "✅ Postinstall script found" -ForegroundColor Green
} else {
    Write-Host "❌ Postinstall script missing (recommended for Prisma)" -ForegroundColor Yellow
}

# Test build locally
Write-Host "🔨 Testing local build..." -ForegroundColor Blue
try {
    npm run build
    Write-Host "✅ Build successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Build failed - fix errors before deploying" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Your app appears ready for Amplify deployment!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Blue
Write-Host "1. Push your code to GitHub"
Write-Host "2. Set up AWS Amplify and connect your repository"
Write-Host "3. Configure environment variables in Amplify console"
Write-Host "4. Deploy your app"
Write-Host ""
Write-Host "See DEPLOYMENT.md for detailed instructions."
