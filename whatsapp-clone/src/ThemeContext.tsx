import React, { createContext, useContext, useState } from 'react';

export interface ThemeColors {
  background: string;
  card: string;
  header: string;
  headerText: string;
  headerIcon: string;
  text: string;
  subText: string;
  border: string;
  accent: string;
  tabBar: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;
  bubbleMine: string;
  bubbleOther: string;
  textMine: string;
  textOther: string;
  timeMine: string;
  timeOther: string;
  composerBg: string;
  inputBg: string;
  inputText: string;
  iconColor: string;
  sendButton: string;
  divider: string;
  lockBadge: string;
  lockText: string;
}

export const darkTheme: ThemeColors = {
  background: '#0b141a',
  card: '#111b21',
  header: '#1f2c34',
  headerText: '#e9edef',
  headerIcon: '#aebac1',
  text: '#e9edef',
  subText: '#8696a0',
  border: '#222d34',
  accent: '#00a884',
  tabBar: '#1f2c34',
  tabBarBorder: '#222d34',
  tabBarActive: '#00a884',
  tabBarInactive: '#8696a0',
  bubbleMine: '#005c4b',
  bubbleOther: '#202c33',
  textMine: '#e9edef',
  textOther: '#e9edef',
  timeMine: '#8696a0',
  timeOther: '#8696a0',
  composerBg: '#1f2c34',
  inputBg: '#2a3942',
  inputText: '#e9edef',
  iconColor: '#8696a0',
  sendButton: '#00a884',
  divider: '#182229',
  lockBadge: '#182229',
  lockText: '#ffd279',
};

export const lightTheme: ThemeColors = {
  background: '#f0f2f5',
  card: '#ffffff',
  header: '#008069',
  headerText: '#ffffff',
  headerIcon: '#ffffff',
  text: '#111b21',
  subText: '#667781',
  border: '#e9edef',
  accent: '#008069',
  tabBar: '#ffffff',
  tabBarBorder: '#f0f2f5',
  tabBarActive: '#008069',
  tabBarInactive: '#8696a0',
  bubbleMine: '#d9fdd3',
  bubbleOther: '#ffffff',
  textMine: '#111b21',
  textOther: '#111b21',
  timeMine: '#667781',
  timeOther: '#667781',
  composerBg: '#f0f2f5',
  inputBg: '#ffffff',
  inputText: '#111b21',
  iconColor: '#54656f',
  sendButton: '#00a884',
  divider: '#e2dfd9',
  lockBadge: '#ffeecd',
  lockText: '#54656f',
};

interface ThemeContextType {
  darkMode: boolean;
  toggleTheme: () => void;
  theme: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType>({
  darkMode: true,
  toggleTheme: () => {},
  theme: darkTheme,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [darkMode, setDarkMode] = useState(true);

  const toggleTheme = () => {
    setDarkMode((prev) => !prev);
  };

  const theme = darkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
