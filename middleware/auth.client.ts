// middleware/auth.client.ts
export default defineNuxtRouteMiddleware((to) => {
  const publicPages = ['/'];
  
  // Если пользователь не авторизован и это не публичная страница
  if (!publicPages.includes(to.path) && !useCookie('auth_token').value) {
    return navigateTo('/');
  }
});