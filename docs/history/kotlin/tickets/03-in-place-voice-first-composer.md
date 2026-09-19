# 03: Introduce the in-place voice-first composer

**What to build:** A person can move through Tend's in-place ready, listening, heard, and saved composer states. Speaking is visually primary; partial recognized words and accessible listening status are visible; typing remains available for correction and recognition recovery.

**Blocked by:** 02: Rebuild the Track shell and Habit management areas.

**Status:** ready-for-agent

## Scope and boundaries

This ticket owns voice capture and composer-state behavior, plus the in-place
**listening** presentation on Track. The visible path is ready → listening →
heard → saved, without opening a modal or a separate confirmation screen.

- Keep speaking visually primary. Show partial recognized words as text and a
  visible, accessible `Listening` status while capture is active.
- Preserve the Habit Statement through partial/final results and recovery
  paths. Permission denial, cancellation, unavailable recognition, recognition
  errors, and stale callbacks must not submit or save anything automatically.
- Preserve Entry Safety: speech recognition produces a Habit Statement and may
  lead to an Interpretation Proposal, but application validation and explicit
  user confirmation remain required before any Habit Entry write.
- The heard state may hand the final recognized statement into the existing
  safe flow, but **editable heard/review UI and parsed-entry presentation are
  Ticket 04**. Do not build them here.
- The saved state returns the composer to ready after the existing successful
  persistence path. The inline post-save acknowledgment is **Ticket 06**; do
  not build it here.

## Read only these references

Do not read the full design artifacts for this ticket. Use only:

- [spec.md](../../../design/tend/spec.md): **Layout, shape, and action rules**; **Voice-first
  logging model** (Ready and Listening, plus the explicit-confirmation rule);
  and **Interaction and accessibility** (reduced motion, text scaling,
  accessible state, focus, and target sizes).
- [Tend 3a.dc.html](../../../design/tend/Tend%203a.dc.html): **3a Track ready**, **3a Track
  listening**, and **3a Track dark listening** only.
- [Tend Design System.dc.html](../../../design/tend/Tend%20Design%20System.dc.html): **Typography
  roles**, **Spacing**, **Action hierarchy**, and **Motion** only. Reuse the
  Tend tokens and primitives already established by earlier tickets.
- [CONTEXT.md](../../../product/CONTEXT.md): the definitions of **Habit Statement** and
  **Interpretation Proposal** only.

## Ticket-specific acceptance criteria

- [ ] The composer has one clear primary action in each state and retains accessible equivalents for voice initiation, Done, and Cancel.
- [ ] Partial recognition, final recognition, permission denial, cancellation, unavailable recognition, and recognition error preserve or recover the Habit Statement safely without automatic submission.
- [ ] Automated voice/state coverage passes; manual Pixel microphone and reduced-motion review confirms the intended behavior.
