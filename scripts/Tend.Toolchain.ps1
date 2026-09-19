Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$script:RepoRoot = Split-Path -Parent $PSScriptRoot
$script:KnownJdkHome = 'C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot'
$script:KnownAndroidSdk = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
$script:PackageName = 'com.vibhavagarwal.tend'

function Get-TendJavaHome {
  $candidates = @()
  if ($env:JAVA_HOME) { $candidates += $env:JAVA_HOME }
  $candidates += $script:KnownJdkHome
  foreach ($candidate in ($candidates | Select-Object -Unique)) {
    $java = Join-Path $candidate 'bin\java.exe'
    if (-not (Test-Path -LiteralPath $java)) { continue }
    $versionText = (& $java --version | Out-String)
    if ($versionText -match '17\.') { return $candidate }
  }
  throw "JDK 17 was not found. Set JAVA_HOME to a JDK 17 installation or install the validated Temurin JDK at '$script:KnownJdkHome'. Do not use Android Studio's Java 25 runtime."
}

function Get-TendAndroidSdk {
  $candidates = @()
  if ($env:ANDROID_HOME) { $candidates += $env:ANDROID_HOME }
  if ($env:ANDROID_SDK_ROOT) { $candidates += $env:ANDROID_SDK_ROOT }
  $candidates += $script:KnownAndroidSdk
  foreach ($candidate in ($candidates | Select-Object -Unique)) {
    if (Test-Path -LiteralPath (Join-Path $candidate 'platform-tools\adb.exe')) { return $candidate }
  }
  throw "Android SDK platform-tools (adb.exe) was not found. Set ANDROID_HOME or ANDROID_SDK_ROOT to an SDK containing platform-tools, or install it at '$script:KnownAndroidSdk'."
}

function Get-TendAdb { return Join-Path (Get-TendAndroidSdk) 'platform-tools\adb.exe' }

function Use-TendBuildEnvironment {
  $env:JAVA_HOME = Get-TendJavaHome
  $env:ANDROID_HOME = Get-TendAndroidSdk
  $env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
}

function Get-TendConnectedDevices {
  $adb = Get-TendAdb
  $lines = & $adb devices 2>&1
  if ($LASTEXITCODE -ne 0) { throw "ADB could not list devices: $($lines -join ' ')" }
  return @($lines | Where-Object { $_ -match '^\S+\s+device$' } | ForEach-Object { ($_ -split '\s+')[0] })
}
