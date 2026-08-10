// src/screens/HomeScreen.js
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, Dimensions, PanResponder, SafeAreaView, 
  StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, Pressable, Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import apiClient from '../api/client';
import { obtenerInfoUV } from '../utils/uvHelper';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = 310;
const CARD_HEIGHT = 480;

export default function HomeScreen({ navigation }) {
  const [macetas, setMacetas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const macetasRef = useRef(macetas);
  const currentIndexRef = useRef(currentIndex);

  useEffect(() => {
    macetasRef.current = macetas;
    currentIndexRef.current = currentIndex;
  }, [macetas, currentIndex]);

  const tilt = useRef(new Animated.ValueXY()).current;
  const slideX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const baseURL = apiClient.defaults.baseURL || 'https://api.tonalkab.com';

  const fetchMacetas = async () => {
    setIsLoading(true);
    try {
      // 🚀 Consumimos el endpoint agregado del dashboard en 1 solo viaje de red
      const response = await apiClient.get('/macetas/dashboard');
      setMacetas(response.data);
    } catch (error) {
      console.log("Error cargando el huerto:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => fetchMacetas());
    return unsubscribe;
  }, [navigation]);

  const rotateX = tilt.y.interpolate({
    inputRange: [-180, 0, 180],
    outputRange: ["15deg", "0deg", "-15deg"],
    extrapolate: "clamp",
  });
  const rotateY = tilt.x.interpolate({
    inputRange: [-180, 0, 180],
    outputRange: ["-20deg", "0deg", "20deg"],
    extrapolate: "clamp",
  });

  const resetTilt = () => {
    Animated.parallel([
      Animated.spring(tilt, { toValue: { x: 0, y: 0 }, friction: 6, tension: 70, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }),
    ]).start();
  };

  const changeCard = (direction) => {
    if (macetas.length <= 1) return;
    const exitX = direction === "next" ? -SCREEN_WIDTH : SCREEN_WIDTH;
    const enterX = direction === "next" ? SCREEN_WIDTH : -SCREEN_WIDTH;

    Animated.parallel([
      Animated.timing(slideX, { toValue: exitX, duration: 220, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 0.95, friction: 6, tension: 90, useNativeDriver: true }),
    ]).start(() => {
      setCurrentIndex((prev) => {
        if (direction === "next") return (prev + 1) % macetas.length;
        return (prev - 1 + macetas.length) % macetas.length;
      });
      slideX.setValue(enterX);
      tilt.setValue({ x: 0, y: 0 });
      scale.setValue(1);
      Animated.spring(slideX, { toValue: 0, friction: 7, tension: 70, useNativeDriver: true }).start();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        Animated.spring(scale, { toValue: 1.02, friction: 5, tension: 100, useNativeDriver: true }).start();
      },
      onPanResponderMove: (_, gesture) => tilt.setValue({ x: gesture.dx, y: gesture.dy }),
      onPanResponderRelease: (_, gesture) => {
        const dx = Math.abs(gesture.dx);
        const dy = Math.abs(gesture.dy);
        const isTap = dx < 8 && dy < 8;

        if (isTap) {
          const cm = macetasRef.current[currentIndexRef.current];
          if (cm) { 
            navigation.navigate('MacetaDetail', { 
              id_maceta: cm.id_maceta, 
              nombre_maceta: cm.nombre_maceta,
              skin_actual_id: cm.skin_activa?.id || 1,
              skin_url: cm.skin_activa?.imagen_url || null 
            });
          }
        }
        resetTilt();
      },
      onPanResponderTerminate: () => resetTilt(),
    })
  ).current;

  // 🌟 HELPER ROBUSTO: Ahora obliga a Javascript a tratar el 0 como un número válido
  const getStatColor = (valorActual, min, max) => {
    if (valorActual === null || valorActual === undefined) return '#0F172A';
    if (min === null || min === undefined || max === null || max === undefined) return '#0F172A';
    
    const val = Number(valorActual);
    const valMin = Number(min);
    const valMax = Number(max);

    if (val < valMin || val > valMax) return '#EF4444'; // Rojo (Peligro/Fuera de rango)
    return '#0F172A'; // Normal
  };

  // 🌟 HELPER DE BÚSQUEDA: Escarba en el objeto para encontrar los límites, sin importar cómo los envíe la API
  const getUmbral = (maceta, campo) => {
    return maceta[campo] 
      ?? maceta.planta?.[campo] 
      ?? maceta.tipo_planta?.[campo] 
      ?? maceta.configuracion?.[campo];
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>Conectando con el huerto...</Text>
      </View>
    );
  }

  if (macetas.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Aún no tienes plantas registradas.</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchMacetas}>
          <Text style={styles.refreshText}>Recargar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentMaceta = macetas[currentIndex];
  const isOnline = currentMaceta.id_estado_dispositivo === 1;
  const lectura = currentMaceta.lectura;

  const uvInfo = lectura ? obtenerInfoUV(lectura.nivel_luz) : null;

  // Evaluamos usando el nuevo Helper de Umbrales
  const colorHumedadSuelo = lectura 
    ? getStatColor(
        lectura.humedad_suelo, 
        getUmbral(currentMaceta, 'humedad_suelo_min'), 
        getUmbral(currentMaceta, 'humedad_suelo_max')
      ) 
    : '#0F172A';

  const colorTemperatura = lectura 
    ? getStatColor(
        lectura.temperatura, 
        getUmbral(currentMaceta, 'temperatura_min'), 
        getUmbral(currentMaceta, 'temperatura_max')
      ) 
    : '#0F172A';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient colors={["#FFFFFF", "#F0FDF4"]} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <Text style={styles.mainTitle}>Mi Huerto</Text>
        <Text style={styles.subtitle}>Desliza para ver tus plantas</Text>
      </View>

      <View style={styles.stage}>
        {macetas.length > 1 && <View style={[styles.backShadowCard, styles.shadowLeft]} />}
        {macetas.length > 1 && <View style={[styles.backShadowCard, styles.shadowRight]} />}

        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.cardContainer,
            { transform: [{ perspective: 1200 }, { translateX: slideX }, { rotateX }, { rotateY }, { scale }] },
          ]}
        >
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.plantName} numberOfLines={1}>{currentMaceta.nombre_maceta}</Text>
              <View style={[styles.statusBadge, { backgroundColor: isOnline ? '#DCFCE7' : '#FEE2E2' }]}>
                <View style={[styles.statusDot, { backgroundColor: isOnline ? '#22C55E' : '#EF4444' }]} />
                <Text style={[styles.statusText, { color: isOnline ? '#16A34A' : '#B91C1C' }]}>
                  {isOnline ? "Online" : "Offline"}
                </Text>
              </View>
            </View>

            <View style={styles.artBox}>
              <LinearGradient colors={["#F8FAFC", "#E2E8F0"]} style={styles.artBackground} />
              {currentMaceta.skin_activa ? (
                <Image 
                  source={{ uri: `${baseURL}${currentMaceta.skin_activa.imagen_url}` }} 
                  style={styles.skinImage}
                  resizeMode="contain"
                />
              ) : (
                <Text style={styles.emojiArt}>🌱</Text>
              )}
            </View>

            <View style={styles.attributesSection}>
              <Text style={styles.attributesTitle}>ATRIBUTOS DE ENTORNO</Text>
              
              {lectura ? (
                <View style={styles.statsGrid}>
                  {/* Humedad Suelo */}
                  <View style={styles.statPill}>
                    <Text style={styles.statIcon}>💧</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.statLabel}>Suelo</Text>
                      <Text style={[styles.statValue, { color: colorHumedadSuelo }]}>
                        {lectura.humedad_suelo}%
                      </Text>
                    </View>
                  </View>
                  
                  {/* Temperatura */}
                  <View style={styles.statPill}>
                    <Text style={styles.statIcon}>🌡️</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.statLabel}>Temp</Text>
                      <Text style={[styles.statValue, { color: colorTemperatura }]}>
                        {lectura.temperatura}°C
                      </Text>
                    </View>
                  </View>
                  
                  {/* Luz (Índice UV) */}
                  <View style={styles.statPill}>
                    <Text style={styles.statIcon}>☀️</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.statLabel}>Luz (IUV)</Text>
                      <Text style={[styles.statValue, { color: uvInfo.color }]}>
                        {uvInfo.valor}
                      </Text>
                    </View>
                  </View>
                  
                  {/* Humedad Ambiente */}
                  <View style={styles.statPill}>
                    <Text style={styles.statIcon}>☁️</Text>
                    {/* 🌟 Agregamos flex: 1 y adjustsFontSizeToFit para que el texto largo no rompa la tarjeta */}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit>Hum. Ambiente</Text>
                      <Text style={styles.statValue}>{lectura.humedad_ambiental}%</Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.noDataBox}>
                  <Text style={styles.noDataText}>Sin datos de sensores</Text>
                </View>
              )}
            </View>

            <TouchableOpacity 
              style={styles.detailBtn}
              onPress={() => navigation.navigate('MacetaDetail', { 
                id_maceta: currentMaceta.id_maceta, 
                nombre_maceta: currentMaceta.nombre_maceta,
                skin_actual_id: currentMaceta.skin_activa?.id || 1,
                skin_url: currentMaceta.skin_activa?.imagen_url || null 
              })}
            >
              <Text style={styles.detailBtnText}>Administrar Planta</Text>
            </TouchableOpacity>

          </View>
        </Animated.View>
      </View>

      {macetas.length > 1 && (
        <View style={styles.controlsContainer}>
          <Pressable style={styles.controlBtn} onPress={() => changeCard("prev")}>
            <Text style={styles.controlBtnText}>‹ Anterior</Text>
          </Pressable>
          <Pressable style={styles.controlBtn} onPress={() => changeCard("next")}>
            <Text style={styles.controlBtnText}>Siguiente ›</Text>
          </Pressable>
        </View>
      )}

      {macetas.length > 0 && (
        <View style={styles.indicatorContainer}>
          {macetas.map((_, index) => (
            <View key={index} style={[styles.indicator, index === currentIndex && styles.indicatorActive]} />
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  
  header: { alignItems: 'center', marginBottom: 20, marginTop: 10 },
  mainTitle: { fontSize: 32, fontWeight: '900', color: '#0F172A', letterSpacing: -1 },
  subtitle: { fontSize: 14, color: '#64748B', marginTop: 5, fontWeight: '500' },
  loadingText: { marginTop: 15, color: '#64748B', fontSize: 16 },

  stage: { width: CARD_WIDTH + 50, height: CARD_HEIGHT + 20, alignItems: 'center', justifyContent: 'center' },

  backShadowCard: { position: 'absolute', width: CARD_WIDTH, height: CARD_HEIGHT, borderRadius: 28, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', opacity: 0.5 },
  shadowLeft: { transform: [{ rotate: '-6deg' }, { translateX: -15 }] },
  shadowRight: { transform: [{ rotate: '6deg' }, { translateX: 15 }] },

  cardContainer: { width: CARD_WIDTH, height: CARD_HEIGHT },

  card: { 
    width: CARD_WIDTH, 
    height: CARD_HEIGHT, 
    borderRadius: 24, 
    backgroundColor: '#FFFFFF',
    padding: 15,
    justifyContent: 'space-between',
    shadowColor: '#0F172A', 
    shadowOffset: { width: 0, height: 15 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 25, 
    elevation: 10, 
    borderWidth: 1, 
    borderColor: '#F1F5F9' 
  },

  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingHorizontal: 5 },
  plantName: { fontSize: 22, fontWeight: '800', color: '#0F172A', flex: 1, marginRight: 10 },
  
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },

  artBox: { flex: 1, position: 'relative', borderRadius: 16, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  artBackground: { ...StyleSheet.absoluteFillObject, opacity: 0.5 },
  skinImage: { width: 180, height: 180, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15 },
  emojiArt: { fontSize: 90, textShadowColor: 'rgba(0,0,0,0.1)', textShadowOffset: { width: 0, height: 5 }, textShadowRadius: 10 },

  attributesSection: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 10 },
  attributesTitle: { fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 1, marginBottom: 8, textAlign: 'center' },
  
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statPill: { width: '48%', flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 8, borderRadius: 12, marginBottom: 8, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  statIcon: { fontSize: 18, marginRight: 8 },
  statLabel: { fontSize: 10, color: '#64748B', fontWeight: '600' },
  statValue: { fontSize: 14, color: '#0F172A', fontWeight: '800' },

  noDataBox: { paddingVertical: 15, alignItems: 'center' },
  noDataText: { color: '#94A3B8', fontSize: 12, fontStyle: 'italic' },

  detailBtn: { backgroundColor: '#22C55E', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  detailBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },

  controlsContainer: { flexDirection: 'row', gap: 15, marginTop: 15 },
  controlBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  controlBtnText: { color: '#0F172A', fontSize: 14, fontWeight: '700' },

  indicatorContainer: { flexDirection: 'row', marginTop: 20, gap: 8 },
  indicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#CBD5E1' },
  indicatorActive: { width: 24, backgroundColor: '#22C55E' },

  refreshBtn: { marginTop: 20, backgroundColor: '#22C55E', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14 },
  refreshText: { color: 'white', fontWeight: 'bold' },
});