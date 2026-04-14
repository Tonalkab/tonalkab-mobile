// src/screens/MacetaDetailScreen.js

import React, { useContext, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  ScrollView, TouchableOpacity, Image
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { ThemeContext } from '../context/ThemeContext';
import apiClient from '../api/client';

export default function MacetaDetailScreen({ route, navigation }) {
  const { id_maceta, nombre_maceta } = route.params;

  const { colors } = useTheme();
  const { isDark } = useContext(ThemeContext);

  const [lectura, setLectura] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchLecturaActual = async () => {
      try {
        const response = await apiClient.get(`/macetas/${id_maceta}/lecturas/actual`);
        setLectura(response.data);
      } catch (error) {
        setErrorMsg("No se pudo obtener la información.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLecturaActual();
  }, [id_maceta]);

  const Sensor = ({ icon, label, value, unit }) => (
    <View style={styles.sensorCard}>
      <Text style={styles.sensorIcon}>{icon}</Text>
      <Text style={styles.sensorValue}>
        {value}<Text style={styles.unit}>{unit}</Text>
      </Text>
      <Text style={styles.sensorLabel}>{label}</Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={{ color: '#94A3B8', marginTop: 10 }}>
          Conectando con {nombre_maceta}...
        </Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{errorMsg}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* 🌱 AVATAR */}
      <View style={styles.avatarContainer}>
        <Image
          source={require('../../assets/avatar.png')}
          style={styles.avatar}
        />
      </View>

      {/* 🌿 CÍRCULO PRINCIPAL */}
      <View style={styles.circleContainer}>
        <View style={styles.circle}>
          <Text style={styles.circleLabel}>Humedad</Text>
          <Text style={styles.circleValue}>
            {lectura?.humedad_suelo || 0}
            <Text style={styles.unit}>%</Text>
          </Text>
        </View>
      </View>

      {/* 📊 SENSORES */}
      <View style={styles.grid}>
        <Sensor icon="🌡️" label="Temp" value={lectura?.temperatura || 0} unit="°C" />
        <Sensor icon="💧" label="Hum. Aire" value={lectura?.humedad_ambiental || 0} unit="%" />
        <Sensor icon="☀️" label="Luz" value={lectura?.nivel_luz || 0} unit="" />
        <Sensor icon="🔋" label="Batería" value={lectura?.voltaje_bateria || 0} unit="V" />
      </View>

      {/* 💧 NIVEL DE AGUA */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Nivel de Agua</Text>

        <View style={styles.progressBg}>
          <View
            style={[
              styles.progressFill,
              { width: `${lectura?.nivel_agua || 0}%` }
            ]}
          />
        </View>

        <Text style={styles.info}>
          {lectura?.nivel_agua || 0}% restante
        </Text>
      </View>

      {/* 📈 BOTÓN STATS */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#3B82F6' }]}
        onPress={() =>
          navigation.navigate('MacetaStats', { id_maceta, nombre_maceta })
        }
      >
        <Text style={styles.buttonText}>
          Ver estadísticas 📊
        </Text>
      </TouchableOpacity>

      {/* ⚙️ CONFIG */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#22C55E' }]}
        onPress={() =>
          navigation.navigate('MacetaConfig', { id_maceta, nombre_maceta })
        }
      >
        <Text style={styles.buttonText}>
          Ajustes ⚙️
        </Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    padding: 20,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  error: {
    color: '#EF4444',
    fontSize: 16,
  },

  // 🌱 AVATAR
  avatarContainer: {
    alignItems: 'center',
    marginTop: 10,
  },

  avatar: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },

  // 🌿 CÍRCULO
  circleContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },

  circle: {
    width: 180,
    height: 180,
    borderRadius: 100,
    borderWidth: 4,
    borderColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },

  circleLabel: {
    color: '#94A3B8',
  },

  circleValue: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#22C55E',
  },

  unit: {
    fontSize: 18,
  },

  // 📊 GRID
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  sensorCard: {
    width: '48%',
    backgroundColor: '#0F172A',
    padding: 15,
    borderRadius: 20,
    marginBottom: 15,
    alignItems: 'center',
  },

  sensorIcon: {
    fontSize: 24,
  },

  sensorValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },

  sensorLabel: {
    color: '#94A3B8',
    marginTop: 5,
  },

  // 💧 CARD
  card: {
    backgroundColor: '#0F172A',
    padding: 20,
    borderRadius: 20,
    marginTop: 20,
  },

  cardTitle: {
    color: '#F8FAFC',
    fontWeight: 'bold',
    marginBottom: 10,
  },

  progressBg: {
    height: 10,
    backgroundColor: '#1E293B',
    borderRadius: 10,
  },

  progressFill: {
    height: 10,
    backgroundColor: '#3B82F6',
    borderRadius: 10,
  },

  info: {
    color: '#94A3B8',
    marginTop: 10,
  },

  // 🔘 BOTONES
  button: {
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 15,
  },

  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});