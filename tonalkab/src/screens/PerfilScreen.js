// src/screens/PerfilScreen.js
import React, { useContext } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  SafeAreaView, Switch, Alert, ScrollView 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../context/ThemeContext';

export default function PerfilScreen({ navigation }) {
  // Traemos el contexto del tema para el Switch
  const { isDark, toggleTheme } = useContext(ThemeContext);

  // Función para cerrar sesión
  const handleLogout = async () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro de que deseas salir de tu cuenta?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sí, salir", 
          style: "destructive",
          onPress: async () => {
            // Eliminamos el token del dispositivo
            await AsyncStorage.removeItem('userToken');
            // Regresamos a la pantalla de Login y borramos el historial de navegación
            navigation.replace('Login');
          } 
        }
      ]
    );
  };

  // Componente reutilizable para las opciones del menú
  const MenuOption = ({ icon, color, title, isSwitch, switchValue, onSwitchToggle, onPress }) => (
    <TouchableOpacity 
      style={styles.menuOption} 
      onPress={onPress} 
      activeOpacity={isSwitch ? 1 : 0.7}
    >
      <View style={styles.menuOptionLeft}>
        <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <Text style={styles.menuOptionText}>{title}</Text>
      </View>
      
      {isSwitch ? (
        <Switch 
          value={switchValue} 
          onValueChange={onSwitchToggle}
          trackColor={{ false: '#E2E8F0', true: '#22C55E' }}
          thumbColor={'#FFFFFF'}
        />
      ) : (
        <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar style="dark" />
      <LinearGradient colors={["#FFFFFF", "#F8FAFC", "#F1F5F9"]} style={StyleSheet.absoluteFill} />

      {/* CABECERA */}
      <View style={styles.headerContainer}>
        <Text style={styles.mainTitle}>Mi Perfil</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* TARJETA DE USUARIO */}
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarBackground}>
              <Text style={styles.avatarText}>HG</Text>
            </View>
            <View style={styles.onlineBadge} />
          </View>
          
          <View style={styles.userInfo}>
            <Text style={styles.userName}>Hugo Garcia</Text>
            <Text style={styles.userEmail}>hugo@tonalkab.com</Text>
            <View style={styles.tagContainer}>
              <Text style={styles.tagText}>Desarrollador</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Ajustes de la App</Text>

        {/* MENÚ DE AJUSTES */}
        <View style={styles.menuContainer}>
          <MenuOption 
            icon="moon" 
            color="#8B5CF6" 
            title="Modo Oscuro (Próximamente)" 
            isSwitch={true}
            switchValue={isDark}
            onSwitchToggle={toggleTheme}
          />
          <View style={styles.divider} />
          <MenuOption 
            icon="notifications" 
            color="#F59E0B" 
            title="Preferencias de Alertas" 
            onPress={() => {}}
          />
          <View style={styles.divider} />
          <MenuOption 
            icon="shield-checkmark" 
            color="#3B82F6" 
            title="Privacidad y Seguridad" 
            onPress={() => {}}
          />
        </View>

        <Text style={styles.sectionTitle}>Soporte</Text>

        {/* MENÚ DE SOPORTE */}
        <View style={styles.menuContainer}>
          <MenuOption 
            icon="help-buoy" 
            color="#10B981" 
            title="Centro de Ayuda" 
            onPress={() => {}}
          />
          <View style={styles.divider} />
          <MenuOption 
            icon="document-text" 
            color="#64748B" 
            title="Términos y Condiciones" 
            onPress={() => {}}
          />
        </View>

        {/* BOTÓN CERRAR SESIÓN */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Tonalkab v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  
  // CABECERA
  headerContainer: { paddingHorizontal: 20, paddingTop: 30, paddingBottom: 20 },
  mainTitle: { fontSize: 32, fontWeight: '900', color: '#0F172A', letterSpacing: -1 },

  // TARJETA DE USUARIO
  userCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 24,
    marginBottom: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.03,
    shadowRadius: 15,
    elevation: 4,
  },
  avatarContainer: { position: 'relative', marginRight: 15 },
  avatarBackground: { width: 65, height: 65, borderRadius: 20, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#22C55E' },
  avatarText: { fontSize: 22, fontWeight: '900', color: '#16A34A', letterSpacing: 1 },
  onlineBadge: { position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: 8, backgroundColor: '#22C55E', borderWidth: 3, borderColor: '#FFFFFF' },
  
  userInfo: { flex: 1 },
  userName: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 2 },
  userEmail: { fontSize: 13, color: '#64748B', fontWeight: '500', marginBottom: 6 },
  tagContainer: { alignSelf: 'flex-start', backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#DCFCE7' },
  tagText: { fontSize: 10, fontWeight: '800', color: '#16A34A', textTransform: 'uppercase' },

  // MENÚS
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginLeft: 5 },
  menuContainer: { backgroundColor: '#FFFFFF', borderRadius: 20, marginBottom: 25, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.02, shadowRadius: 10, elevation: 2 },
  
  menuOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  menuOptionLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  menuOptionText: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  
  divider: { height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 16 },

  // CERRAR SESIÓN
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF2F2', paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: '#FEE2E2', marginTop: 10 },
  logoutText: { color: '#EF4444', fontSize: 15, fontWeight: '700' },

  // VERSIÓN
  versionText: { textAlign: 'center', color: '#CBD5E1', fontSize: 12, fontWeight: '600', marginTop: 20 }
});