<template>
  <div class="container">
    <SkeletonReveal :data="user" :sample="LOCHIE">
      <template #default="{ data }">
        <div class="card">
          <div class="avatar" />
          <div>
            <div class="name">{{ data.name }}</div>
            <div class="role">{{ data.role }}</div>
          </div>
        </div>
      </template>
    </SkeletonReveal>
    <button @click="reload">Reload</button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { SkeletonReveal } from "skullet/vue";

type User = { name: string; role: string };

const LOCHIE: User = { name: "Lochie Axon", role: "Design engineer" };
const user = ref<User | null>(null);

function reload() {
  user.value = null;
  setTimeout(() => {
    user.value = LOCHIE;
  }, 1500);
}

onMounted(reload);
</script>

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
