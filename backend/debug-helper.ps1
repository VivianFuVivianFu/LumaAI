# Luma Backend - Quick Debugging Helper Script (PowerShell)
# Usage: .\debug-helper.ps1 [command]

param(
    [Parameter(Position=0)]
    [string]$Command = "menu"
)

$ErrorActionPreference = "Continue"

# Colors
function Write-Success { param($message) Write-Host $message -ForegroundColor Green }
function Write-Warning { param($message) Write-Host $message -ForegroundColor Yellow }
function Write-Error { param($message) Write-Host $message -ForegroundColor Red }
function Write-Info { param($message) Write-Host $message -ForegroundColor Cyan }

Write-Host "╔═══════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║   Luma Debug Helper (PowerShell)      ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

# Function to check health
function Check-Health {
    Write-Warning "Checking backend health..."
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:4000/api/v1/health" -Method Get
        $response | ConvertTo-Json -Depth 10
        Write-Success "✓ Backend is healthy"
    }
    catch {
        Write-Error "✗ Backend health check failed: $_"
    }
}

# Function to check for common issues
function Check-Issues {
    Write-Warning "Scanning for common issues..."
    Write-Host ""

    Write-Warning "1. Checking for deprecated methods..."
    Get-ChildItem -Path "src" -Recurse -Filter "*.ts" | Select-String "@deprecated" | Select-Object -First 5

    Write-Host ""
    Write-Warning "2. Checking for TODO items..."
    Get-ChildItem -Path "src" -Recurse -Filter "*.ts" | Select-String "TODO|FIXME" | Select-Object -First 10

    Write-Host ""
    Write-Warning "3. Checking for type safety issues..."
    $typeIssues = Get-ChildItem -Path "src" -Recurse -Filter "*.ts" | Select-String "as any|@ts-ignore"
    Write-Host "$($typeIssues.Count) type safety violations found"

    Write-Host ""
    Write-Warning "4. Recent files changed:"
    Get-ChildItem -Path "src" -Recurse -Filter "*.ts" | Sort-Object LastWriteTime -Descending | Select-Object -First 5 | ForEach-Object {
        Write-Host "  $($_.Name) - Modified: $($_.LastWriteTime)"
    }
}

# Function to check logs
function Check-Logs {
    Write-Warning "Recent error logs:"
    if (Test-Path "logs\error.log") {
        Get-Content "logs\error.log" -Tail 20
    }
    else {
        Write-Host "No error log found"
    }
}

# Function to check ports
function Check-Ports {
    Write-Warning "Checking port status..."

    Write-Host ""
    Write-Host "Port 4000 (Backend):"
    $port4000 = Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue
    if ($port4000) {
        Write-Success "✓ Port 4000 is in use (PID: $($port4000.OwningProcess))"
    }
    else {
        Write-Error "✗ Port 4000 is not in use"
    }

    Write-Host ""
    Write-Host "Port 3000 (Frontend):"
    $port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
    if ($port3000) {
        Write-Success "✓ Port 3000 is in use (PID: $($port3000.OwningProcess))"
    }
    else {
        Write-Error "✗ Port 3000 is not in use"
    }
}

# Function to verify environment
function Check-Env {
    Write-Warning "Checking environment configuration..."

    if (Test-Path ".env.development") {
        Write-Success "✓ .env.development exists"

        # Read and check critical variables
        $envContent = Get-Content ".env.development"

        $hasOpenAI = $envContent | Select-String "OPENAI_API_KEY=" | Where-Object { $_ -notmatch "^#" }
        $hasSupabase = $envContent | Select-String "SUPABASE_URL=" | Where-Object { $_ -notmatch "^#" }
        $hasLangfuse = $envContent | Select-String "LANGFUSE_SECRET_KEY=" | Where-Object { $_ -notmatch "^#" }

        if ($hasOpenAI) { Write-Success "✓ OPENAI_API_KEY set" } else { Write-Error "✗ OPENAI_API_KEY missing" }
        if ($hasSupabase) { Write-Success "✓ SUPABASE_URL set" } else { Write-Error "✗ SUPABASE_URL missing" }
        if ($hasLangfuse) { Write-Success "✓ LANGFUSE_SECRET_KEY set" } else { Write-Error "✗ LANGFUSE_SECRET_KEY missing" }
    }
    else {
        Write-Error "✗ .env.development not found"
    }
}

# Function to test critical endpoints
function Test-Endpoints {
    Write-Warning "Testing critical endpoints..."

    # Test login
    Write-Host "Testing login..."
    try {
        $loginBody = @{
            email = "vivianfu2020@gmail.com"
            password = "shuwei1984"
        } | ConvertTo-Json

        $loginResponse = Invoke-RestMethod -Uri "http://localhost:4000/api/v1/auth/login" -Method Post -Body $loginBody -ContentType "application/json"

        if ($loginResponse.success) {
            Write-Success "✓ Login successful"
            $token = $loginResponse.data.session.access_token

            # Test chat endpoints
            Write-Host "Testing chat endpoints..."
            $chatResponse = Invoke-RestMethod -Uri "http://localhost:4000/api/v1/chat" -Method Get -Headers @{Authorization = "Bearer $token"}
            if ($chatResponse) { Write-Success "✓ Chat endpoints working" }

            # Test goals endpoints
            Write-Host "Testing goals endpoints..."
            $goalsResponse = Invoke-RestMethod -Uri "http://localhost:4000/api/v1/goals" -Method Get -Headers @{Authorization = "Bearer $token"}
            if ($goalsResponse) { Write-Success "✓ Goals endpoints working" }
        }
    }
    catch {
        Write-Error "✗ Endpoint test failed: $_"
    }
}

# Function to run quick tests
function Quick-Test {
    Write-Warning "Running quick validation tests..."

    # Test TypeScript compilation
    Write-Host "1. Testing TypeScript compilation..."
    try {
        npm run build
        Write-Success "✓ Build successful"
    }
    catch {
        Write-Error "✗ Build failed"
    }

    # Check for node_modules
    Write-Host ""
    Write-Host "2. Checking dependencies..."
    if (Test-Path "node_modules") {
        Write-Success "✓ Dependencies installed"
    }
    else {
        Write-Error "✗ Dependencies missing - run 'npm install'"
    }
}

# Function to show system info
function Show-SystemInfo {
    Write-Warning "System Information:"
    Write-Host ""
    Write-Host "Node Version: $(node --version)"
    Write-Host "NPM Version: $(npm --version)"
    Write-Host "TypeScript Version: $(npx tsc --version)"
    Write-Host "Working Directory: $(Get-Location)"
    Write-Host ""
}

# Main menu
switch ($Command) {
    "health" {
        Check-Health
    }
    "issues" {
        Check-Issues
    }
    "test" {
        Test-Endpoints
    }
    "logs" {
        Check-Logs
    }
    "ports" {
        Check-Ports
    }
    "env" {
        Check-Env
    }
    "quick" {
        Quick-Test
    }
    "info" {
        Show-SystemInfo
    }
    "all" {
        Show-SystemInfo
        Write-Host ""
        Check-Health
        Write-Host ""
        Check-Issues
        Write-Host ""
        Check-Env
        Write-Host ""
        Check-Ports
    }
    default {
        Write-Host "Usage: .\debug-helper.ps1 [command]" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Commands:" -ForegroundColor Yellow
        Write-Host "  health  - Check backend health endpoint"
        Write-Host "  issues  - Scan for code issues"
        Write-Host "  test    - Test critical API endpoints"
        Write-Host "  logs    - Show recent error logs"
        Write-Host "  ports   - Check port usage"
        Write-Host "  env     - Verify environment variables"
        Write-Host "  quick   - Run quick validation tests"
        Write-Host "  info    - Show system information"
        Write-Host "  all     - Run all checks"
        Write-Host ""
        Write-Host "Example: .\debug-helper.ps1 health" -ForegroundColor Gray
        exit 1
    }
}

Write-Host ""
Write-Success "Done!"
