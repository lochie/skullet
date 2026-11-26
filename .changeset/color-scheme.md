---
"skullet": patch
---

#### Fixed

- In `system` mode, skeleton colours follow the page's `color-scheme`, so a class-based dark mode like shadcn's, or a dark section of a page, switches them. Set `color-scheme` with the class if your theme doesn't. Browsers without `light-dark()` still follow the OS.
