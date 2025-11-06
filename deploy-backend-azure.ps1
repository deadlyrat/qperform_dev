# Deploy QPerform Backend to Azure
# Safe, secure, production-ready deployment

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   QPerform Backend - Azure Deployment" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if Azure CLI is installed
try {
    $azVersion = az version --output json 2>$null | ConvertFrom-Json
    Write-Host "✅ Azure CLI installed: $($azVersion.'azure-cli')" -ForegroundColor Green
} catch {
    Write-Host "❌ Azure CLI not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Install Azure CLI:" -ForegroundColor Yellow
    Write-Host "   winget install Microsoft.AzureCLI" -ForegroundColor White
    Write-Host "   OR download from: https://aka.ms/installazurecliwindows" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit
}
Write-Host ""

# Step 2: Check if backend folder exists
$backendPath = "C:\qperform_server-main"
if (-Not (Test-Path $backendPath)) {
    Write-Host "❌ Backend not found at: $backendPath" -ForegroundColor Red
    $backendPath = Read-Host "Enter path to your backend folder"
    if (-Not (Test-Path $backendPath)) {
        Write-Host "❌ Path not found!" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit
    }
}

Write-Host "✅ Backend found at: $backendPath" -ForegroundColor Green
Write-Host ""

# Step 3: Login to Azure
Write-Host "1️⃣  AZURE LOGIN" -ForegroundColor Yellow
Write-Host "   Opening Azure login in browser..." -ForegroundColor White
az login --use-device-code

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Azure login failed!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit
}

Write-Host ""
Write-Host "✅ Logged in to Azure" -ForegroundColor Green
Write-Host ""

# Step 4: Get configuration
Write-Host "2️⃣  CONFIGURATION" -ForegroundColor Yellow
Write-Host ""

$appName = Read-Host "Enter app name (e.g., qperform-api)"
$resourceGroup = Read-Host "Enter resource group (e.g., qperform-rg)"
$location = Read-Host "Enter location (e.g., eastus, westus2) [default: eastus]"
if ([string]::IsNullOrWhiteSpace($location)) {
    $location = "eastus"
}

Write-Host ""
Write-Host "Configuration:" -ForegroundColor Cyan
Write-Host "   App Name: $appName" -ForegroundColor White
Write-Host "   Resource Group: $resourceGroup" -ForegroundColor White
Write-Host "   Location: $location" -ForegroundColor White
Write-Host ""

$confirm = Read-Host "Proceed with deployment? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "❌ Deployment cancelled" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit
}

Write-Host ""
Write-Host "3️⃣  DEPLOYING TO AZURE..." -ForegroundColor Yellow
Write-Host ""

# Step 5: Navigate to backend folder
Set-Location $backendPath

# Step 6: Deploy using Azure CLI
Write-Host "Creating/updating Azure resources..." -ForegroundColor Cyan
az webapp up --name $appName --resource-group $resourceGroup --runtime "NODE:20-lts" --location $location

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit
}

Write-Host ""
Write-Host "✅ Backend deployed successfully!" -ForegroundColor Green
Write-Host ""

# Step 7: Get the URL
$appUrl = "https://$appName.azurewebsites.net"
Write-Host "🌐 Your API is now available at:" -ForegroundColor Cyan
Write-Host "   $appUrl" -ForegroundColor White
Write-Host ""

# Step 8: Configure CORS
Write-Host "4️⃣  CONFIGURING CORS..." -ForegroundColor Yellow
Write-Host "   Allowing Power Apps domains..." -ForegroundColor White

az webapp cors add --resource-group $resourceGroup --name $appName --allowed-origins `
    "https://*.powerapps.com" `
    "https://*.powerplatformusercontent.com" `
    "http://localhost:3000"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ CORS configured" -ForegroundColor Green
} else {
    Write-Host "⚠️  CORS configuration had issues (may need manual setup)" -ForegroundColor Yellow
}

Write-Host ""

# Step 9: Update frontend
Write-Host "5️⃣  UPDATE FRONTEND CONFIGURATION" -ForegroundColor Yellow
Write-Host ""
Write-Host "Now update your frontend with this URL:" -ForegroundColor White
Write-Host ""
Write-Host "   1. Open: C:\qperform_dev\.env.production" -ForegroundColor Cyan
Write-Host "   2. Set: VITE_API_URL=$appUrl" -ForegroundColor Cyan
Write-Host "   3. Run: npm run build" -ForegroundColor Cyan
Write-Host "   4. Run: pac code push" -ForegroundColor Cyan
Write-Host ""

$updateNow = Read-Host "Update .env.production now? (yes/no)"

if ($updateNow -eq "yes") {
    Set-Location "C:\qperform_dev"
    Set-Content -Path ".env.production" -Value "# Production environment - Azure deployment`nVITE_API_URL=$appUrl"
    Write-Host "✅ Updated .env.production" -ForegroundColor Green
    Write-Host ""

    $buildNow = Read-Host "Build frontend now? (yes/no)"
    if ($buildNow -eq "yes") {
        npm run build

        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✅ Build completed!" -ForegroundColor Green
            Write-Host ""

            $deployNow = Read-Host "Deploy to Power Apps now? (yes/no)"
            if ($deployNow -eq "yes") {
                pac code push --environment-id 3a7af3e9-f4bf-e436-b690-1541b2005714

                if ($LASTEXITCODE -eq 0) {
                    Write-Host ""
                    Write-Host "✅ Deployed to Power Apps!" -ForegroundColor Green
                }
            }
        }
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   ✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 SUMMARY:" -ForegroundColor Yellow
Write-Host "   • Backend API: $appUrl" -ForegroundColor White
Write-Host "   • Resource Group: $resourceGroup" -ForegroundColor White
Write-Host "   • Location: $location" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Useful Commands:" -ForegroundColor Yellow
Write-Host "   View logs:" -ForegroundColor White
Write-Host "   az webapp log tail --resource-group $resourceGroup --name $appName" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Restart app:" -ForegroundColor White
Write-Host "   az webapp restart --resource-group $resourceGroup --name $appName" -ForegroundColor Cyan
Write-Host ""
Write-Host "   View in portal:" -ForegroundColor White
Write-Host "   https://portal.azure.com" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to exit"
