// src/api/client.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Apuntamos directamente a tu backend en producción
const apiClient = axios.create({
  baseURL: 'https://api.tonalkab.com', 
  timeout: 15000, // 15 segundos máximo por petición para evitar bloqueos
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de Solicitud: Inyecta el token Bearer JWT
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor de Respuesta: Maneja tokens expirados (401) y errores globales
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Si el token expiró o es inválido, limpiamos la sesión local
      console.warn("Sesión expirada o token inválido (401). Limpiando credenciales...");
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
    }
    return Promise.reject(error);
  }
);

export default apiClient;