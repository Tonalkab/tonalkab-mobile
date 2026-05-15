// src/screens/MacetaVestidorScreen.js
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  FlatList, ActivityIndicator, Alert, SafeAreaView, Dimensions,
  Platform, StatusBar as RNStatusBar 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import apiClient from '../api/client';

const { width } = Dimensions.get('window');

export default function MacetaVestidorScreen({ route, navigation }) {
  // 🌟 RECIBIMOS LA FUNCIÓN onSkinChange
  const { id_maceta, nombre_maceta, skin_actual_id, onSkinChange } = route.params || {};

  const [catalogo, setCatalogo] = useState([]);
  const [misSkins, setMisSkins] = useState([]);
  const [skinEquipada, setSkinEquipada] = useState(skin_actual_id || 1); 
  const [skinPreview, setSkinPreview] = useState(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isEquipping, setIsEquipping] = useState(false);

  const baseURL = apiClient.defaults.baseURL || 'https://api.tonalkab.com';

  useEffect(() => {
    const fetchDatosVestidor = async () => {
      setIsLoading(true);
      try {
        const [catalogoRes, inventarioRes] = await Promise.all([
          apiClient.get('/skins/'),
          apiClient.get('/me/skins')
        ]);

        const skinsDisponibles = catalogoRes.data;
        setCatalogo(skinsDisponibles);
        
        const misSkinsIds = inventarioRes.data.map(item => item.id_skin || item.id);
        setMisSkins(misSkinsIds);

        const skinInicial = skinsDisponibles.find(s => s.id === skinEquipada);
        if (skinInicial) setSkinPreview(skinInicial);

      } catch (error) {
        console.error("Error cargando el vestidor:", error);
        Alert.alert("Error", "No se pudo cargar la boutique de skins.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDatosVestidor();
  }, [skinEquipada]);

  const handleEquipar = async () => {
    if (!skinPreview) return;

    if (!misSkins.includes(skinPreview.id)) {
      Alert.alert("Bloqueado", "Aún no tienes esta skin en tu colección.");
      return;
    }

    setIsEquipping(true);
    try {
      await apiClient.post(`/macetas/${id_maceta}/skins/${skinPreview.id}/equipar`);
      setSkinEquipada(skinPreview.id);
      Alert.alert("¡Nuevo Estilo!", "Tu maceta ahora luce espectacular.");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Hubo un problema al aplicar el estilo.");
    } finally {
      setIsEquipping(false);
    }
  };

  // 🌟 FUNCIÓN DE RETROCESO SEGURA Y SIN BUCLES
  const handleGoBack = () => {
    const skinActivaObj = catalogo.find(s => s.id === skinEquipada);
    
    // Si tenemos la función y una skin activa, le avisamos a MacetaDetailScreen
    if (onSkinChange && skinActivaObj) {
      onSkinChange(skinEquipada, skinActivaObj.imagen_url);
    }
    
    // Usamos el retroceso seguro nativo. ¡Adiós a los laberintos de pantallas!
    navigation.goBack();
  };

  const renderSkinItem = ({ item }) => {
    const isUnlocked = misSkins.includes(item.id);
    const isEquipped = item.id === skinEquipada;
    const isSelected = skinPreview?.id === item.id;
    const imageUrl = `${baseURL}${item.imagen_url}`;

    return (
      <TouchableOpacity 
        style={[
          styles.skinCard, 
          isSelected && styles.skinCardSelected,
          !isUnlocked && styles.skinCardLocked
        ]}
        onPress={() => setSkinPreview(item)}
        activeOpacity={0.7}
      >
        <Image 
          source={{ uri: imageUrl }} 
          style={[styles.skinThumbnail, !isUnlocked && { opacity: 0.25, tintColor: 'gray' }]} 
          resizeMode="contain"
        />
        
        {isEquipped && (
          <View style={[styles.badge, styles.badgeEquipped]}>
            <Ionicons name="checkmark-sharp" size={12} color="#FFF" />
          </View>
        )}
        {!isUnlocked && (
          <View style={[styles.badge, styles.badgeLocked]}>
            <Ionicons name="lock-closed" size={12} color="#FFF" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>Abriendo la boutique...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient colors={["#FFFFFF", "#F8FAFC", "#F1F5F9"]} style={StyleSheet.absoluteFill} />

      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={handleGoBack}>
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>Boutique Tonalkab</Text>
          <Text style={styles.headerSubtitle}>{nombre_maceta}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.vitrinaContainer}>
        <View style={styles.auraGlow} />
        
        {skinPreview ? (
          <Image 
            source={{ uri: `${baseURL}${skinPreview.imagen_url}` }} 
            style={styles.vitrinaImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.placeholderImage} />
        )}

        <View style={styles.infoBox}>
          <Text style={styles.skinName}>{skinPreview?.nombre || "Cargando..."}</Text>
          <Text style={styles.skinDesc} numberOfLines={2}>{skinPreview?.descripcion || ""}</Text>
          
          <TouchableOpacity 
            style={[
              styles.actionBtn, 
              skinEquipada === skinPreview?.id ? styles.actionBtnDisabled : styles.actionBtnActive,
              !misSkins.includes(skinPreview?.id) && styles.actionBtnLocked
            ]}
            disabled={skinEquipada === skinPreview?.id || isEquipping || !misSkins.includes(skinPreview?.id)}
            onPress={handleEquipar}
          >
            {isEquipping ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionBtnText}>
                {!misSkins.includes(skinPreview?.id) 
                  ? "Bloqueado" 
                  : skinEquipada === skinPreview?.id 
                    ? "En Uso" 
                    : "Aplicar Estilo"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inventoryContainer}>
        <View style={styles.inventoryHeader}>
          <Text style={styles.sectionTitle}>Tu Colección</Text>
          <Text style={styles.collectionCount}>{misSkins.length} / {catalogo.length}</Text>
        </View>
        
        <FlatList
          data={catalogo}
          keyExtractor={(item) => item.id.toString()}
          numColumns={3}
          showsVerticalScrollIndicator={false}
          renderItem={renderSkinItem}
          columnWrapperStyle={styles.row}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  loadingText: { marginTop: 15, color: '#64748B', fontSize: 16, fontWeight: '500' },
  
  headerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight + 10 : 10, 
    paddingBottom: 20 
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  headerTitleBox: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  headerSubtitle: { fontSize: 12, fontWeight: '600', color: '#22C55E' },

  vitrinaContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 30,
    paddingTop: 30,
    paddingBottom: 25,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 25
  },
  auraGlow: {
    position: 'absolute',
    top: 50,
    width: 180,
    height: 180,
    backgroundColor: 'rgba(34, 197, 94, 0.10)',
    borderRadius: 90
  },
  vitrinaImage: { width: 200, height: 200, marginBottom: 20 },
  placeholderImage: { width: 200, height: 200, backgroundColor: '#F8FAFC', borderRadius: 100, marginBottom: 20 },
  
  infoBox: { width: '100%', alignItems: 'center' },
  skinName: { color: '#0F172A', fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  skinDesc: { color: '#64748B', fontSize: 13, textAlign: 'center', marginTop: 8, marginBottom: 20, paddingHorizontal: 10, fontWeight: '500', lineHeight: 18 },
  
  actionBtn: { width: '90%', paddingVertical: 16, borderRadius: 18, alignItems: 'center', elevation: 2 },
  actionBtnActive: { backgroundColor: '#22C55E', shadowColor: '#22C55E', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12 },
  actionBtnDisabled: { backgroundColor: '#E2E8F0', shadowColor: 'transparent', elevation: 0 },
  actionBtnLocked: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0', elevation: 0, shadowColor: 'transparent' },
  actionBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15, letterSpacing: 0.5 },

  inventoryContainer: { flex: 1, paddingHorizontal: 20 },
  inventoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  collectionCount: { fontSize: 13, fontWeight: '700', color: '#64748B', backgroundColor: '#E2E8F0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  
  row: { justifyContent: 'space-between', marginBottom: 15 },
  
  skinCard: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F8FAFC',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 3,
  },
  skinCardSelected: { borderColor: '#4ADE80', backgroundColor: '#F0FDF4' },
  skinCardLocked: { backgroundColor: '#F8FAFC', borderColor: '#F1F5F9', elevation: 0, shadowOpacity: 0 },
  
  skinThumbnail: { width: '100%', height: '100%' },
  
  badge: { position: 'absolute', top: -6, right: -6, width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 4 },
  badgeEquipped: { backgroundColor: '#22C55E' },
  badgeLocked: { backgroundColor: '#94A3B8' }
});