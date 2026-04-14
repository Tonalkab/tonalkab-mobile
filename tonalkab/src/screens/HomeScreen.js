// src/screens/HomeScreen.js

import React, { useContext, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, FlatList, RefreshControl
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { ThemeContext } from '../context/ThemeContext';
import apiClient from '../api/client';

export default function HomeScreen({ navigation }) {
  const { colors } = useTheme();
  const { isDark } = useContext(ThemeContext);

  const [macetas, setMacetas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMacetas = async () => {
    try {
      const response = await apiClient.get('/macetas/');
      setMacetas(response.data);
    } catch (error) {
      console.log("Error macetas:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMacetas();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMacetas();
  };

  // 🎯 COLOR SEGÚN ESTADO
  const getStatusColor = (estado) => {
    return estado === 1 ? '#22C55E' : '#EF4444';
  };

  const renderMacetaCard = ({ item }) => {
    const statusColor = getStatusColor(item.id_estado_dispositivo);

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.card, { shadowColor: statusColor }]}
        onPress={() =>
          navigation.navigate('MacetaDetail', {
            id_maceta: item.id_maceta,
            nombre_maceta: item.nombre_maceta
          })
        }
      >
        {/* HEADER */}
        <View style={styles.cardHeader}>
          <Text style={styles.title}>
            🌱 {item.nombre_maceta}
          </Text>

          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        </View>

        {/* INFO */}
        <Text style={styles.info}>
          ID: {item.id_maceta}
        </Text>

        <Text style={styles.info}>
          {item.id_estado_dispositivo === 1
            ? "Dispositivo activo"
            : "Desconectado"}
        </Text>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.date}>
            {new Date(item.fecha_registro).toLocaleDateString()}
          </Text>

          <Text style={[styles.statusText, { color: statusColor }]}>
            {item.id_estado_dispositivo === 1 ? "En línea" : "Offline"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.mainTitle}>
          🌿 Mis Plantas
        </Text>

        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.settings}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* CONTENIDO */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#22C55E" />
        </View>
      ) : (
        <FlatList
          data={macetas}
          keyExtractor={(item) => item.id_maceta.toString()}
          renderItem={renderMacetaCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#22C55E"
            />
          }
        />
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#020617',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },

  mainTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },

  settings: {
    fontSize: 24,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
  },

  card: {
    backgroundColor: '#0F172A',
    padding: 20,
    borderRadius: 25,
    marginBottom: 15,

    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',

    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },

  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 10,
  },

  info: {
    color: '#94A3B8',
    marginTop: 5,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },

  date: {
    color: '#64748B',
    fontSize: 12,
  },

  statusText: {
    fontWeight: 'bold',
  },
});