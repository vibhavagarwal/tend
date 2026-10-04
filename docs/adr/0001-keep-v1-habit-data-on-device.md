# Keep V1 Habit Data on Device

V1 keeps Habits, Habit Entries, Pending Statements, and Interpretation Proposals on the Android device as the authoritative data, while the cloud backend acts only as a stateless interpretation gateway. This sacrifices cloud backup and multi-device access in favor of privacy, simplicity, and a no-login personal experience; authentication and synchronization must be reconsidered before broader distribution.

Current implementation note (2026-09-23): Tend must not embed the existing
Render gateway's durable bearer token in an APK. Proper mobile gateway
authentication, such as Android app attestation with provider-level abuse
controls, is deferred. Until that work is completed, Tend remains local-only
and does not configure the Render gateway URL in its production build.
