# PowerShell script to start the development server
# This script adds Node.js to PATH and starts the dev server
# Usage: .\start-dev.ps1

Write-Host "Starting development server..." -ForegroundColor Green

# Add Node.js to PATH
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH

# Check if node is available
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Cyan
} catch {
    Write-Host "Error: Node.js not found in C:\Program Files\nodejs" -ForegroundColor Red
    exit 1
}

# Start the dev server
Write-Host "Starting Vite dev server..." -ForegroundColor Yellow
npm run dev
