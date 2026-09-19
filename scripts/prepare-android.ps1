. "$PSScriptRoot\Tend.Toolchain.ps1"
Push-Location $RepoRoot
try {
  if (-not (Test-Path -LiteralPath 'node_modules\expo\package.json')) { throw 'Dependencies are absent. Run npm ci before generating Android files.' }
  Use-TendBuildEnvironment
  & npx expo prebuild --platform android --no-install
  if ($LASTEXITCODE -ne 0) { throw "Expo prebuild failed with exit code $LASTEXITCODE." }
  Write-Host 'Generated ignored Android native files. Next run: npm run preflight'
} finally { Pop-Location }
