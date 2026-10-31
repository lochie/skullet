# Skullet

Smart skeleton states for React, Vue, Svelte, and vanilla JavaScript.

## Installation

```shell
pnpm i skullet
```

## Usage

```tsx
import { Skeleton } from "skullet/react";

<Skeleton data={user} sample={SAMPLE_USER}>
  {(user) => <Card user={user} />}
</Skeleton>;
```

While it loads, the content is measured into a skeleton that takes exactly its
space, so nothing moves when it arrives.

See the [package README](packages/skullet/README.md) for full API documentation.

# Contributing

## Install dependencies

```sh
pnpm install:all
```

## Dev/Watch Library and Example

```sh
pnpm dev
```

## Build Library

```sh
pnpm build
```

## Found this useful?

Follow me on [Twitter](https://twitter.com/lochieaxon).

## Other projects

You might also like:

- [torph](https://torph.lochie.me) - An opinionated text morphing library.
- [easing.dev](https://easing.dev) - Explore easing curves for your projects.
- [web haptics](https://haptics.lochie.me) - Haptic feedback for interactions on the web.

# Acknowledgements

- Thanks to [Alex](https://x.com/alexvanderzon) for assistance with the site design.
- Thanks to [Pugson](https://x.com/pugson) for putting up with my bullshit.
- All early reviewers and testers for their valuable feedback.
