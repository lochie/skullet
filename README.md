# Skele

Dependency-free skeleton loading component for React, Vue, Svelte, and vanilla JavaScript.

## Installation

```shell
pnpm i skele
```

## Usage

```tsx
import { SkeletonReveal } from "skele/react";

<SkeletonReveal data={user} sample={SAMPLE_USER}>
  {(user) => <Card user={user} />}
</SkeletonReveal>;
```

While it loads, the content is measured into a skeleton that takes exactly its
space, so nothing moves when it arrives.

See the [package README](packages/skele/README.md) for full API documentation.

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
