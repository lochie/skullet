<script lang="ts">
  import Skeleton from '../Skeleton.svelte';

  type User = { name: string; bio: string };

  let {
    data,
    sample,
    onreveal,
  }: { data: PromiseLike<User>; sample?: User; onreveal?: () => void } = $props();
</script>

<div style="width: 320px">
  <Skeleton {data} {sample} {onreveal}>
    {#snippet children(u)}
      <div style="padding: 16px; border: 1px solid #ccc">
        <h3 style="margin: 0">{u.name}</h3>
        <p style="margin: 4px 0 0">{u.bio}</p>
      </div>
    {/snippet}
    {#snippet errorMessage(error)}
      <p>Couldn’t load: {String(error)}</p>
    {/snippet}
  </Skeleton>
</div>
