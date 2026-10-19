import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.shandon.elite',
  appName: 'SHANDON ELITE',
  webDir: 'out',
  server: {
    url: 'https://elite.senhoramorim.com.br',
    cleartext: false,
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: '#020617',
      showSpinner: true,
      spinnerColor: '#22FF88',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#020617',
    },
  },
  android: {
    allowMixedContent: false,
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'APK',
    },
  },
};

export default config;
