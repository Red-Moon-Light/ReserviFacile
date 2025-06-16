<template>
  <div class="auth-page">
    <div class="bg"></div>
    <div class="auth-container">
      <h1 class="special">Резерви Фасиль</h1>
      <p class="description">Платформа для онлайн-бронирования<br>мест в ресторанах
      </p>
      <p class="hint">Пожалуйста, пройдите авторизацию!</p>
      <div class="tabs">
        <button 
          @click="activeTab = 'login'"
          :class="{ 'active': activeTab === 'login' }"
        >
          Вход
        </button>
        <button 
          @click="activeTab = 'register'"
          :class="{ 'active': activeTab === 'register' }"
        >
          Регистрация
        </button>
      </div>

      <!-- Форма входа -->
      <form v-show="activeTab === 'login'" @submit.prevent="handleLogin">
        <div class="input-wrapper">
          <input 
            v-model="loginData.phone" ref="phoneInputLogin" class="input-phone"
            @accept="onPhoneAccept" placeholder="+7" required
          >
        </div>
        
        <div class="input-wrapper">
          <input class="password"
            :type="showLoginPassword ? 'text' : 'password'"
            v-model="loginData.password" placeholder="Пароль" required
          >
          <button 
            type="button" class="toggle-password"
            @click="showLoginPassword = !showLoginPassword"
          >
            {{ showLoginPassword ? '🙈' : '👁️' }}
          </button>
        </div>
        
        <button type="submit">Войти</button>
      </form>


      <!-- Форма регистрации -->
      <form v-show="activeTab === 'register'" @submit.prevent="handleRegister">

        <div class="input-wrapper">
          <input v-model="registerData.name" placeholder="Имя" required>
        </div>
        
        <div class="input-wrapper">
          <input 
            v-model="registerData.phone" ref="phoneInputReg" class="input-phone"
            @accept="onPhoneAccept" placeholder="+7" required
          >
        </div>

        <div class="input-wrapper">
          <input v-model="registerData.email" type="email" placeholder="Email" required>
        </div>

        <div class="input-wrapper">
          <input class="password"
            :type="showRegisterPassword ? 'text' : 'password'"
            v-model="registerData.password" placeholder="Пароль" required
          >
          <button 
            type="button" class="toggle-password"
            @click="showRegisterPassword = !showRegisterPassword"
          >
            {{ showRegisterPassword ? '🙈' : '👁️' }}
          </button>
        </div>

        <div class="input-wrapper">
          <input class="password"
            :type="showConfirmPassword ? 'text' : 'password'"
            v-model="registerData.confirmPassword" placeholder="Повтор пароля" required
          >
          <button 
            type="button" class="toggle-password"
            @click="showConfirmPassword = !showConfirmPassword"
          >
            {{ showConfirmPassword ? '🙈' : '👁️' }}
          </button>
        </div>

        <div class="checkbox-wrapper">
          <input type="checkbox" class="checkbox" required>
          <label class="checkbox-text">Я согласен с правилами использования платформы и даю
            разрешение на обработку моих персональных данных в соответствии с
            <NuxtLink to="#" class="checkbox-license-link">Лицензионным соглашением.</NuxtLink>
          </label>
        </div>
        
        <button type="submit">Зарегистрироваться</button>
      </form>

      <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
      <div v-if="successMessage" class="success">{{ successMessage }}</div>
    </div> 
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive } from 'vue';
import IMask from 'imask';

// Состояния для отображения паролей
const showLoginPassword = ref(false);
const showRegisterPassword = ref(false);
const showConfirmPassword = ref(false);

const phoneInputLogin = ref(null);
const phoneInputReg = ref(null);
// Конфиг маски для телефона
onMounted(() => {
  // Инициализация IMask
  const maskOptions = {
    mask: '+{7} 000 000 00 00', // Маска для номера телефона
    lazy: true, // Показывать маску сразу, без ожидания ввода
  };

  if (phoneInputLogin.value) {
    IMask(phoneInputLogin.value, maskOptions);
  }
  if (phoneInputReg.value) {
    IMask(phoneInputReg.value, maskOptions);
  }
});

// Обработчик обновления значения телефона
const onPhoneAccept = (e: CustomEvent) => {
  const maskRef = e.detail;
  if (activeTab.value === 'login') {
    loginData.phone = maskRef.value;
  } else {
    registerData.phone = maskRef.value;
  }
};

const activeTab = ref<'login' | 'register'>('login');
const errorMessage = ref('');
const successMessage = ref('');

// Реактивные данные для форм
const loginData = reactive({
  phone: '',
  password: ''
});

const registerData = reactive({
  name: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: ''
});

// Обработка входа
const handleLogin = async () => {
  errorMessage.value = '';

  if (loginData.phone.length < 10) {
    errorMessage.value = 'Номер телефона введён не полностью';
    return;
  }

  if (loginData.password.length < 8) {
    errorMessage.value = 'Пароль должен содержать минимум 8 символов';
    return;
  }

  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: loginData,
      credentials: 'include' // Важно для передачи Cookie
    });
    navigateTo('/booking');
  } catch (e) {
    // Типизация ошибки
    if (e instanceof Error && 'statusCode' in e) {
      const err = e as { statusCode: number };
      if (err.statusCode === 481) {
        errorMessage.value = 'Пользователь с таким номером не зарегистрирован';
      } else if (err.statusCode === 482) {
        errorMessage.value = 'Неверный пароль';
      } 
    } else {
        errorMessage.value = 'Неизвестная ошибка';
    }
  }
};

// Обработка регистрации
const handleRegister = async () => {
  errorMessage.value = '';

  if (registerData.password.length < 8) {
    errorMessage.value = 'Пароль должен содержать минимум 8 символов';
    return;
  }
  
  if (registerData.phone.length < 10) {
    errorMessage.value = 'Номер телефона введён не полностью';
    return;
  }

  if (registerData.password !== registerData.confirmPassword) {
    errorMessage.value = 'Пароли не совпадают';
    return;
  }

  try {
    const response = await $fetch('/api/auth/register', {
      method: 'POST',
      body: {
        name: registerData.name,
        phone: registerData.phone,
        email: registerData.email,
        password: registerData.password
      }
    });

    if (response.success) {
      successMessage.value = 'Регистрация успешна! Авторизуйтесь';
      activeTab.value = 'login';
      registerData.password = '';
      registerData.confirmPassword = '';
    }
  } catch (e) {
    // Типизация ошибки
    if (e instanceof Error && 'statusCode' in e) {
      const err = e as { statusCode: number };
      if (err.statusCode === 483) {
        errorMessage.value = 'Пользователь с данным номером телефона уже существует';
      } else if (err.statusCode === 484) {
        errorMessage.value = 'Пользователь с данной электронной почтой уже существует';
      } 
    } else {
        errorMessage.value = 'Неизвестная ошибка';
    }
  }
};
</script>

<style scoped src="./index.css">

</style>