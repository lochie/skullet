---
"skullet": patch
---

Faster skeletons: the shimmer is one highlight per skeleton, masked to its bones and moved by `transform`, so the compositor runs it with no repaints, and drawing or revealing a skeleton reads layout once instead of after every bone.
