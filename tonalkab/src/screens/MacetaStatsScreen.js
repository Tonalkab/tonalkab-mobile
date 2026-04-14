// src/screens/MacetaStatsScreen.js
import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { LineChart } from "react-native-gifted-charts";
import { ThemeContext } from '../context/ThemeContext';
import apiClient from '../api/client';

export default function MacetaStatsScreen({ route }) {
  const { id_maceta, nombre_maceta } = route.params;
  const { colors } = useTheme();
  const { isDark } = useContext(ThemeContext);

  const [dataHumedad, setDataHumedad] = useState([]);
  const [dataTemp, setDataTemp] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        // Obtenemos los últimos 20 registros del historial 
        const res = await apiClient.get(`/macetas/${id_maceta}/lecturas/historial?limit=20`);
        const historial = res.data.reverse(); // Invertimos para que el tiempo fluya de izquierda a derecha

        // Mapeamos los datos para la librería de gráficas [cite: 9, 146]
        const formattedHumedad = historial.map(item => ({
          value: parseFloat(item.humedad_suelo),
          label: new Date(item.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          dataPointText: `${item.humedad_suelo}%`
        }));

        const formattedTemp = historial.map(item => ({
          value: parseFloat(item.temperatura),
          label: '', // No repetimos etiquetas para no saturar
        }));

        setDataHumedad(formattedHumedad);
        setDataTemp(formattedTemp);
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
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={[styles.mainTitle, { color: colors.text }]}>{nombre_maceta}</Text>
      
      {/* GRÁFICA DE HUMEDAD DE SUELO (MAGENTA/VERDE) */}
      <View style={[styles.chartCard, { backgroundColor: 'rgba(30, 41, 59, 0.7)' }]}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>Humedad del Suelo (%)</Text>
        <LineChart
          data={dataHumedad}
          height={200}
          width={Dimensions.get('window').width - 80}
          initialSpacing={10}
          color={colors.primary}
          thickness={3}
          dataPointsColor={colors.primary}
          textColor={colors.text}
          noOfSections={4}
          yAxisColor="transparent"
          xAxisColor="rgba(255,255,255,0.2)"
          yAxisTextStyle={{ color: '#94A3B8' }}
        />
        <Text style={styles.chartFootnote}>Variación de humedad en las últimas horas</Text>
      </View>

      {/* GRÁFICA DE TEMPERATURA AMBIENTAL */}
      <View style={[styles.chartCard, { backgroundColor: 'rgba(30, 41, 59, 0.7)' }]}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>Temperatura Ambiente (°C)</Text>
        <LineChart
          data={dataTemp}
          height={150}
          width={Dimensions.get('window').width - 80}
          color="#F59E0B" // Naranja para temperatura
          thickness={2}
          hideDataPoints
          noOfSections={3}
          yAxisColor="transparent"
          xAxisColor="rgba(255,255,255,0.2)"
          yAxisTextStyle={{ color: '#94A3B8' }}
        />
      </View>

      {/* RESUMEN TÉCNICO */}
      <View style={[styles.infoBox, { borderColor: colors.primary }]}>
        <Text style={[styles.infoText, { color: colors.text }]}>
          ℹ️ Estas gráficas permiten observar el comportamiento del algoritmo "Valle a Pico". Los incrementos sin activación de bomba indican detección de lluvia o riego externo[cite: 263, 271].
        </Text>
      </View>
      
      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mainTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  chartCard: { padding: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', marginBottom: 20 },
  chartTitle: { fontSize: 18, fontWeight: '600', marginBottom: 20 },
  chartFootnote: { fontSize: 12, color: '#94A3B8', marginTop: 15, textAlign: 'center' },
  infoBox: { padding: 15, borderRadius: 15, borderWidth: 1, borderStyle: 'dashed', marginTop: 10 },
  infoText: { fontSize: 13, lineHeight: 18, opacity: 0.8 }
});