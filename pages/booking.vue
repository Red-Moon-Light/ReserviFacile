<template>
  <div class="bg">
    <Header />
    <div class="container">
      <h1 class="choose special page-title-pc">~~~ Выберите ресторан ~~~</h1>
      <h1 class="choose special page-title-mobile">Выберите ресторан</h1>
      
      <div v-if="pending" class="loading">Загрузка ресторанов...</div>
      <div v-else-if="error" class="error">Ошибка загрузки: {{ error.message }}</div>
      
      <div v-else>
        <input
          v-model="searchQuery"
          placeholder="Поиск по названию ресторана"
          class="search-input"
        />
        <div class="restaurants-list">
          <div 
            v-for="restaurant in filteredRestaurants" 
            :key="restaurant.id"
            class="restaurant-card"
            :style="{ backgroundImage: `url(${restaurant.image})` }"
            @click="navigateToRestaurant(restaurant.id)"
          >
            <div class="restaurant-name special">{{ restaurant.name }}</div>
          </div>
        </div>
        <div v-if="filteredRestaurants.length == 0" class="search-no-result">
          Рестораны с таким названием не зарегистрированы в платформе
        </div>
      </div>
    </div>

    <div v-if="error" class="error">
        {{ error.data?.details || error.message }}
    </div>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

interface Restaurant {
  id: number;
  name: string;
  image: string;
  addresses: string[];
}

const { 
  data: restaurants,
  pending,
  error
} = await useFetch<Restaurant[]>('/api/restaurants');

const searchQuery = ref('');

const filteredRestaurants = computed(() => {
  if (!restaurants.value) return [];
  const query = searchQuery.value.toLowerCase().trim();
  return restaurants.value.filter(restaurant =>
    restaurant.name.toLowerCase().includes(query)
  );
});


const navigateToRestaurant = (id: number) => {
  navigateTo(`/restaurant/${id}`);
};
</script>

<style scoped src="./booking.css">

</style>