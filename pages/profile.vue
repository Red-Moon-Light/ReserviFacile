<!-- pages/profile.vue -->
<template>
  <div class="bg">
    <div v-if="showNotification" class="notification">
      {{ notificationMessage }}
    </div>

    <!-- Модальное окно подтверждения -->
    <div v-if="showCancelModal" class="modal">
      <div class="modal-content">
        <p class="modal-main">Вы уверены, что хотите отменить бронь?</p>
        <p class="modal-comment">
          Если вы отменяете бронь не позднее, чем за 3 часа до назначенного времени,
          Вам будет возвращено 70% от стоимости предварительного бронирования в течение 2 рабочих дней.
        </p>
        <div class="modal-buttons">
          <button @click="confirmCancel" class="modal-confirm-btn">Подтвердить</button>
          <button @click="showCancelModal = false" class="modal-cancel-btn">Назад</button>
        </div>
      </div>
    </div>

    <Header />
    <div class="container">
      <!-- Секция информации о пользователе -->
      <div class="user-profile">
        <h2 class="special page-title-pc">~~~ Личный кабинет ~~~</h2>
        <h2 class="special page-title-mobile">Личный кабинет</h2>
        <div class="user-info">
          <p><strong class="special">Имя:</strong> {{ userData?.name || 'Не указано' }}</p>
          <p><strong class="special">Телефон:</strong> {{ userData?.phone || 'Не указан' }}</p>
          <p><strong class="special">Email:</strong> {{ userData?.email || 'Не указан' }}</p>
        </div>
        <button @click="logout" class="logout-btn">Выйти из аккаунта</button>
      </div>

      <!-- Секция бронирований -->
      <div class="bookings-section">
        <h3 class="special page-title-pc">~~~ Мои бронирования ~~~</h3>
        <h3 class="special page-title-mobile">Мои бронирования</h3>
        <div class="bookings-list">
          <div v-for="booking in bookings" :key="booking.id" class="booking-card">
            <h4>{{ booking.restaurantName }} {{ booking.address }}</h4>
            <div class="booking-info">
              <p>Столик №{{ booking.tableNumber }}</p>
                <p>{{ formatDate(booking.booking_date) }} {{ booking.start_time }} - {{ booking.end_time }}</p>
              <p class="price">Стоимость: {{ booking.price }}₽</p>
            </div>
            <button 
              @click="openCancelModal(booking.id)"
              class="cancel-btn"
            >
              Отменить бронь
            </button>
          </div>
          <div v-if="bookings.length == 0" class="no-bookings">
            У вас пока нет активных бронирований
          </div>
        </div>
      </div>
    </div>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface User {
  id: number;
  name: string;
  phone: string;
  email: string;
}

interface Booking {
  id: number;
  restaurantName: string;
  address: string;
  tableNumber: number;
  booking_date: string;
  start_time: string;
  end_time: string;
  price: number;
}

const userData = ref<User | null>(null);

// Загрузка данных пользователя
const loadUserData = async () => {
  try {
    const { data } = await useFetch<User>('/api/auth/me');
    userData.value = data.value;
  } catch (e) {
    console.error('Ошибка загрузки данных пользователя:', e);
  }
};

// Выход из аккаунта
const logout = async () => {
  try {
    await $fetch('/api/auth/logout', { method: 'POST' });
    navigateTo('/');
  } catch (e) {
    console.error('Ошибка при выходе:', e);
  }
};

const bookings = ref<Booking[]>([]);

async function loadBookings() {
  try {
    const { data } = await useFetch<Booking[]>('/api/bookings/my', {
      headers: {
        Authorization: `Bearer ${useCookie('auth_token').value}`
      }
    });
    bookings.value = data.value || [];
  } catch (e) {
    console.error('Ошибка загрузки бронирований:', e);
  }
}

// Инициализация
onMounted(() => {
  loadUserData();
  loadBookings();
});

// Добавьте форматирование даты
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ru-RU');
};

// Добавляем состояния для уведомлений
const showNotification = ref(false);
const notificationMessage = ref('');


const showCancelModal = ref(false);
const selectedBookingId = ref<number | null>(null);

// Открытие модального окна
const openCancelModal = (bookingId: number) => {
  selectedBookingId.value = bookingId;
  showCancelModal.value = true;
};

// Подтверждение отмены
const confirmCancel = async () => {
  if (selectedBookingId.value !== null) {
    await cancelBooking(selectedBookingId.value);
    showCancelModal.value = false;
    selectedBookingId.value = null;
  }
};

// Метод отмены брони
async function cancelBooking(bookingId: number) {
  try {
    await $fetch(`/api/bookings/${bookingId}`, {
      method: 'DELETE' as any,
      headers: {
        Authorization: `Bearer ${useCookie('auth_token').value}`
      }
    });
    
    notificationMessage.value = 'Бронирование успешно отменено';
    showNotification.value = true;
    setTimeout(() => showNotification.value = false, 5000);
    
    await loadBookings();
  } catch (e) {
    console.error('Ошибка отмены брони:', e);
    notificationMessage.value = 'Ошибка при отмене бронирования';
    showNotification.value = true;
    setTimeout(() => showNotification.value = false, 5000);
  } finally {
    showCancelModal.value = false;
  }
}

</script>

<style scoped src="./profile.css">

</style>