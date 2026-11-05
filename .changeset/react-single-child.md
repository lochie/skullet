---
"skullet": patch
---

Fixes single-child components like Radix `Slot` breaking in a React skeleton.

#### Fixed

- Components that take exactly one child, like Radix `Slot` and `asChild`, now render inside `Skeleton` and `SkeletonSuspense`.
