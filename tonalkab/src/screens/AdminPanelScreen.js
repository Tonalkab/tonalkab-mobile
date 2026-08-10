// src/screens/AdminPanelScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, ActivityIndicator, Alert, SafeAreaView, Image,
  Platform, StatusBar as RNStatusBar, Switch
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '../api/client';

export default function AdminPanelScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('skins'); // 'skins' | 'plantas' | 'monedas' | 'stats'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stats, setStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Formulario Skin
  const [skinNombre, setSkinNombre] = useState('');
  const [skinDescripcion, setSkinDescripcion] = useState('');
  const [skinPrecio, setSkinPrecio] = useState('100');
  const [skinEsPremium, setSkinEsPremium] = useState(false);
  const [skinImage, setSkinImage] = useState(null);

  // Formulario Planta
  const [plantaNombre, setPlantaNombre] = useState('');
  const [humSueloMin, setHumSueloMin] = useState('40');
  const [humSueloMax, setHumSueloMax] = useState('70');
  const [humAmbMin, setHumAmbMin] = useState('50');
  const [humAmbMax, setHumAmbMax] = useState('80');
  const [tempMin, setTempMin] = useState('18');
  const [tempMax, setTempMax] = useState('28');
  const [diasRiego, setDiasRiego] = useState('4');
  const [profRaiz, setProfRaiz] = useState('15');
  const [dificultad, setDificultad] = useState('1');
  const [plantaDesc, setPlantaDesc] = useState('');
  const [plantaCuidados, setPlantaCuidados] = useState('');
  const [plantaImage, setPlantaImage] = useState(null);

  // Gestión de Monedas
  const [userQuery, setUserQuery] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [monedasCantidad, setMonedasCantidad] = useState('500');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isTransferringCoins, setIsTransferringCoins] = useState(false);

  useEffect(() => {
    if (activeTab === 'stats') {
      fetchStats();
    } else if (activeTab === 'monedas') {
      fetchUsuarios('');
    }
  }, [activeTab]);

  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      const res = await apiClient.get('/admin/stats');
      setStats(res.data);
    } catch (err) {
      console.error(err);
      Alert.alert("Aviso", "No se pudieron cargar las estadísticas.");
    } finally {
      setIsLoadingStats(false);
    }
  };

  const fetchUsuarios = async (queryText = '') => {
    setIsLoadingUsers(true);
    try {
      const endpoint = queryText.trim() 
        ? `/admin/usuarios?query=${encodeURIComponent(queryText.trim())}` 
        : '/admin/usuarios';
      const res = await apiClient.get(endpoint);
      setUserResults(res.data || []);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "No se pudieron buscar usuarios.");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleOtorgarMonedas = async () => {
    if (!selectedUser) {
      Alert.alert("Usuario Requerido", "Por favor selecciona a qué usuario transferir las monedas.");
      return;
    }
    const monto = parseInt(monedasCantidad, 10);
    if (isNaN(monto) || monto === 0) {
      Alert.alert("Cantidad Inválida", "Ingresa una cantidad válida diferente de 0.");
      return;
    }

    setIsTransferringCoins(true);
    try {
      const res = await apiClient.post(`/admin/usuarios/${selectedUser.id_usuario}/monedas`, {
        cantidad: monto
      });

      const nuevoSaldo = res.data.saldo_nuevo;
      
      // Actualizar el estado local
      setSelectedUser(prev => prev ? { ...prev, monedas: nuevoSaldo } : null);
      setUserResults(prev => prev.map(u => u.id_usuario === selectedUser.id_usuario ? { ...u, monedas: nuevoSaldo } : u));

      Alert.alert(
        "¡Transferencia Exitosa! 🪙",
        `Se han ${monto > 0 ? 'acreditado' : 'descontado'} ${Math.abs(monto)} monedas a ${selectedUser.nombre}.\n\nNuevo saldo: 🪙 ${nuevoSaldo.toLocaleString()}`
      );
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.detail || "Error al transferir monedas.";
      Alert.alert("Error", msg);
    } finally {
      setIsTransferringCoins(false);
    }
  };

  const pickImage = async (setter) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Se necesita acceso a la galería para seleccionar imágenes.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setter(result.assets[0]);
    }
  };

  const handleCrearSkin = async () => {
    if (!skinNombre.trim()) {
      Alert.alert("Campo Requerido", "Por favor ingresa el nombre de la skin.");
      return;
    }
    if (!skinImage) {
      Alert.alert("Imagen Requerida", "Debes seleccionar una imagen para la skin.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('nombre', skinNombre.trim());
      formData.append('descripcion', skinDescripcion.trim());
      formData.append('es_premium', skinEsPremium ? 'true' : 'false');
      formData.append('precio_monedas', skinPrecio || '0');

      const filename = skinImage.uri.split('/').pop() || 'skin.png';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/png';

      formData.append('imagen', {
        uri: skinImage.uri,
        name: filename,
        type: type,
      });

      const res = await apiClient.post('/admin/skins', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert("¡Éxito!", `Skin '${res.data.nombre}' creada y publicada exitosamente.`);
      setSkinNombre('');
      setSkinDescripcion('');
      setSkinPrecio('100');
      setSkinEsPremium(false);
      setSkinImage(null);
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.detail || "Error al registrar la skin.";
      Alert.alert("Error", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCrearPlanta = async () => {
    if (!plantaNombre.trim()) {
      Alert.alert("Campo Requerido", "Por favor ingresa el nombre de la planta.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('nombre_planta', plantaNombre.trim());
      formData.append('humedad_suelo_min', humSueloMin || '40');
      formData.append('humedad_suelo_max', humSueloMax || '70');
      formData.append('humedad_ambiente_min', humAmbMin || '50');
      formData.append('humedad_ambiente_max', humAmbMax || '80');
      formData.append('temperatura_min', tempMin || '18');
      formData.append('temperatura_max', tempMax || '28');
      formData.append('tiempo_min_entre_riegos_dias', diasRiego || '4');
      formData.append('profundidad_raiz_cm', profRaiz || '15');
      formData.append('nivel_dificultad', dificultad || '1');
      formData.append('sensibilidad_luz_id', '1');
      formData.append('tolerancia_exceso_agua_id', '1');
      formData.append('tipo_planta_categoria_id', '1');
      formData.append('tipo_suelo_id', '1');
      formData.append('consumo_agua_id', '1');
      formData.append('descripcion', plantaDesc.trim());
      formData.append('cuidados_generales', plantaCuidados.trim());

      if (plantaImage) {
        const filename = plantaImage.uri.split('/').pop() || 'planta.png';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/png';
        formData.append('imagen', {
          uri: plantaImage.uri,
          name: filename,
          type: type,
        });
      }

      const res = await apiClient.post('/admin/plantas', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert("¡Éxito!", res.data.message || "Planta agregada al catálogo botánico.");
      setPlantaNombre('');
      setPlantaDesc('');
      setPlantaCuidados('');
      setPlantaImage(null);
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.detail || "Error al registrar la especie.";
      Alert.alert("Error", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient colors={["#FFFFFF", "#F8FAFC", "#F1F5F9"]} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>Panel de Administración</Text>
          <Text style={styles.headerSubtitle}>Gestión y Economía Tonalkab</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Segmented Control / Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'skins' && styles.tabBtnActive]} 
          onPress={() => setActiveTab('skins')}
        >
          <Ionicons name="color-palette-outline" size={15} color={activeTab === 'skins' ? '#FFF' : '#64748B'} />
          <Text style={[styles.tabBtnText, activeTab === 'skins' && styles.tabBtnTextActive]}>Skins</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'plantas' && styles.tabBtnActive]} 
          onPress={() => setActiveTab('plantas')}
        >
          <Ionicons name="leaf-outline" size={15} color={activeTab === 'plantas' ? '#FFF' : '#64748B'} />
          <Text style={[styles.tabBtnText, activeTab === 'plantas' && styles.tabBtnTextActive]}>Plantas</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'monedas' && styles.tabBtnActive]} 
          onPress={() => setActiveTab('monedas')}
        >
          <Ionicons name="wallet-outline" size={15} color={activeTab === 'monedas' ? '#FFF' : '#64748B'} />
          <Text style={[styles.tabBtnText, activeTab === 'monedas' && styles.tabBtnTextActive]}>Monedas</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'stats' && styles.tabBtnActive]} 
          onPress={() => setActiveTab('stats')}
        >
          <Ionicons name="bar-chart-outline" size={15} color={activeTab === 'stats' ? '#FFF' : '#64748B'} />
          <Text style={[styles.tabBtnText, activeTab === 'stats' && styles.tabBtnTextActive]}>Métricas</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* ===================== TAB SKINS ===================== */}
        {activeTab === 'skins' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🎨 Subir Nueva Skin</Text>
            <Text style={styles.cardSubtitle}>Agrega un nuevo diseño a la boutique sin tocar código SQL.</Text>

            <TouchableOpacity style={styles.imageSelector} onPress={() => pickImage(setSkinImage)}>
              {skinImage ? (
                <Image source={{ uri: skinImage.uri }} style={styles.previewImage} resizeMode="contain" />
              ) : (
                <View style={styles.placeholderSelector}>
                  <Ionicons name="cloud-upload-outline" size={36} color="#7C3AED" />
                  <Text style={styles.imageSelectorText}>Toca para elegir imagen PNG/JPG</Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.inputLabel}>Nombre de la Skin *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Sakura Neón"
              placeholderTextColor="#94A3B8"
              value={skinNombre}
              onChangeText={setSkinNombre}
            />

            <Text style={styles.inputLabel}>Descripción</Text>
            <TextInput
              style={[styles.input, { height: 65, textAlignVertical: 'top' }]}
              placeholder="Ej: Estilo floral inspirado en los cerezos de Kioto."
              placeholderTextColor="#94A3B8"
              multiline
              value={skinDescripcion}
              onChangeText={setSkinDescripcion}
            />

            <Text style={styles.inputLabel}>Precio en Monedas 🪙 (0 = Gratis)</Text>
            <TextInput
              style={styles.input}
              placeholder="100"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={skinPrecio}
              onChangeText={setSkinPrecio}
            />

            <View style={styles.switchRow}>
              <View>
                <Text style={styles.switchLabel}>Skin Exclusiva / Premium</Text>
                <Text style={styles.switchSub}>Destaca el diseño en la boutique</Text>
              </View>
              <Switch
                value={skinEsPremium}
                onValueChange={setSkinEsPremium}
                trackColor={{ false: '#E2E8F0', true: '#DDD6FE' }}
                thumbColor={skinEsPremium ? '#7C3AED' : '#CBD5E1'}
              />
            </View>

            <TouchableOpacity 
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]} 
              disabled={isSubmitting}
              onPress={handleCrearSkin}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitBtnText}>Publicar Skin</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ===================== TAB PLANTAS ===================== */}
        {activeTab === 'plantas' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🌿 Nueva Especie Botánica</Text>
            <Text style={styles.cardSubtitle}>Registra una nueva especie con sus rangos de salud ambiental.</Text>

            <TouchableOpacity style={styles.imageSelector} onPress={() => pickImage(setPlantaImage)}>
              {plantaImage ? (
                <Image source={{ uri: plantaImage.uri }} style={styles.previewImage} resizeMode="cover" />
              ) : (
                <View style={styles.placeholderSelector}>
                  <Ionicons name="image-outline" size={32} color="#16A34A" />
                  <Text style={styles.imageSelectorText}>Foto de la especie (Opcional)</Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.inputLabel}>Nombre de la Planta *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Monstera Deliciosa"
              placeholderTextColor="#94A3B8"
              value={plantaNombre}
              onChangeText={setPlantaNombre}
            />

            {/* Rangos */}
            <View style={styles.rowInputs}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.inputLabel}>Hum. Suelo Mín (%)</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={humSueloMin} onChangeText={setHumSueloMin} />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.inputLabel}>Hum. Suelo Máx (%)</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={humSueloMax} onChangeText={setHumSueloMax} />
              </View>
            </View>

            <View style={styles.rowInputs}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.inputLabel}>Temp. Mín (°C)</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={tempMin} onChangeText={setTempMin} />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.inputLabel}>Temp. Máx (°C)</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={tempMax} onChangeText={setTempMax} />
              </View>
            </View>

            <View style={styles.rowInputs}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.inputLabel}>Días entre Riego</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={diasRiego} onChangeText={setDiasRiego} />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.inputLabel}>Dificultad (1-5)</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={dificultad} onChangeText={setDificultad} />
              </View>
            </View>

            <Text style={styles.inputLabel}>Descripción General</Text>
            <TextInput
              style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
              placeholder="Detalles sobre la especie..."
              placeholderTextColor="#94A3B8"
              multiline
              value={plantaDesc}
              onChangeText={setPlantaDesc}
            />

            <Text style={styles.inputLabel}>Consejos de Cuidado</Text>
            <TextInput
              style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
              placeholder="Luz indirecta, riego moderado..."
              placeholderTextColor="#94A3B8"
              multiline
              value={plantaCuidados}
              onChangeText={setPlantaCuidados}
            />

            <TouchableOpacity 
              style={[styles.submitBtn, { backgroundColor: '#16A34A' }, isSubmitting && styles.submitBtnDisabled]} 
              disabled={isSubmitting}
              onPress={handleCrearPlanta}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitBtnText}>Registrar Planta</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ===================== TAB MONEDAS ===================== */}
        {activeTab === 'monedas' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🪙 Transferir Monedas</Text>
            <Text style={styles.cardSubtitle}>Busca cualquier usuario y acredítale monedas directamente.</Text>

            {/* Buscador de usuarios */}
            <Text style={styles.inputLabel}>Buscar Usuario por Correo o Nombre</Text>
            <View style={styles.searchRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="Ej: usuario@gmail.com"
                placeholderTextColor="#94A3B8"
                value={userQuery}
                onChangeText={(text) => {
                  setUserQuery(text);
                  fetchUsuarios(text);
                }}
              />
              <TouchableOpacity 
                style={styles.searchBtn}
                onPress={() => fetchUsuarios(userQuery)}
              >
                <Ionicons name="search" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* Lista de usuarios encontrados */}
            <Text style={[styles.inputLabel, { marginTop: 14 }]}>
              {userResults.length > 0 ? "Resultados de Usuarios:" : "Usuarios Registrados:"}
            </Text>

            {isLoadingUsers ? (
              <ActivityIndicator color="#F59E0B" style={{ marginVertical: 12 }} />
            ) : (
              <View style={styles.userListContainer}>
                {userResults.map((u) => {
                  const isSelected = selectedUser?.id_usuario === u.id_usuario;
                  return (
                    <TouchableOpacity
                      key={u.id_usuario}
                      style={[styles.userItem, isSelected && styles.userItemSelected]}
                      onPress={() => setSelectedUser(u)}
                    >
                      <View style={styles.userAvatarBox}>
                        <Ionicons 
                          name={u.es_admin ? "shield-checkmark" : "person"} 
                          size={18} 
                          color={u.es_admin ? "#7C3AED" : "#3B82F6"} 
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.userItemName}>{u.nombre}</Text>
                          {u.es_admin && <Text style={styles.adminMiniTag}>ADMIN</Text>}
                        </View>
                        <Text style={styles.userItemEmail} numberOfLines={1}>{u.email}</Text>
                      </View>
                      <View style={styles.userCoinBadge}>
                        <Text style={styles.userCoinText}>🪙 {u.monedas.toLocaleString()}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Panel de transferencia si hay usuario seleccionado */}
            {selectedUser && (
              <View style={styles.transferSection}>
                <LinearGradient colors={["#FEF3C7", "#FDE68A"]} style={styles.transferHeaderGradient}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="gift" size={24} color="#D97706" />
                    <View>
                      <Text style={styles.transferHeaderTitle}>Destinatario: {selectedUser.nombre}</Text>
                      <Text style={styles.transferHeaderSub}>Saldo actual: 🪙 {selectedUser.monedas.toLocaleString()} monedas</Text>
                    </View>
                  </View>
                </LinearGradient>

                <Text style={[styles.inputLabel, { marginTop: 14 }]}>Monto a Otorgar</Text>
                
                {/* Botones rápidos de monedas */}
                <View style={styles.quickChipsRow}>
                  {['+100', '+500', '+1000', '+5000'].map((chip) => (
                    <TouchableOpacity
                      key={chip}
                      style={[
                        styles.quickChip,
                        monedasCantidad === chip.replace('+', '') && styles.quickChipActive
                      ]}
                      onPress={() => setMonedasCantidad(chip.replace('+', ''))}
                    >
                      <Text style={[
                        styles.quickChipText,
                        monedasCantidad === chip.replace('+', '') && styles.quickChipTextActive
                      ]}>
                        {chip}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Input personalizado */}
                <TextInput
                  style={[styles.input, { textAlign: 'center', fontSize: 18, fontWeight: '800', color: '#B45309' }]}
                  placeholder="500"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={monedasCantidad}
                  onChangeText={setMonedasCantidad}
                />

                <TouchableOpacity
                  style={[styles.submitBtn, { backgroundColor: '#F59E0B' }, isTransferringCoins && styles.submitBtnDisabled]}
                  disabled={isTransferringCoins}
                  onPress={handleOtorgarMonedas}
                >
                  {isTransferringCoins ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name="sparkles" size={18} color="#FFF" />
                      <Text style={styles.submitBtnText}>Transferir 🪙 {monedasCantidad} Monedas</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* ===================== TAB STATS ===================== */}
        {activeTab === 'stats' && (
          <View>
            {isLoadingStats ? (
              <ActivityIndicator size="large" color="#7C3AED" style={{ marginTop: 40 }} />
            ) : (
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Ionicons name="people" size={24} color="#3B82F6" />
                  <Text style={styles.statNumber}>{stats?.total_usuarios ?? 0}</Text>
                  <Text style={styles.statLabel}>Usuarios Totales</Text>
                </View>

                <View style={styles.statCard}>
                  <Ionicons name="hardware-chip" size={24} color="#10B981" />
                  <Text style={styles.statNumber}>{stats?.total_macetas ?? 0}</Text>
                  <Text style={styles.statLabel}>Macetas Conectadas</Text>
                </View>

                <View style={styles.statCard}>
                  <Ionicons name="color-palette" size={24} color="#8B5CF6" />
                  <Text style={styles.statNumber}>{stats?.total_skins ?? 0}</Text>
                  <Text style={styles.statLabel}>Skins Disponibles</Text>
                </View>

                <View style={styles.statCard}>
                  <Ionicons name="leaf" size={24} color="#F59E0B" />
                  <Text style={styles.statNumber}>{stats?.total_plantas ?? 0}</Text>
                  <Text style={styles.statLabel}>Especies Botánicas</Text>
                </View>
              </View>
            )}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  
  headerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight + 8 : 8, 
    paddingBottom: 15
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  headerTitleBox: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  headerSubtitle: { fontSize: 12, fontWeight: '600', color: '#7C3AED' },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    marginHorizontal: 20,
    borderRadius: 14,
    padding: 3,
    marginBottom: 20
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    gap: 4
  },
  tabBtnActive: {
    backgroundColor: '#7C3AED',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3
  },
  tabBtnText: { fontSize: 11.5, fontWeight: '700', color: '#64748B' },
  tabBtnTextActive: { color: '#FFFFFF' },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 20
  },
  cardTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A', marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: '#64748B', fontWeight: '500', marginBottom: 18 },

  imageSelector: {
    width: '100%',
    height: 140,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#DDD6FE',
    borderStyle: 'dashed',
    backgroundColor: '#FAF5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    overflow: 'hidden'
  },
  placeholderSelector: { alignItems: 'center', gap: 6 },
  imageSelectorText: { fontSize: 13, color: '#7C3AED', fontWeight: '600' },
  previewImage: { width: '100%', height: '100%' },

  inputLabel: { fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
    marginBottom: 14
  },
  rowInputs: { flexDirection: 'row', justifyContent: 'space-between' },

  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    marginVertical: 10
  },
  switchLabel: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  switchSub: { fontSize: 12, color: '#64748B' },

  submitBtn: {
    backgroundColor: '#7C3AED',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15, letterSpacing: 0.5 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
    gap: 6
  },
  statNumber: { fontSize: 24, fontWeight: '900', color: '#0F172A' },
  statLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },

  // Estilos Tab Monedas
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  searchBtn: {
    backgroundColor: '#7C3AED',
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  userListContainer: {
    maxHeight: 180,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 6,
    marginBottom: 16
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    gap: 10,
    backgroundColor: '#FFFFFF',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  userItemSelected: {
    borderColor: '#F59E0B',
    backgroundColor: '#FEF3C7'
  },
  userAvatarBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center'
  },
  userItemName: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  userItemEmail: { fontSize: 11, color: '#64748B' },
  adminMiniTag: {
    fontSize: 9,
    fontWeight: '800',
    color: '#7C3AED',
    backgroundColor: '#DDD6FE',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4
  },
  userCoinBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  userCoinText: { fontSize: 12, fontWeight: '800', color: '#B45309' },

  transferSection: {
    marginTop: 10,
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: '#E2E8F0'
  },
  transferHeaderGradient: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10
  },
  transferHeaderTitle: { fontSize: 14, fontWeight: '800', color: '#78350F' },
  transferHeaderSub: { fontSize: 12, fontWeight: '600', color: '#92400E' },

  quickChipsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  quickChip: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  quickChipActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#D97706'
  },
  quickChipText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  quickChipTextActive: { color: '#FFFFFF' }
});
