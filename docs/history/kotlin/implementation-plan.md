# Tend Next Evolution: Implementation Plan

**Status:** approved for implementation planning  
**Scope:** sequential delivery plan; application code remains unchanged

## Delivery order

Implement and validate each slice before beginning the next. The approved
[specification](../../design/tend/spec.md) remains the product and design authority.

### 1. Tend visual foundation

**Outcome:** Fixed light/dark Tend palette, typography, spacing, pill actions,
hairlines, and accessible Compose primitives appear without changing user
flows.

**Likely scope:** Extract the theme from `ui/TendScreen.kt` into small token and
theme files; add local font resources; add only the action, rule, label, and
text-field primitives needed by Track, Reflect, and acknowledgments.

**Risk:** Contrast, visible focus, touch targets, and 200% text scaling.

**Validation:** Compose semantics/size tests; manual Pixel checks in light and
dark themes, large text, TalkBack, and reduced motion.

**Commit:** `feat(ui): add Tend theme tokens and core primitives`

### 2. Track shell, history, and habit management

**Outcome:** Track gains its icon/wordmark header, Reflect entry point, calm
history rows, and restyled active/archived Habit management without cards,
shadows, or persistent bottom navigation.

**Likely scope:** Split `ui/TendScreen.kt` into Track header, history, and Habit
management composables while retaining existing ViewModel actions.

**Risk:** Confirmations or management actions become difficult to find after
the layout changes.

**Validation:** Update archive, restore, deletion, persisted-history, empty,
long-name, and scrolling UI tests; review on a device at large text sizes.

**Commit:** `feat(track): redesign the Track shell and history`

### 3. Voice-first composer states

**Outcome:** The composer changes in place through ready, listening, heard, and
saved states; voice is primary and typed input remains a correction/recovery
path.

**Likely scope:** Add a small Track composer and listening-state composable;
extend `ui/VoiceInput.kt` only enough to surface partial transcript and optional
RMS level data from Android recognition.

**Risk:** Permission, cancellation, recognition error, partial-result, and
stale-callback handling must not change or submit a Habit Statement unexpectedly.

**Validation:** Voice adapter and UI tests for all results/states; manual
microphone testing on Pixel; manually verify listening bars and reduced motion.

**Commit:** `feat(voice): introduce the in-place Track composer`

### 4. Heard review, correction, and safe confirmation

**Outcome:** Tend displays the verbatim Habit Statement, structured proposed
Habit Entry, resolved Activity Date in plain words, and original date wording.
The person can edit fields or speak again before explicit save.

**Likely scope:** Add review/clarification/edit-field composables. Extend
`InterpretationProposal` and gateway parsing with a small source-date-phrase
field; persist it with retry-ready proposals. Revalidate edited fields through
the existing HabitModule before save.

**Risk:** This crosses interpretation, Entry Safety, clarification, duplicate
warning, and pending-retry behavior.

**Validation:** Unit and UI coverage for gateway contract parsing, explicit
confirmation, ambiguous matching, no active match, invalid edits, omission of
duration/quantity, duplicates, cancellation, and retry-to-review.

**Commit:** `feat(review): make entry review editable while preserving confirmation`

### 5. Reflect

**Outcome:** A read-only child view presents only deterministic “This week” and
“In total” Habit Entry frequency recaps.

**Likely scope:** Add `ui/ReflectScreen.kt` plus one narrow local aggregation
query/model in the Habit module. Count Activity Dates in local Monday–Sunday
weeks; include archived Habits, visibly marked, in totals.

**Risk:** Week boundaries, active/archived ordering, and zero-count exclusion.

**Validation:** Deterministic Room/unit coverage for boundaries, empty history,
inline versus list rendering, alphabetical order, and archived totals; Compose
Back behavior test; manual readability review.

**Commit:** `feat(reflect): add local entry-count reflections`

### 6. Post-Achievement Acknowledgment

**Outcome:** A successfully persisted Habit Entry receives the approved,
non-blocking inline acknowledgment; new Habit creation receives only its fixed
send-off.

**Likely scope:** Add acknowledgment/send-off composables and the fixed 24-line
corpus. Back global deterministic rotation with a tiny local persisted cursor,
advanced only when a save succeeds.

**Risk:** Never show or advance acknowledgment on failure; ensure rotation
survives process recreation and does not repeat before corpus exhaustion.

**Validation:** Corpus order/wrap/persistence/failure unit tests and UI tests
for successful Save and Save anyway; manual motion and reduced-motion check.

**Commit:** `feat(acknowledgment): add quiet post-save encouragement`

### 7. Regression and release validation

**Outcome:** The finished evolution preserves existing trusted behavior and
meets the approved visual/accessibility requirements.

**Likely scope:** Existing UI, voice, Room migration, gateway, pending retry,
and notification suites.

**Risk:** Cross-cutting regressions from presenting existing state differently.

**Validation:** Full automated suite plus manual release checklist: both themes,
200% text, TalkBack, reduced motion, actual microphone, offline retry,
review-ready notification, archive/restore, duplicate handling, and weekly
Reflect boundary. Stabilize the existing microphone permission test flake
separately before making the full instrumentation suite a release gate.

**Commit:** `test(ui): cover Tend redesign regressions`

## Guardrails throughout

- Keep Entry Safety: application validation and explicit confirmation precede
  every Habit Entry write.
- Retain ambiguity clarification before review and save.
- Retain offline preservation, retry, review-ready notification, and no
  automatic write after retry.
- Keep Archived Habits excluded from normal matching while retaining their
  history and including them in Reflect totals as specified.
- Add no new runtime LLM, cloud, token use, accounts, sync, reminders,
  dashboards, targets, streaks, or gamification. The existing interpretation
  gateway is pre-existing behavior, not part of the new feature scope.

## Prototype boundary

Use the Claude prototype only to inform the approved “Still point, voice first”
direction. Do not port its bundled web runtime, fixed artboard layout,
alternative-direction screens, or prototype-only interactions. Avoid literal
cards, shadows, dashboard patterns, garden mechanics, celebrations, or a broad
design-system framework. Keep the draft wordmark replaceable.

## Start here

Begin with **Slice 1 — Tend visual foundation**. It is low risk and provides a
consistent, accessible basis for every later slice without changing logging
behavior.
