<!-- components/Header.vue -->
<template>
  <header class="header">
    <nav class="nav">
      <NuxtLink to="#" class="logo special">Резерви Фасиль</NuxtLink>
      <NuxtLink to="/booking" class="nav-link first">Забронировать столик</NuxtLink>
      <NuxtLink to="/about" class="nav-link">О нас</NuxtLink>
      <NuxtLink to="/profile" class="nav-link">Личный кабинет</NuxtLink>
    </nav>
    <p class='special'>Бронируйте места в любимых ресторанах легко!</p>
  </header>
</template>

<style scoped>
@import url('./Header.css');
</style>