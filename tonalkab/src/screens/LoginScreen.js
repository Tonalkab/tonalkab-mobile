// src/screens/LoginScreen.js
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  Animated, Easing, Dimensions, 
  Image // 1. IMPORTACIÓN AGREGADA AQUÍ
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import apiClient from '../api/client';

const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // --- Valores Animados ---
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.exp)
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.exp)
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true
      })
    ]).start();
  }, []);

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
        await apiClient.post('/users', { nombre, email, password });
        Alert.alert("¡Registro exitoso!", "Ahora puedes iniciar sesión con tus credenciales.");
        setIsRegistering(false);
        setPassword('');
      } else {
        const res = await apiClient.post('/login', { email, password });
        await AsyncStorage.setItem('userToken', res.data.access_token);
        navigation.replace('Home');
      }
    } catch (error) {
      const msg = error.response?.data?.detail || "Ocurrió un error con el servidor";
      Alert.alert(isRegistering ? "Error al registrar" : "Fallo al entrar", msg);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setPassword('');
    slideAnim.setValue(20);
    fadeAnim.setValue(0.5);
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, friction: 7, tension: 50, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true })
    ]).start();
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.mainContainer}
    >
      <StatusBar style="dark" />
      
      <LinearGradient 
        colors={["#FFFFFF", "#F0FDF4"]} 
        style={StyleSheet.absoluteFill} 
      />

      <Animated.View style={[
        styles.contentContainer, 
        { 
          opacity: fadeAnim, 
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }] 
        }
      ]}>
        
        {/* Cabecera Minimalista */}
        <View style={styles.header}>
          {/* 2. CAMBIO AQUÍ: Emoji eliminado, Imagen agregada */}
          <Image 
            source={require('../../assets/logo.png')} // Asegúrate de que esta ruta sea correcta
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.title}>Tonalkab</Text>
          <Text style={styles.subtitle}>Conectando con la naturaleza</Text>
        </View>

        {/* Contenedor del Formulario */}
        <View style={styles.formContainer}>
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

          <TouchableOpacity 
            style={styles.mainBtn} 
            onPress={handleAuth}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>
                {isRegistering ? "Crear Cuenta" : "Iniciar Sesión"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.switchModeBtn} 
          onPress={toggleMode}
          activeOpacity={0.6}
        >
          <Text style={styles.switchModeText}>
            {isRegistering 
              ? "¿Ya tienes cuenta? Inicia sesión" 
              : "¿No tienes cuenta? Regístrate"}
          </Text>
        </TouchableOpacity>

      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { 
    flex: 1, 
    justifyContent: 'center', 
  },
  contentContainer: {
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  header: { 
    alignItems: 'center', 
    marginBottom: 40 
  },
  // 3. NUEVO ESTILO PARA LA IMAGEN DEL LOGO
  logoImage: {
    width: 100, // Ajusta el ancho según tu logo
    height: 100, // Ajusta el alto según tu logo
    marginBottom: 10,
    // Pequeña sombra sutil para dar relieve, estilo Soft UI
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  title: { 
    fontSize: 36, 
    fontWeight: '900', 
    color: '#0F172A', 
    letterSpacing: -1,
  },
  subtitle: { 
    fontSize: 15, 
    color: '#64748B', 
    marginTop: 5,
    fontWeight: '500'
  },
  formContainer: { 
    width: '100%',
    backgroundColor: '#FFFFFF', 
    padding: 25, 
    borderRadius: 24, 
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5, 
    borderWidth: 1, 
    borderColor: '#F1F5F9' 
  },
  input: { 
    backgroundColor: '#F8FAFC', 
    color: '#0F172A', 
    padding: 18, 
    borderRadius: 16, 
    marginBottom: 15, 
    fontSize: 15,
    fontWeight: '500',
    borderWidth: 1, 
    borderColor: '#E2E8F0' 
  },
  mainBtn: { 
    backgroundColor: '#22C55E', 
    padding: 18, 
    borderRadius: 16, 
    alignItems: 'center', 
    marginTop: 10,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  btnText: { 
    color: 'white', 
    fontWeight: 'bold', 
    fontSize: 16,
    letterSpacing: 0.5
  },
  switchModeBtn: { 
    marginTop: 30, 
    padding: 10
  },
  switchModeText: { 
    color: '#16A34A', 
    fontWeight: '600', 
    fontSize: 14 
  }
});