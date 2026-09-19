# Conversational Habit Tracker --- Product Requirements Document

**Document:** Product Requirements Document (PRD)\
**Status:** Initial Baseline\
**Version:** 0.1\
**Date:** September 5, 2026\
**Target:** Android, initially tested only on the owner's Google Pixel\
**Project duration:** Approximately 2--3 weeks

------------------------------------------------------------------------

## 1. Purpose

Build a simple Android habit-tracking application that allows a user to
create and log habits primarily through natural conversation using voice
or text.

The project has two purposes:

1.  Build a genuinely useful personal habit tracker that avoids the
    friction and pressure of many existing habit-tracking applications
2.  Learn how modern software is built using an AI coding agent, without
    requiring the product owner to become a programmer

The project should follow sound software-engineering practices while
remaining intentionally small enough to complete in approximately two to
three weeks.

------------------------------------------------------------------------

## 2. Product Philosophy

The application should help a user **build a good relationship with a
habit rather than measure compliance with a plan**.

The product should therefore favor:

-   Low friction over extensive configuration
-   Logging behavior over judging behavior
-   Natural language over forms
-   User initiation over app-driven prompting
-   Clarification when materially uncertain rather than silent guessing
-   Simple defaults over asking unnecessary questions
-   Positive tracking without creating guilt around missed targets

For example, if a user wants to track meditation, five minutes of
meditation is a valid activity. The product should not frame it as
failure because the user did not reach an arbitrary 20-minute target.

------------------------------------------------------------------------

## 3. Primary User Experience

The application is primarily conversational and intentionally has a
lightweight visual interface.

A user should be able to open the app and either speak or type a
natural-language statement.

Example:

> I meditated for 20 minutes today.

For voice input, the application should:

1.  Allow the user to initiate listening explicitly by pressing a Talk
    control
2.  Transcribe the speech into visible text
3.  Allow the user to see what was captured before submission
4.  Allow correction of the transcribed text before submission if
    necessary
5.  Interpret the statement into structured habit information
6.  Present the interpreted information to the user for confirmation
7.  Save the habit entry only after confirmation

Conceptually:

**Voice → Transcription → Visible Text → Interpretation → Confirmation →
Save**

Text input enters the same flow after the transcription step.

------------------------------------------------------------------------

## 4. Habit Creation

Habit creation should require as little information as possible.

Example:

> I want to track meditation.

The application should create a Meditation habit without requiring the
user to define:

-   Target duration
-   Required frequency
-   Weekly target
-   Streak goal
-   Goal date
-   Reminder schedule
-   Detailed categorization

The initial habit model should contain only information necessary to
identify and manage the habit.

Potential core attributes include:

-   Unique identifier
-   Habit name
-   Creation date
-   Active/inactive status

The implementation may contain additional technical fields where
necessary, but those fields should not create additional setup
requirements for the user.

------------------------------------------------------------------------

## 5. Multiple Habits

Multiple habits must be supported from the beginning.

Meditation will be the first habit used during development and testing,
but the underlying application must not hardcode meditation-specific
behavior.

Examples of future habits could include:

-   Meditation
-   Reading
-   Running
-   Walking
-   Technical reading

The same conversational mechanism should eventually work across
different habit types.

------------------------------------------------------------------------

## 6. Habit Logging

A habit entry represents something the user actually did.

Examples:

> I meditated for 20 minutes today.

> I read for 30 minutes yesterday.

The application should interpret relevant information from the statement
where available, such as:

-   Habit
-   Date
-   Duration or quantity

The application should not require all possible attributes to be present
for every entry.

The structured data model should be independent of the input method.
Whether an entry eventually comes from voice, typed text, a form, or
another mechanism, the underlying habit system should receive the same
type of structured command/data.

This separation is an important architectural principle for the project.

------------------------------------------------------------------------

## 7. Ambiguity Handling

The application should not silently guess when there is meaningful
ambiguity.

For example, if the user tracks both:

-   Reading
-   Technical Reading

and says:

> I read for 20 minutes today.

the application should ask which habit the user intended.

The principle is:

**Infer when reasonably confident; clarify when materially uncertain.**

The goal is to keep interaction friction low without sacrificing trust
in the recorded history.

------------------------------------------------------------------------

## 8. New Habit Detection

The long-term product should be capable of recognizing a potentially new
habit from a logging statement.

Example:

> I walked for 35 minutes today.

If Walking is not currently tracked, a future version could respond:

> You're not tracking Walking yet. Would you like me to add it and log
> today's 35 minutes?

This behavior is desirable but is **not required for the first
version**.

For V1, creating a habit and logging an entry against an existing habit
may remain separate actions.

------------------------------------------------------------------------

## 9. Voice Interaction

Voice is a primary interaction mechanism but is explicitly initiated by
the user.

The application should not continuously listen.

The expected interaction is:

1.  User opens the application
2.  User presses Talk
3.  User speaks
4.  Speech is transcribed
5.  Transcription is displayed
6.  User submits the text
7.  Application interprets it
8.  Application asks for confirmation where appropriate
9.  Application saves the structured entry

The user may correct the transcription before submitting it.

A separate transcription-editing workflow is not required.

------------------------------------------------------------------------

## 10. Text Interaction

Text input should be available alongside voice.

A user should be able to type the same natural-language statements they
would otherwise speak.

Voice and text should converge on the same interpretation and logging
workflow rather than creating two independent implementations.

------------------------------------------------------------------------

## 11. AI Interpretation

The intended architecture may use a cloud-based AI model to convert
natural-language input into structured habit information.

The AI's responsibility should be **interpretation**, not direct
modification of application data.

Conceptually:

**Natural language → AI interpretation → structured result → application
validation → user confirmation → database write**

The AI should not be given unrestricted authority to write directly to
the application's habit database.

This separation should make the system easier to validate, debug, test,
and eventually replace or modify.

------------------------------------------------------------------------

## 12. Initial Architecture Direction

The likely architecture is:

**Android App → Application Backend → AI Service**

with habit information persisted in an appropriate data store.

The exact technology choices have not yet been finalized.

The Android application should not contain an exposed AI service API
credential.

The architecture should separate:

-   User interface
-   Voice transcription
-   Natural-language interpretation
-   Habit business logic
-   Data persistence
-   External AI integration

The project should avoid adding architectural layers that are
unnecessary for the initial personal-use application.

------------------------------------------------------------------------

## 13. V1 Scope

The first version should focus on the smallest end-to-end experience
that proves the concept.

V1 should support:

-   Android
-   Installation and use on the owner's Google Pixel
-   Multiple habits
-   Simple conversational habit creation
-   Voice input initiated by the user
-   Visible speech transcription
-   Text input
-   Natural-language interpretation
-   Logging against an existing habit
-   Basic duration/date extraction when supplied
-   Confirmation before saving interpreted information
-   Clarification when multiple existing habits are plausible
-   Persistent storage of habits and habit entries

Reporting and analytics will be defined separately later.

------------------------------------------------------------------------

## 14. Explicitly Out of Scope for Initial V1

Unless needed to make the core experience work, the initial build should
not include:

-   iOS
-   Public app-store release
-   Distribution to friends
-   Multi-user architecture
-   Social features
-   Complex onboarding
-   Required habit frequencies
-   Required duration targets
-   Streak pressure
-   Gamification
-   Detailed goal configuration
-   Complex reminder systems
-   Automatic creation of new habits from logging statements
-   Advanced reporting
-   Large-scale cloud architecture
-   Premature optimization for many users

These capabilities can be reconsidered after the basic product works.

------------------------------------------------------------------------

## 15. Learning Goals

The owner does **not** intend to learn programming or manually write
meaningful portions of the application's code.

An AI coding agent will perform most or all coding.

The learning objective is instead to understand the modern
software-development workflow well enough to direct AI-assisted
development responsibly.

The project should teach practical understanding of:

-   Translating a product idea into requirements
-   Defining scope
-   Making basic architecture decisions
-   Breaking development into small increments
-   Understanding the purpose of major project components
-   Using an AI coding agent effectively
-   Running an Android application locally
-   Testing on a physical Android device
-   Reading and reasoning about errors
-   Debugging with an AI agent
-   Basic Git/version-control concepts
-   Creating meaningful commits/checkpoints
-   Testing behavior before accepting changes
-   Preventing an AI coding agent from unnecessarily complicating the
    codebase
-   Separating product requirements from implementation decisions
-   Evolving an application without rebuilding it from scratch

The goal is not proficiency in Kotlin syntax.

------------------------------------------------------------------------

## 16. Development Approach

The application should not be generated in one large AI prompt.

Development should proceed incrementally:

**Requirement → small implementation task → AI-generated code → run →
test → inspect → fix → commit → next task**

Each increment should result in something observable or testable where
practical.

The project should favor understanding and repeatability over maximum
development speed.

------------------------------------------------------------------------

## 17. Development Environment

Known constraints:

-   Development computer: Windows PC
-   Target device: Google Pixel
-   Initial platform: Android
-   Initial audience: owner only
-   Coding experience should not be assumed
-   Project duration target: 2--3 weeks
-   AI-assisted development is expected

Likely tools to evaluate include:

-   Android Studio
-   Git
-   GitHub
-   AI coding agent

The specific AI coding agent and supporting technology stack have not
yet been selected.

------------------------------------------------------------------------

## 18. Engineering Principles

The following principles should guide technical decisions throughout the
project.

### Keep the domain independent of the interface

Habit logic should not depend on whether information originated from
voice, text, or a future interface.

### Separate interpretation from action

AI may interpret user intent, but application code controls validation
and persistence.

### Ask only when necessary

The system should not convert every possible database field into a
question for the user.

### Prefer reversible decisions

During the learning project, choose implementations that are easy to
change rather than designing prematurely for hypothetical scale.

### Build vertically

Prefer completing small end-to-end capabilities rather than building
every database component, then every backend component, then every
interface component independently.

### Keep V1 intentionally small

A feature being desirable eventually does not make it necessary now.

### Make behavior observable

The user should be able to see what speech was transcribed and what the
system believes it is about to record.

### Protect user trust

When interpretation is materially ambiguous, ask rather than silently
recording potentially incorrect information.

------------------------------------------------------------------------

## 19. Initial Success Criteria

The first version can be considered successful when the owner can
install and run it on their Pixel and complete an experience similar to
the following:

1.  Open the application
2.  Tell it to start tracking Meditation
3.  See Meditation represented as a tracked habit
4.  Later press Talk
5.  Say, "I meditated for 20 minutes today"
6.  See the speech accurately transcribed
7.  Submit the transcription
8.  See the application's structured interpretation
9.  Confirm the interpretation
10. Have the entry persist after the application is closed and reopened
11. Add another habit and repeat the workflow without
    meditation-specific code or behavior

The project is also successful if the owner finishes it with a
repeatable mental model and workflow for starting a more complex
AI-assisted software project.

------------------------------------------------------------------------

## 20. Open Decisions

The following decisions should be made during project planning rather
than assumed in this document:

-   Native Android technology choices
-   AI coding agent
-   AI model/provider
-   Speech-to-text approach
-   Backend technology
-   Local versus cloud data persistence
-   Authentication, if any is actually necessary for V1
-   Exact confirmation interaction
-   Minimal visual design
-   Testing strategy
-   Git/GitHub workflow
-   Deployment/install workflow to the Pixel
-   Reporting requirements

These should be resolved deliberately, with preference for the simplest
choice that supports the learning goals and V1 experience.

------------------------------------------------------------------------

## 21. Future Product Ideas

The following ideas are intentionally captured without committing them
to V1:

-   Detect a new habit implicitly from a logging statement
-   Ask whether the user wants to begin tracking the newly detected
    activity
-   More sophisticated conversational context
-   Reporting and habit history
-   Trend summaries
-   Useful observations without guilt-inducing scoring
-   Optional reminders or alerts
-   Distribution to additional users
-   Cross-platform support

Future functionality should continue to respect the core philosophy of
helping users develop a healthy relationship with their habits rather
than maximizing streaks or compliance.

------------------------------------------------------------------------

## 22. Reference Principle

When future feature or architecture decisions are unclear, use this
question as a filter:

> **Does this make it easier for someone to naturally record and
> understand the habits they are building, or are we adding complexity
> because conventional habit trackers and software architectures usually
> have it?**

If the latter, the feature or technical component should require
explicit justification before being added.
