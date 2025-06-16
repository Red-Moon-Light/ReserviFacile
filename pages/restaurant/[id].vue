<!-- pages/restaurant/[id].vue -->
<template>
  <div class="bg">

    <!-- Модальное окно подтверждения -->
    <div v-if="showBookingModal" class="modal">
      <div class="modal-content">
        <p>Стоимость предварительного бронирования данного столика:</p>
        <p class="modal-booking-price">{{ bookingPrice }} р.</p>
        <p>(Эта сумма будет вычтена из Вашего чека в ресторане)</p>
        <div class="modal-buttons">
          <button @click="confirmBooking" class="modal-confirm-btn">Перейти к оплате</button>
          <button @click="showBookingModal = false" class="modal-cancel-btn">Отмена</button>
        </div>
      </div>
    </div>

    <Header />
    <div class="container">
      <div class="filter-panel">

        <div class="page-title">
          <NuxtLink to="/booking" class="link-back">
            <img class="arrow" src="/public/svg/arrow-left.svg" alt="Назад к списку">
          </NuxtLink>
          <h1 v-if="restaurant" class="special">{{ restaurant.name }}</h1>
        </div>

        <!-- Поле для выбора адреса ресторана -->
        <select v-model="selectedAddress" class="select-address">
          <option v-for="addr in addresses" :key="addr.code" :value="addr.code">
            {{ addr.address }}
          </option>
        </select>

        <!-- Поле для выбора даты -->
        <input class="input-date"
          type="date" 
          v-model="selectedDate"
          :min="minDate"
          required
          placeholder="Выберите дату"
        >

        <!-- Поле для количества гостей -->
        <input class="input-guests"
          type="number" 
          v-model.number="guests"
          placeholder="Число гостей"
          min="1"
        >
      </div>

      <!-- Сообщение, если адрес или дата не выбрана -->
      <div v-if="!selectedAddress || !selectedDate" class="warning-message">
        Пожалуйста, выберите адрес ресторана и дату посещения для отображения доступных столиков.
      </div>

      <div class="tables-container" v-if="selectedAddress && selectedDate">
        <div v-if="filteredTables.length" class="tables-grid">
          <div v-for="table in filteredTables" :key="table.id" class="table-card">
            <h3 class="special">Столик №{{ table.table_number }}</h3>
            <div class="table-info">
              <p>Мест: {{ table.seats }}</p>
              <p>Тариф: {{ table.hourly_rate }} р./час</p>
            </div>

            <div class="hint" style="margin-top: 5px;">Время посещения</div>

            <div class="time-slots">
              <div
                v-for="hour in timeSlots"
                :key="hour"
                :class="getSlotClass(hour, table)"
                @click="selectSlot(hour, table)"
              >
                {{ hour }}:00
              </div>
            </div>

            <div class="booking-controls">
            <div class="hint">Длительность бронирования</div>

              <select v-model="selectedDuration[table.id]" class="duration">
                <option v-for="d in durations[table.id]" :value="d" :key="d">
                  {{ d }} час{{ d > 1 && d < 5 ? 'а' : '' }}{{ d >= 5 ? 'ов' : '' }}
                </option>
              </select>
              <p>Стоимость: {{ calculatePrice(table) }} р.</p>
              <button 
                @click="openBookingModal(table)"
                :disabled="!canBook(table)"
              >
                Забронировать
              </button>
            </div>
          </div>
        </div>
        <div v-else class="no-tables-message">
          На данное число гостей нет доступных столиков
        </div>
      </div>

    </div>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { format, isToday } from 'date-fns';

interface Restaurant {
  id: number;
  name: string;
  addresses: string[];
}

interface Table {
  id: string;
  address_code: string;
  table_number: number;
  seats: number;
  hourly_rate: number;
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

const route = useRoute();
const restaurantId = parseInt(route.params.id as string);

// Загрузка данных ресторана с явной типизацией
const restaurant = ref<Restaurant>();
onMounted(async () => {
  const data = await $fetch<Restaurant>(`/api/restaurants/${restaurantId}`);
  if (!data) throw createError({ statusCode: 404, message: 'Ресторан не найден' });
  restaurant.value = data;
});

// Фильтрация
const selectedAddress = ref('');
const selectedDate = ref(format(new Date(), 'yyyy-MM-dd'));
const guests = ref<number | null>(null);
const minDate = ref(new Date().toISOString().split('T')[0]);
const tables = ref<Table[]>([]);
const selectedHour = ref<Record<string, number | undefined>>({});
const selectedDuration = ref<Record<string, number | undefined>>({});
const bookings = ref<Record<string, any[]>>({});
const durations = ref<Record<string, number[]>>({});
const loading = ref(false);

const filteredTables = computed(() => {
  if (!guests.value || guests.value < 1) return tables.value;
  return tables.value.filter(table => table.seats === guests.value);
});
// Добавляем watch для guests
watch(guests, (newVal) => {
  if (newVal && newVal < 1) guests.value = null;
});

// Преобразование адресов ресторана
const addresses = computed(() => {
  // Проверяем, что restaurant.value существует и содержит addresses
  if (!restaurant.value?.addresses) return [];
  
  return restaurant.value.addresses.map(addr => {
    const [code, address, timeRange] = addr.split('/');
    const [opening, closing] = timeRange.split('-');
    return { code, address, opening, closing };
  });
});


// Наблюдатель для установки первого адреса по умолчанию
watch(addresses, (newAddresses) => {
  if (newAddresses.length > 0 && selectedAddress.value === '') {
    selectedAddress.value = newAddresses[0].code;
  }
});



// Добавляем вычисление графика работы для выбранного адреса
const currentSchedule = computed(() => {
  return addresses.value.find(a => a.code === selectedAddress.value);
});



// Загрузка столиков при изменении фильтров
watch([selectedAddress, selectedDate], async ([address, date]) => {
  if (!address || !date) return;
  
  const data = await $fetch(`/api/restaurants/${route.params.id}/tables`, {
    params: { address }
  });
  
  tables.value = data as Table[];
  loadBookings();
});

// Загрузка бронирований
async function loadBookings() {
  for (const table of tables.value) {
    const data = await $fetch<Booking[]>('/api/bookings', {
      params: { 
        tableId: table.id,
        date: selectedDate.value
      }
    });
    bookings.value[table.id] = data || [];
  }
}

// Логика временных слотов
const timeSlots = computed(() => {
  if (!currentSchedule.value) return [];
  
  const now = new Date();
  const currentHour = isToday(selectedDate.value) ? now.getHours() : 0;
  
  // Парсим время работы
  const [openHour] = currentSchedule.value.opening.split(':').map(Number);
  const [closeHour] = currentSchedule.value.closing.split(':').map(Number);
  
  // Генерируем все слоты в рамках графика
  const allSlots = Array.from({ length: closeHour - openHour }, (_, i) => openHour + i);
  
  return allSlots;
});

const isSlotDisabled = (hour: number) => {
  if (!isToday(selectedDate.value)) return false;
  
  const now = new Date();
  const currentHour = now.getHours();
  return hour <= currentHour + 1;
};

function getSlotClass(hour: number, table: Table) {
  const isBooked = bookings.value[table.id]?.some(b => {
    const start = parseInt(b.start_time.split(':')[0]);
    const end = parseInt(b.end_time.split(':')[0]);
    return hour >= start && hour < end;
  });
  
  return {
    'time-slot': true,
    booked: isBooked,
    'disabled-slot': isSlotDisabled(hour),
    selected: selectedHour.value[table.id] === hour
  };
}

// Выбор временного слота
function selectSlot(hour: number, table: Table) {
  if (getSlotClass(hour, table).booked || isSlotDisabled(hour)) return;
  selectedHour.value[table.id] = hour;
  calculateDurations(table);
}

// Расчет доступных длительностей
function calculateDurations(table: Table) {
  const bookingsForTable = bookings.value[table.id] || [];
  const start = selectedHour.value[table.id];
  if (!start || !currentSchedule.value) return;

  const [closeHour] = currentSchedule.value.closing.split(':').map(Number);
  const maxAvailable = closeHour - start;
  
  let maxDuration = 0;
  for (let i = 1; i <= maxAvailable; i++) {
    const endHour = start + i;
    const isBooked = bookingsForTable.some(b => 
      endHour > parseInt(b.start_time) && start < parseInt(b.end_time)
    );
    if (isBooked) break;
    maxDuration = i;
  }
  
  durations.value[table.id] = Array.from(
    { length: maxDuration }, 
    (_, i) => i + 1
  );

  // Устанавливаем 1 час по умолчанию, если доступен
  if (durations.value[table.id]?.length) {
    selectedDuration.value[table.id] = 1;
  }
}

// Расчет стоимости
function calculatePrice(table: Table): number {
  const duration = selectedDuration.value[table.id] || 0;
  return table.hourly_rate * duration;
}

// Добавляем вычисляемую стоимость для отображения в модальном окне
const bookingPrice = computed(() => {
  if (!selectedTable.value) return 0;
  return calculatePrice(selectedTable.value);
});

// Добавляем состояния для модального окна
const showBookingModal = ref(false);
const selectedTable = ref<Table | null>(null);

// Открытие модального окна
const openBookingModal = (table: Table) => {
  selectedTable.value = table;
  showBookingModal.value = true;
};

// Подтверждение бронирования
const confirmBooking = async () => {
  if (selectedTable.value) {
    await performBooking(selectedTable.value);
    showBookingModal.value = false;
    selectedTable.value = null;
  }
};

// Проверка условий бронирования
function canBook(table: Table): boolean {
  return !!selectedHour.value[table.id] && !!selectedDuration.value[table.id];
}

// Отправка брони
async function performBooking(table: Table) {
  try {
    loading.value = true;
    await $fetch('/api/bookings', {
      method: 'POST',
      body: {
        tableId: table.id,
        date: selectedDate.value,
        start: selectedHour.value[table.id] + ':00',
        duration: selectedDuration.value[table.id]
      }
    });

    // Сбрасываем выбранные значения для этого столика
    selectedHour.value[table.id] = undefined as unknown as number | undefined;
    selectedDuration.value[table.id] = undefined as unknown as number | undefined;

    await loadBookings();
  } finally {
    loading.value = false;
  }
}

</script>

<style scoped src="./id.css">

</style>
