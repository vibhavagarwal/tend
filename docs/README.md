# Tend documentation

`C:\dev\tend` is the canonical implementation repository for Tend's current
Expo/React Native application.

The product, domain, decision, and design-reference material in this directory
originated in the frozen Kotlin Tend repository at tag
`tend-kotlin-freeze-2026-09-16`. It is retained here so the current
implementation can use the durable product and design decisions without
depending on the earlier Kotlin workspace.

## Authority and provenance

- [Product requirements](product/PRODUCT_REQUIREMENTS.md) and
  [product context](product/CONTEXT.md) describe durable product intent and
  domain language. Interpret them independently of the implementation
  technology used by the former application.
- [ADR 0001](adr/0001-keep-v1-habit-data-on-device.md) is the portable V1
  decision record for on-device authoritative data.
- The approved [evolution specification](design/tend/spec.md),
  [Tend 3a visual prototype](design/tend/Tend%203a.dc.html), and
  [Tend Design System](design/tend/Tend%20Design%20System.dc.html) form the
  approved Tend design baseline unless a later documented product decision
  supersedes them. The [current decision overrides](design/tend/CURRENT_DECISION_OVERRIDES.md)
  record known superseding decisions.
- [Kotlin history](history/kotlin/) preserves the former implementation plan
  and Tickets 01–07 for intent and acceptance criteria. Kotlin, Compose, Room,
  ViewModel, Gradle, emulator, and other technology-specific details in those
  files are not requirements for the Expo implementation. Ticket status does
  not automatically describe the state of the current Expo application.

The design directory also retains the authoritative source [app icon](design/tend/tend-app-icon.svg)
and [wordmark](design/tend/tend-wordmark-v1.png). Do not treat exploratory
directions, generated prototype exports, uploads, or Kotlin source as
authoritative documentation.
