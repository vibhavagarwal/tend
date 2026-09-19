# Tend Next Evolution Map

**Status:** ready-for-agent

## Agreed direction

[spec.md](./spec.md) is the implementation authority for Tend's next product
evolution. It covers the visual foundation, deterministic Reflect behavior,
post-achievement encouragement, and future-sharing boundary.

[implementation-plan.md](../../history/kotlin/implementation-plan.md) records the approved
sequential delivery slices, validation expectations, and commit boundaries.

## Implementation tickets

1. [01: Add Tend's accessible visual foundation](../../history/kotlin/tickets/01-tend-visual-foundation.md)
2. [02: Rebuild the Track shell and Habit management areas](../../history/kotlin/tickets/02-track-shell-and-habit-management.md)
3. [03: Introduce the in-place voice-first composer](../../history/kotlin/tickets/03-in-place-voice-first-composer.md)
4. [04: Make Habit Entry review editable while retaining Entry Safety](../../history/kotlin/tickets/04-editable-safe-entry-review.md)
5. [05: Add the Reflect child view](../../history/kotlin/tickets/05-reflect-entry-counts.md)
6. [06: Add post-achievement acknowledgment and Habit creation send-off](../../history/kotlin/tickets/06-post-achievement-acknowledgment.md)
7. [07: Run Tend evolution regression and accessibility validation](../../history/kotlin/tickets/07-regression-and-accessibility-validation.md)

## Scope guardrails

- No application code has been changed by this planning work.
- Do not add an LLM, cloud request, or runtime token use for Reflect or
  encouragement.
- Do not add streaks, targets, dashboard analytics, recap notifications,
  accounts, synchronization, or shared data.
- Resolve the listed deferred visual/copy decisions through visual review
  before finalizing implementation details.
