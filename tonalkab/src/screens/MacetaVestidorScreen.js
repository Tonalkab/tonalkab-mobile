// src/screens/MacetaVestidorScreen.js

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  FlatList, ActivityIndicator, Alert, SafeAreaView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import apiClient from '../api/client';

export default function MacetaVestidorScreen({ route, navigation }) {
  // Recibimos los datos de la maceta actual desde la navegación
  const { id_maceta, nombre_maceta, skin_actual_id } = route.params || {};

  const [catalogo, setCatalogo] = useState([]);
  const [misSkins, setMisSkins] = useState([]);
  const [skinEquipada, setSkinEquipada] = useState(skin_actual_id || 1); // Starter pack por defecto
  const [skinPreview, setSkinPreview] = useState(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isEquipping, setIsEquipping] = useState(false);

  // La URL base de tu backend para concatenar las imágenes estáticas
  const baseURL = apiClient.defaults.baseURL || 'https://api.tonalkab.com';

  useEffect(() => {
    const fetchDatosVestidor = async () => {
      setIsLoading(true);
      try {
        // Ejecutamos ambas peticiones al mismo tiempo para mayor velocidad
        const [catalogoRes, inventarioRes] = await Promise.all([
          apiClient.get('/skins/'),
          apiClient.get('/me/skins')
        ]);

        const skinsDisponibles = catalogoRes.data;
        setCatalogo(skinsDisponibles);
        
        // Mapeamos el inventario para tener un arreglo simple de IDs desbloqueados
        // Dependiendo de tu esquema exacto, esto asume que inventarioRes.data trae objetos con { id: X } o { id_skin: X }
        const misSkinsIds = inventarioRes.data.map(item => item.id_skin || item.id);
        setMisSkins(misSkinsIds);

        // Establecemos la vista previa inicial
        const skinInicial = skinsDisponibles.find(s => s.id === skinEquipada);
        if (skinInicial) setSkinPreview(skinInicial);

      } catch (error) {
        console.error("Error cargando el vestidor:", error);
        Alert.alert("Error", "No se pudo cargar la tienda de skins.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDatosVestidor();
  }, [skinEquipada]);

  const handleEquipar = async () => {
    if (!skinPreview) return;

    if (!misSkins.includes(skinPreview.id)) {
      Alert.alert("Bloqueado 🔒", "Aún no tienes esta skin en tu inventario.");
      return;
    }

    setIsEquipping(true);
    try {
      await apiClient.post(`/macetas/${id_maceta}/skins/${skinPreview.id}/equipar`);
      setSkinEquipada(skinPreview.id);
      Alert.alert("¡Genial! ✨", "Tu maceta ahora luce un nuevo estilo.");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Hubo un problema al equipar la skin.");
    } finally {
      setIsEquipping(false);
    }
  };

  const renderSkinItem = ({ item }) => {
    const isUnlocked = misSkins.includes(item.id);
    const isEquipped = item.id === skinEquipada;
    const isSelected = skinPreview?.id === item.id;

    // Concatenamos la URL
    const imageUrl = `${baseURL}${item.imagen_url}`;

    return (
      <TouchableOpacity 
        style={[
          styles.skinCard, 
          isSelected && styles.skinCardSelected,
          !isUnlocked && styles.skinCardLocked
        ]}
        onPress={() => setSkinPreview(item)}
      >
        <Image 
          source={{ uri: imageUrl }} 
          style={[styles.skinThumbnail, !isUnlocked && { opacity: 0.3 }]} 
          resizeMode="contain"
        />
        
        {/* Indicadores */}
        {isEquipped && <View style={styles.badgeEquipped}><Text style={styles.badgeText}>✓</Text></View>}
        {!isUnlocked && <View style={styles.badgeLocked}><Text style={styles.badgeText}>🔒</Text></View>}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={{ color: '#64748B', marginTop: 10 }}>Abriendo el armario...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient colors={["#F8FAFC", "#E2E8F0"]} style={StyleSheet.absoluteFill} />

      {/* HEADER: EL PODIO (MODO OSCURO) */}
      <View style={styles.podioContainer}>
        <LinearGradient colors={["#0F172A", "#1E293B"]} style={StyleSheet.absoluteFill} borderRadius={30} />
        
        <Text style={styles.podioTitle}>{nombre_maceta || "Tu Maceta"}</Text>
        
        {skinPreview ? (
          <Image 
            source={{ uri: `${baseURL}${skinPreview.imagen_url}` }} 
            style={styles.podioImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.placeholderImage} />
        )}

        <View style={styles.infoBox}>
          <Text style={styles.skinName}>{skinPreview?.nombre || "Cargando..."}</Text>
          <Text style={styles.skinDesc}>{skinPreview?.descripcion || ""}</Text>
          
          <TouchableOpacity 
            style={[
              styles.actionBtn, 
              skinEquipada === skinPreview?.id ? styles.actionBtnDisabled : styles.actionBtnActive
            ]}
            disabled={skinEquipada === skinPreview?.id || isEquipping}
            onPress={handleEquipar}
          >
            {isEquipping ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionBtnText}>
                {skinEquipada === skinPreview?.id ? "Equipado Actualmente" : "Equipar Skin"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* BODY: EL INVENTARIO (MODO CLARO) */}
      <View style={styles.inventoryContainer}>
        <Text style={styles.sectionTitle}>Colección de Skins</Text>
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
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  
  // PODIO (ARRIBA)
  podioContainer: {
    height: '55%',
    margin: 15,
    borderRadius: 30,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    alignItems: 'center',
    padding: 20,
    justifyContent: 'space-between'
  },
  podioTitle: { color: '#94A3B8', fontSize: 16, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
  podioImage: { width: 220, height: 220, marginVertical: 10 },
  placeholderImage: { width: 220, height: 220, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 110, marginVertical: 10 },
  
  infoBox: { width: '100%', alignItems: 'center' },
  skinName: { color: '#F8FAFC', fontSize: 24, fontWeight: 'bold' },
  skinDesc: { color: '#CBD5E1', fontSize: 13, textAlign: 'center', marginTop: 5, marginBottom: 15, paddingHorizontal: 20 },
  
  actionBtn: { width: '80%', paddingVertical: 15, borderRadius: 15, alignItems: 'center' },
  actionBtnActive: { backgroundColor: '#22C55E', shadowColor: '#22C55E', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.4, shadowRadius: 8 },
  actionBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.1)' },
  actionBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },

  // INVENTARIO (ABAJO)
  inventoryContainer: { flex: 1, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#0F172A', marginBottom: 15 },
  row: { justifyContent: 'space-between', marginBottom: 15 },
  
  skinCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  skinCardSelected: { borderColor: '#4ADE80', backgroundColor: '#F0FDF4' },
  skinCardLocked: { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' },
  
  skinThumbnail: { width: '100%', height: '100%' },
  
  badgeEquipped: { position: 'absolute', top: -5, right: -5, backgroundColor: '#22C55E', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  badgeLocked: { position: 'absolute', bottom: -5, right: -5, backgroundColor: '#64748B', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' }
});