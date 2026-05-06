// src/screens/PlantaDetailScreen.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import apiClient from '../api/client';

const { width } = Dimensions.get('window');

export default function PlantaDetailScreen({ route, navigation }) {
  const { planta } = route.params;
  const baseURL = apiClient.defaults.baseURL || 'https://api.tonalkab.com';

  // Función para darle color al nivel de dificultad
  const getDificultad = (nivel) => {
    switch (nivel) {
      case 1: return { label: 'Fácil', color: '#22C55E', bg: '#DCFCE7' };
      case 2: return { label: 'Media', color: '#F59E0B', bg: '#FEF3C7' };
      case 3: return { label: 'Difícil', color: '#EF4444', bg: '#FEE2E2' };
      default: return { label: 'Desconocida', color: '#64748B', bg: '#F1F5F9' };
    }
  };

  const dificultad = getDificultad(planta.nivel_dificultad);

  const InfoCard = ({ icon, label, value, color, bgColor }) => (
    <View style={styles.infoCard}>
      <View style={[styles.iconBox, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar style="dark" />
      <LinearGradient colors={["#F0FDF4", "#FFFFFF"]} style={StyleSheet.absoluteFill} />

      {/* BOTÓN DE RETROCESO FLOTANTE */}
      <View style={styles.backBtnContainer}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
        
        {/* ÁREA DE IMAGEN (HERO) */}
        <View style={styles.heroSection}>
          <View style={styles.imageBackground}>
            {planta.imagen_url ? (
              <Image 
                source={{ uri: `${baseURL}${planta.imagen_url}` }} 
                style={styles.plantaImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.emojiArt}>🌿</Text>
            )}
          </View>
        </View>

        {/* CONTENIDO DE LA FICHA */}
        <View style={styles.contentSection}>
          
          {/* TÍTULO Y BADGES */}
          <View style={styles.titleRow}>
            <Text style={styles.plantaName}>{planta.nombre_planta}</Text>
            <View style={styles.badgesContainer}>
              <View style={styles.badgeSoportada}>
                <Ionicons name="shield-checkmark" size={12} color="#22C55E" />
                <Text style={styles.badgeSoportadaText}>IA Soportada</Text>
              </View>
              {planta.nivel_dificultad && (
                <View style={[styles.badgeDificultad, { backgroundColor: dificultad.bg, borderColor: dificultad.color + '40' }]}>
                  <Ionicons name="star" size={12} color={dificultad.color} />
                  <Text style={[styles.badgeDificultadText, { color: dificultad.color }]}>
                    {dificultad.label}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* DESCRIPCIÓN */}
          <Text style={styles.descriptionText}>
            {planta.descripcion || "Especie registrada en la base de datos de Tonalkab."}
          </Text>

          {/* HISTORIA Y ORIGEN (NUEVA SECCIÓN) */}
          {(planta.historia || planta.origen_geografico) && (
            <View style={styles.narrativeCard}>
              <View style={styles.narrativeHeader}>
                <Ionicons name="earth" size={20} color="#0EA5E9" />
                <Text style={styles.narrativeTitle}>Historia y Origen</Text>
              </View>
              {planta.origen_geografico && (
                <Text style={styles.origenText}>
                  <Text style={{ fontWeight: 'bold' }}>Origen: </Text>
                  {planta.origen_geografico}
                </Text>
              )}
              {planta.historia && (
                <Text style={styles.historiaText}>{planta.historia}</Text>
              )}
            </View>
          )}

          {/* CUIDADOS GENERALES (NUEVA SECCIÓN) */}
          {planta.cuidados_generales && (
            <View style={[styles.narrativeCard, { backgroundColor: '#FEF2F2', borderColor: '#FEE2E2' }]}>
              <View style={styles.narrativeHeader}>
                <Ionicons name="heart" size={20} color="#EF4444" />
                <Text style={[styles.narrativeTitle, { color: '#B91C1C' }]}>Tips de Cuidado</Text>
              </View>
              <Text style={[styles.historiaText, { color: '#991B1B' }]}>
                {planta.cuidados_generales}
              </Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>Requisitos del Hardware</Text>
          
          {/* CUADRÍCULA DE DATOS TÉCNICOS */}
          <View style={styles.grid}>
            <InfoCard 
              icon="water-outline" 
              label="Humedad Min." 
              value={`${planta.humedad_suelo_min || 0}%`} 
              color="#3B82F6" 
              bgColor="#EFF6FF" 
            />
            <InfoCard 
              icon="water" 
              label="Humedad Máx." 
              value={`${planta.humedad_suelo_max || 0}%`} 
              color="#2563EB" 
              bgColor="#DBEAFE" 
            />
            <InfoCard 
              icon="thermometer" 
              label="Temperatura" 
              value={`${planta.temperatura_min || 0}° a ${planta.temperatura_max || 0}°C`} 
              color="#F59E0B" 
              bgColor="#FEF3C7" 
            />
            <InfoCard 
              icon="time" 
              label="Ciclo de Riego" 
              value={`${planta.tiempo_min_entre_riegos_dias || 0} Días (Pausa)`} 
              color="#8B5CF6" 
              bgColor="#EDE9FE" 
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  backBtnContainer: { position: 'absolute', top: 50, left: 20, zIndex: 10 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  
  // HERO SECTION
  heroSection: { height: 350, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, overflow: 'hidden', backgroundColor: '#DCFCE7', shadowColor: '#22C55E', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  imageBackground: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  plantaImage: { width: '100%', height: '100%' },
  emojiArt: { fontSize: 120, textShadowColor: 'rgba(0,0,0,0.1)', textShadowOffset: { width: 0, height: 10 }, textShadowRadius: 15 },
  
  contentSection: { paddingHorizontal: 25, paddingTop: 25 },
  
  // TÍTULOS Y BADGES
  titleRow: { marginBottom: 15 },
  plantaName: { fontSize: 28, fontWeight: '900', color: '#0F172A', letterSpacing: -1, marginBottom: 10 },
  badgesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  
  badgeSoportada: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1, borderColor: '#DCFCE7' },
  badgeSoportadaText: { color: '#16A34A', fontSize: 11, fontWeight: '800', marginLeft: 4, textTransform: 'uppercase' },
  
  badgeDificultad: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  badgeDificultadText: { fontSize: 11, fontWeight: '800', marginLeft: 4, textTransform: 'uppercase' },
  
  descriptionText: { fontSize: 15, lineHeight: 24, color: '#64748B', fontWeight: '500', marginBottom: 25 },
  
  // TARJETAS DE NARRATIVA (Historia y Cuidados)
  narrativeCard: { backgroundColor: '#F0F9FF', padding: 20, borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: '#E0F2FE' },
  narrativeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  narrativeTitle: { fontSize: 16, fontWeight: '800', color: '#0369A1', marginLeft: 8 },
  origenText: { fontSize: 13, color: '#0F172A', marginBottom: 8, fontStyle: 'italic' },
  historiaText: { fontSize: 14, lineHeight: 22, color: '#334155', fontWeight: '500' },

  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 15, marginTop: 10 },
  
  // CUADRÍCULA DE REQUISITOS
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  infoCard: { width: '48%', backgroundColor: '#FFFFFF', padding: 15, borderRadius: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  iconBox: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  infoLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '700', marginBottom: 2, textTransform: 'uppercase' },
  infoValue: { fontSize: 13, fontWeight: '800', color: '#0F172A' }
});