// src/screens/MacetaDetailScreen.js
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  ScrollView, TouchableOpacity, Image, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import apiClient from '../api/client';

const { width } = Dimensions.get('window');

export default function MacetaDetailScreen({ route, navigation }) {
  const { id_maceta, nombre_maceta, skin_actual_id } = route.params;

  const [lectura, setLectura] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const baseURL = apiClient.defaults.baseURL || 'https://api.tonalkab.com';

  useEffect(() => {
    const fetchLecturaActual = async () => {
      try {
        const response = await apiClient.get(`/macetas/${id_maceta}/lecturas/actual`);
        setLectura(response.data);
      } catch (error) {
        console.log("Error en detalle:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLecturaActual();
  }, [id_maceta]);

  const SensorPill = ({ icon, label, value, unit, color }) => (
    <View style={styles.sensorPill}>
      <View style={[styles.iconCircle, { backgroundColor: color + '20' }]}>
        <Text style={styles.pillIcon}>{icon}</Text>
      </View>
      <View>
        <Text style={styles.pillLabel}>{label}</Text>
        <Text style={styles.pillValue}>{value}{unit}</Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar style="dark" />
      <LinearGradient colors={["#FFFFFF", "#F0FDF4"]} style={StyleSheet.absoluteFill} />

      {/* 🌿 CABECERA DINÁMICA: Muestra la Skin seleccionada */}
      <View style={styles.heroSection}>
        <View style={styles.skinCircle}>
          {lectura?.skin_activa?.imagen_url ? (
            <Image 
              source={{ uri: `${baseURL}${lectura.skin_activa.imagen_url}` }} 
              style={styles.skinImage}
              resizeMode="contain"
            />
          ) : (
            <Text style={styles.emojiLarge}>🌱</Text>
          )}
        </View>
        <Text style={styles.mainTitle}>{nombre_maceta}</Text>
        <Text style={styles.idText}>Dispositivo Tonalkab #{id_maceta}</Text>
      </View>

      {/* 📊 PANEL DE ESTADO RÁPIDO */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Estado Vital</Text>
        <View style={styles.grid}>
          <SensorPill icon="💧" label="Humedad" value={lectura?.humedad_suelo || 0} unit="%" color="#3B82F6" />
          <SensorPill icon="🌡️" label="Temp" value={lectura?.temperatura || 0} unit="°C" color="#EF4444" />
          <SensorPill icon="☀️" label="Luz UV" value={lectura?.nivel_luz || 0} unit="" color="#F59E0B" />
          <SensorPill icon="🔋" label="Energía" value={lectura?.voltaje_bateria || 0} unit="V" color="#10B981" />
        </View>
      </View>

      {/* 💧 NIVEL DE AGUA (Depósito) */}
      <View style={styles.waterCard}>
        <View style={styles.waterInfo}>
          <Text style={styles.waterTitle}>Depósito de Agua</Text>
          <Text style={styles.waterPercent}>{lectura?.nivel_agua || 0}%</Text>
        </View>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${lectura?.nivel_agua || 0}%` }]} />
        </View>
        <Text style={styles.waterHint}>
          {lectura?.nivel_agua < 20 ? "⚠️ ¡Rellena pronto!" : "Nivel óptimo para 3 días"}
        </Text>
      </View>

      {/* 🛠️ ACCIONES */}
      <View style={styles.actionsGrid}>
        <TouchableOpacity 
          style={[styles.actionBtn, { backgroundColor: '#3B82F6' }]}
          onPress={() => navigation.navigate('MacetaStats', { id_maceta, nombre_maceta })}
        >
          <Text style={styles.actionBtnText}>Historial 📈</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionBtn, { backgroundColor: '#22C55E' }]}
          onPress={() => navigation.navigate('MacetaConfig', { id_maceta, nombre_maceta })}
        >
          <Text style={styles.actionBtnText}>Ajustes ⚙️</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionBtn, { backgroundColor: '#8B5CF6', width: '100%' }]}
          onPress={() => navigation.navigate('MacetaVestidor', { 
            id_maceta, 
            nombre_maceta, 
            skin_actual_id: lectura?.skin_activa?.id || 1 
          })}
        >
          <Text style={styles.actionBtnText}>Cambiar Skin 👕</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  
  heroSection: { alignItems: 'center', paddingTop: 30, marginBottom: 30 },
  skinCircle: { 
    width: 200, 
    height: 200, 
    borderRadius: 100, 
    backgroundColor: '#FFFFFF', 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
    marginBottom: 20
  },
  skinImage: { width: 160, height: 160 },
  emojiLarge: { fontSize: 80 },
  mainTitle: { fontSize: 28, fontWeight: '900', color: '#0F172A' },
  idText: { fontSize: 13, color: '#94A3B8', fontWeight: '600', marginTop: 5 },

  statsContainer: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  
  sensorPill: { 
    width: '48%', 
    backgroundColor: '#FFFFFF', 
    padding: 15, 
    borderRadius: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  iconCircle: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  pillIcon: { fontSize: 18 },
  pillLabel: { fontSize: 10, color: '#64748B', fontWeight: '600', textTransform: 'uppercase' },
  pillValue: { fontSize: 16, color: '#0F172A', fontWeight: '800' },

  waterCard: { margin: 20, backgroundColor: '#FFFFFF', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#F1F5F9' },
  waterInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  waterTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  waterPercent: { fontSize: 18, fontWeight: '900', color: '#3B82F6' },
  progressContainer: { height: 12, backgroundColor: '#F1F5F9', borderRadius: 6, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: '#3B82F6', borderRadius: 6 },
  waterHint: { fontSize: 12, color: '#94A3B8', marginTop: 10, fontWeight: '500' },

  actionsGrid: { paddingHorizontal: 20, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  actionBtn: { width: '48%', paddingVertical: 18, borderRadius: 18, alignItems: 'center', marginBottom: 15, elevation: 2 },
  actionBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 }
});