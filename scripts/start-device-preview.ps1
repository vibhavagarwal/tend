param([string]$Serial)

. "$PSScriptRoot\Tend.Toolchain.ps1"
Push-Location $RepoRoot
try {
  $devices = @(Get-TendConnectedDevices)
  if ($Serial) {
    if ($devices -notcontains $Serial) { throw "Requested device '$Serial' is not an authorized connected device." }
  } elseif ($devices.Count -eq 1) {
    $Serial = $devices[0]
  } else {
    throw "Expected exactly one authorized Android device, found $($devices.Count). Re-run with -Serial <device-id>."
  }

  $adb = Get-TendAdb
  & $adb -s $Serial reverse tcp:8081 tcp:8081
  if ($LASTEXITCODE -ne 0) { throw "Could not forward Metro port 8081 to '$Serial'." }

  Write-Host "Fast preview ready for $Serial. Open the installed development build; edits to TypeScript, styles, and assets will refresh without Gradle."
  & npx expo start --dev-client --localhost
  if ($LASTEXITCODE -ne 0) { throw "Expo preview server exited with code $LASTEXITCODE." }
} finally { Pop-Location }
