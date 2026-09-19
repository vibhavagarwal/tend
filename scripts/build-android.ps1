. "$PSScriptRoot\Tend.Toolchain.ps1"
Push-Location $RepoRoot
try {
  if (-not (Test-Path -LiteralPath 'android\gradlew.bat')) { throw 'Generated Android files are absent. Run npm run android:prepare first.' }
  Use-TendBuildEnvironment
  & .\android\gradlew.bat :app:assembleDebug --no-daemon --console=plain
  if ($LASTEXITCODE -ne 0) { throw "Android debug build failed with exit code $LASTEXITCODE." }
  $apk = 'android\app\build\outputs\apk\debug\app-debug.apk'
  if (-not (Test-Path -LiteralPath $apk)) { throw "Gradle reported success but did not produce $apk." }
  Write-Host "Android debug APK: $(Resolve-Path $apk)"
} finally { Pop-Location }
