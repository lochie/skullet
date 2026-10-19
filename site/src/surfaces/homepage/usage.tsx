export const examples = {
  vanilla: `const reveal = new Reveal(document.getElementById('card'));

const skeleton = renderCard();
new Placeholder(skeleton);
reveal.show(skeleton);

// once loaded
reveal.show(renderCard(user));`,
  react: `<SkeletonReveal loading={!user}>
  <Card user={user} />
</SkeletonReveal>`,
  vue: `<template>
  <SkeletonReveal :loading="!user">
    <Card :user="user" />
  </SkeletonReveal>
</template>`,
  svelte: `<SkeletonReveal loading={!user}>
  <Card {user} />
</SkeletonReveal>`,
};
