// App.js
import React from 'react';
import { ThemeProvider } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    // ¡ESTO SOLUCIONA EL ERROR!
    <ThemeProvider>
      <AppNavigator />
    </ThemeProvider>
  );
}