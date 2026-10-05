import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const light = {
  bg: '#F4F5F1',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF0EB',
  border: '#E3E6E0',
  borderStrong: '#DCE0D8',
  text: '#121614',
  muted: '#59615C',
  ink: '#121614',
  inkText: '#F4F5F1',
  inkMuted: '#CBD1CC',
  inkBorder: '#3A423D',
  accent: '#4338CA',
  onAccent: '#FFFFFF',
  accentSoft: '#EEEDFB',
  accentText: '#3730A3',
  lime: '#D9F26B',
  onLime: '#121614',
  okBg: '#E6F2EA',
  okText: '#145A33',
  okDot: '#1D7A46',
  warnBg: '#FFF4EA',
  warnBorder: '#F3D9C2',
  warnText: '#7A3A08',
  warnFill: '#C2570C',
  danger: '#A1260F',
  tabBar: '#FFFFFF',
};

export type Colors = typeof light;

const dark: Colors = {
  bg: '#0E1211',
  surface: '#171C1A',
  surfaceAlt: '#222925',
  border: '#2A312D',
  borderStrong: '#343C37',
  text: '#EEF1EC',
  muted: '#A3ACA6',
  ink: '#1C2320',
  inkText: '#EEF1EC',
  inkMuted: '#C3CAC5',
  inkBorder: '#3A423D',
  accent: '#5B54E0',
  onAccent: '#FFFFFF',
  accentSoft: '#232147',
  accentText: '#B4B0FA',
  lime: '#D9F26B',
  onLime: '#121614',
  okBg: '#16301F',
  okText: '#8FD9A8',
  okDot: '#5CC98A',
  warnBg: '#2A1C12',
  warnBorder: '#4A3020',
  warnText: '#F5B27A',
  warnFill: '#F08A3C',
  danger: '#FF8A75',
  tabBar: '#121715',
};

export const fonts = {
  regular: 'Geist_400Regular',
  medium: 'Geist_500Medium',
  semibold: 'Geist_600SemiBold',
  bold: 'Geist_700Bold',
  mono: 'GeistMono_400Regular',
};

export type ThemePref = 'system' | 'light' | 'dark';

interface ThemeValue {
  c: Colors;
  scheme: 'light' | 'dark';
  pref: ThemePref;
  setPref: (p: ThemePref) => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);
const KEY = 'eatos.theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [pref, setPrefState] = useState<ThemePref>('system');

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => {
        if (v === 'light' || v === 'dark' || v === 'system') setPrefState(v);
      })
      .catch(() => {});
  }, []);

  const value = useMemo<ThemeValue>(() => {
    const scheme = pref === 'system' ? (system === 'dark' ? 'dark' : 'light') : pref;
    return {
      c: scheme === 'dark' ? dark : light,
      scheme,
      pref,
      setPref: (p) => {
        setPrefState(p);
        AsyncStorage.setItem(KEY, p).catch(() => {});
      },
    };
  }, [pref, system]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const v = useContext(ThemeContext);
  if (!v) throw new Error('useTheme outside ThemeProvider');
  return v;
}
