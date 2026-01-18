<#
Usage (PowerShell as Administrator):
  $env:REPO_URL = 'https://github.com/OWNER/REPO'
  $env:RUNNER_TOKEN = '<registration-token>'
  $env:RUNNER_NAME = 'windows-runner'
  .\scripts\setup-self-hosted-runner.ps1
#>
param()
Set-StrictMode -Version Latest

$repoUrl = $env:REPO_URL
$token = $env:RUNNER_TOKEN
$runnerName = $env:RUNNER_NAME
$workDir = $env:WORKDIR
if (-not $workDir) { $workDir = "C:\actions-runner" }

if (-not $repoUrl -or -not $token) {
    Write-Error "REPO_URL and RUNNER_TOKEN environment variables must be set. See .github/SELF_HOSTED_RUNNER.md"
    exit 1
}

New-Item -ItemType Directory -Force -Path $workDir | Out-Null
Set-Location $workDir

Write-Output "Fetching latest GitHub Actions Runner release info..."
$release = Invoke-RestMethod -Uri https://api.github.com/repos/actions/runner/releases/latest
$asset = $release.assets | Where-Object { $_.name -match 'windows-x64' } | Select-Object -First 1
if (-not $asset) { Write-Error "Could not find windows-x64 runner asset."; exit 1 }

$zipUrl = $asset.browser_download_url
Write-Output "Downloading: $zipUrl"

$zipPath = Join-Path $workDir actions-runner.zip
Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath -UseBasicParsing
Expand-Archive -Path $zipPath -DestinationPath $workDir -Force
Remove-Item $zipPath

Write-Output "Configuring runner"
& .\config.cmd --unattended --url $repoUrl --token $token --name $runnerName

Write-Output "Installing service"
& .\svc.sh install
& .\svc.sh start

Write-Output "Runner installed and started. Check repository Settings → Actions → Runners."
