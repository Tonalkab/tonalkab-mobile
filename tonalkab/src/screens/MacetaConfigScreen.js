// src/screens/MacetaConfigScreen.js
import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { ThemeContext } from '../context/ThemeContext';
import apiClient from '../api/client';

export default function MacetaConfigScreen({ route, navigation }) {
  const { id_maceta, nombre_maceta } = route.params;
  const { colors } = useTheme();
  const { isDark } = useContext(ThemeContext);

  const [activeTab, setActiveTab] = useState('planta'); // 'planta' o 'manual'
  const [isLoading, setIsLoading] = useState(false);

  // Estados para el Catálogo
  const [catalogo, setCatalogo] = useState([]);
  const [selectedPlanta, setSelectedPlanta] = useState(null);

  // Estados para Configuración Manual
  const [humMin, setHumMin] = useState('');
  const [humMax, setHumMax] = useState('');
  const [dias, setDias] = useState('');

  // Cargar el catálogo al iniciar
  useEffect(() => {
    const fetchCatalogo = async () => {
      try {
        // AQUÍ ESTÁ LA CORRECCIÓN DE LA RUTA (Error 404 solucionado)
        const res = await apiClient.get('/catalogos/plantas');
        setCatalogo(res.data);
      } catch (error) {
        console.error("Error al cargar catálogo:", error);
      }
    };
    fetchCatalogo();
  }, []);

  // 1. Enviar Cambio de Planta
  const handleCambiarPlanta = async () => {
    if (!selectedPlanta) return Alert.alert("Error", "Selecciona una planta del catálogo");
    setIsLoading(true);
    try {
      await apiClient.patch(`/macetas/${id_maceta}/planta`, { id_tipo_planta: selectedPlanta });
      Alert.alert("¡Éxito!", "La maceta ha sido actualizada. La configuración natural ha sido restaurada.");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", error.response?.data?.detail || "No se pudo cambiar la planta");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Enviar Configuración Manual (Sobreescribe la IA)
  const handleGuardarManual = async () => {
    if (!humMin || !humMax || !dias) return Alert.alert("Error", "Llena todos los campos");
    setIsLoading(true);
    try {
      await apiClient.post(`/macetas/${id_maceta}/configuracion`, {
        humedad_suelo_min: parseFloat(humMin),
        humedad_suelo_max: parseFloat(humMax),
        tiempo_min_entre_riegos_dias: parseInt(dias),
        modo_operacion: "manual"
      });
      Alert.alert("¡Éxito!", "Reglas manuales establecidas. El hardware las descargará en breve.");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", error.response?.data?.detail || "No se pudo guardar la configuración");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.headerTitle, { color: colors.text }]}>{nombre_maceta}</Text>
      
      {/* Pestañas de Navegación */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'planta' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('planta')}
        >
          <Text style={{ color: activeTab === 'planta' ? colors.primary : '#94A3B8', fontWeight: 'bold' }}>Catálogo Botánico</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'manual' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('manual')}
        >
          <Text style={{ color: activeTab === 'manual' ? colors.primary : '#94A3B8', fontWeight: 'bold' }}>Control Manual</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* PESTAÑA: CATÁLOGO */}
        {activeTab === 'planta' && (
          <View style={styles.section}>
            <Text style={[styles.description, { color: colors.text }]}>
              Selecciona la especie que acabas de sembrar. El sistema aplicará los umbrales biológicos ideales automáticamente.
            </Text>
            
            {catalogo.map((planta) => (
              <TouchableOpacity 
                key={planta.id_tipo_planta}
                style={[
                  styles.plantaCard, 
                  { backgroundColor: 'rgba(30, 41, 59, 0.7)', borderColor: selectedPlanta === planta.id_tipo_planta ? colors.primary : 'rgba(255,255,255,0.1)' }
                ]}
                onPress={() => setSelectedPlanta(planta.id_tipo_planta)}
              >
                <Text style={[styles.plantaName, { color: colors.text }]}>🌿 {planta.nombre_planta}</Text>
                <Text style={{ color: '#94A3B8' }}>Humedad ideal: {planta.humedad_suelo_min}% - {planta.humedad_suelo_max}%</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={handleCambiarPlanta} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Asignar Planta</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* PESTAÑA: MANUAL */}
        {activeTab === 'manual' && (
          <View style={styles.section}>
            <Text style={[styles.description, { color: colors.text }]}>
              Forza los umbrales operativos del hardware (Edge Computing). Al guardar, sobreescribirás la biología por defecto de la planta.
            </Text>

            <View style={[styles.inputGroup, { backgroundColor: 'rgba(30, 41, 59, 0.7)' }]}>
              <Text style={{ color: colors.text, marginBottom: 5 }}>Humedad Mínima Crítica (%)</Text>
              <TextInput style={styles.input} keyboardType="numeric" placeholder="Ej. 30" placeholderTextColor="#475569" value={humMin} onChangeText={setHumMin} />
            </View>

            <View style={[styles.inputGroup, { backgroundColor: 'rgba(30, 41, 59, 0.7)' }]}>
              <Text style={{ color: colors.text, marginBottom: 5 }}>Humedad Máxima Objetivo (%)</Text>
              <TextInput style={styles.input} keyboardType="numeric" placeholder="Ej. 70" placeholderTextColor="#475569" value={humMax} onChangeText={setHumMax} />
            </View>

            <View style={[styles.inputGroup, { backgroundColor: 'rgba(30, 41, 59, 0.7)' }]}>
              <Text style={{ color: colors.text, marginBottom: 5 }}>Días de espera entre riegos</Text>
              <TextInput style={styles.input} keyboardType="numeric" placeholder="Ej. 3" placeholderTextColor="#475569" value={dias} onChangeText={setDias} />
            </View>

            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={handleGuardarManual} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Sobreescribir Hardware</Text>}
            </TouchableOpacity>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  tabContainer: { flexDirection: 'row', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  section: { flex: 1 },
  description: { fontSize: 14, marginBottom: 20, opacity: 0.8, lineHeight: 20 },
  plantaCard: { padding: 15, borderRadius: 15, borderWidth: 2, marginBottom: 15 },
  plantaName: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  inputGroup: { padding: 15, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 15 },
  input: { fontSize: 18, color: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#334155', paddingVertical: 5 },
  actionBtn: { padding: 15, borderRadius: 15, alignItems: 'center', marginTop: 10 },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});