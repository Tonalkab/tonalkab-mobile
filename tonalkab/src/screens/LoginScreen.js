// src/screens/LoginScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/client';

export default function LoginScreen({ navigation }) {
  const [isRegistering, setIsRegistering] = useState(false); // Alterna entre Login y Registro
  const [nombre, setNombre] = useState(''); // Solo se usa en el registro
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      return Alert.alert("Campos incompletos", "Por favor ingresa tu correo y contraseña.");
    }

    if (isRegistering && !nombre) {
      return Alert.alert("Falta tu nombre", "Por favor ingresa tu nombre para registrarte.");
    }

    setIsLoading(true);

    try {
      if (isRegistering) {
        // 1. FLUJO DE REGISTRO
        // Basado en tu schema UserCreate: nombre, email, password
        await apiClient.post('/users', { nombre, email, password });
        Alert.alert("¡Registro exitoso!", "Ahora puedes iniciar sesión con tus credenciales.");
        setIsRegistering(false); // Cambiamos la vista a Login
        setPassword(''); // Limpiamos la contraseña por seguridad
      } else {
        // 2. FLUJO DE LOGIN TRADICIONAL
        const res = await apiClient.post('/login', { email, password });
        
        // Guardamos el JWT que devuelve tu backend
        await AsyncStorage.setItem('userToken', res.data.access_token);
        
        // Redirigimos al Home
        navigation.replace('Home');
      }
    } catch (error) {
      // Manejo de errores basado en las respuestas de FastAPI
      const msg = error.response?.data?.detail || "Ocurrió un error con el servidor";
      Alert.alert(isRegistering ? "Error al registrar" : "Fallo al entrar", msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Text style={styles.title}>🌱 Tonalkab</Text>
      <Text style={styles.subtitle}>Conectando con la naturaleza</Text>

      <View style={styles.formContainer}>
        {/* Campo de Nombre (Solo visible si está en modo registro) */}
        {isRegistering && (
          <TextInput 
            style={styles.input} 
            placeholder="Nombre completo" 
            placeholderTextColor="#94A3B8"
            autoCapitalize="words"
            value={nombre}
            onChangeText={setNombre}
          />
        )}

        <TextInput 
          style={styles.input} 
          placeholder="Correo electrónico" 
          placeholderTextColor="#94A3B8"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput 
          style={styles.input} 
          placeholder="Contraseña" 
          placeholderTextColor="#94A3B8"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {/* Botón Principal (Cambia de texto según el modo) */}
        <TouchableOpacity 
          style={styles.mainBtn} 
          onPress={handleAuth}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>
              {isRegistering ? "Crear Cuenta" : "Iniciar Sesión"}
            </Text>
          )}
        </TouchableOpacity>

        {/* Alternar entre Login y Registro */}
        <TouchableOpacity 
          style={styles.switchModeBtn} 
          onPress={() => {
            setIsRegistering(!isRegistering);
            setPassword(''); // Limpia la contraseña al cambiar de modo
          }}
        >
          <Text style={styles.switchModeText}>
            {isRegistering 
              ? "¿Ya tienes cuenta? Inicia sesión aquí" 
              : "¿No tienes cuenta? Regístrate aquí"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', padding: 25 },
  title: { fontSize: 40, fontWeight: 'bold', color: '#4ADE80', textAlign: 'center', marginBottom: 5 },
  subtitle: { fontSize: 16, color: '#94A3B8', textAlign: 'center', marginBottom: 40 },
  formContainer: { backgroundColor: 'rgba(30, 41, 59, 0.7)', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  input: { backgroundColor: '#0F172A', color: '#F8FAFC', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#334155' },
  mainBtn: { backgroundColor: '#16A34A', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  switchModeBtn: { marginTop: 20, alignItems: 'center' },
  switchModeText: { color: '#4ADE80', fontWeight: '600', fontSize: 14 }
});