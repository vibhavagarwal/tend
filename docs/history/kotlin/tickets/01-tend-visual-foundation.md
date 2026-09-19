# 01: Add Tend's accessible visual foundation

Type: feature

**What to build:** Tend adopts its approved light and dark visual language—semantic palette, typography, spacing, shapes, actions, hairlines, focused fields, and restrained motion—without changing the existing Habit logging behavior. The implementation keeps native accessible control semantics and uses only the small reusable primitives needed by Track, Reflect, and acknowledgments.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [x] Both device themes use Tend's fixed semantic palette rather than wallpaper-derived color, with the approved typography and spacing roles.
- [x] Primary, secondary, and tertiary actions; focused fields; labels; and dividers meet approved target sizes, contrast, focus, and text-scaling behavior.
- [x] Automated semantics/target-size coverage and manual light/dark, 200% text, TalkBack, and reduced-motion checks pass.

## Answer

Added the fixed Tend light/dark theme, bundled typography roles, spacing/shape/motion tokens, and native Compose action, field, label, and rule primitives. Applied the foundation to the existing screen without changing its state or callbacks, and verified it with contrast, semantics, target-size, regression, and Pixel emulator checks. The mandated light muted pair measures 4.85:1 (WCAG AA), rather than the specification's stated 5.6:1; the exact approved color values were retained.

See the [Tend Next Evolution map](../../../design/tend/map.md).
