# 06: Add post-achievement acknowledgment and Habit creation send-off

**What to build:** After a Habit Entry persists successfully, Tend shows one quiet, non-blocking inline Post-Achievement Acknowledgment from the approved fixed corpus. Habit creation instead shows the distinct fixed Habit Creation Send-Off.

**Blocked by:** 04: Make Habit Entry review editable while retaining Entry Safety.

**Status:** ready-for-agent

- [ ] The approved 24-message corpus rotates globally and deterministically without repetition before exhaustion, including across process recreation.
- [ ] An acknowledgment appears only after a successful Habit Entry persistence, does not block another action, and is absent after validation or save failure.
- [ ] Habit creation never uses the rotating corpus; automated corpus, persistence, success/failure, and UI coverage passes.

