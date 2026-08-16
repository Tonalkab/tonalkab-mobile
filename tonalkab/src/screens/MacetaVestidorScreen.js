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
  const { id_maceta, nombre_maceta, skin_actual_id, onSkinChange } = route.params || {};

  const [catalogo, setCatalogo] = useState([]);
  const [misSkins, setMisSkins] = useState([]);
  const [saldoMonedas, setSaldoMonedas] = useState(0);
  const [skinEquipada, setSkinEquipada] = useState(skin_actual_id || 1); 
  const [skinPreview, setSkinPreview] = useState(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const baseURL = apiClient.defaults.baseURL || 'https://api.tonalkab.com';

  const fetchDatosVestidor = async () => {
    try {
      // Intentar obtener catálogo enriquecido de la tienda
      const tiendaRes = await apiClient.get('/skins/tienda');
      const { saldo_monedas, skins } = tiendaRes.data;
      
      setSaldoMonedas(saldo_monedas);
      setCatalogo(skins);
      
      const misSkinsIds = skins.filter(s => s.desbloqueada).map(s => s.id);
      setMisSkins(misSkinsIds);

      const skinInicial = skins.find(s => s.id === skinEquipada) || skins[0];
      if (skinInicial) setSkinPreview(skinInicial);

    } catch (error) {
      console.warn("Fallo /skins/tienda, usando fallback:", error);
      // Fallback a endpoints clásicos
      try {
        const [catalogoRes, inventarioRes, meRes] = await Promise.all([
          apiClient.get('/skins/'),
          apiClient.get('/me/skins'),
          apiClient.get('/me')
        ]);
        setCatalogo(catalogoRes.data);
        setSaldoMonedas(meRes.data.monedas || 0);
        const misSkinsIds = inventarioRes.data.map(item => item.id_skin || item.id);
        setMisSkins(misSkinsIds);
        const skinInicial = catalogoRes.data.find(s => s.id === skinEquipada) || catalogoRes.data[0];
        if (skinInicial) setSkinPreview(skinInicial);
      } catch (err) {
        console.error("Error cargando el vestidor:", err);
        Alert.alert("Error", "No se pudo cargar la boutique de skins.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDatosVestidor();
  }, [skinEquipada]);

  const handleEquipar = async () => {
    if (!skinPreview) return;

    if (!misSkins.includes(skinPreview.id)) {
      Alert.alert("Bloqueado", "Aún no tienes esta skin en tu colección.");
      return;
    }

    setIsActionLoading(true);
    try {
      await apiClient.post(`/macetas/${id_maceta}/skins/${skinPreview.id}/equipar`);
      setSkinEquipada(skinPreview.id);
      Alert.alert("¡Nuevo Estilo!", "Tu maceta ahora luce espectacular.");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Hubo un problema al aplicar el estilo.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleComprarODesbloquear = async () => {
    if (!skinPreview) return;
    const precio = skinPreview.precio_monedas || 0;

    if (precio > 0 && saldoMonedas < precio) {
      Alert.alert(
        "Monedas Insuficientes",
        `Esta skin cuesta ${precio} monedas y actualmente tienes 🪙 ${saldoMonedas}.\n\n¡Sigue cuidando tus macetas para ganar más monedas!`
      );
      return;
    }

    setIsActionLoading(true);
    try {
      const res = await apiClient.post(`/skins/${skinPreview.id}/comprar`);
      const nuevoSaldo = res.data.saldo_monedas ?? (saldoMonedas - precio);
      
      setSaldoMonedas(nuevoSaldo);
      setMisSkins(prev => [...prev, skinPreview.id]);

      Alert.alert(
        "¡Adquisición Exitosa!",
        res.data.message || `Has desbloqueado '${skinPreview.nombre}'. ¡Ya puedes equiparla!`
      );
    } catch (error) {
      const msg = error.response?.data?.detail || "No se pudo completar la compra.";
      Alert.alert("Error", msg);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleGoBack = () => {
    const skinActivaObj = catalogo.find(s => s.id === skinEquipada);
    if (onSkinChange && skinActivaObj) {
      onSkinChange(skinEquipada, skinActivaObj.imagen_url);
    }
    navigation.goBack();
  };

  const getCategoryStyles = (categoria, isSelected, isUnlocked) => {
    if (!isUnlocked) return styles.skinCardLocked;
    
    if (!isSelected) {
      switch (categoria) {
        case 'legendaria': return { borderColor: '#E9D5FF', backgroundColor: '#FAF5FF' }; // Light Purple
        case 'rara': return { borderColor: '#FFEDD5', backgroundColor: '#FFF7ED' };       // Light Orange
        case 'comun':
        default: return {}; 
      }
    } else {
      switch (categoria) {
        case 'legendaria': return { borderColor: '#A855F7', backgroundColor: '#FAF5FF', borderWidth: 2 }; 
        case 'rara': return { borderColor: '#F97316', backgroundColor: '#FFF7ED', borderWidth: 2 };       
        case 'comun':
        default: return styles.skinCardSelected;           
      }
    }
  };

  const renderSkinItem = ({ item }) => {
    const isUnlocked = misSkins.includes(item.id);
    const isEquipped = item.id === skinEquipada;
    const isSelected = skinPreview?.id === item.id;
    const imageUrl = item.imagen_url?.startsWith('http') 
      ? item.imagen_url 
      : `${baseURL}${item.imagen_url}`;

    return (
      <TouchableOpacity 
        style={[
          styles.skinCard, 
          getCategoryStyles(item.categoria, isSelected, isUnlocked)
        ]}
        onPress={() => setSkinPreview(item)}
        activeOpacity={0.7}
      >
        <Image 
          source={{ uri: imageUrl }} 
          style={[styles.skinThumbnail, !isUnlocked && { opacity: 0.4 }]} 
          resizeMode="contain"
        />
        
        {isEquipped && (
          <View style={[styles.badge, styles.badgeEquipped]}>
            <Ionicons name="checkmark-sharp" size={12} color="#FFF" />
          </View>
        )}
        
        {!isUnlocked && (
          <View style={[styles.badge, styles.badgeLocked]}>
            {item.precio_monedas > 0 ? (
              <Text style={styles.badgePriceText}>🪙</Text>
            ) : (
              <Ionicons name="gift-outline" size={12} color="#FFF" />
            )}
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

  const isUnlocked = misSkins.includes(skinPreview?.id);
  const isEquipped = skinEquipada === skinPreview?.id;
  const precio = skinPreview?.precio_monedas || 0;
  const previewImgUrl = skinPreview?.imagen_url?.startsWith('http')
    ? skinPreview.imagen_url
    : `${baseURL}${skinPreview?.imagen_url}`;

  const getAuraColor = (categoria) => {
    switch (categoria) {
      case 'legendaria': return 'rgba(168, 85, 247, 0.15)'; 
      case 'rara': return 'rgba(249, 115, 22, 0.15)';
      case 'comun':
      default: return 'rgba(34, 197, 94, 0.10)';
    }
  };

  const getCategoryTextColor = (categoria) => {
    switch (categoria) {
      case 'legendaria': return '#9333EA'; 
      case 'rara': return '#EA580C';       
      case 'comun':
      default: return '#64748B';           
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient colors={["#FFFFFF", "#F8FAFC", "#F1F5F9"]} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={handleGoBack}>
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>Boutique Tonalkab</Text>
          <Text style={styles.headerSubtitle}>{nombre_maceta || "Personaliza tu maceta"}</Text>
        </View>

        {/* Saldo de Monedas */}
        <View style={styles.coinBadge}>
          <Text style={styles.coinIcon}>🪙</Text>
          <Text style={styles.coinText}>{saldoMonedas}</Text>
        </View>
      </View>

      {/* Vitrina de exhibición */}
      <View style={styles.vitrinaContainer}>
        <View style={[styles.auraGlow, { backgroundColor: getAuraColor(skinPreview?.categoria) }]} />
        
        {skinPreview ? (
          <Image 
            source={{ uri: previewImgUrl }} 
            style={styles.vitrinaImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.placeholderImage} />
        )}

        <View style={styles.infoBox}>
          <Text style={styles.skinName}>{skinPreview?.nombre || "Cargando..."}</Text>
          <Text style={[styles.skinCategoryTag, { color: getCategoryTextColor(skinPreview?.categoria) }]}>
            {skinPreview?.categoria ? skinPreview.categoria.toUpperCase() : 'COMÚN'}
          </Text>
          <Text style={styles.skinDesc} numberOfLines={2}>{skinPreview?.descripcion || "Diseño exclusivo de Tonalkab."}</Text>
          
          {/* BOTÓN DINÁMICO: Equipar / Reclamar Gratis / Comprar con Monedas */}
          {isUnlocked ? (
            <TouchableOpacity 
              style={[
                styles.actionBtn, 
                isEquipped ? styles.actionBtnDisabled : styles.actionBtnActive
              ]}
              disabled={isEquipped || isActionLoading}
              onPress={handleEquipar}
            >
              {isActionLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.actionBtnText}>
                  {isEquipped ? "✓ En Uso" : "Aplicar Estilo"}
                </Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.actionBtn, styles.actionBtnBuy]}
              disabled={isActionLoading}
              onPress={handleComprarODesbloquear}
            >
              {isActionLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.actionBtnText}>
                  {precio === 0 
                    ? "🎁 Reclamar Gratis" 
                    : `🪙 Comprar por ${precio} Monedas`}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Catálogo / Colección */}
      <View style={styles.inventoryContainer}>
        <View style={styles.inventoryHeader}>
          <Text style={styles.sectionTitle}>Colección & Tienda</Text>
          <Text style={styles.collectionCount}>{misSkins.length} / {catalogo.length} Desbloqueadas</Text>
        </View>
        
        <FlatList
          data={catalogo}
          keyExtractor={(item) => item.id.toString()}
          numColumns={3}
          showsVerticalScrollIndicator={false}
          renderItem={renderSkinItem}
          columnWrapperStyle={styles.row}
          contentContainerStyle={{ paddingBottom: 30 }}
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
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight + 8 : 8, 
    paddingBottom: 10
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  headerTitleBox: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  headerSubtitle: { fontSize: 12, fontWeight: '600', color: '#22C55E' },

  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  coinIcon: { fontSize: 14, marginRight: 4 },
  coinText: { color: '#B45309', fontWeight: '800', fontSize: 14 },

  vitrinaContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 25,
    paddingTop: 15,
    paddingBottom: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 15,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 15
  },
  auraGlow: {
    position: 'absolute',
    top: 25,
    width: 140,
    height: 140,
    backgroundColor: 'rgba(34, 197, 94, 0.10)',
    borderRadius: 70
  },
  vitrinaImage: { width: 160, height: 160, marginBottom: 10 },
  placeholderImage: { width: 160, height: 160, backgroundColor: '#F8FAFC', borderRadius: 80, marginBottom: 10 },
  
  infoBox: { width: '100%', alignItems: 'center' },
  skinName: { color: '#0F172A', fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  skinCategoryTag: { fontSize: 11, fontWeight: '800', marginTop: 2, letterSpacing: 1 },
  skinDesc: { color: '#64748B', fontSize: 13, textAlign: 'center', marginTop: 4, marginBottom: 12, paddingHorizontal: 10, fontWeight: '500', lineHeight: 18 },
  
  actionBtn: { width: '90%', paddingVertical: 14, borderRadius: 16, alignItems: 'center', elevation: 2 },
  actionBtnActive: { backgroundColor: '#22C55E', shadowColor: '#22C55E', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12 },
  actionBtnBuy: { backgroundColor: '#D97706', shadowColor: '#D97706', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12 },
  actionBtnDisabled: { backgroundColor: '#E2E8F0', shadowColor: 'transparent', elevation: 0 },
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
  badgeLocked: { backgroundColor: '#D97706' },
  badgePriceText: { fontSize: 10 }
});