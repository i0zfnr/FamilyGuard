# Test execution script for XennGuard Windows Agent
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $scriptDir

$testExe = Join-Path $scriptDir "bin\XennGuardAgentTests.exe"
if (-not (Test-Path $testExe)) {
    Write-Host "Test executable not found, running build.ps1 first..."
    & "$scriptDir\build.ps1"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Build failed."
        exit $LASTEXITCODE
    }
}

Write-Host "Executing XennGuard Windows Agent Test Runner..."
& $testExe
exit $LASTEXITCODE
