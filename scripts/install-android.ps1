param([string]$Serial)
. "$PSScriptRoot\Tend.Toolchain.ps1"
Push-Location $RepoRoot
try {
  $apk = Resolve-Path 'android\app\build\outputs\apk\debug\app-debug.apk' -ErrorAction SilentlyContinue
  if (-not $apk) { throw 'Debug APK is absent. Run npm run android:build first.' }
  $devices = @(Get-TendConnectedDevices)
  if ($Serial) {
    if ($devices -notcontains $Serial) { throw "Requested device '$Serial' is not an authorized connected device." }
  } elseif ($devices.Count -eq 1) { $Serial = $devices[0] } else { throw "Expected exactly one authorized Android device, found $($devices.Count). Re-run with -Serial <device-id>." }
  $adb = Get-TendAdb
  & $adb -s $Serial install -r $apk.Path
  if ($LASTEXITCODE -ne 0) { throw "ADB install failed with exit code $LASTEXITCODE." }
  $packagePath = & $adb -s $Serial shell pm path $PackageName
  if ($LASTEXITCODE -ne 0 -or -not ($packagePath -match '^package:')) { throw "Installed-package verification failed for $PackageName." }
  Write-Host "Installed and verified $PackageName on ${Serial}: $packagePath"
} finally { Pop-Location }
