<template>
  <v-app :dir="'rtl'">
    <router-view />
  </v-app>
</template>

<script setup>
import { onMounted } from 'vue';
import { useAuthStore } from './stores/authStore';

const authStore = useAuthStore();

onMounted(() => {
  authStore.checkAuth();
});
</script>
