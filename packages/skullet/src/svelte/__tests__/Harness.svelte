<script lang="ts">
  import Skeleton from '../Skeleton.svelte';

  type User = { name: string; bio: string };

  let { sample = undefined }: { sample?: User } = $props();
  let user = $state<User | null>(null);

  export function set(next: User | null) {
    user = next;
  }
</script>

<div style="width: 320px">
  <Skeleton data={user} {sample}>
    {#snippet children(u)}
      <div style="padding: 16px; border: 1px solid #ccc">
        <h3 style="margin: 0">{u.name}</h3>
        <p style="margin: 4px 0 0">{u.bio}</p>
      </div>
    {/snippet}
  </Skeleton>
</div>
