. "$PSScriptRoot\Tend.Toolchain.ps1"
Push-Location $RepoRoot
try {
  if (-not (Test-Path -LiteralPath 'android\gradlew.bat')) { throw 'Generated Android files are absent. Run npm run android:prepare first.' }
  Use-TendBuildEnvironment
  Push-Location 'android'
  & .\gradlew.bat :app:assembleRelease --no-daemon --console=plain
  if ($LASTEXITCODE -ne 0) { throw "Android release build failed with exit code $LASTEXITCODE." }
  Pop-Location
  $apk = 'android\app\build\outputs\apk\release\app-release.apk'
  if (-not (Test-Path -LiteralPath $apk)) { throw "Gradle reported success but did not produce $apk." }
  Write-Host "Android release APK: $(Resolve-Path $apk)"
} finally { Pop-Location }
