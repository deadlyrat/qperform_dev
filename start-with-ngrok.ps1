# QPerform - Start with ngrok for Power Apps Testing
# This script helps you quickly set up ngrok for testing

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   QPerform - ngrok Setup Helper" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if backend is in expected location
$backendPath = "C:\qperform_server-main"
if (-Not (Test-Path $backendPath)) {
    Write-Host "❌ Backend not found at: $backendPath" -ForegroundColor Red
    Write-Host "Please update the `$backendPath variable in this script." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit
}

Write-Host "✅ Backend found at: $backendPath" -ForegroundColor Green
Write-Host ""

# Step 2: Check if ngrok is installed
try {
    $ngrokVersion = & ngrok version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ ngrok is installed: $ngrokVersion" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ ngrok not found!" -ForegroundColor Red
    Write-Host "Run: winget install ngrok.ngrok" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit
}
Write-Host ""

# Step 3: Instructions
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   STEP-BY-STEP INSTRUCTIONS" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1️⃣  START BACKEND (in a new terminal):" -ForegroundColor Yellow
Write-Host "   cd $backendPath" -ForegroundColor White
Write-Host "   node server.js" -ForegroundColor White
Write-Host ""

Write-Host "2️⃣  START NGROK (in another new terminal):" -ForegroundColor Yellow
Write-Host "   ngrok http 3001" -ForegroundColor White
Write-Host ""
Write-Host "   📋 COPY the HTTPS URL from ngrok output!" -ForegroundColor Cyan
Write-Host "   Example: https://abc123.ngrok-free.app" -ForegroundColor Gray
Write-Host ""

$continue = Read-Host "Have you started backend and ngrok? (yes/no)"
if ($continue -ne "yes") {
    Write-Host ""
    Write-Host "❌ Please start backend and ngrok first, then run this script again." -ForegroundColor Red
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit
}

Write-Host ""

# Step 4: Get ngrok URL from user
Write-Host "3️⃣  ENTER YOUR NGROK URL:" -ForegroundColor Yellow
$ngrokUrl = Read-Host "Paste your ngrok HTTPS URL here"

if (-Not $ngrokUrl.StartsWith("https://")) {
    Write-Host ""
    Write-Host "❌ URL must start with https://" -ForegroundColor Red
    Write-Host "   Example: https://abc123.ngrok-free.app" -ForegroundColor Gray
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit
}

Write-Host ""
Write-Host "✅ ngrok URL: $ngrokUrl" -ForegroundColor Green
Write-Host ""

# Step 5: Update .env.production
$envFile = ".env.production"
$envContent = "# Production environment for ngrok testing`nVITE_API_URL=$ngrokUrl"

Set-Content -Path $envFile -Value $envContent
Write-Host "✅ Updated $envFile with your ngrok URL" -ForegroundColor Green
Write-Host ""

# Step 6: Build frontend
Write-Host "4️⃣  BUILDING FRONTEND..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Build failed!" -ForegroundColor Red
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit
}

Write-Host ""
Write-Host "✅ Build completed successfully!" -ForegroundColor Green
Write-Host ""

# Step 7: Ask about deployment
Write-Host "5️⃣  DEPLOY TO POWER APPS:" -ForegroundColor Yellow
$deploy = Read-Host "Do you want to deploy now? (yes/no)"

if ($deploy -eq "yes") {
    Write-Host ""
    Write-Host "Deploying to Power Apps..." -ForegroundColor Cyan
    pac code push --environment-id 3a7af3e9-f4bf-e436-b690-1541b2005714

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Deployed successfully!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Deployment failed!" -ForegroundColor Red
    }
} else {
    Write-Host ""
    Write-Host "⏭️  Skipped deployment." -ForegroundColor Yellow
    Write-Host "   To deploy manually, run:" -ForegroundColor Gray
    Write-Host "   pac code push --environment-id 3a7af3e9-f4bf-e436-b690-1541b2005714" -ForegroundColor White
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   ✅ SETUP COMPLETE!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "   1. Open your Power App in browser" -ForegroundColor White
Write-Host "   2. Click 'Enter Dashboard'" -ForegroundColor White
Write-Host "   3. Open DevTools (F12) → Console" -ForegroundColor White
Write-Host "   4. Check for successful API calls" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Your API URL: $ngrokUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "📚 For detailed troubleshooting, see:" -ForegroundColor Gray
Write-Host "   NGROK_SETUP_GUIDE.md" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to exit"
