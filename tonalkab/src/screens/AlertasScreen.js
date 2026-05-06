// src/screens/AlertasScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, SafeAreaView 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import apiClient from '../api/client';

export default function AlertasScreen() {
  const [alertas, setAlertas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAlertas = async () => {
      try {
        // Intenta obtener las alertas reales de tu backend
        const res = await apiClient.get('/alertas');
        if (res.data && res.data.length > 0) {
          setAlertas(res.data);
        } else {
          cargarDatosDePrueba(); // Si no hay, cargamos el diseño de prueba
        }
      } catch (error) {
        console.log("No se pudo conectar al endpoint de alertas. Cargando demo...");
        cargarDatosDePrueba();
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlertas();
  }, []);

  // Datos simulados para que veas lo increíble que queda el diseño
  const cargarDatosDePrueba = () => {
    setAlertas([
      { id: '1', tipo: 'agua', maceta: 'Lengua de Suegra', titulo: 'Nivel de agua crítico', mensaje: 'El tanque de reserva está por debajo del 10%. Rellénalo pronto.', tiempo: 'Hace 10 min', leida: false },
      { id: '2', tipo: 'temperatura', maceta: 'Monstera Deliciosa', titulo: 'Calor extremo', mensaje: 'La temperatura superó los 35°C. Considera mover la planta a la sombra.', tiempo: 'Hace 2 horas', leida: false },
      { id: '3', tipo: 'bateria', maceta: 'Bonsái', titulo: 'Batería baja', mensaje: 'El dispositivo tiene 15% de batería restante.', tiempo: 'Ayer', leida: true },
      { id: '4', tipo: 'conexion', maceta: 'Cactus', titulo: 'Dispositivo desconectado', mensaje: 'Se perdió la conexión WiFi con el huerto desde hace 5 horas.', tiempo: 'Hace 5 horas', leida: true },
    ]);
  };

  const marcarComoLeidas = () => {
    const alertasActualizadas = alertas.map(a => ({ ...a, leida: true }));
    setAlertas(alertasActualizadas);
    // Aquí podrías hacer un apiClient.post('/alertas/marcar-leidas')
  };

  // Función para darle un estilo único a cada tipo de alerta
  const getEstiloAlerta = (tipo) => {
    switch (tipo) {
      case 'agua': return { icon: 'water', color: '#3B82F6', bg: '#EFF6FF', border: '#DBEAFE' }; // Azul
      case 'temperatura': return { icon: 'thermometer', color: '#F59E0B', bg: '#FEF3C7', border: '#FDE68A' }; // Naranja
      case 'bateria': return { icon: 'battery-dead', color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' }; // Rojo
      case 'conexion': return { icon: 'wifi', color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' }; // Gris
      default: return { icon: 'notifications', color: '#22C55E', bg: '#F0FDF4', border: '#DCFCE7' }; // Verde por defecto
    }
  };

  const renderAlerta = ({ item }) => {
    const estilo = getEstiloAlerta(item.tipo);
    
    return (
      <TouchableOpacity style={[styles.alertaCard, !item.leida && styles.alertaNoLeida]} activeOpacity={0.7}>
        {/* ÍCONO DE LA ALERTA */}
        <View style={[styles.iconBox, { backgroundColor: estilo.bg, borderColor: estilo.border }]}>
          <Ionicons name={estilo.icon} size={24} color={estilo.color} />
        </View>

        {/* CONTENIDO */}
        <View style={styles.contentBox}>
          <View style={styles.headerRow}>
            <Text style={styles.alertaTitle} numberOfLines={1}>{item.titulo}</Text>
            <Text style={styles.alertaTime}>{item.tiempo}</Text>
          </View>
          <Text style={styles.alertaMaceta}>📍 {item.maceta}</Text>
          <Text style={styles.alertaMessage} numberOfLines={2}>{item.mensaje}</Text>
        </View>

        {/* INDICADOR DE NO LEÍDA */}
        {!item.leida && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  // --- VISTA DE ESTADO VACÍO (CUANDO TODO ESTÁ BIEN) ---
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyCircle}>
        <Ionicons name="shield-checkmark" size={60} color="#22C55E" />
      </View>
      <Text style={styles.emptyTitle}>Todo bajo control</Text>
      <Text style={styles.emptyText}>
        Tu huerto está en perfectas condiciones. No hay alertas críticas en este momento.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar style="dark" />
      <LinearGradient colors={["#FFFFFF", "#F8FAFC", "#F1F5F9"]} style={StyleSheet.absoluteFill} />

      {/* CABECERA */}
      <View style={styles.headerContainer}>
        <View>
          <Text style={styles.mainTitle}>Alertas</Text>
          <Text style={styles.subtitle}>Centro de notificaciones</Text>
        </View>
        
        {/* BOTÓN PARA MARCAR LEÍDAS */}
        {alertas.some(a => !a.leida) && (
          <TouchableOpacity style={styles.markReadBtn} onPress={marcarComoLeidas}>
            <Ionicons name="checkmark-done" size={18} color="#3B82F6" />
            <Text style={styles.markReadText}>Limpiar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* LISTA DE ALERTAS */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#22C55E" />
        </View>
      ) : (
        <FlatList
          data={alertas}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderAlerta}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyState}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // CABECERA
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 30, paddingBottom: 15 },
  mainTitle: { fontSize: 32, fontWeight: '900', color: '#0F172A', letterSpacing: -1 },
  subtitle: { fontSize: 14, fontWeight: '600', color: '#22C55E', marginTop: 2 },
  
  markReadBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#DBEAFE' },
  markReadText: { fontSize: 12, fontWeight: '700', color: '#1E3A8A', marginLeft: 4 },

  // LISTA
  listContainer: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 10 },
  
  // TARJETAS DE ALERTA
  alertaCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 24,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  alertaNoLeida: {
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    shadowOpacity: 0.05,
  },
  
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginRight: 15,
  },
  
  contentBox: { flex: 1, justifyContent: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 },
  alertaTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', flex: 1, marginRight: 10 },
  alertaTime: { fontSize: 11, fontWeight: '600', color: '#94A3B8' },
  
  alertaMaceta: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 4 },
  alertaMessage: { fontSize: 13, lineHeight: 18, color: '#475569', fontWeight: '500' },
  
  // PUNTO AZUL (NO LEÍDA)
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#3B82F6', marginLeft: 10 },

  // ESTADO VACÍO (SIN ALERTAS)
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 4, borderColor: '#DCFCE7' },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 10 },
  emptyText: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22, fontWeight: '500' }
});