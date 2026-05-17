// src/screens/EnciclopediaScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TextInput, 
  TouchableOpacity, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform,
  Image // 🌟 Agregamos Image a las importaciones
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import apiClient from '../api/client';

export default function EnciclopediaScreen({ navigation }) {
  const [plantas, setPlantas] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // 🌟 Definimos la URL base para cargar las imágenes desde tu servidor
  const baseURL = apiClient.defaults.baseURL || 'https://api.tonalkab.com';

  // Cargamos las plantas desde tu API
  useEffect(() => {
    const fetchEnciclopedia = async () => {
      try {
        const res = await apiClient.get('/catalogos/plantas');
        setPlantas(res.data);
      } catch (error) {
        console.error("Error al cargar la enciclopedia:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEnciclopedia();
  }, []);

  // Filtrado reactivo de búsqueda
  const plantasFiltradas = plantas.filter(p => 
    p.nombre_planta.toLowerCase().includes(filtro.toLowerCase())
  );

  const renderPlanta = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.7}
      onPress={() => navigation.navigate('PlantaDetail', { planta: item })} 
    >
      <View style={styles.iconBox}>
        {/* 🌟 CONDICIONAL: Si hay imagen, la mostramos. Si no, mostramos el emoji */}
        {item.imagen_url ? (
          <Image 
            source={{ uri: `${baseURL}${item.imagen_url}` }} 
            style={styles.plantaImage}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.emojiArt}>🌿</Text>
        )}
      </View>
      
      <View style={styles.cardInfo}>
        <Text style={styles.plantaName}>{item.nombre_planta}</Text>
        
        {/* Atributos de la Planta */}
        <View style={styles.badgesRow}>
          <View style={[styles.badge, { backgroundColor: '#EFF6FF', borderColor: '#DBEAFE' }]}>
            <Ionicons name="water" size={12} color="#3B82F6" style={{ marginRight: 4 }} />
            <Text style={[styles.badgeText, { color: '#1E3A8A' }]}>
              {item.humedad_suelo_min}% - {item.humedad_suelo_max}%
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actionArrow}>
        <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar style="dark" />
      <LinearGradient colors={["#FFFFFF", "#F8FAFC", "#F1F5F9"]} style={StyleSheet.absoluteFill} />

      {/* CABECERA Y BUSCADOR */}
      <View style={styles.headerContainer}>
        <Text style={styles.mainTitle}>Enciclopedia</Text>
        <Text style={styles.subtitle}>Catálogo de especies compatibles</Text>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre..."
            placeholderTextColor="#94A3B8"
            value={filtro}
            onChangeText={setFiltro}
            autoCorrect={false}
          />
          {filtro.length > 0 && (
            <TouchableOpacity onPress={() => setFiltro('')} style={styles.clearIcon}>
              <Ionicons name="close-circle" size={20} color="#CBD5E1" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* LISTA DE PLANTAS */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={styles.loadingText}>Abriendo los archivos botánicos...</Text>
        </View>
      ) : plantasFiltradas.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="leaf-outline" size={60} color="#CBD5E1" />
          <Text style={styles.emptyText}>No se encontraron especies con ese nombre.</Text>
        </View>
      ) : (
        <FlatList
          data={plantasFiltradas}
          keyExtractor={(item) => item.id_tipo_planta.toString()}
          renderItem={renderPlanta}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 15, color: '#64748B', fontSize: 15, fontWeight: '500' },
  emptyText: { marginTop: 15, color: '#94A3B8', fontSize: 15, fontWeight: '500', textAlign: 'center', paddingHorizontal: 40 },
  
  // CABECERA
  headerContainer: { paddingHorizontal: 20, paddingTop: 30, paddingBottom: 15 },
  mainTitle: { fontSize: 32, fontWeight: '900', color: '#0F172A', letterSpacing: -1 },
  subtitle: { fontSize: 14, fontWeight: '600', color: '#22C55E', marginTop: 4, marginBottom: 20 },

  // BUSCADOR
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, color: '#0F172A', fontWeight: '500' },
  clearIcon: { padding: 5 },

  // LISTA
  listContainer: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 10 },
  
  // TARJETAS DE ESPECIE
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 20,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 3,
  },
  iconBox: {
    width: 60,
    height: 60,
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    marginRight: 15,
    overflow: 'hidden', // 🌟 IMPORTANTE: Para que la imagen no se salga de los bordes redondeados
  },
  plantaImage: { 
    width: '100%', 
    height: '100%' 
  }, // 🌟 Estilo para la nueva imagen
  emojiArt: { fontSize: 30 },
  
  cardInfo: { flex: 1, justifyContent: 'center' },
  plantaName: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 6 },
  
  badgesRow: { flexDirection: 'row' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },

  actionArrow: { paddingLeft: 10 }
});