# Tend

Tend is a calm, voice-first Android habit tracker. Habit Statements can be
spoken or typed, but every meaningful change is reviewed and explicitly
confirmed before it is saved. V1 data remains on the device.

See [the documentation guide](docs/README.md) for the authoritative product,
domain, decision, and approved Tend design references.

## Windows Android development

The canonical Tend checkout is `C:\dev\tend`. Keep it at this short path:
React Native CMake object paths can exceed the Windows 260-character limit in
a deeply nested workspace. `android/`, `.expo/`, `dist/`, and `node_modules/`
are generated and intentionally ignored; source history lives in Git.

The validated local toolchain is Node `24.18.0`, npm `11.16.0`, and Temurin
JDK 17 (validated with `17.0.20.1`). Expo SDK 54 / React Native 0.81.5 use the
committed `package-lock.json`; use `npm ci`, never a dependency upgrade, to
recreate dependencies. JDK 17 is mandatory for Gradle. Do not use Android
Studio's bundled Java 25 runtime.

The scripts use `JAVA_HOME` when it names a JDK 17 installation; otherwise
they discover the validated installation at
`C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot`. They similarly
use `ANDROID_HOME` or `ANDROID_SDK_ROOT`, then the standard per-user SDK path
`%LOCALAPPDATA%\Android\Sdk`. They only set these values in their own process
when invoking Gradle; they never alter global environment settings or `PATH`.

### Supported workflow

From PowerShell in `C:\dev\tend`:

```powershell
git switch develop
git pull --ff-only                 # only after a remote is deliberately configured
npm ci                             # first checkout, or after package-lock.json changes
npm run android:prepare            # generates ignored Android native files
npm run preflight                  # read-only checks, including Gradle project loading
npm test
npm run typecheck
npm run android:build              # produces android\app\build\outputs\apk\debug\app-debug.apk
npm run android:install            # installs/updates the connected Pixel and verifies the package
```

`npm run preflight` fails with an actionable message if the repository is
dirty, the path is too long, dependencies are absent, the JDK/SDK/ADB/device
is unavailable, or Gradle cannot load the generated Android project. It does
not repair any condition. Run `npm run android:prepare` after a fresh clone or
when Expo configuration/native dependencies change; it intentionally creates
only ignored generated files.

For a manual install, use the SDK-local ADB discovered by the scripts:

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" install -r .\android\app\build\outputs\apk\debug\app-debug.apk
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" shell pm path com.vibhavagarwal.tend
```

The project currently has no Git remote. Add one only when a reviewed hosting
destination is available; normal local development does not rely on duplicate
source folders as rollback points.

## Interpretation architecture

The default runtime uses Tend's deterministic local interpreter. When
`EXPO_PUBLIC_TEND_INTERPRETATION_GATEWAY_URL` is configured at build time,
statements the local interpreter cannot understand or match are sent to that separately hosted
interpretation gateway. The app never sends an OpenAI API key, gateway bearer
token, or other durable secret; the gateway must keep any OpenAI credential in
its own server-side secret store and expose only the `POST /interpret` contract
used by `src/domain/interpreter.ts`.

Regardless of interpreter, structured proposals are validated by the
application and require explicit confirmation before local data changes.

## Git workflow

- `main` contains integrated, testable acceptance candidates.
- `develop` is the integration branch for the next stabilization or feature
  pass.
- Create short-lived branches from `develop` using names such as
  `feature/reflect-copy` or `fix/voice-cancellation` when work benefits from an
  isolated review point.
- Merge validated work into `develop`; promote a tested candidate to `main`.
- Tag frozen physical-device baselines and acceptance candidates before the
  next build is installed.
- Do not commit generated `android/`, `dist/`, `.expo/`, or `node_modules/`
  directories.

## Local checkpoints

- `tend-expo-baseline-2026-09-17`: source captured from the frozen Pixel
  acceptance baseline.
- `tend-v1-candidate-2026-09-17`: completed approved V1 evolution slices,
  ready for the next physical-device acceptance cycle.
