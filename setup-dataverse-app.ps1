# PowerShell Script to Register Azure AD App for Dataverse Authentication
# Run this script to automatically create an Azure AD App Registration for QPerform

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   QPerform - Dataverse App Registration Setup" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Azure CLI is installed
$azureCliInstalled = Get-Command az -ErrorAction SilentlyContinue

if (-not $azureCliInstalled) {
    Write-Host "ERROR: Azure CLI is not installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Azure CLI from:" -ForegroundColor Yellow
    Write-Host "https://learn.microsoft.com/en-us/cli/azure/install-azure-cli-windows" -ForegroundColor Cyan
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Login to Azure
Write-Host "Step 1: Azure Login" -ForegroundColor Yellow
Write-Host "------------------------------" -ForegroundColor Gray
Write-Host ""

$loginResult = az account show 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Host "You need to log in to Azure..." -ForegroundColor Yellow
    az login --allow-no-subscriptions

    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "ERROR: Azure login failed" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

$accountInfo = az account show | ConvertFrom-Json
Write-Host "Logged in as: $($accountInfo.user.name)" -ForegroundColor Green
Write-Host "Tenant: $($accountInfo.tenantId)" -ForegroundColor Green
Write-Host ""

# App configuration
$appName = "QPerform Dataverse App"
$redirectUris = @(
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174"
)

Write-Host "Step 2: Creating Azure AD App Registration" -ForegroundColor Yellow
Write-Host "------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "App Name: $appName" -ForegroundColor White
Write-Host ""

# Check if app already exists
$existingApp = az ad app list --display-name $appName | ConvertFrom-Json

if ($existingApp.Length -gt 0) {
    Write-Host "WARNING: An app with name '$appName' already exists" -ForegroundColor Yellow
    Write-Host ""
    $overwrite = Read-Host "Do you want to delete and recreate it? (y/N)"

    if ($overwrite -eq 'y' -or $overwrite -eq 'Y') {
        Write-Host "Deleting existing app..." -ForegroundColor Yellow
        az ad app delete --id $existingApp[0].appId
        Write-Host "Existing app deleted" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "Using existing app registration..." -ForegroundColor Cyan
        $appId = $existingApp[0].appId
        $objectId = $existingApp[0].id
    }
}

# Create new app if needed
if (-not $appId) {
    Write-Host "Creating new Azure AD App Registration..." -ForegroundColor Yellow

    # Create the app registration
    $app = az ad app create `
        --display-name $appName `
        --sign-in-audience "AzureADMyOrg" `
        --web-redirect-uris $redirectUris `
        --enable-access-token-issuance $true `
        --enable-id-token-issuance $true | ConvertFrom-Json

    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "ERROR: Failed to create app registration" -ForegroundColor Red
        Write-Host ""
        Write-Host "You may not have permissions to register apps in Azure AD" -ForegroundColor Yellow
        Write-Host "Please contact your Azure AD administrator" -ForegroundColor Yellow
        Write-Host ""
        Read-Host "Press Enter to exit"
        exit 1
    }

    $appId = $app.appId
    $objectId = $app.id

    Write-Host "App created successfully!" -ForegroundColor Green
    Write-Host ""
}

Write-Host "App ID: $appId" -ForegroundColor Cyan
Write-Host "Object ID: $objectId" -ForegroundColor Cyan
Write-Host ""

# Step 3: Configure API permissions for Dataverse
Write-Host "Step 3: Configuring Dataverse API Permissions" -ForegroundColor Yellow
Write-Host "------------------------------" -ForegroundColor Gray
Write-Host ""

# Dynamics CRM (Dataverse) Resource ID: 00000007-0000-0000-c000-000000000000
# user_impersonation permission ID: 78ce3f0f-a1ce-49c2-8cde-64b5c0896db4

Write-Host "Adding Dynamics CRM (Dataverse) API permissions..." -ForegroundColor White

$permissionAdded = az ad app permission add `
    --id $appId `
    --api "00000007-0000-0000-c000-000000000000" `
    --api-permissions "78ce3f0f-a1ce-49c2-8cde-64b5c0896db4=Scope" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "Dataverse permissions added successfully!" -ForegroundColor Green
} else {
    Write-Host "WARNING: Could not add permissions automatically" -ForegroundColor Yellow
    Write-Host "You may need to add them manually in Azure Portal" -ForegroundColor Yellow
}

Write-Host ""

# Grant admin consent
Write-Host "Step 4: Granting Admin Consent" -ForegroundColor Yellow
Write-Host "------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "Attempting to grant admin consent for API permissions..." -ForegroundColor White

$consentResult = az ad app permission admin-consent --id $appId 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "Admin consent granted successfully!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "WARNING: Could not grant admin consent automatically" -ForegroundColor Yellow
    Write-Host "You may not have admin permissions" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please ask your Azure AD administrator to:" -ForegroundColor Yellow
    Write-Host "  1. Go to Azure Portal -> Azure Active Directory" -ForegroundColor White
    Write-Host "  2. Navigate to App registrations -> $appName" -ForegroundColor White
    Write-Host "  3. Go to API permissions" -ForegroundColor White
    Write-Host "  4. Click 'Grant admin consent for [Your Organization]'" -ForegroundColor White
}

Write-Host ""

# Step 5: Update .env file
Write-Host "Step 5: Updating .env Configuration" -ForegroundColor Yellow
Write-Host "------------------------------" -ForegroundColor Gray
Write-Host ""

$tenantId = $accountInfo.tenantId
$envPath = ".env"

if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw

    # Update VITE_DATAVERSE_CLIENT_ID
    if ($envContent -match "VITE_DATAVERSE_CLIENT_ID=.*") {
        $envContent = $envContent -replace "VITE_DATAVERSE_CLIENT_ID=.*", "VITE_DATAVERSE_CLIENT_ID=$appId"
    } else {
        $envContent += "`nVITE_DATAVERSE_CLIENT_ID=$appId"
    }

    # Update VITE_DATAVERSE_TENANT_ID
    if ($envContent -match "VITE_DATAVERSE_TENANT_ID=.*") {
        $envContent = $envContent -replace "VITE_DATAVERSE_TENANT_ID=.*", "VITE_DATAVERSE_TENANT_ID=$tenantId"
    } else {
        $envContent += "`nVITE_DATAVERSE_TENANT_ID=$tenantId"
    }

    Set-Content -Path $envPath -Value $envContent

    Write-Host ".env file updated successfully!" -ForegroundColor Green
} else {
    Write-Host "WARNING: .env file not found" -ForegroundColor Yellow
    Write-Host "Please create .env file with the following values:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "VITE_DATAVERSE_CLIENT_ID=$appId" -ForegroundColor Cyan
    Write-Host "VITE_DATAVERSE_TENANT_ID=$tenantId" -ForegroundColor Cyan
}

Write-Host ""

# Summary
Write-Host "================================================================" -ForegroundColor Green
Write-Host "   Setup Complete!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "CONFIGURATION DETAILS:" -ForegroundColor Yellow
Write-Host "------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "App Name:        $appName" -ForegroundColor White
Write-Host "Application ID:  $appId" -ForegroundColor Cyan
Write-Host "Tenant ID:       $tenantId" -ForegroundColor Cyan
Write-Host "Dataverse URL:   https://orgdf3b8790.api.crm.dynamics.com/api/data/v9.2" -ForegroundColor Cyan
Write-Host ""
Write-Host "REDIRECT URIs CONFIGURED:" -ForegroundColor Yellow
foreach ($uri in $redirectUris) {
    Write-Host "  - $uri" -ForegroundColor White
}
Write-Host ""
Write-Host "API PERMISSIONS:" -ForegroundColor Yellow
Write-Host "  - Dynamics CRM / user_impersonation (Delegated)" -ForegroundColor White
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "   1. To enable real authentication, update .env:" -ForegroundColor White
Write-Host "      VITE_USE_MOCK_AUTH=false" -ForegroundColor Cyan
Write-Host ""
Write-Host "   2. Restart your development server:" -ForegroundColor White
Write-Host "      npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "   3. Test authentication by clicking 'Enter Dashboard'" -ForegroundColor White
Write-Host ""
Write-Host "   4. If you encounter permission errors:" -ForegroundColor White
Write-Host "      - Contact: ONQ.PowerBI.MIS@onqoc.com" -ForegroundColor Cyan
Write-Host "      - Or ask your Azure AD admin to grant consent" -ForegroundColor Cyan
Write-Host ""
Write-Host "MANAGE YOUR APP:" -ForegroundColor Yellow
Write-Host "   Azure Portal: https://portal.azure.com" -ForegroundColor Cyan
Write-Host "   Navigate to: Azure Active Directory -> App registrations -> $appName" -ForegroundColor White
Write-Host ""

$null = Read-Host "Press Enter to exit"
