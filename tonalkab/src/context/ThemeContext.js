import React, { createContext, useState } from 'react';
import { useColorScheme } from 'react-native';

// 1. Le damos valores por defecto para evitar errores "undefined"
export const ThemeContext = createContext({
  isDark: true,
  toggleTheme: () => {}
});

export const ThemeProvider = ({ children }) => {
  const systemTheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemTheme === 'dark');

  const toggleTheme = (useDark) => {
    setIsDark(useDark);
    // Nota: Guardado local desactivado temporalmente
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};