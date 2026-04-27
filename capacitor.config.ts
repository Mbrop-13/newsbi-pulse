import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.reclu.news',
  appName: 'Reclu',
  webDir: 'out',

  // In production, the app loads from Vercel deployment
  server: {
    url: 'https://reclu.vercel.app',
    cleartext: false,
  },

  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      showSpinner: false,
      backgroundColor: '#0F172A',
      androidSplashResourceName: 'splash',
      launchShowDuration: 2000,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0F172A',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },

  android: {
    allowMixedContent: false,
    backgroundColor: '#0F172A',
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },
};

export default config;
