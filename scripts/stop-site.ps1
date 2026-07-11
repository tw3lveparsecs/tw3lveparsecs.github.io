#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Stops and tears down the local Jekyll blog container started with wslc.

.DESCRIPTION
    - Stops the 'jekyll-blog' container (if running).
    - Removes the container.
    - With -RemoveImage, also removes the built 'jekyll-blog' image.

.EXAMPLE
    ./scripts/stop-site.ps1
    ./scripts/stop-site.ps1 -RemoveImage   # also delete the built image
#>

[CmdletBinding()]
param(
    [string]$ImageName = 'jekyll-blog',
    [string]$ContainerName = 'jekyll-blog',
    [switch]$RemoveImage
)

$ErrorActionPreference = 'Stop'

if (-not (Get-Command wslc -ErrorAction SilentlyContinue)) {
    throw "wslc (WSL Container CLI) was not found on PATH. Install/enable it and try again."
}

$existing = (wslc list --all 2>$null) | Select-String -SimpleMatch $ContainerName

if ($existing) {
    Write-Host "Stopping container '$ContainerName'..." -ForegroundColor Cyan
    wslc stop $ContainerName 2>$null | Out-Null

    Write-Host "Removing container '$ContainerName'..." -ForegroundColor Cyan
    wslc remove $ContainerName 2>$null | Out-Null
}
else {
    Write-Host "No container named '$ContainerName' found. Nothing to stop." -ForegroundColor Yellow
}

if ($RemoveImage) {
    Write-Host "Removing image '$ImageName'..." -ForegroundColor Cyan
    wslc rmi $ImageName 2>$null | Out-Null
}

Write-Host ""
Write-Host "Teardown complete." -ForegroundColor Green
