# 02: Rebuild the Track shell and Habit management areas

**What to build:** Track becomes the approved quiet, centered experience with the Tend header, Reflect entry point, recent Habit Entry history, and accessible Active Habit and Archived Habit management. Existing archive, restore, and deletion confirmations remain required and are presented in Tend's visual language without cards, shadows, or persistent bottom navigation.

**Blocked by:** 01: Add Tend's accessible visual foundation.

**Status:** resolved

- [x] Track presents the approved hierarchy while retaining clear entry points for history, archive, restore, and delete actions.
- [x] Archive, restore, delete, empty, long-name, scrolling, and persisted-history behavior remains covered and unchanged in outcome.
- [ ] Manual large-text review confirms management and confirmation controls remain reachable and understandable.

## Answer

- [Tend Next Evolution Map](../../../design/tend/map.md)
- Corrected Track to the Tend 3a ready-state composition: left icon/right disabled Reflect header, exact Tend wordmark, voice-first prompt and composer, centered compact recent-history treatment, and secondary Habit management below the primary experience.
- Preserved archive, restore, delete, confirmation, and existing data behavior; recent entries have an explicit accessibility label so the presentation and management rows remain distinguishable.
- Android validation passed using the local Android Studio SDK and Pixel 10 Pro emulator: JVM unit tests, debug and instrumented APK builds, `TendVisualFoundationTest` (4 tests), and `TendScreenTest` (19 tests).
- Manual large-text and TalkBack usability review remain required.
