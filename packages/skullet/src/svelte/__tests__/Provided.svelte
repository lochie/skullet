<script lang="ts">
  import SkulletProvider from '../SkulletProvider.svelte';
  import Skeleton from '../Skeleton.svelte';

  type User = { name: string };

  let user = $state<User | null>(null);

  export function set(next: User | null) {
    user = next;
  }
</script>

<SkulletProvider reveal="sequence" mode="dark" theme={{ light: { base: 'red', highlight: 'white' }, dark: { base: 'rgb(10, 20, 30)', highlight: 'white' } }}>
  <Skeleton data={user} sample={{ name: 'Ada Lovelace' }} label="Loading profile">
    {#snippet children(u)}
      <p style="margin: 0">{u.name}</p>
    {/snippet}
  </Skeleton>
</SkulletProvider>
