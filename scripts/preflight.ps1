. "$PSScriptRoot\Tend.Toolchain.ps1"
$failures = [System.Collections.Generic.List[string]]::new()
function Check($condition, $success, $failure) {
  if ($condition) { Write-Host "PASS  $success" } else { Write-Host "FAIL  $failure"; $failures.Add($failure) }
}

Push-Location $RepoRoot
try {
  $insideGit = (& git -c "safe.directory=$RepoRoot" rev-parse --is-inside-work-tree 2>$null) -eq 'true'
  Check $insideGit 'Git repository detected.' 'This directory is not a Git repository.'
  if ($insideGit) {
    $status = & git -c "safe.directory=$RepoRoot" status --porcelain
    Check ([string]::IsNullOrWhiteSpace(($status -join ''))) 'Git working tree is clean.' 'Git working tree is dirty; commit, stash, or discard intentional changes before building.'
  }
  $pathLength = $RepoRoot.Length
  Check ($pathLength -le 80) "Project path is short ($pathLength characters): $RepoRoot" "Project path is $pathLength characters; move the canonical checkout to a shorter path before native builds."
  Check ((Test-Path 'package.json') -and (Test-Path 'package-lock.json') -and (Test-Path 'app.json')) 'Required project and lock files are present.' 'package.json, package-lock.json, or app.json is missing.'
  Check (Test-Path 'node_modules\expo\package.json') 'Dependencies are installed.' 'Dependencies are absent or incomplete; run npm ci.'
  $nodeVersion = (& node --version 2>$null).Trim()
  Check ($nodeVersion -eq 'v24.18.0') "Node $nodeVersion matches the validated version." "Node $nodeVersion is not the validated version v24.18.0; install/select it before a reproducibility build."
  $npmVersion = (& npm --version 2>$null).Trim()
  Check ($npmVersion -eq '11.16.0') "npm $npmVersion matches the validated version." "npm $npmVersion is not the validated version 11.16.0; install/select it before a reproducibility build."
  try {
    $jdk = Get-TendJavaHome
    $javaVersion = (& (Join-Path $jdk 'bin\java.exe') --version | Select-Object -First 1)
    Write-Host "PASS  JDK 17: $javaVersion ($jdk)"
    Write-Host "INFO  JAVA_HOME: $($env:JAVA_HOME)"
  } catch { $failures.Add($_.Exception.Message); Write-Host "FAIL  $($_.Exception.Message)" }
  try {
    $sdk = Get-TendAndroidSdk
    Write-Host "PASS  Android SDK: $sdk"
    Write-Host "INFO  ANDROID_HOME: $($env:ANDROID_HOME)"
    Write-Host "INFO  ANDROID_SDK_ROOT: $($env:ANDROID_SDK_ROOT)"
    $devices = @(Get-TendConnectedDevices)
    Check ($devices.Count -gt 0) "ADB available; connected device(s): $($devices -join ', ')" "ADB is available but no authorized Android device is connected."
  } catch { $failures.Add($_.Exception.Message); Write-Host "FAIL  $($_.Exception.Message)" }
  Check (Test-Path 'android\gradlew.bat') 'Generated Android Gradle wrapper is present.' 'Generated Android files are absent; run npm run android:prepare.'
  if ($failures.Count -eq 0) {
    try {
      Use-TendBuildEnvironment
      & .\android\gradlew.bat help --no-daemon --console=plain
      if ($LASTEXITCODE -ne 0) { throw "Gradle could not load the Android project (exit code $LASTEXITCODE)." }
      Write-Host 'PASS  Gradle loaded the Android project.'
    } catch { $failures.Add($_.Exception.Message); Write-Host "FAIL  $($_.Exception.Message)" }
  } else { Write-Host 'SKIP  Gradle load because prerequisite checks failed.' }
} finally { Pop-Location }
if ($failures.Count -gt 0) { Write-Host "Preflight failed with $($failures.Count) issue(s). No repair was attempted."; exit 1 }
Write-Host 'Preflight passed.'
