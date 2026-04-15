import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert
} from 'react-native';

import { BleManager } from 'react-native-ble-plx';
import apiClient from '../api/client';

const manager = new BleManager();

export default function AgregarMacetaScreen({ navigation }) {

  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [nombreMaceta, setNombreMaceta] = useState('');

  const [device, setDevice] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [sending, setSending] = useState(false);

  // 🔵 ESCANEAR ESP32
  const scanDevice = () => {
    setConnecting(true);

    manager.startDeviceScan(null, null, (error, scannedDevice) => {
      if (error) {
        Alert.alert("Error Bluetooth", error.message);
        setConnecting(false);
        return;
      }

      // 🔥 FILTRAR ESP32 (cambia el nombre si quieres)
      if (scannedDevice?.name?.includes("ESP32")) {
        manager.stopDeviceScan();

        scannedDevice.connect()
          .then((d) => d.discoverAllServicesAndCharacteristics())
          .then((d) => {
            setDevice(d);
            setConnecting(false);
            Alert.alert("Conectado", "ESP32 listo");
          })
          .catch((e) => {
            setConnecting(false);
            Alert.alert("Error conexión", e.message);
          });
      }
    });

    // stop scan after 10s
    setTimeout(() => {
      manager.stopDeviceScan();
      setConnecting(false);
    }, 10000);
  };

  // 📡 ENVIAR WIFI AL ESP32
  const sendDataToESP32 = async () => {
    if (!device) return Alert.alert("Error", "Conecta el ESP32 primero");
    if (!ssid || !password || !nombreMaceta) {
      return Alert.alert("Error", "Completa todos los campos");
    }

    setSending(true);

    try {
      const payload = JSON.stringify({
        ssid,
        password,
        token: Date.now().toString() // o genera UUID real
      });

      // ⚠️ UUIDs dependen de tu ESP32
      await device.writeCharacteristicWithResponseForService(
        "SERVICE_UUID",
        "CHARACTERISTIC_UUID",
        Buffer.from(payload).toString("base64")
      );

      // 🌿 CREAR MACETA EN BACKEND
      await apiClient.post('/macetas', {
        nombre_maceta: nombreMaceta,
        id_tipo_planta: 1,
        token_hash: JSON.parse(payload).token
      });

      Alert.alert("Éxito", "Maceta configurada correctamente");
      navigation.goBack();

    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.container}>

      <Text style={styles.title}>➕ Agregar Maceta</Text>

      {/* BOTÓN BLUETOOTH */}
      <TouchableOpacity style={styles.btn} onPress={scanDevice}>
        {connecting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Buscar ESP32</Text>
        )}
      </TouchableOpacity>

      {device && (
        <Text style={styles.ok}>✔ ESP32 Conectado</Text>
      )}

      {/* INPUTS */}
      <TextInput
        placeholder="Nombre de la maceta"
        placeholderTextColor="#999"
        style={styles.input}
        value={nombreMaceta}
        onChangeText={setNombreMaceta}
      />

      <TextInput
        placeholder="SSID WiFi"
        placeholderTextColor="#999"
        style={styles.input}
        value={ssid}
        onChangeText={setSsid}
      />

      <TextInput
        placeholder="Contraseña WiFi"
        placeholderTextColor="#999"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {/* ENVIAR */}
      <TouchableOpacity style={styles.btn2} onPress={sendDataToESP32}>
        {sending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Configurar Maceta</Text>
        )}
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 20,
    justifyContent: 'center'
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#22C55E',
    textAlign: 'center',
    marginBottom: 30
  },

  input: {
    backgroundColor: '#1E293B',
    padding: 15,
    borderRadius: 12,
    color: '#fff',
    marginBottom: 15
  },

  btn: {
    backgroundColor: '#3B82F6',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15
  },

  btn2: {
    backgroundColor: '#22C55E',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10
  },

  btnText: {
    color: '#fff',
    fontWeight: 'bold'
  },

  ok: {
    color: '#22C55E',
    textAlign: 'center',
    marginBottom: 10
  }
});