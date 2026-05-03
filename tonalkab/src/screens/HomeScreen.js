// src/screens/HomeScreen.js

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, Dimensions, PanResponder, SafeAreaView, 
  StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, Pressable, Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import apiClient from '../api/client';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = 290;
const CARD_HEIGHT = 440;

export default function HomeScreen({ navigation }) {
  const [macetas, setMacetas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const tilt = useRef(new Animated.ValueXY()).current;
  const slideX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const flip = useRef(new Animated.Value(0)).current;
  const flippedRef = useRef(false);

  // Define la URL base para concatenar las imágenes estáticas del backend
  const baseURL = apiClient.defaults.baseURL || 'https://api.tonalkab.com';

  const fetchMacetas = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/macetas/');
      const macetasData = response.data;

      const macetasConLecturas = await Promise.all(
        macetasData.map(async (maceta) => {
          try {
            const lecturaRes = await apiClient.get(`/macetas/${maceta.id_maceta}/lecturas/actual`);
            return { ...maceta, lectura: lecturaRes.data };
          } catch (err) {
            return { ...maceta, lectura: null }; 
          }
        })
      );

      setMacetas(macetasConLecturas);
    } catch (error) {
      console.log("Error cargando el huerto:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Escuchar cuando la pantalla recobra el foco (útil al volver del vestidor)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchMacetas();
    });
    return unsubscribe;
  }, [navigation]);

  const rotateX = tilt.y.interpolate({
    inputRange: [-180, 0, 180],
    outputRange: ["25deg", "0deg", "-25deg"],
    extrapolate: "clamp",
  });

  const rotateY = tilt.x.interpolate({
    inputRange: [-180, 0, 180],
    outputRange: ["-35deg", "0deg", "35deg"],
    extrapolate: "clamp",
  });

  const frontRotate = flip.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const backRotate = flip.interpolate({
    inputRange: [0, 1],
    outputRange: ["180deg", "360deg"],
  });

  const resetTilt = () => {
    Animated.parallel([
      Animated.spring(tilt, { toValue: { x: 0, y: 0 }, friction: 6, tension: 70, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }),
    ]).start();
  };

  const toggleFlip = () => {
    const nextValue = flippedRef.current ? 0 : 1;
    flippedRef.current = !flippedRef.current;
    setFlipped(flippedRef.current);
    Animated.spring(flip, { toValue: nextValue, friction: 8, tension: 60, useNativeDriver: true }).start();
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
      flip.setValue(0);
      flippedRef.current = false;
      setFlipped(false);

      Animated.spring(slideX, { toValue: 0, friction: 7, tension: 70, useNativeDriver: true }).start();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        Animated.spring(scale, { toValue: 1.04, friction: 5, tension: 100, useNativeDriver: true }).start();
      },
      onPanResponderMove: (_, gesture) => {
        tilt.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        const dx = Math.abs(gesture.dx);
        const dy = Math.abs(gesture.dy);
        const isTap = dx < 8 && dy < 8;

        if (isTap) {
          resetTilt();
          toggleFlip();
          return;
        }
        resetTilt();
      },
      onPanResponderTerminate: () => resetTilt(),
    })
  ).current;

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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient colors={["#F8FAFC", "#E2E8F0"]} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <Text style={styles.mainTitle}>Tonalkab</Text>
        <Text style={styles.subtitle}>Toca para ver los sensores</Text>
      </View>

      <View style={styles.stage}>
        {macetas.length > 1 && <View style={[styles.backShadowCard, styles.shadowLeft]} />}
        {macetas.length > 1 && <View style={[styles.backShadowCard, styles.shadowRight]} />}

        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.cardContainer,
            { transform: [{ perspective: 1000 }, { translateX: slideX }, { rotateX }, { rotateY }, { scale }] },
          ]}
        >
          {/* FRENTE */}
          <Animated.View style={[styles.cardFace, { transform: [{ perspective: 1000 }, { rotateY: frontRotate }] }]}>
            <View style={styles.card}>
              <LinearGradient colors={["#0F172A", "#1E293B"]} style={StyleSheet.absoluteFill} />
              <View style={styles.cardInner}>
                <View style={styles.statusHeader}>
                  <View style={[styles.statusDot, { backgroundColor: isOnline ? '#22C55E' : '#EF4444' }]} />
                  <Text style={styles.statusText}>{isOnline ? "En línea" : "Desconectado"}</Text>
                </View>
                
                {/* 🎨 RENDERIZADO DE LA SKIN ACTIVA */}
                <View style={styles.artBox}>
                  {currentMaceta.skin_activa ? (
                    <Image 
                      source={{ uri: `${baseURL}${currentMaceta.skin_activa.imagen_url}` }} 
                      style={styles.skinImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <Text style={styles.emojiArt}>🌿</Text>
                  )}
                </View>

                <View style={styles.titleBox}>
                  <Text style={styles.plantName}>{currentMaceta.nombre_maceta}</Text>
                  <Text style={styles.plantId}>ID: {currentMaceta.id_maceta}</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* REVERSO */}
          <Animated.View style={[styles.cardFace, { transform: [{ perspective: 1000 }, { rotateY: backRotate }] }]}>
            <View style={styles.card}>
              <LinearGradient colors={["#1E293B", "#020617"]} style={StyleSheet.absoluteFill} />
              <View style={styles.backInner}>
                <Text style={styles.backTitle}>Sensores en Vivo</Text>
                {currentMaceta.lectura ? (
                  <View style={styles.sensorGrid}>
                    <View style={styles.sensorItem}>
                      <Text style={styles.sensorIcon}>💧</Text>
                      <Text style={styles.sensorValue}>{currentMaceta.lectura.humedad_suelo}%</Text>
                      <Text style={styles.sensorLabel}>Suelo</Text>
                    </View>
                    <View style={styles.sensorItem}>
                      <Text style={styles.sensorIcon}>🌡️</Text>
                      <Text style={styles.sensorValue}>{currentMaceta.lectura.temperatura}°C</Text>
                      <Text style={styles.sensorLabel}>Temp</Text>
                    </View>
                    <View style={styles.sensorItem}>
                      <Text style={styles.sensorIcon}>☁️</Text>
                      <Text style={styles.sensorValue}>{currentMaceta.lectura.humedad_ambiental}%</Text>
                      <Text style={styles.sensorLabel}>Ambiente</Text>
                    </View>
                    <View style={styles.sensorItem}>
                      <Text style={styles.sensorIcon}>☀️</Text>
                      <Text style={styles.sensorValue}>{currentMaceta.lectura.nivel_luz}</Text>
                      <Text style={styles.sensorLabel}>Luz UV</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.noDataBox}>
                    <Text style={styles.noDataText}>Aún no hay lecturas del dispositivo.</Text>
                  </View>
                )}
                <TouchableOpacity 
                  style={styles.detailButton}
                  onPress={() => navigation.navigate('MacetaDetail', { 
                    id_maceta: currentMaceta.id_maceta, 
                    nombre_maceta: currentMaceta.nombre_maceta,
                    // Pasamos la skin actual por si quiere ir al vestidor desde los detalles
                    skin_actual_id: currentMaceta.skin_activa?.id || 1 
                  })}
                >
                  <Text style={styles.detailButtonText}>Ver Historial y Riego →</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </Animated.View>
      </View>

      {/* ZONA DE CONTROLES */}
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

      <TouchableOpacity style={styles.syncBtn} onPress={fetchMacetas}>
        <Text style={styles.syncBtnText}>↻ Sincronizar datos</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  
  header: { alignItems: 'center', marginBottom: 20, marginTop: 10 },
  mainTitle: { fontSize: 32, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#64748B', marginTop: 5, fontWeight: '500' },
  loadingText: { marginTop: 15, color: '#64748B', fontSize: 16 },

  stage: { width: CARD_WIDTH + 50, height: CARD_HEIGHT + 20, alignItems: 'center', justifyContent: 'center' },

  backShadowCard: { position: 'absolute', width: CARD_WIDTH, height: CARD_HEIGHT, borderRadius: 28, backgroundColor: 'rgba(15, 23, 42, 0.05)', borderWidth: 1, borderColor: 'rgba(15, 23, 42, 0.1)' },
  shadowLeft: { transform: [{ rotate: '-6deg' }, { translateX: -15 }] },
  shadowRight: { transform: [{ rotate: '6deg' }, { translateX: 15 }] },

  cardContainer: { width: CARD_WIDTH, height: CARD_HEIGHT },
  cardFace: { position: 'absolute', width: CARD_WIDTH, height: CARD_HEIGHT, backfaceVisibility: 'hidden' },

  card: { width: CARD_WIDTH, height: CARD_HEIGHT, borderRadius: 28, overflow: 'hidden', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.25, shadowRadius: 25, elevation: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },

  cardInner: { flex: 1, padding: 25, justifyContent: 'space-between' },
  statusHeader: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { color: '#F8FAFC', fontSize: 12, fontWeight: '700' },
  
  artBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emojiArt: { fontSize: 110, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 10 }, textShadowRadius: 15 },
  
  // NUEVO ESTILO PARA LA IMAGEN (Efecto 3D)
  skinImage: {
    width: 220,
    height: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  
  titleBox: { backgroundColor: 'rgba(0,0,0,0.2)', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  plantName: { color: '#F8FAFC', fontSize: 24, fontWeight: 'bold' },
  plantId: { color: '#94A3B8', fontSize: 14, marginTop: 4, fontWeight: '500' },

  backInner: { flex: 1, padding: 25, justifyContent: 'center' },
  backTitle: { color: '#F8FAFC', fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  
  sensorGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 10 },
  sensorItem: { width: '46%', backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 15, borderRadius: 15, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  sensorIcon: { fontSize: 20, marginBottom: 5 },
  sensorValue: { color: '#F8FAFC', fontSize: 18, fontWeight: '800' },
  sensorLabel: { color: '#94A3B8', fontSize: 12, marginTop: 2, fontWeight: '500' },
  
  noDataBox: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 150 },
  noDataText: { color: '#94A3B8', textAlign: 'center', paddingHorizontal: 20 },
  
  detailButton: { backgroundColor: '#22C55E', paddingVertical: 16, borderRadius: 15, marginTop: 10, alignItems: 'center', shadowColor: '#22C55E', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 12 },
  detailButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },

  controlsContainer: { flexDirection: 'row', gap: 15, marginTop: 15 },
  controlBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  controlBtnText: { color: '#0F172A', fontSize: 14, fontWeight: '700' },

  indicatorContainer: { flexDirection: 'row', marginTop: 20, gap: 8 },
  indicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#CBD5E1' },
  indicatorActive: { width: 24, backgroundColor: '#0F172A' },
  
  syncBtn: { marginTop: 20, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: 'transparent' },
  syncBtnText: { color: '#64748B', fontWeight: '600', fontSize: 13, textDecorationLine: 'underline' },
  refreshBtn: { marginTop: 20, backgroundColor: '#22C55E', padding: 15, borderRadius: 10 },
  refreshText: { color: 'white', fontWeight: 'bold' },
});