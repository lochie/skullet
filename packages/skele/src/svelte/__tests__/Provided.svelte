<script lang="ts">
  import SkeleProvider from '../SkeleProvider.svelte';
  import SkeletonReveal from '../SkeletonReveal.svelte';

  type User = { name: string };

  let user = $state<User | null>(null);

  export function set(next: User | null) {
    user = next;
  }
</script>

<SkeleProvider reveal="sequence" mode="dark" theme={{ light: { base: 'red', highlight: 'white' }, dark: { base: 'rgb(10, 20, 30)', highlight: 'white' } }}>
  <SkeletonReveal data={user} sample={{ name: 'Ada Lovelace' }} label="Loading profile">
    {#snippet children(u)}
      <p style="margin: 0">{u.name}</p>
    {/snippet}
  </SkeletonReveal>
</SkeleProvider>
