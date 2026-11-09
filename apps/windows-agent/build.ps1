# Build script for XennGuard Windows Agent
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $scriptDir

$csc = "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
if (-not (Test-Path $csc)) {
    Write-Error "C# compiler not found at $csc"
    exit 1
}

$binDir = Join-Path $scriptDir "bin"
if (-not (Test-Path $binDir)) {
    New-Item -ItemType Directory -Path $binDir -Force | Out-Null
}

$references = "System.dll,System.Core.dll,System.Security.dll,System.Windows.Forms.dll,System.Drawing.dll,System.Net.Http.dll"

Write-Host "Building XennGuardAgent.exe..."
$agentSources = (Get-ChildItem -Path "$scriptDir\src" -Filter "*.cs" -Recurse).FullName
$agentOut = Join-Path $binDir "XennGuardAgent.exe"

& $csc /nologo /target:exe /out:$agentOut /reference:$references $agentSources
if ($LASTEXITCODE -ne 0) {
    Write-Error "Compilation of XennGuardAgent.exe failed with code $LASTEXITCODE"
    exit $LASTEXITCODE
}
Write-Host "Successfully built: $agentOut"

Write-Host "Building XennGuardAgentTests.exe..."
$testSources = (Get-ChildItem -Path "$scriptDir\src" -Filter "*.cs" -Recurse | Where-Object { $_.Name -ne "Program.cs" }).FullName
$testSources += (Get-ChildItem -Path "$scriptDir\tests" -Filter "*.cs" -Recurse).FullName
$testsOut = Join-Path $binDir "XennGuardAgentTests.exe"

& $csc /nologo /target:exe /out:$testsOut /reference:$references $testSources
if ($LASTEXITCODE -ne 0) {
    Write-Error "Compilation of XennGuardAgentTests.exe failed with code $LASTEXITCODE"
    exit $LASTEXITCODE
}
Write-Host "Successfully built: $testsOut"
Write-Host "Windows Agent Build Completed Successfully."
exit 0
