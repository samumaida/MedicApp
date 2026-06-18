import type { CapacitorConfig } from '@capacitor/cli';

// ⚠ File generato automaticamente da build-client.js — NON modificare manualmente
const config: CapacitorConfig = {
  appId: 'com.codesea.medicapp',
  appName: 'MedicApp',
  webDir: 'www',
  android: {
    path: 'android',
    minWebViewVersion: 55
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#3880ff',
      showSpinner: false
    }
  }
};

export default config;
