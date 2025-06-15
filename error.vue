<template>
  <div class="error-page">
      <h1>{{ error.statusCode }}</h1>
      <p class="message">{{ error.message }}</p>
      
      <button @click="handleError">
      {{ error.statusCode === 401 ? 'Перейти к авторизации' : 'На главную' }}
      </button>
  </div>
</template>

<script setup>
const { error } = defineProps(['error'])
const handleError = () => clearError({ redirect: error.statusCode === 401 ? '/' : '/booking' })
</script>

<style>
.error-page {
  text-align: center;
  padding: 2rem;
}

.error-page h1 {
  font-size: 8rem;
  color: #dc3545;
  margin: 0;
}

.message {
  font-size: 1.5rem;
  margin: 1rem 0;
}

button {
  padding: 12px 24px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>