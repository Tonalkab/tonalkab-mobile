// src/screens/MacetaStatsScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import { LineChart } from "react-native-gifted-charts";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import apiClient from '../api/client';

const { width } = Dimensions.get('window');

export default function MacetaStatsScreen({ route }) {
  const { id_maceta, nombre_maceta } = route.params;

  const [dataHumedad, setDataHumedad] = useState([]);
  const [dataTemp, setDataTemp] = useState([]);
  const [dataHumAmb, setDataHumAmb] = useState([]);
  const [dataLuz, setDataLuz] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        const res = await apiClient.get(`/macetas/${id_maceta}/lecturas/historial?limit=20`);
        const historial = res.data.reverse(); 

        // Parche de Zona Horaria (Alemania -> Local)
        const corregirHoraServidor = (fechaIso) => {
          if (!fechaIso) return new Date();
          const fechaLimpia = fechaIso.replace(' ', 'T');
          const d = new Date(fechaLimpia);
          d.setHours(d.getHours() - 8); // Restamos las 8 horas de diferencia con Nuremberg
          return d;
        };

        // 🌟 FUNCIÓN SIMPLIFICADA: Ahora siempre retorna únicamente la hora corregida
        const formatLabel = (fechaIso) => {
          const d = corregirHoraServidor(fechaIso);
          return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        };

        const formattedHumedad = historial.map((item, index) => ({
          value: parseFloat(item.humedad_suelo || 0),
          label: index % 4 === 0 ? formatLabel(item.fecha_hora) : '',
        }));

        const formattedTemp = historial.map((item, index) => ({
          value: parseFloat(item.temperatura || 0),
          label: index % 4 === 0 ? formatLabel(item.fecha_hora) : '',
        }));

        const formattedHumAmb = historial.map((item, index) => ({
          value: parseFloat(item.humedad_ambiental || 0),
          label: index % 4 === 0 ? formatLabel(item.fecha_hora) : '',
        }));

        const formattedLuz = historial.map((item, index) => ({
          value: parseFloat(item.nivel_luz || 0),
          label: index % 4 === 0 ? formatLabel(item.fecha_hora) : '',
        }));

        setDataHumedad(formattedHumedad);
        setDataTemp(formattedTemp);
        setDataHumAmb(formattedHumAmb);
        setDataLuz(formattedLuz);
      } catch (error) {
        console.error("Error cargando historial:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistorial();
  }, [id_maceta]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>Procesando métricas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar style="dark" />
      <LinearGradient colors={["#FFFFFF", "#F8FAFC", "#F1F5F9"]} style={StyleSheet.absoluteFill} />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* CABECERA */}
        <View style={styles.header}>
          <Text style={styles.subtitle}>Reporte de Salud</Text>
          <Text style={styles.mainTitle}>{nombre_maceta}</Text>
        </View>
        
        {/* 1. GRÁFICA DE HUMEDAD DE SUELO */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="water" size={20} color="#22C55E" />
            </View>
            <View>
              <Text style={styles.chartTitle}>Humedad del Suelo</Text>
              <Text style={styles.chartSubtitle}>Últimas lecturas registradas</Text>
            </View>
          </View>

          <LineChart
            areaChart
            curved
            data={dataHumedad}
            height={160}
            width={width - 80}
            initialSpacing={15}
            color="#22C55E"
            thickness={3}
            startFillColor="#22C55E"
            endFillColor="#FFFFFF"
            startOpacity={0.4}
            endOpacity={0.05}
            hideDataPoints
            yAxisColor="transparent"
            xAxisColor="transparent"
            rulesColor="#F1F5F9"
            yAxisTextStyle={styles.yAxisText}
            xAxisLabelTextStyle={styles.xAxisText}
          />
        </View>

        {/* 2. GRÁFICA DE TEMPERATURA AMBIENTAL */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#FFEDD5' }]}>
              <Ionicons name="thermometer" size={20} color="#F97316" />
            </View>
            <View>
              <Text style={styles.chartTitle}>Temperatura Ambiental</Text>
              <Text style={styles.chartSubtitle}>Impacto térmico en la planta</Text>
            </View>
          </View>

          <LineChart
            areaChart
            curved
            data={dataTemp}
            height={160}
            width={width - 80}
            initialSpacing={15}
            color="#F97316"
            thickness={3}
            startFillColor="#F97316"
            endFillColor="#FFFFFF"
            startOpacity={0.3}
            endOpacity={0.05}
            hideDataPoints
            yAxisColor="transparent"
            xAxisColor="transparent"
            rulesColor="#F1F5F9"
            yAxisTextStyle={styles.yAxisText}
            xAxisLabelTextStyle={styles.xAxisText}
          />
        </View>

        {/* 3. GRÁFICA DE HUMEDAD AMBIENTAL */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="cloud" size={20} color="#3B82F6" />
            </View>
            <View>
              <Text style={styles.chartTitle}>Humedad Ambiental</Text>
              <Text style={styles.chartSubtitle}>Humedad relativa en el aire</Text>
            </View>
          </View>

          <LineChart
            areaChart
            curved
            data={dataHumAmb}
            height={160}
            width={width - 80}
            initialSpacing={15}
            color="#3B82F6"
            thickness={3}
            startFillColor="#3B82F6"
            endFillColor="#FFFFFF"
            startOpacity={0.3}
            endOpacity={0.05}
            hideDataPoints
            yAxisColor="transparent"
            xAxisColor="transparent"
            rulesColor="#F1F5F9"
            yAxisTextStyle={styles.yAxisText}
            xAxisLabelTextStyle={styles.xAxisText}
          />
        </View>

        {/* 4. GRÁFICA DE LUZ */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#FEF9C3' }]}>
              <Ionicons name="sunny" size={20} color="#EAB308" />
            </View>
            <View>
              <Text style={styles.chartTitle}>Nivel de Luz</Text>
              <Text style={styles.chartSubtitle}>Exposición solar</Text>
            </View>
          </View>

          <LineChart
            areaChart
            curved
            data={dataLuz}
            height={160}
            width={width - 80}
            initialSpacing={15}
            color="#EAB308"
            thickness={3}
            startFillColor="#EAB308"
            endFillColor="#FFFFFF"
            startOpacity={0.3}
            endOpacity={0.05}
            hideDataPoints
            yAxisColor="transparent"
            xAxisColor="transparent"
            rulesColor="#F1F5F9"
            yAxisTextStyle={styles.yAxisText}
            xAxisLabelTextStyle={styles.xAxisText}
          />
        </View>

        {/* RESUMEN TÉCNICO */}
        <View style={styles.insightCard}>
          <View style={styles.insightIconRow}>
            <Ionicons name="bulb" size={24} color="#3B82F6" />
            <Text style={styles.insightTitle}>Análisis del Algoritmo</Text>
          </View>
          <Text style={styles.insightText}>
            Estas métricas reflejan el comportamiento del modelo "Valle a Pico". Los incrementos de humedad sin activación de la bomba sugieren eventos externos como lluvia o riego manual.
          </Text>
        </View>
        
        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  loadingText: { marginTop: 15, color: '#64748B', fontSize: 15, fontWeight: '500' },
  
  header: { marginTop: 25, marginBottom: 25 },
  subtitle: { fontSize: 14, fontWeight: '700', color: '#22C55E', textTransform: 'uppercase', letterSpacing: 1 },
  mainTitle: { fontSize: 32, fontWeight: '900', color: '#0F172A', letterSpacing: -1, marginTop: 4 },
  
  chartCard: { 
    backgroundColor: '#FFFFFF', 
    padding: 20, 
    borderRadius: 24, 
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 15,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  chartHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  chartTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  chartSubtitle: { fontSize: 12, fontWeight: '500', color: '#94A3B8', marginTop: 2 },
  
  yAxisText: { color: '#94A3B8', fontSize: 11, fontWeight: '600' },
  xAxisText: { color: '#94A3B8', fontSize: 10, fontWeight: '500', textAlign: 'center' },

  insightCard: { 
    backgroundColor: '#EFF6FF', 
    padding: 20, 
    borderRadius: 20, 
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#DBEAFE'
  },
  insightIconRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  insightTitle: { fontSize: 15, fontWeight: '800', color: '#1E3A8A', marginLeft: 8 },
  insightText: { fontSize: 13, lineHeight: 20, color: '#3B82F6', fontWeight: '500' }
});