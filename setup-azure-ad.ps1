# QPerform - Azure AD App Registration Setup
# This script helps you register QPerform in Azure Active Directory

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   QPerform - Azure AD Setup" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Azure CLI is installed
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

# Login to Azure
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

# Get tenant ID
Write-Host "2️⃣  GETTING TENANT INFORMATION" -ForegroundColor Yellow
$account = az account show --output json | ConvertFrom-Json
$tenantId = $account.tenantId
$tenantName = $account.name

Write-Host "   Tenant ID: $tenantId" -ForegroundColor Cyan
Write-Host "   Tenant Name: $tenantName" -ForegroundColor Cyan
Write-Host ""

# App configuration
$appName = "QPerform Web App"
$redirectUris = @(
    "http://localhost:5173",
    "http://localhost:3000"
)

Write-Host "3️⃣  REGISTERING APPLICATION" -ForegroundColor Yellow
Write-Host "   App Name: $appName" -ForegroundColor White
Write-Host "   Redirect URIs: $($redirectUris -join ', ')" -ForegroundColor White
Write-Host ""

# Check if app already exists
$existingApp = az ad app list --display-name $appName --output json | ConvertFrom-Json

if ($existingApp -and $existingApp.Count -gt 0) {
    Write-Host "App '$appName' already exists!" -ForegroundColor Yellow
    Write-Host ""
    $useExisting = Read-Host "Use existing app? (yes/no)"

    if ($useExisting -eq "yes") {
        $appId = $existingApp[0].appId
        Write-Host "✅ Using existing app ID: $appId" -ForegroundColor Green
    } else {
        Write-Host "Creating new app with unique name..." -ForegroundColor White
        $timestamp = Get-Date -Format "yyyyMMddHHmmss"
        $appName = "QPerform Web App $timestamp"
    }
}

if (-not $appId) {
    Write-Host "Creating new app registration..." -ForegroundColor Cyan

    # Create the app registration with SPA platform
    $app = az ad app create `
        --display-name $appName `
        --sign-in-audience AzureADMyOrg `
        --web-redirect-uris $redirectUris[0] $redirectUris[1] `
        --enable-id-token-issuance true `
        --output json | ConvertFrom-Json

    $appId = $app.appId

    if (-not $appId) {
        Write-Host "❌ Failed to create app registration!" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit
    }

    Write-Host "✅ App registered successfully!" -ForegroundColor Green
    Write-Host "   App ID: $appId" -ForegroundColor Cyan
    Write-Host ""

    # Wait a moment for Azure AD to propagate
    Write-Host "⏳ Waiting for Azure AD to propagate changes..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}

# Configure API permissions (User.Read)
Write-Host "4️⃣  CONFIGURING API PERMISSIONS" -ForegroundColor Yellow
Write-Host "   Adding Microsoft Graph - User.Read permission..." -ForegroundColor White

try {
    # Microsoft Graph App ID
    $graphAppId = "00000003-0000-0000-c000-000000000000"
    # User.Read permission ID
    $userReadPermissionId = "e1fe6dd8-ba31-4d61-89e7-88639da4683d"

    az ad app permission add `
        --id $appId `
        --api $graphAppId `
        --api-permissions "$userReadPermissionId=Scope" `
        --output none 2>$null

    Write-Host "✅ Permissions configured" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Permission may already be configured" -ForegroundColor Yellow
}
Write-Host ""

# Update .env file
Write-Host "5️⃣  UPDATING CONFIGURATION FILES" -ForegroundColor Yellow

$envPath = "C:\qperform_dev\.env"
$envProductionPath = "C:\qperform_dev\.env.production"

# Update .env
if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw
    $envContent = $envContent -replace 'VITE_AZURE_CLIENT_ID=.*', "VITE_AZURE_CLIENT_ID=$appId"
    $envContent = $envContent -replace 'VITE_AZURE_TENANT_ID=.*', "VITE_AZURE_TENANT_ID=$tenantId"
    Set-Content -Path $envPath -Value $envContent
    Write-Host "   ✅ Updated .env" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  .env file not found at $envPath" -ForegroundColor Yellow
}

# Update .env.production
if (Test-Path $envProductionPath) {
    $envProdContent = Get-Content $envProductionPath -Raw
    $envProdContent = $envProdContent -replace 'VITE_AZURE_CLIENT_ID=.*', "VITE_AZURE_CLIENT_ID=$appId"
    $envProdContent = $envProdContent -replace 'VITE_AZURE_TENANT_ID=.*', "VITE_AZURE_TENANT_ID=$tenantId"
    Set-Content -Path $envProductionPath -Value $envProdContent
    Write-Host "   ✅ Updated .env.production" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  .env.production file not found at $envProductionPath" -ForegroundColor Yellow
}

Write-Host ""

# Summary
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   ✅ SETUP COMPLETE!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 CONFIGURATION SUMMARY:" -ForegroundColor Yellow
Write-Host "   App Name: $appName" -ForegroundColor White
Write-Host "   Application (Client) ID: $appId" -ForegroundColor White
Write-Host "   Directory (Tenant) ID: $tenantId" -ForegroundColor White
Write-Host "   Redirect URIs: $($redirectUris -join ', ')" -ForegroundColor White
Write-Host ""
Write-Host "✅ Configuration files have been updated!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "   1. Test locally:" -ForegroundColor White
Write-Host "      cd C:\qperform_dev" -ForegroundColor Cyan
Write-Host "      npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "   2. Open browser to: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "   3. Click 'Enter Dashboard' to test Microsoft login" -ForegroundColor White
Write-Host ""
Write-Host "📝 IMPORTANT NOTES:" -ForegroundColor Yellow
Write-Host "   • Your organization may require admin consent for the app" -ForegroundColor White
Write-Host "   • Contact your Azure AD admin if you see consent errors" -ForegroundColor White
Write-Host "   • Add production URL as redirect URI after deployment" -ForegroundColor White
Write-Host ""
Write-Host "MANAGE YOUR APP:" -ForegroundColor Yellow
Write-Host "   Azure Portal: https://portal.azure.com" -ForegroundColor Cyan
Write-Host "   Navigate to: Azure Active Directory -> App registrations -> $appName" -ForegroundColor White
Write-Host ""
$null = Read-Host "Press Enter to exit"
