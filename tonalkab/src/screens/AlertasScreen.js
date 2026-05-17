// src/screens/AlertasScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, SafeAreaView, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import apiClient from '../api/client';

export default function AlertasScreen() {
  const [alertas, setAlertas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAlertasGlobales = async () => {
    setIsLoading(true);
    try {
      // 1. Primero obtenemos todas las macetas del usuario
      const macetasRes = await apiClient.get('/macetas/');
      const macetas = macetasRes.data;

      // 2. Por cada maceta, pedimos sus alertas pendientes simultáneamente
      const peticionesAlertas = macetas.map(m => 
        apiClient.get(`/macetas/${m.id_maceta}/alertas?solo_pendientes=false`)
      );

      const resultados = await Promise.all(peticionesAlertas);
      
      // 3. Aplanamos los resultados en una sola lista
      let todasLasAlertas = [];
      resultados.forEach((res, index) => {
        const alertasConNombre = res.data.map(alerta => ({
          ...alerta,
          nombre_maceta: macetas[index].nombre_maceta 
        }));
        todasLasAlertas = [...todasLasAlertas, ...alertasConNombre];
      });

      // 4. Ordenamos por fecha (la más reciente arriba)
      todasLasAlertas.sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora));

      setAlertas(todasLasAlertas);
    } catch (error) {
      console.error("Error cargando alertas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertasGlobales();
  }, []);

  // Función para marcar como vista
  const marcarComoLeida = async (alertaId, index) => {
    try {
      const nuevasAlertas = [...alertas];
      nuevasAlertas[index].vista_usuario = true;
      setAlertas(nuevasAlertas);

      await apiClient.patch(`/alertas/${alertaId}/vista`);
    } catch (error) {
      console.error("Error al actualizar estado vista:", error);
    }
  };

  // Traductor de tipos de alertas
  const getAlertaInfo = (idTipo) => {
    switch (idTipo) {
      case 1: 
        return { titulo: 'Falta de Humedad', icon: 'leaf', color: '#A855F7', bg: '#FAF5FF', border: '#E9D5FF' };
      case 2: 
        return { titulo: 'Batería Crítica', icon: 'battery-dead', color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' };
      case 3: 
        return { titulo: 'Desconexión', icon: 'wifi-outline', color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' };
      case 4: 
        return { titulo: 'Tanque Vacío', icon: 'water', color: '#3B82F6', bg: '#EFF6FF', border: '#DBEAFE' };
      default: 
        return { titulo: 'Aviso del Sistema', icon: 'notifications', color: '#22C55E', bg: '#F0FDF4', border: '#DCFCE7' };
    }
  };

  const renderAlerta = ({ item, index }) => {
    const info = getAlertaInfo(item.id_tipo_alerta);
    const isLeida = item.vista_usuario === true || item.id_estado_alerta === 2;

    // 🌟 Parche de Zona Horaria (Alemania -> Local México -8 horas)
    const corregirHoraServidor = (fechaIso) => {
      if (!fechaIso) return new Date();
      const fechaLimpia = fechaIso.replace(' ', 'T');
      const d = new Date(fechaLimpia);
      d.setHours(d.getHours() - 8); 
      return d;
    };

    const fechaCorregida = corregirHoraServidor(item.fecha_hora);
    
    // Formateamos de forma limpia el día/mes y la hora correspondientes
    const fechaTexto = fechaCorregida.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
    const horaTexto = fechaCorregida.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <TouchableOpacity 
        style={[styles.alertaCard, !isLeida && styles.alertaNoLeida]} 
        activeOpacity={0.7}
        onPress={() => !isLeida && marcarComoLeida(item.id_alerta, index)}
      >
        <View style={[styles.iconBox, { backgroundColor: info.bg, borderColor: info.border }]}>
          <Ionicons name={info.icon} size={24} color={info.color} />
        </View>

        <View style={styles.contentBox}>
          <View style={styles.headerRow}>
            <Text style={styles.alertaTitle}>{info.titulo}</Text>
            {/* 🌟 MUESTRA FECHA Y HORA JUNTAS */}
            <Text style={styles.alertaTime}>{`${fechaTexto} - ${horaTexto}`}</Text>
          </View>
          <Text style={styles.alertaMaceta}>📍 {item.nombre_maceta}</Text>
          <Text style={styles.alertaMessage} numberOfLines={3}>{item.mensaje}</Text>
        </View>

        {!isLeida && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar style="dark" />
      <LinearGradient colors={["#FFFFFF", "#F8FAFC", "#F1F5F9"]} style={StyleSheet.absoluteFill} />

      <View style={styles.headerContainer}>
        <View>
          <Text style={styles.mainTitle}>Alertas</Text>
          <Text style={styles.subtitle}>Estado del huerto en tiempo real</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchAlertasGlobales}>
          <Ionicons name="refresh" size= {20} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#22C55E" />
        </View>
      ) : (
        <FlatList
          data={alertas}
          keyExtractor={(item) => item.id_alerta.toString()}
          renderItem={renderAlerta}
          contentContainerStyle={styles.listContainer}
          onRefresh={fetchAlertasGlobales}
          refreshing={isLoading}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="shield-checkmark" size={80} color="#22C55E" />
              <Text style={styles.emptyTitle}>Todo perfecto</Text>
              <Text style={styles.emptyText}>No hay alertas que requieran tu atención ahora mismo.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 30, paddingBottom: 15 },
  mainTitle: { fontSize: 32, fontWeight: '900', color: '#0F172A', letterSpacing: -1 },
  subtitle: { fontSize: 14, fontWeight: '600', color: '#22C55E' },
  refreshBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#DBEAFE' },
  listContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  alertaCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 24, marginBottom: 15, alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 8, elevation: 2 },
  alertaNoLeida: { borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  iconBox: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, marginRight: 15 },
  contentBox: { flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  alertaTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  alertaTime: { fontSize: 11, fontWeight: '600', color: '#94A3B8' },
  alertaMaceta: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 4 },
  alertaMessage: { fontSize: 13, lineHeight: 18, color: '#475569', fontWeight: '500' },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#3B82F6', marginLeft: 10 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginTop: 20 },
  emptyText: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 10, lineHeight: 22 }
});