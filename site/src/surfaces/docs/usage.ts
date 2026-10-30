export const examples = {
  vanilla: `const reveal = new Reveal(document.getElementById("card")!);

reveal.load(renderCard(SAMPLE_USER));

// Once loaded
reveal.show(renderCard(user));`,
  react: `<SkeletonReveal data={user} sample={SAMPLE_USER}>
  {(user) => <Card user={user} />}
</SkeletonReveal>`,
  vue: `<template>
  <SkeletonReveal :data="user" :sample="SAMPLE_USER">
    <template #default="{ data }">
      <Card :user="data" />
    </template>
  </SkeletonReveal>
</template>`,
  svelte: `<SkeletonReveal data={user} sample={SAMPLE_USER}>
  {#snippet children(user)}
    <Card {user} />
  {/snippet}
</SkeletonReveal>`,
};
