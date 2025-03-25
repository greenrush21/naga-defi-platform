# Docker API Connection Test Script (PowerShell)
# This script tests the connection to the Docker Engine API

# Default Docker API settings
$dockerHost = "localhost"
$dockerPort = 2375
$dockerApiVersion = "v1.41"

# Construct API URL
$apiUrl = "http://${dockerHost}:${dockerPort}/${dockerApiVersion}/_ping"

Write-Host "Testing connection to Docker Engine API at $apiUrl..."

try {
    # Make the request to the Docker API ping endpoint
    $response = Invoke-WebRequest -Uri $apiUrl -Method GET -UseBasicParsing
    
    # Check if the response is successful
    if ($response.StatusCode -eq 200) {
        Write-Host "SUCCESS: Docker API is accessible" -ForegroundColor Green
        Write-Host "Response: $($response.Content)"
        
        # Get Docker version information
        $versionUrl = "http://${dockerHost}:${dockerPort}/${dockerApiVersion}/version"
        $versionResponse = Invoke-WebRequest -Uri $versionUrl -Method GET -UseBasicParsing
        $versionInfo = ConvertFrom-Json $versionResponse.Content
        
        Write-Host "`nDocker Version Information:" -ForegroundColor Cyan
        Write-Host "  Version:    $($versionInfo.Version)"
        Write-Host "  API Version: $($versionInfo.ApiVersion)"
        Write-Host "  Go Version:  $($versionInfo.GoVersion)"
        Write-Host "  OS:          $($versionInfo.Os) $($versionInfo.Arch)"
        Write-Host "  Kernel:      $($versionInfo.KernelVersion)"
    } else {
        Write-Host "ERROR: Unexpected response code: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "ERROR: Failed to connect to Docker API" -ForegroundColor Red
    Write-Host "$($_.Exception.Message)" -ForegroundColor Red
    
    Write-Host "`nPossible causes:" -ForegroundColor Yellow
    Write-Host "1. Docker service is not running"
    Write-Host "2. Docker API is not exposed on TCP port 2375"
    Write-Host "3. Firewall is blocking the connection"
    
    Write-Host "`nVerification steps:" -ForegroundColor Yellow
    Write-Host "1. Check if Docker is running using 'docker version'"
    Write-Host "2. Ensure 'Expose daemon on tcp://localhost:2375 without TLS' is enabled in Docker Desktop settings"
    Write-Host "3. After changing settings, restart Docker Desktop"
}

Write-Host "`nPress Enter to exit..."
$Host.UI.ReadLine()