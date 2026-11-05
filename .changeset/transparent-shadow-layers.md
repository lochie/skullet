---
"skullet": patch
---

Fixes text drawn as a solid block under a transparent shadow.

#### Fixed

- Text in an element with only transparent shadows, like the ones Tailwind's `shadow-*` and `ring-*` utilities leave, gets its own bars again instead of one block.
- Chips and shadows in black, or any colour with no blue in it, are no longer read as transparent.
