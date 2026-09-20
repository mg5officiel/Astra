import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.astrasys.astra',
  appName: 'Astra',
  webDir: 'dist',
  server: { cleartext: false },
  android: { allowMixedContent: false },
  ios: { contentInset: 'automatic' },
};
export default config;
