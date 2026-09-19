# Tend: Next Evolution

**Status:** approved  
**Scope:** agreed product and design direction only; no implementation has
been performed

## Purpose

Tend is a **quiet tending companion**: a warm, grounded, observant space that
helps people notice and care for the practices they are growing. It does not
measure a person's worth, demand momentum, or behave as a coach, productivity
tool, game, or analytics dashboard.

The product favors low-friction, user-initiated tracking. Five minutes of an
activity is worthwhile. Absence is never treated as failure.

## Visual and interaction foundation

### Design language

- Tend is a **quietly expressive interface**, not an illustration-led themed
  app. Its character comes from typography, deliberate color, organic shape
  and spacing, restrained texture, and gentle motion.
- The visual language is abstract and nature-informed. It must not use literal
  garden mechanics, plants that wilt, or imagery that makes absence look like
  decay or neglect.
- The selected direction is **Still point, voice first**: a quiet, centred
  composer where the person speaks first and the interface changes in place
  rather than opening a sequence of modal steps. The visual weight belongs to
  the person's words, not to a decorative scene or celebration.
- Preserve the existing Tend app icon. It occupies the Track header slot at
  40px with an 11px corner radius. The interface accent is the icon's teal so
  the product mark and controls agree.
- The supplied Tend wordmark is a draft visual asset, not a final logo
  lockup. It is centred below the header icon at approximately 34px ink height
  with clear space equal to the height of its `T`. In dark theme, use a
  legible light treatment; no separate dark-theme wordmark lockup is required.
  While listening, reduce its visual prominence so the transcript is the only
  display-weighted content.

### Reusable system

- Use these semantic palette tokens; implementation must refer to roles, not
  literal color names:

  | Role | Light | Dark | Use |
  | --- | --- | --- | --- |
  | `background` | `#EBEFEE` | `#0E1514` | Every screen ground |
  | `surface` | `#F9FBFA` | `#16201E` | Sheets and dialogs only; Track and Reflect use none |
  | `primary-text` | `#17211F` | `#E2EBE8` | Habit names, entries, transcripts |
  | `muted-text` | `#5A6B68` | `#90A39F` | Captions, counts, dates, quiet history; never reduce with opacity |
  | `quiet-accent` | `#006B5F` | `#6FBFB2` | Primary fill, outlines, control labels, and listening-level bars |
  | `affirmation` | `#D9E7E1` | `#172927` | Post-Achievement Acknowledgment variants |
  | `hairline` | `#D7DFDC` | `#26302E` | Separators and centred rules |
  | `emphasis` | `#A9BCB6` | `#3A4A47` | Acknowledgment rule and focused-field treatment |

- On their intended backgrounds, primary text must meet or exceed the
  prototype's 13.4:1 light / 12.2:1 dark contrast and muted text 5.6:1 light
  / 4.9:1 dark contrast. Accent must have sufficient contrast for its use as
  text, outline, or a filled action.
- Tend owns its palette; do not use Android wallpaper/dynamic color. Provide
  accessible mappings for both light and dark themes, following the device
  setting automatically. Do not add an in-app theme selector.
- Use three typography roles:
  - **Expressive — EB Garamond 400 / 400 italic:** headings (34px), prompts
    (31px), recap sentences (29px), transcripts (28px italic), the Habit
    Creation Send-Off (26px), Post-Achievement Acknowledgments (27px italic),
    and a Habit under review (44px). Italic expresses what was heard; roman
    expresses what Tend says.
  - **Functional — Karla 400 / 500:** editable entry fields (19px), list rows
    and totals (17px), dates and helper text (16px), and tertiary controls
    (15px). Never use this role below 15px. Buttons are 17px regular and never
    all caps.
  - **Caption — IBM Plex Mono 400:** section labels (11px uppercase with
    `0.14em` tracking), recap counts (15px), and week ranges / parse lines
    (11–12px). This is the only role that uses letter spacing.
- Initial primitives are deliberately limited to actions, the input/composer,
  surfaces, list rows, and the Post-Achievement Acknowledgment, plus spacing,
  shape/elevation, typography, color, and motion rules. Do not create a broad
  component library or predesign future screens.
- Retain native accessible component behavior underneath Tend's tokens and
  primitives. Do not rebuild standard controls from scratch or leave them in
  stock Material styling.

### Layout, shape, and action rules

- Use a 6px base unit and this scale: 6, 12, 14, 22, 26, 34, and 52px. Screen
  padding is 16px top, 26px sides, and 20px bottom. Header-to-wordmark spacing
  is 14px; label-to-display spacing is 14–16px; display-to-primary-action
  spacing is 22–26px. A centred dividing rule is 56px wide, with 30–34px above
  and 20–22px below. History rows are 14px apart.
- Composer whitespace is elastic rather than fixed. It absorbs text scaling
  before history is pushed down; content must never clip.
- Primary actions are full-width, 60px-high filled pills (`999px` radius).
  Exactly one is visually primary in each composer state: `Hold to speak` in
  ready, and `Save activity` after an entry has been heard and parsed.
- Secondary navigation and stop actions are 44px-high outlined pills: for
  example `Reflect`, Back, and `Done`. Use an accent outline when it advances
  the person and a hairline outline when it returns them.
- Tertiary actions are 44px-high text controls with no underline: accent for
  an alternative route (`Type instead`, `Edit as text`, `New habit`) and muted
  text for retreat (`Cancel`, `Not now`, `Say it again`). Links and controls
  must remain distinguishable.
- App icon corners are 11px; screen corners are 36px. Do not use cards,
  panels, or shadows in the app. Establish structure through 1px hairlines,
  the 56px rule, and spacing. A focused text field uses a 1px accent underline
  and no fill.

### Voice-first logging model

- Track's logging composer has four in-place states: **ready → listening →
  heard → saved**. It does not present a popup or a separate confirmation
  screen; the composer changes what it contains.
- **Ready:** invite the person to say what they did and make `Hold to speak`
  the primary action. `Type instead` is available but secondary. Recent saved
  entries and `New habit` may sit below the composer without competing with it.
- **Listening:** show the `Listening` state in text and show the evolving
  recognized words as text. Five small level bars may reflect microphone level
  while listening. `Done` and `Cancel` stop or abandon listening; no audio-only
  cue conveys the state or outcome.
- **Heard:** show the recognized Habit Statement verbatim and its parsed,
  structured reading before any save. For a Habit Entry this includes the
  matched Habit and any recognized details (such as duration or quantity), and
  resolves and displays the **Activity Date in plain words**. Show the raw
  phrase used for the date beneath the parsed date. No unspecified duration or
  quantity is invented. `Save activity` is primary; `Edit as text` and `Say it
  again` remain available.
- **Saved:** only after the person selects `Save activity`, required validation
  succeeds, and the Habit Entry persists successfully, return the composer to
  ready and show the inline Post-Achievement Acknowledgment. This state is not
  a separate `Saved` label or popup.
- A Habit Entry always requires explicit user confirmation before it saves.
  Speech recognition and parsing produce an Interpretation Proposal only;
  neither can save an entry on their own.
- Speech is the primary path for both Habit Entry logging and spoken Habit
  creation. A spoken Habit creation follows its own confirmation requirements
  and, after successful creation, uses the fixed Habit Creation Send-Off—not a
  Post-Achievement Acknowledgment.
- Text is the correction and speech-recognition-fallback path, not a parallel
  primary composer. It presents the parsed entry as editable fields (Habit,
  recognized details, and Activity Date) with `Save activity` still requiring
  confirmation. Speaking again replaces the whole proposal. If recognition
  fails, open this path with any partial recognized text preserved; treat it as
  an error/recovery path, never encouragement.

### Product boundaries

- This evolution must not introduce LLM or runtime token use, cloud requests,
  accounts, synchronization, shared data, reminders, recap notifications,
  streaks, targets, performance scores, analytics dashboards, literal garden
  mechanics, decay imagery, coaching, guilt, or gamification.
- Habit and Habit Entry language remains authoritative. Do not recast entries
  as goals, tasks, check-ins, completions, results, or rewards.

### Interaction and accessibility

- Each state has one visually emphasized primary action; supporting actions
  are secondary or tertiary.
- Motion is purposeful and restrained: it confirms state changes or supports
  orientation, never delays logging or becomes a reward spectacle. The only
  continuous motion is the five 3px listening-level bars; they immediately
  settle when listening stops. The transcript replaces itself with no typing
  animation. Acknowledgment enters with a 200ms fade and 4px rise; Track ↔
  Reflect uses a 220ms cross-fade; a new history line fades over 160ms without
  animating list reflow.
- Honor reduced motion: all transitions become instant, listening bars hold at
  rest, and visible `Listening` text carries the state.
- Support device text scaling through 200%. All blocks flow and are not
  height-capped; elastic composer space yields before content can clip.
- Primary actions and secondary/tertiary controls meet their 60px and 44px
  target sizes. Provide visible focus treatment independent of color alone,
  preserve native accessible semantics and focus order, and ensure screen
  reader labels communicate state, recognized text, parsed details, errors,
  and confirmation affordances.
- No meaning may be communicated only through color, sound, or motion. Meet
  the palette contrast requirements above in both themes.
- Color communicates interface meaning only: actions, focus, confirmation,
  and genuine errors. It never grades habits, rewards volume, or makes absence
  visually negative.
- Tend's voice is warm, plainspoken, short, direct, and trustworthy. Avoid
  jargon, cutesiness, forced poetry, and coach-like language.

## Reflect

### Access and scope

- **Reflect** is an optional, on-demand Reflection space. It is reached via a
  clearly labeled `Reflect` action near Tend's top heading on Track.
- Reflect is a child view: its top-left Back control and the system Back action
  return to Track. Do not add persistent bottom navigation.
- Do not automatically show a recap, send recap notifications, or show unread
  badges, dots, or review-due prompts.
- Reflect is read-only and contains only two count recaps: **This week** and
  **In total**. Do not duplicate the raw entry history from Track, make habit
  names drill-down controls, add per-habit histories, or add charts.

### Deterministic recap rules

- Generate all Reflection content locally from stored Habit Entries. Never use
  an LLM, cloud request, or tokens.
- Report frequency only: the number of confirmed Habit Entries. Do not
  aggregate duration or quantity, merge same-day entries, or convert activity
  into a common score.
- A weekly count uses the entry's **Activity Date**, not save date. “This
  week” is the local Monday-through-Sunday calendar week; do not use a rolling
  seven-day window or a configurable week start.
- Both recaps name only habits with one or more saved entries in the relevant
  period/history. Never show zero-count habits.
- The weekly recap names only activity that occurred in the week. If nothing
  was saved that week, say plainly that no activity was saved, then still show
  **In total** if saved history exists.
- Before any Habit Entry exists, show: “No activity saved yet. When you save
  an activity, it will appear here.”
- Include archived habits in **In total**, visibly marked as archived. Active
  habits appear first; archived habits second; each group is alphabetical.
- Use the existing Habit name as a label, not an inferred verb. For example:
  “This week: Swimming — 3 times; Meditation — 4 times.” This works for any
  custom habit name without extra configuration or language inference.
- With up to three named habits, use a short sentence introduction with inline
  labeled counts. With four or more, use a simple labeled list. Neither form
  becomes dashboard cards.

### Explicit exclusions

Reflect must not offer advice about quieter habits, personal-rhythm
inferences, streaks, scores, targets, rankings, charts, dashboard metrics, or
performance judgments.

## Post-achievement encouragement

### Habit Entry save

- After and only after a Habit Entry persists successfully, show a
  **Post-Achievement Acknowledgment** below the logging composer. Its presence
  is the success signal; do not add a separate `Saved` label or second popup.
- The acknowledgment stays visibly inline until the person takes their next
  action or leaves. It never requires dismissal and does not block logging.
- On save failure, do not show encouragement; retain the normal error path.

### Curated corpus

- Use a finite local corpus of 24 universal messages. It must not call an LLM,
  cloud service, or consume tokens at runtime.
- Rotate messages globally and deterministically for every successful Habit
  Entry save. Do not repeat a message until the corpus has been exhausted; do
  not keep separate sequences by habit.
- Messages acknowledge the act without evaluating the person. Do not mention
  habit name, duration, quantity, streaks, momentum, next actions, identity
  praise, or performance judgments.
- Use this approved fixed corpus, in this order:

  1. “That’s in. Nothing more needed.”
  2. “A small moment, kept.”
  3. “You made room for it.”
  4. “There it is.”
  5. “The day held this, too.”
  6. “A quiet mark on the day.”
  7. “That counts as living.”
  8. “It happened. It’s noted.”
  9. “A little care, recorded.”
  10. “This part made it in.”
  11. “Something real, kept close.”
  12. “The record is yours now.”
  13. “One thing, honestly held.”
  14. “A moment with its place.”
  15. “It belongs to the day.”
  16. “There’s room for this.”
  17. “The page has it.”
  18. “A simple thing, saved.”
  19. “It has been noticed.”
  20. “The day carries this forward.”
  21. “A small truth, kept.”
  22. “That was worth recording.”
  23. “One more thing that happened.”
  24. “It’s here when you want it.”

### Habit creation

- Habit creation is planning, not an achievement. Do not use the rotating
  encouragement corpus after it.
- After a Habit is successfully created, show the fixed **Habit Creation
  Send-Off**: “You're now tracking [Habit]. Good luck—and, most importantly,
  have fun.”

## Future-sharing boundary

If Tend is later available to other people or platforms, each person has an
independent activity history. Shared family data, collaboration, accounts,
cloud synchronization, and cross-device data sharing are outside this
evolution.

## Deferred decisions

None.
