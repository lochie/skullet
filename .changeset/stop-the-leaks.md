---
"skullet": patch
---

Fixes two memory leaks.

#### Fixed

- Skeletons stop animating and using CPU once they leave the page.
- Content with images is freed when it leaves the page.
