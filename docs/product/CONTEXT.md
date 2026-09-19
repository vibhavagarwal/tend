# Habit Tracking

This context describes the language used to record real habit activity through conversational input while keeping the user in control of what is saved.

## Language

**Habit**:
A named activity the user has deliberately chosen to track.
_Avoid_: Goal, routine, task

**Active Habit**:
A Habit the user is currently tracking. It appears in normal choices and may be matched during interpretation.
_Avoid_: Current habit, enabled habit

**Archived Habit**:
A Habit the user has intentionally stopped tracking while retaining its Habit Entries as history. It is excluded from normal active choices and interpretation matching.
_Avoid_: Inactive habit, deleted habit

**Activity Date**:
The calendar date on which the activity represented by a Habit Entry occurred. Relative wording is resolved using the date and time zone at statement submission, not later interpretation or saving time.
_Avoid_: Log date, creation date, save date

**Habit Entry**:
A user-confirmed record of activity that actually occurred, associated with an existing Habit and optionally including details such as date, duration, or quantity.
_Avoid_: Check-in, completion, result

**Habit Statement**:
Natural-language text the user submits for interpretation, whether typed directly or produced through speech recognition.
_Avoid_: Prompt, command, transcript

**Interpretation Proposal**:
A structured, unsaved account of what the system believes a submitted statement means. It requires application validation and user confirmation before it can create a Habit or Habit Entry.
_Avoid_: AI decision, saved entry, command

**Pending Statement**:
A submitted Habit Statement preserved while interpretation is unavailable. It may be interpreted automatically when service returns, but its result cannot be saved without user confirmation.
_Avoid_: Failed message, queued entry, habit entry

**Post-Achievement Acknowledgment**:
A brief, non-blocking moment shown after a Habit Entry is successfully saved, recognizing the activity with a short encouraging message.
_Avoid_: Success screen, celebration, reward

**Habit Creation Send-Off**:
A fixed, friendly confirmation shown after a Habit is successfully created;
it welcomes tracking without treating setup as an achievement.
_Avoid_: Creation reward, onboarding celebration

**Reflection**:
An optional, user-initiated view that helps a person notice their Habit
Entries over a chosen period without grading their performance.
_Avoid_: Report, analytics dashboard, recap obligation
