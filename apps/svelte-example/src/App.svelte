<script lang="ts">
  import { onMount } from 'svelte';
  import { Skeleton } from 'skullet/svelte';

  type User = { name: string; role: string };

  const LOCHIE: User = { name: 'Lochie Axon', role: 'Design engineer' };
  let user = $state<User | null>(null);

  function reload() {
    user = null;
    setTimeout(() => {
      user = LOCHIE;
    }, 1500);
  }

  onMount(reload);
</script>

<div class="container">
  <Skeleton data={user} sample={LOCHIE}>
    {#snippet children(user)}
      <div class="card">
        <div class="avatar"></div>
        <div>
          <div class="name">{user.name}</div>
          <div class="role">{user.role}</div>
        </div>
      </div>
    {/snippet}
  </Skeleton>
  <button onclick={reload}>Reload</button>
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 24px;
    height: 100vh;
    font-family: system-ui;
  }

  .card {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 16px;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgb(0 0 0 / 0.2);
  }

  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #ddd;
  }

  .name {
    font-weight: 600;
  }

  .role {
    color: #666;
  }
</style>
