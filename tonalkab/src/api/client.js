// src/api/client.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Apuntamos directamente a tu backend en producción
const apiClient = axios.create({
  baseURL: 'https://api.tonalkab.com', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Antes de que salga cualquier petición, busca el JWT y lo añade
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; // Tu backend espera el formato Bearer
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default apiClient;