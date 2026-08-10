// src/screens/TonalliScreen.js
import React, { useState, useRef } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  FlatList, KeyboardAvoidingView, Platform, SafeAreaView, 
  ActivityIndicator, Image, Keyboard, Alert, StatusBar as RNStatusBar 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '../api/client';

export default function TonalliScreen({ navigation }) {
  const [mensaje, setMensaje] = useState('');
  const [imagenAdjunta, setImagenAdjunta] = useState(null); // { uri, base64 }
  const [historial, setHistorial] = useState([
    { id: '1', role: 'model', content: '¡Hola! Soy Tonalli 🌿. Estoy monitoreando el huerto. ¿En qué te ayudo hoy? Puedes hacerme preguntas o enviarme una foto de tus plantas para diagnosticarlas.' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef();

  // 📷 Abrir menú para tomar foto o elegir de la galería
  const seleccionarOpcionImagen = () => {
    Alert.alert(
      "Diagnóstico con Foto",
      "¿De dónde quieres obtener la imagen de tu planta?",
      [
        { text: "Cámara", onPress: tomarFoto },
        { text: "Galería", onPress: elegirDeGaleria },
        { text: "Cancelar", style: "cancel" }
      ]
    );
  };

  const tomarFoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permiso Denegado", "Se requiere acceso a la cámara para tomar fotos de tus plantas.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setImagenAdjunta({ uri: asset.uri, base64: asset.base64 });
      }
    } catch (err) {
      console.error("Error al abrir la cámara:", err);
      Alert.alert("Error", "No se pudo abrir la cámara.");
    }
  };

  const elegirDeGaleria = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permiso Denegado", "Se requiere acceso a la galería para seleccionar fotos.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setImagenAdjunta({ uri: asset.uri, base64: asset.base64 });
      }
    } catch (err) {
      console.error("Error al abrir galería:", err);
      Alert.alert("Error", "No se pudo abrir la galería.");
    }
  };

  const descartarImagen = () => {
    setImagenAdjunta(null);
  };

  const enviarMensaje = async () => {
    if (!mensaje.trim() && !imagenAdjunta) return;

    const textoUsuario = mensaje.trim() || "Analiza esta fotografía de mi planta.";
    const fotoAEnviar = imagenAdjunta;
    
    setMensaje('');
    setImagenAdjunta(null);
    Keyboard.dismiss();

    // 1. Agregamos el mensaje del usuario a la UI (con foto si existe)
    const nuevoMensajeUsuario = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: textoUsuario,
      imagenUri: fotoAEnviar?.uri || null
    };
    const nuevoHistorial = [...historial, nuevoMensajeUsuario];
    setHistorial(nuevoHistorial);

    // 2. Preparamos el payload exacto que espera tu FastAPI
    const historialParaAPI = nuevoHistorial
      .filter(msg => msg.id !== '1') 
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));

    setIsLoading(true);

    try {
      const response = await apiClient.post('/bot/chat', {
        mensaje: textoUsuario,
        historial: historialParaAPI.slice(0, -1), // Historial previo
        imagen_base64: fotoAEnviar ? fotoAEnviar.base64 : null 
      });

      // 3. Agregamos la respuesta de Tonalli a la UI
      const respuestaBot = { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        content: response.data.respuesta 
      };
      
      setHistorial(prev => [...prev, respuestaBot]);

    } catch (error) {
      console.error("Error hablando con Tonalli:", error);
      const errorMsg = { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        content: 'Hubo un error de conexión con mis servidores centrales. 🔌' 
      };
      setHistorial(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMensaje = ({ item }) => {
    const isUser = item.role === 'user';

    return (
      <View style={[styles.messageWrapper, isUser ? styles.messageWrapperUser : styles.messageWrapperBot]}>
        {!isUser && (
          <View style={styles.botAvatarContainer}>
            <Image 
              source={require('../../assets/tonalli_avatar.png')} 
              style={styles.botAvatar}
            />
          </View>
        )}
        
        <View style={[styles.messageBubble, isUser ? styles.messageBubbleUser : styles.messageBubbleBot]}>
          {item.imagenUri && (
            <Image 
              source={{ uri: item.imagenUri }} 
              style={styles.chatAttachedImage} 
              resizeMode="cover"
            />
          )}
          <Text style={[styles.messageText, isUser ? styles.messageTextUser : styles.messageTextBot]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar style="dark" />
      <LinearGradient colors={["#FFFFFF", "#F8FAFC", "#F1F5F9"]} style={StyleSheet.absoluteFill} />

      {/* CABECERA */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>Tonalli</Text>
          <Text style={styles.headerSubtitle}>IA Botánica Multimodal</Text>
        </View>
        <View style={styles.infoBtn}>
          <Ionicons name="ellipse" size={10} color="#22C55E" />
          <Text style={styles.onlineText}>Online</Text>
        </View>
      </View>

      {/* ENVOLVEDOR PRINCIPAL (Lista + Input) */}
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* ÁREA DE CHAT */}
        <FlatList
          ref={flatListRef}
          data={historial}
          keyExtractor={item => item.id}
          renderItem={renderMensaje}
          contentContainerStyle={styles.chatContainer}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* INDICADOR DE CARGA */}
        {isLoading && (
          <View style={styles.loadingBubble}>
            <ActivityIndicator size="small" color="#22C55E" />
            <Text style={styles.loadingText}>Tonalli está analizando...</Text>
          </View>
        )}

        {/* PREVIEW DE IMAGEN ADJUNTA */}
        {imagenAdjunta && (
          <View style={styles.previewContainer}>
            <Image source={{ uri: imagenAdjunta.uri }} style={styles.previewImage} />
            <View style={styles.previewTextBox}>
              <Text style={styles.previewTitle}>Foto lista para diagnóstico</Text>
              <Text style={styles.previewSubtitle}>Se enviará con tu mensaje</Text>
            </View>
            <TouchableOpacity style={styles.removeImageBtn} onPress={descartarImagen}>
              <Ionicons name="close-circle" size={24} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}

        {/* ZONA DE INPUT */}
        <View style={styles.inputContainer}>
          <TouchableOpacity 
            style={[styles.attachBtn, imagenAdjunta && styles.attachBtnActive]} 
            onPress={seleccionarOpcionImagen}
          >
            <Ionicons 
              name={imagenAdjunta ? "checkmark-circle" : "camera-outline"} 
              size={24} 
              color={imagenAdjunta ? "#22C55E" : "#64748B"} 
            />
          </TouchableOpacity>
          
          <TextInput
            style={styles.textInput}
            placeholder={imagenAdjunta ? "Escribe un comentario sobre la foto..." : "Pregúntale a Tonalli o adjunta una foto..."}
            placeholderTextColor="#94A3B8"
            value={mensaje}
            onChangeText={setMensaje}
            multiline
            maxLength={300}
          />
          
          <TouchableOpacity 
            style={[styles.sendBtn, (!mensaje.trim() && !imagenAdjunta) && styles.sendBtnDisabled]} 
            onPress={enviarMensaje}
            disabled={(!mensaje.trim() && !imagenAdjunta) || isLoading}
          >
            <Ionicons name="send" size={20} color="#FFFFFF" style={{ marginLeft: 3 }} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  
  // CABECERA
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight + 15 : 15, 
    paddingBottom: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F1F5F9', 
    backgroundColor: '#FFFFFF', 
    zIndex: 10 
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  headerTitleBox: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  headerSubtitle: { fontSize: 12, fontWeight: '600', color: '#22C55E' },
  infoBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  onlineText: { fontSize: 11, fontWeight: '700', color: '#16A34A', marginLeft: 4 },

  // CHAT
  chatContainer: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },
  
  messageWrapper: { flexDirection: 'row', marginBottom: 20, alignItems: 'flex-end' },
  messageWrapperUser: { justifyContent: 'flex-end' },
  messageWrapperBot: { justifyContent: 'flex-start' },
  
  botAvatarContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center', marginRight: 10, borderWidth: 1, borderColor: '#22C55E' },
  botAvatar: { width: 24, height: 24 }, 
  
  messageBubble: { maxWidth: '75%', paddingHorizontal: 18, paddingVertical: 14, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  messageBubbleUser: { backgroundColor: '#22C55E', borderBottomRightRadius: 4 },
  messageBubbleBot: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#F1F5F9' },
  
  chatAttachedImage: { width: 180, height: 130, borderRadius: 12, marginBottom: 8 },
  messageText: { fontSize: 15, lineHeight: 22 },
  messageTextUser: { color: '#FFFFFF', fontWeight: '500' },
  messageTextBot: { color: '#334155', fontWeight: '500' },

  // CARGA
  loadingBubble: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#FFFFFF', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, marginLeft: 20, marginBottom: 15, borderWidth: 1, borderColor: '#F1F5F9' },
  loadingText: { marginLeft: 10, fontSize: 13, color: '#64748B', fontStyle: 'italic' },

  // PREVIEW
  previewContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', paddingHorizontal: 15, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  previewImage: { width: 44, height: 44, borderRadius: 8, marginRight: 10 },
  previewTextBox: { flex: 1 },
  previewTitle: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  previewSubtitle: { fontSize: 11, color: '#64748B' },
  removeImageBtn: { padding: 5 },

  // INPUT
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: '#FFFFFF', paddingHorizontal: 15, paddingVertical: 15, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  attachBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', marginRight: 10, backgroundColor: '#F8FAFC', borderRadius: 22 },
  attachBtnActive: { backgroundColor: '#DCFCE7' },
  textInput: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 20, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 12, minHeight: 44, maxHeight: 100, fontSize: 15, color: '#0F172A', borderWidth: 1, borderColor: '#E2E8F0' },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#22C55E', justifyContent: 'center', alignItems: 'center', marginLeft: 10, shadowColor: '#22C55E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  sendBtnDisabled: { backgroundColor: '#CBD5E1', shadowOpacity: 0 }
});