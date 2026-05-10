// src/navigation/AppNavigator.js
import React, { useContext } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons'; 
import { ThemeContext } from '../context/ThemeContext';

// Importación de Pantallas
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import MacetaDetailScreen from '../screens/MacetaDetailScreen'; 
import MacetaConfigScreen from '../screens/MacetaConfigScreen'; 
import MacetaStatsScreen from '../screens/MacetaStatsScreen';
import EnciclopediaScreen from '../screens/EnciclopediaScreen';
import AlertasScreen from '../screens/AlertasScreen';
import PerfilScreen from '../screens/PerfilScreen';
import MacetaVestidorScreen from '../screens/MacetaVestidorScreen';
import PlantaDetailScreen from '../screens/PlantaDetailScreen';

// --- NUEVA PANTALLA ---
import TonalliScreen from '../screens/TonalliScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// --- 1. CONFIGURACIÓN DE LA BARRA INFERIOR (TABS) ---
function MainTabNavigator() {
  const { isDark } = useContext(ThemeContext);
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          borderTopWidth: 0,
          elevation: 10,
          height: 65,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: isDark ? '#4ADE80' : '#16A34A',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarIcon: ({ focused, color }) => {
          let iconName;

          // Lógica de iconos incluyendo a Tonalli
          if (route.name === 'Macetas') {
            iconName = focused ? 'leaf' : 'leaf-outline';
          } else if (route.name === 'Enciclopedia') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Tonalli') {
            // Usamos sparkles para representar la Inteligencia Artificial
            iconName = focused ? 'sparkles' : 'sparkles-outline';
          } else if (route.name === 'Alertas') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'Perfil') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={26} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Macetas" component={HomeScreen} />
      <Tab.Screen name="Enciclopedia" component={EnciclopediaScreen} />
      
      {/* SECCIÓN CENTRAL: TONALLI */}
      <Tab.Screen 
        name="Tonalli" 
        component={TonalliScreen} 
        options={{ tabBarLabel: 'IA Tonalli' }} 
      />

      <Tab.Screen name="Alertas" component={AlertasScreen} />
      <Tab.Screen name="Perfil" component={PerfilScreen} />
    </Tab.Navigator>
  );
}

// --- 2. NAVEGADOR PRINCIPAL (STACK) ---
export default function AppNavigator() {
  const { isDark } = useContext(ThemeContext);

  const TonalkabDark = {
    ...DarkTheme,
    colors: { ...DarkTheme.colors, background: '#0F172A', primary: '#4ADE80', card: '#1E293B', text: '#F8FAFC' }
  };
  
  const TonalkabLight = {
    ...DefaultTheme,
    colors: { ...DefaultTheme.colors, background: '#F8FAFC', primary: '#16A34A', card: '#FFFFFF', text: '#0F172A' }
  };

  return (
    <NavigationContainer theme={isDark ? TonalkabDark : TonalkabLight}>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShadowVisible: false }}>
        
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        
        {/* El login navegará a "Home", que ahora contiene los 5 tabs */}
        <Stack.Screen name="Home" component={MainTabNavigator} options={{ headerShown: false }} />
        
        {/* Pantallas de detalle (se abren sobre los tabs) */}
        <Stack.Screen 
          name="MacetaDetail" 
          component={MacetaDetailScreen} 
          options={({ route }) => ({ title: route.params.nombre_maceta })} 
        />
        <Stack.Screen 
          name="MacetaConfig" 
          component={MacetaConfigScreen} 
          options={{ title: 'Ajustes de la Planta' }} 
        />
        <Stack.Screen 
          name="MacetaStats" 
          component={MacetaStatsScreen} 
          options={{ title: 'Gráficas e Historial' }} 
        />
        <Stack.Screen 
          name="MacetaVestidor" 
          component={MacetaVestidorScreen} 
          options={{ title: 'Vestidor' }} 
        />
        <Stack.Screen 
          name="PlantaDetail" 
          component={PlantaDetailScreen} 
          options={{ headerShown: false }} 
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}