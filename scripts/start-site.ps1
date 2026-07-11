#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Builds and starts the Jekyll blog locally using wslc (WSL Container CLI).

.DESCRIPTION
    - Builds the image from the repo Dockerfile (tagged 'jekyll-blog').
    - Creates and starts a detached container named 'jekyll-blog'.
    - Maps host port 4000 -> container port 4000.
    - Bind-mounts the repo root into /srv/jekyll for live editing.
    If the container already exists it is (re)started instead of recreated.

.EXAMPLE
    ./scripts/start-site.ps1
    ./scripts/start-site.ps1 -Rebuild   # force image rebuild
#>

[CmdletBinding()]
param(
    [string]$ImageName = 'jekyll-blog',
    [string]$ContainerName = 'jekyll-blog',
    [int]$Port = 4000,
    [switch]$Rebuild
)

$ErrorActionPreference = 'Stop'

# Repo root = parent of this script's folder.
$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

if (-not (Get-Command wslc -ErrorAction SilentlyContinue)) {
    throw "wslc (WSL Container CLI) was not found on PATH. Install/enable it and try again."
}

# If a container with this name already exists, just start it (unless -Rebuild).
$existing = (wslc list --all 2>$null) | Select-String -SimpleMatch $ContainerName

if ($existing -and -not $Rebuild) {
    Write-Host "Container '$ContainerName' already exists. Starting it..." -ForegroundColor Cyan
    wslc start $ContainerName
}
else {
    if ($existing) {
        Write-Host "Rebuild requested. Removing existing container '$ContainerName'..." -ForegroundColor Yellow
        wslc stop $ContainerName 2>$null | Out-Null
        wslc remove $ContainerName 2>$null | Out-Null
    }

    Write-Host "Building image '$ImageName' from Dockerfile..." -ForegroundColor Cyan
    wslc build -t $ImageName .

    Write-Host "Starting container '$ContainerName' on port $Port..." -ForegroundColor Cyan
    wslc run -d --name $ContainerName -p "$($Port):4000" -v "$($RepoRoot):/srv/jekyll" $ImageName
}

Write-Host ""
Write-Host "Site starting at http://localhost:$Port" -ForegroundColor Green
Write-Host "Stop/tear down:  ./scripts/stop-site.ps1" -ForegroundColor DarkGray

Write-Host ""
Write-Host "Following logs (Ctrl+C to stop following; container keeps running)..." -ForegroundColor Cyan
wslc logs jekyll-blog -f
