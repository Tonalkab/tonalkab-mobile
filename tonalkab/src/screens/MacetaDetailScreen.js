// src/screens/MacetaDetailScreen.js

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  ScrollView, TouchableOpacity, Image, Dimensions, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import apiClient from '../api/client';
import { obtenerInfoUV } from '../utils/uvHelper'; 

const { width } = Dimensions.get('window');

export default function MacetaDetailScreen({ route, navigation }) {
  const { id_maceta, nombre_maceta, skin_actual_id, skin_url } = route.params;
  
  const [lectura, setLectura] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [currentSkinId, setCurrentSkinId] = useState(skin_actual_id);
  const [currentSkinUrl, setCurrentSkinUrl] = useState(skin_url);

  const baseURL = apiClient.defaults.baseURL || 'https://api.tonalkab.com';

  useEffect(() => {
    const fetchLecturaActual = async () => {
      if (!id_maceta) return;
      try {
        const response = await apiClient.get(`/macetas/${id_maceta}/lecturas/actual`);
        setLectura(response.data);
      } catch (error) {
        console.error("Error en detalle:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLecturaActual();
  }, [id_maceta]); 

  // --- FUNCIÓN ORIGINAL: FORZAR RIEGO EDGE ---
  const handleRegarAhora = async () => {
    Alert.alert(
      "Regar Planta 💧",
      "¿Estás seguro de que deseas forzar el riego ahora mismo?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sí, regar", 
          onPress: async () => {
            try {
              const res = await apiClient.post(`/macetas/${id_maceta}/forzar-riego-edge`);
              Alert.alert("Orden enviada", res.data.nota);
            } catch (error) {
              Alert.alert(
                "Aviso", 
                error.response?.data?.detail || "No se pudo enviar la orden."
              );
            }
          }
        }
      ]
    );
  };

  /*
  // --- NUEVA FUNCIÓN: RIEGO TEMPORIZADO CORTO (OPCIÓN B) ---
  // COMENTADA TEMPORALMENTE
  const handleRegarCincoSegundos = async () => {
    Alert.alert(
      "Riego Corto ⏱️",
      "¿Deseas activar la bomba por exactamente 5 segundos?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sí, regar", 
          onPress: async () => {
            try {
              const res = await apiClient.post(`/macetas/${id_maceta}/forzar-riego-edge`, { 
                segundos: 5 
              });
              Alert.alert("Orden enviada", res.data.nota || "Bomba programada por 5 segundos.");
            } catch (error) {
              Alert.alert(
                "Aviso", 
                error.response?.data?.detail || "No se pudo enviar la orden."
              );
            }
          }
        }
      ]
    );
  };
  */

  const StatBox = ({ icon, label, value, unit, color }) => (
    <View style={styles.statCard}>
      <View style={[styles.iconCircle, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.statValue}>{value}{unit}</Text>
        <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit>{label}</Text>
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

  const uvInfo = obtenerInfoUV(lectura?.nivel_luz);

  return (
    <View style={styles.mainContainer}>
      <StatusBar style="dark" />
      <LinearGradient colors={["#FFFFFF", "#F0FDF4", "#DCFCE7"]} style={StyleSheet.absoluteFill} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.heroSection}>
          <View style={styles.pedestalGlow} />
          
          {currentSkinUrl ? (
            <Image 
              source={{ uri: `${baseURL}${currentSkinUrl}` }} 
              style={styles.mainSkin} 
              resizeMode="contain"
            />
          ) : (
            <Text style={styles.placeholderEmoji}>🌿</Text>
          )}
        </View>

        <View style={styles.infoPanel}>
          <Text style={styles.sectionTitle}>Estado del Entorno</Text>
          
          <View style={styles.statsGrid}>
            <StatBox icon="thermometer" label="Temperatura" value={lectura?.temperatura || 0} unit="°C" color="#F59E0B" />
            
            <StatBox 
              icon="sunny" 
              label={`Luz (${uvInfo.categoria})`} 
              value={uvInfo.valor} 
              unit=" IUV" 
              color={uvInfo.color} 
            />
            
            <StatBox icon="cloud" label="Hum. Aire" value={lectura?.humedad_ambiental || 0} unit="%" color="#64748B" />
            <StatBox icon="water" label="Hum. Tierra" value={lectura?.humedad_suelo || 0} unit="%" color="#3B82F6" />
          </View>

          <View style={styles.waterTankContainer}>
            <View style={styles.tankHeader}>
              <Text style={styles.tankTitle}>Reserva de Agua</Text>
              <Text style={styles.tankPercent}>{lectura?.nivel_agua || 0}%</Text>
            </View>
            <View style={styles.tankTrack}>
              <LinearGradient 
                colors={["#60A5FA", "#3B82F6"]} 
                start={{x:0, y:0}} end={{x:1, y:0}}
                style={[styles.tankFill, { width: `${lectura?.nivel_agua || 0}%` }]} 
              />
            </View>
            <Text style={styles.tankFooter}>Aproximadamente {((lectura?.nivel_agua || 0) * 1.7 / 100).toFixed(1)}L disponibles</Text>
          </View>

          {/* --- BOTÓN DE REGAR AHORA ORIGINAL --- */}
          <TouchableOpacity 
            style={styles.waterNowBtn}
            onPress={handleRegarAhora}
          >
            <Ionicons name="water" size={24} color="#FFFFFF" style={{ marginRight: 10 }} />
            <Text style={styles.waterNowBtnText}>Forzar Riego Ahora</Text>
          </TouchableOpacity>

          {/* --- 🌟 NUEVO BOTÓN: REGAR 5 SEGUNDOS (COMENTADO) --- */}
          {/*
          <TouchableOpacity 
            style={[styles.waterNowBtn, { backgroundColor: '#2563EB', marginTop: 12 }]}
            onPress={handleRegarCincoSegundos}
          >
            <Ionicons name="timer-outline" size={24} color="#FFFFFF" style={{ marginRight: 10 }} />
            <Text style={styles.waterNowBtnText}>Regar 5 Segundos</Text>
          </TouchableOpacity>
          */}

          <View style={styles.actionHub}>
             <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: '#3B82F6' }]}
              onPress={() => navigation.navigate('MacetaStats', { id_maceta, nombre_maceta })}
            >
              <Ionicons name="bar-chart" size={24} color="#FFF" />
              <Text style={styles.actionBtnText}>Reportes</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: '#22C55E' }]}
              onPress={() => navigation.navigate('MacetaConfig', { id_maceta, nombre_maceta })}
            >
              <Ionicons name="options" size={24} color="#FFF" />
              <Text style={styles.actionBtnText}>Ajustes</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: '#8B5CF6' }]}
              onPress={() => navigation.navigate('MacetaVestidor', { 
                id_maceta, 
                nombre_maceta, 
                skin_actual_id: currentSkinId,
                onSkinChange: (nuevoId, nuevaUrl) => {
                  setCurrentSkinId(nuevoId);
                  setCurrentSkinUrl(nuevaUrl);
                }
              })}
            >
              <Ionicons name="shirt" size={24} color="#FFF" />
              <Text style={styles.actionBtnText}>Skins</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  heroSection: {
    height: 320,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20
  },
  pedestalGlow: {
    position: 'absolute',
    width: 200,
    height: 60,
    backgroundColor: '#22C55E20',
    borderRadius: 100,
    bottom: 40,
    transform: [{ scaleX: 1.5 }],
    filter: 'blur(20px)'
  },
  mainSkin: { 
    width: 260, 
    height: 260,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  placeholderEmoji: { fontSize: 100 },

  infoPanel: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    padding: 25,
    marginTop: -10,
    flex: 1,
    minHeight: 500,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 10
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 20 },
  
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    padding: 15,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  iconCircle: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  statValue: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  statLabel: { fontSize: 10, color: '#64748B', fontWeight: '600', textTransform: 'uppercase' },

  waterTankContainer: {
    backgroundColor: '#F0F9FF',
    padding: 20,
    borderRadius: 25,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E0F2FE'
  },
  tankHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  tankTitle: { fontSize: 14, fontWeight: '700', color: '#0369A1' },
  tankPercent: { fontSize: 18, fontWeight: '900', color: '#0369A1' },
  tankTrack: { height: 12, backgroundColor: '#E0F2FE', borderRadius: 6, overflow: 'hidden' },
  tankFill: { height: '100%', borderRadius: 6 },
  tankFooter: { fontSize: 11, color: '#7DD3FC', marginTop: 8, fontWeight: '600', textAlign: 'right' },

  waterNowBtn: {
    backgroundColor: '#0EA5E9', 
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  waterNowBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5
  },

  actionHub: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20 
  },
  actionBtn: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4
  },
  actionBtnText: { color: '#FFF', fontSize: 11, fontWeight: '800', marginTop: 8 }
});