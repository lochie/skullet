<script lang="ts">
  import SkulletProvider from '../SkulletProvider.svelte';
  import Skeleton from '../Skeleton.svelte';
</script>

<SkulletProvider remember={false}>
  <Skeleton id="profile" data={{ name: 'Ada' }}>
    {#snippet children(u)}
      <p>{u.name}</p>
    {/snippet}
  </Skeleton>
</SkulletProvider>
