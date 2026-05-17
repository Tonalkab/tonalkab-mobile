// src/screens/MacetaConfigScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, TextInput, 
  Alert, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
  Image // 🌟 Importamos Image para el catálogo
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import apiClient from '../api/client';

export default function MacetaConfigScreen({ route, navigation }) {
  const { id_maceta, nombre_maceta } = route.params;

  const [activeTab, setActiveTab] = useState('planta'); // 'planta' o 'manual'
  const [isLoading, setIsLoading] = useState(false);

  // Estados para el Catálogo
  const [catalogo, setCatalogo] = useState([]);
  const [selectedPlanta, setSelectedPlanta] = useState(null);

  // Estados para Configuración Manual
  const [humMin, setHumMin] = useState('');
  const [humMax, setHumMax] = useState('');
  const [dias, setDias] = useState('');

  // 🌟 URL base para resolver las rutas de las imágenes de tu API
  const baseURL = apiClient.defaults.baseURL || 'https://api.tonalkab.com';

  useEffect(() => {
    const fetchCatalogo = async () => {
      try {
        const res = await apiClient.get('/catalogos/plantas');
        setCatalogo(res.data);
      } catch (error) {
        console.error("Error al cargar catálogo:", error);
      }
    };
    fetchCatalogo();
  }, []);

  const handleCambiarPlanta = async () => {
    if (!selectedPlanta) return Alert.alert("Falta selección", "Elige una especie del catálogo biológico.");
    setIsLoading(true);
    try {
      await apiClient.patch(`/macetas/${id_maceta}/planta`, { id_tipo_planta: selectedPlanta });
      Alert.alert("¡Especie Actualizada! 🌱", "Se han descargado los algoritmos de riego ideales para tu planta.");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", error.response?.data?.detail || "No se pudo cambiar la planta");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuardarManual = async () => {
    if (!humMin || !humMax || !dias) return Alert.alert("Campos incompletos", "Por favor, define todos los parámetros del hardware.");
    setIsLoading(true);
    try {
      await apiClient.post(`/macetas/${id_maceta}/configuracion`, {
        humedad_suelo_min: parseFloat(humMin),
        humedad_suelo_max: parseFloat(humMax),
        tiempo_min_entre_riegos_dias: parseInt(dias),
        modo_operacion: "manual"
      });
      Alert.alert("¡Hardware Sobreescrito! ⚙️", "Las nuevas directivas se están enviando al dispositivo.");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", error.response?.data?.detail || "No se pudo guardar la configuración");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.mainContainer}
    >
      <StatusBar style="dark" />
      <LinearGradient colors={["#FFFFFF", "#F8FAFC", "#F1F5F9"]} style={StyleSheet.absoluteFill} />

      {/* CABECERA */}
      <View style={styles.header}>
        <View style={styles.iconWrapper}>
          <Ionicons name="settings" size={28} color="#22C55E" />
        </View>
        <Text style={styles.mainTitle}>Ajustes del Sistema</Text>
        <Text style={styles.subtitle}>{nombre_maceta}</Text>
      </View>

      {/* SELECTOR DE MODO */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity 
          style={[styles.segmentBtn, activeTab === 'planta' && styles.segmentActive]}
          onPress={() => setActiveTab('planta')}
        >
          <Ionicons name="leaf" size={16} color={activeTab === 'planta' ? '#FFFFFF' : '#64748B'} style={{ marginRight: 6 }}/>
          <Text style={[styles.segmentText, activeTab === 'planta' && styles.segmentTextActive]}>Biología IA</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.segmentBtn, activeTab === 'manual' && styles.segmentActive]}
          onPress={() => setActiveTab('manual')}
        >
          <Ionicons name="hardware-chip" size={16} color={activeTab === 'manual' ? '#FFFFFF' : '#64748B'} style={{ marginRight: 6 }}/>
          <Text style={[styles.segmentText, activeTab === 'manual' && styles.segmentTextActive]}>Forzar Hardware</Text>
        </TouchableOpacity>
      </View>

      {/* ÁREA DESPLAZABLE (Solo para el contenido de las listas/inputs) */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* PESTAÑA: BIOLOGÍA IA */}
        {activeTab === 'planta' && (
          <View style={styles.section}>
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={24} color="#3B82F6" />
              <Text style={styles.infoText}>
                Selecciona la especie. El sistema Tonalkab descargará los umbrales ideales y automatizará el cuidado basado en su biología.
              </Text>
            </View>
            
            {catalogo.map((planta) => {
              const isSelected = selectedPlanta === planta.id_tipo_planta;
              return (
                <TouchableOpacity 
                  key={planta.id_tipo_planta}
                  style={[styles.plantaCard, isSelected && styles.plantaCardSelected]}
                  onPress={() => setSelectedPlanta(planta.id_tipo_planta)}
                  activeOpacity={0.7}
                >
                  <View style={styles.plantaCardBody}>
                    {/* 🌟 CONTENEDOR DE IMAGEN O EMOJI */}
                    <View style={styles.imgContainer}>
                      {planta.imagen_url ? (
                        <Image 
                          source={{ uri: `${baseURL}${planta.imagen_url}` }} 
                          style={styles.plantaImg}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={styles.emojiArt}>🌿</Text>
                      )}
                    </View>

                    {/* TEXTO E INFORMACIÓN */}
                    <View style={styles.plantaInfo}>
                      <View style={styles.plantaHeader}>
                        <Text style={[styles.plantaName, isSelected && { color: '#16A34A' }]} numberOfLines={1}>
                          {planta.nombre_planta}
                        </Text>
                        {isSelected && <Ionicons name="checkmark-circle" size={22} color="#22C55E" />}
                      </View>
                      
                      <View style={styles.plantaStatsRow}>
                        <View style={styles.plantaStat}>
                          <Ionicons name="water-outline" size={12} color="#64748B" />
                          <Text style={styles.plantaStatText}>Min: {planta.humedad_suelo_min}%</Text>
                        </View>
                        <View style={styles.plantaStat}>
                          <Ionicons name="water" size={12} color="#3B82F6" />
                          <Text style={styles.plantaStatText}>Max: {planta.humedad_suelo_max}%</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        )}

        {/* PESTAÑA: MANUAL */}
        {activeTab === 'manual' && (
          <View style={styles.section}>
            <View style={[styles.infoBox, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
              <Ionicons name="warning" size={24} color="#EF4444" />
              <Text style={[styles.infoText, { color: '#B91C1C' }]}>
                ¡Peligro! Al guardar estas reglas desactivarás la Inteligencia Artificial. La maceta obedecerá estrictamente a estos números.
              </Text>
            </View>

            <View style={styles.inputCard}>
              <View style={styles.inputHeader}>
                <Ionicons name="arrow-down-circle" size={20} color="#F59E0B" />
                <Text style={styles.inputTitle}>Humedad Mínima Crítica</Text>
              </View>
              <View style={styles.inputRow}>
                <TextInput 
                  style={styles.numericInput} 
                  keyboardType="numeric" 
                  placeholder="00" 
                  placeholderTextColor="#CBD5E1" 
                  value={humMin} 
                  onChangeText={setHumMin} 
                  maxLength={3}
                />
                <Text style={styles.unitText}>%</Text>
              </View>
              <Text style={styles.inputHelper}>La bomba se activará al bajar de este nivel.</Text>
            </View>

            <View style={styles.inputCard}>
              <View style={styles.inputHeader}>
                <Ionicons name="arrow-up-circle" size={20} color="#3B82F6" />
                <Text style={styles.inputTitle}>Humedad Máxima Objetivo</Text>
              </View>
              <View style={styles.inputRow}>
                <TextInput 
                  style={styles.numericInput} 
                  keyboardType="numeric" 
                  placeholder="00" 
                  placeholderTextColor="#CBD5E1" 
                  value={humMax} 
                  onChangeText={setHumMax} 
                  maxLength={3}
                />
                <Text style={styles.unitText}>%</Text>
              </View>
              <Text style={styles.inputHelper}>La bomba se detendrá al alcanzar este nivel.</Text>
            </View>

            <View style={styles.inputCard}>
              <View style={styles.inputHeader}>
                <Ionicons name="time" size={20} color="#8B5CF6" />
                <Text style={styles.inputTitle}>Días de absorción (Espera)</Text>
              </View>
              <View style={styles.inputRow}>
                <TextInput 
                  style={styles.numericInput} 
                  keyboardType="numeric" 
                  placeholder="0" 
                  placeholderTextColor="#CBD5E1" 
                  value={dias} 
                  onChangeText={setDias} 
                  maxLength={2}
                />
                <Text style={styles.unitText}>Días</Text>
              </View>
              <Text style={styles.inputHelper}>Evita ahogar la planta forzando pausas entre riegos.</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 🌟 SECCIÓN FIJA INFERIOR (STICKY FOOTER): El botón nunca se oculta al scrollear */}
      <View style={styles.fixedBottomAction}>
        {activeTab === 'planta' ? (
          <TouchableOpacity style={styles.actionBtn} onPress={handleCambiarPlanta} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Aplicar Perfil Biológico</Text>}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#EF4444', shadowColor: '#EF4444' }]} onPress={handleGuardarManual} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Sobreescribir Dispositivo</Text>}
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  // Dejamos un padding inferior en el scroll para que el footer fijo no tape el último elemento
  scrollContent: { paddingHorizontal: 20, paddingBottom: 110 },
  
  header: { alignItems: 'center', marginTop: 30, marginBottom: 20 },
  iconWrapper: { width: 60, height: 60, borderRadius: 20, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  mainTitle: { fontSize: 26, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
  subtitle: { fontSize: 16, fontWeight: '600', color: '#64748B', marginTop: 4 },

  segmentContainer: { flexDirection: 'row', backgroundColor: '#E2E8F0', marginHorizontal: 20, padding: 4, borderRadius: 16, marginBottom: 25 },
  segmentBtn: { flex: 1, flexDirection: 'row', paddingVertical: 12, justifyContent: 'center', alignItems: 'center', borderRadius: 12 },
  segmentActive: { backgroundColor: '#22C55E', shadowColor: '#22C55E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  segmentText: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  segmentTextActive: { color: '#FFFFFF' },

  section: { flex: 1 },
  
  infoBox: { flexDirection: 'row', backgroundColor: '#EFF6FF', padding: 15, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#DBEAFE', alignItems: 'center' },
  infoText: { flex: 1, fontSize: 13, lineHeight: 20, color: '#1E3A8A', fontWeight: '500', marginLeft: 10 },

  // TARJETAS RESTRUCTURADAS CON IMAGEN
  plantaCard: { backgroundColor: '#FFFFFF', padding: 14, borderRadius: 20, marginBottom: 15, borderWidth: 2, borderColor: '#F1F5F9', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  plantaCardSelected: { borderColor: '#4ADE80', backgroundColor: '#F0FDF4' },
  plantaCardBody: { flexDirection: 'row', alignItems: 'center' },
  imgContainer: { width: 55, height: 55, borderRadius: 14, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#DCFCE7', overflow: 'hidden', marginRight: 14 },
  plantaImg: { width: '100%', height: '100%' },
  emojiArt: { fontSize: 26 },
  
  plantaInfo: { flex: 1 },
  plantaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  plantaName: { fontSize: 17, fontWeight: '800', color: '#0F172A', flex: 1, marginRight: 10 },
  plantaStatsRow: { flexDirection: 'row', gap: 10 },
  plantaStat: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  plantaStatText: { fontSize: 11, fontWeight: '600', color: '#64748B', marginLeft: 4 },

  inputCard: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 20, marginBottom: 15, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 10, elevation: 2 },
  inputHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  inputTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginLeft: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'baseline', borderBottomWidth: 2, borderBottomColor: '#F1F5F9', paddingBottom: 5 },
  numericInput: { fontSize: 36, fontWeight: '900', color: '#0F172A', minWidth: 70, padding: 0 },
  unitText: { fontSize: 20, fontWeight: '700', color: '#94A3B8', marginLeft: 5 },
  inputHelper: { fontSize: 12, color: '#94A3B8', marginTop: 10, fontWeight: '500' },

  // ESTILOS DEL CONTENEDOR FIJO INFERIOR
  fixedBottomAction: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    backgroundColor: '#FFFFFF', 
    paddingHorizontal: 20, 
    paddingVertical: 15, 
    borderTopWidth: 1, 
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10
  },
  actionBtn: { backgroundColor: '#22C55E', paddingVertical: 16, borderRadius: 16, alignItems: 'center', shadowColor: '#22C55E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16, letterSpacing: 0.5 }
});