import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Geist_400Regular, Geist_500Medium, Geist_600SemiBold, Geist_700Bold } from '@expo-google-fonts/geist';
import { GeistMono_400Regular } from '@expo-google-fonts/geist-mono';
import { ThemeProvider, useTheme } from '../src/theme';
import { KernelProvider, useKernelMaybe, useLock } from '../src/kernel';
import { Unlock } from '../src/Unlock';

function Shell({ fontsReady }: { fontsReady: boolean }) {
  const { c, scheme } = useTheme();
  const k = useKernelMaybe();
  const lock = useLock();
  if (fontsReady && lock.locked) {
    return (
      <>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <Unlock />
      </>
    );
  }
  if (!k || !fontsReady) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={c.accent} />
      </View>
    );
  }
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }} />
    </>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({ Geist_400Regular, Geist_500Medium, Geist_600SemiBold, Geist_700Bold, GeistMono_400Regular });
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <KernelProvider>
          <Shell fontsReady={loaded || !!error} />
        </KernelProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
