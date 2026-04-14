import React, { useContext } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { ThemeContext } from '../context/ThemeContext';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { isDark, toggleTheme } = useContext(ThemeContext);

  return (
    <View style={styles.container}>
      <View style={[styles.row, { backgroundColor: colors.card }]}>
        <Text style={[styles.text, { color: colors.text }]}>
          {isDark ? '🌙 Modo Oscuro' : '☀️ Modo Claro'}
        </Text>
        <Switch 
          value={isDark} 
          onValueChange={(value) => toggleTheme(value)} 
          trackColor={{ false: '#767577', true: '#4ADE80' }}
          thumbColor={'#ffffff'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderRadius: 15 },
  text: { fontSize: 18, fontWeight: '600' }
});