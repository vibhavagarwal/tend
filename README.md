# Tend

Tend is a calm, voice-first Android habit tracker. Habit Statements can be
spoken or typed, but every meaningful change is reviewed and explicitly
confirmed before it is saved. V1 data remains on the device.

## Requirements

- Node.js 20 or newer
- npm
- Android Studio and an Android SDK for native device builds
- A compatible Android speech-recognition service for voice input

## Setup

```powershell
npm ci
npm start
```

Use `npm run android` to create or run an Android development build. Do not
install a development build over an active physical-device acceptance baseline
without confirming that the baseline is no longer needed.

## Validation

```powershell
npm test
npm run typecheck
npx expo-doctor
npm run export:android
```

The Android export is written to `dist/`, which is intentionally ignored by
Git.

## Interpretation architecture

The current default runtime uses Tend's deterministic local interpreter. The
application contains an optional client for a separately hosted interpretation
gateway, but no OpenAI secret belongs in the mobile app and model-backed
interpretation is not enabled in the V1 acceptance candidate.

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
