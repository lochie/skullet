export const examples = {
  vanilla: `const reveal = new Reveal(document.getElementById("card")!);

reveal.load(renderCard(SAMPLE_USER));

// Once loaded
reveal.show(renderCard(user));`,
  react: `<Skeleton data={user} sample={SAMPLE_USER}>
  {(user) => <Card user={user} />}
</Skeleton>`,
  vue: `<template>
  <Skeleton :data="user" :sample="SAMPLE_USER">
    <template #default="{ data }">
      <Card :user="data" />
    </template>
  </Skeleton>
</template>`,
  svelte: `<Skeleton data={user} sample={SAMPLE_USER}>
  {#snippet children(user)}
    <Card {user} />
  {/snippet}
</Skeleton>`,
};
