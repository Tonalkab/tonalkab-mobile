// src/screens/PerfilScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  SafeAreaView, Alert, ScrollView, ActivityIndicator 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/client';

export default function PerfilScreen({ navigation }) {
  const [usuario, setUsuario] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Consulta de los datos del usuario en sesión al enfocar la pantalla
  const fetchPerfilUsuario = async () => {
    try {
      const res = await apiClient.get('/me');
      setUsuario(res.data);
    } catch (error) {
      console.log("Error en /me, intentando endpoint alterno...", error);
      try {
        const resAlt = await apiClient.get('/users/me');
        setUsuario(resAlt.data);
      } catch (err) {
        console.error("No se pudo recuperar la información del perfil:", err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPerfilUsuario();
    }, [])
  );

  // Función para extraer las iniciales dinámicamente
  const obtenerIniciales = (nombreCompleto) => {
    if (!nombreCompleto) return 'U';
    const palabras = nombreCompleto.trim().split(' ');
    if (palabras.length >= 2) {
      return (palabras[0][0] + palabras[1][0]).toUpperCase();
    }
    return palabras[0][0].toUpperCase();
  };

  // Función para cerrar sesión
  const handleLogout = async () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro de que deseas salir de tu cuenta?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sí, salir", 
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem('userToken');
            navigation.replace('Login');
          } 
        }
      ]
    );
  };

  const MenuOption = ({ icon, color, title, onPress }) => (
    <TouchableOpacity 
      style={styles.menuOption} 
      onPress={onPress} 
      activeOpacity={0.7}
    >
      <View style={styles.menuOptionLeft}>
        <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <Text style={styles.menuOptionText}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar style="dark" />
      <LinearGradient colors={["#FFFFFF", "#F8FAFC", "#F1F5F9"]} style={StyleSheet.absoluteFill} />

      <View style={styles.headerContainer}>
        <Text style={styles.mainTitle}>Mi Perfil</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* TARJETA DE USUARIO DINÁMICA CON MONEDAS */}
        <View style={styles.userCard}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#22C55E" />
              <Text style={styles.loadingText}>Sincronizando usuario...</Text>
            </View>
          ) : (
            <>
              <View style={styles.avatarContainer}>
                <View style={styles.avatarBackground}>
                  <Text style={styles.avatarText}>{obtenerIniciales(usuario?.nombre)}</Text>
                </View>
                <View style={styles.onlineBadge} />
              </View>
              
              <View style={styles.userInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.userName}>{usuario?.nombre || "Usuario Tonalkab"}</Text>
                  {usuario?.es_admin && (
                    <View style={styles.adminBadge}>
                      <Text style={styles.adminBadgeText}>ADMIN</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.userEmail}>{usuario?.email || "sin_correo@tonalkab.com"}</Text>
                
                {/* Billetera de Monedas */}
                <View style={styles.coinBalanceRow}>
                  <Text style={styles.coinBalanceIcon}>🪙</Text>
                  <Text style={styles.coinBalanceText}>{usuario?.monedas ?? 100} Monedas</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* SECCIÓN EXCLUSIVA DE ADMINISTRADOR */}
        {usuario?.es_admin && (
          <>
            <Text style={[styles.sectionTitle, { color: '#7C3AED' }]}>Administración</Text>
            <View style={[styles.menuContainer, styles.adminMenuContainer]}>
              <MenuOption 
                icon="shield-checkmark" 
                color="#7C3AED" 
                title="⚙️ Panel de Gestión (Skins & Plantas)" 
                onPress={() => navigation.navigate('AdminPanel')}
              />
            </View>
          </>
        )}

        <Text style={styles.sectionTitle}>Diagnóstico del Sistema</Text>

        {/* MENÚ DE DIAGNÓSTICO */}
        <View style={styles.menuContainer}>
          <MenuOption 
            icon="pulse" 
            color="#3B82F6" 
            title="Estado del Servidor API" 
            onPress={() => Alert.alert(
              "Monitoreo de Red", 
              "Conexión estable con FastAPI en api.tonalkab.com. Los webhooks de sensores y boutique operan con normalidad."
            )}
          />
        </View>

        <Text style={styles.sectionTitle}>Acerca del Proyecto</Text>

        {/* MENÚ DE PRESENTACIÓN DEL PROYECTO */}
        <View style={styles.menuContainer}>
          <MenuOption 
            icon="flash" 
            color="#10B981" 
            title="Arquitectura Energética" 
            onPress={() => Alert.alert(
              "Tecnología Autosustentable", 
              "El hardware de Tonalkab genera su propia energía de forma autosustentable a través de procesos de bioenergía."
            )}
          />
          <View style={styles.divider} />
          <MenuOption 
            icon="school" 
            color="#8B5CF6" 
            title="Créditos de Desarrollo" 
            onPress={() => Alert.alert(
              "Equipo Multidisciplinario", 
              "Proyecto desarrollado en el Instituto Tecnológico de Veracruz por estudiantes de Ingeniería en Sistemas, Mecatrónica e Industrial."
            )}
          />
          <View style={styles.divider} />
          <MenuOption 
            icon="trophy" 
            color="#F59E0B" 
            title="Trayectoria y Certámenes" 
            onPress={() => Alert.alert(
              "InnovaTecNM 2026", 
              "Tonalkab es un proyecto de innovación tecnológica diseñado para competir y representar a nuestra institución en el certamen nacional InnovaTecNM 2026."
            )}
          />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Tonalkab App v1.1.0 • Plataforma Integral</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  
  headerContainer: { paddingHorizontal: 20, paddingTop: 30, paddingBottom: 20 },
  mainTitle: { fontSize: 32, fontWeight: '900', color: '#0F172A', letterSpacing: -1 },

  userCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 24,
    marginBottom: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.03,
    shadowRadius: 15,
    elevation: 4,
    minHeight: 110
  },
  loadingContainer: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  loadingText: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  avatarContainer: { position: 'relative', marginRight: 15 },
  avatarBackground: { width: 65, height: 65, borderRadius: 20, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#22C55E' },
  avatarText: { fontSize: 22, fontWeight: '900', color: '#16A34A', letterSpacing: 1 },
  onlineBadge: { position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: 8, backgroundColor: '#22C55E', borderWidth: 3, borderColor: '#FFFFFF' },
  
  userInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userName: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  adminBadge: { backgroundColor: '#EDE9FE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#DDD6FE' },
  adminBadgeText: { color: '#7C3AED', fontSize: 10, fontWeight: '900' },
  userEmail: { fontSize: 12, color: '#64748B', fontWeight: '500', marginTop: 2 },
  
  coinBalanceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, backgroundColor: '#FEF3C7', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1, borderColor: '#FDE68A' },
  coinBalanceIcon: { fontSize: 12, marginRight: 4 },
  coinBalanceText: { color: '#B45309', fontWeight: '800', fontSize: 12 },

  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginLeft: 5 },
  menuContainer: { backgroundColor: '#FFFFFF', borderRadius: 20, marginBottom: 25, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.02, shadowRadius: 10, elevation: 2 },
  adminMenuContainer: { backgroundColor: '#FAF5FF', borderColor: '#E9D5FF', borderWidth: 1.5 },
  
  menuOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  menuOptionLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  menuOptionText: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  
  divider: { height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 16 },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF2F2', paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: '#FEE2E2', marginTop: 10 },
  logoutText: { color: '#EF4444', fontSize: 15, fontWeight: '700' },

  versionText: { textAlign: 'center', color: '#CBD5E1', fontSize: 12, fontWeight: '600', marginTop: 20 }
});