import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

// ── Toggle: true = local dev server, false = Vercel production ──
const USE_LOCAL_DEV = false;

const config: CapacitorConfig = {
  appId: 'com.reclu.news',
  appName: 'Reclu',
  webDir: 'out',

  server: USE_LOCAL_DEV
    ? {
        // Your PC's local IP so the emulator can reach it
        url: 'http://192.168.18.74:3000',
        cleartext: true,
      }
    : {
        url: 'https://newsbi-pulse.vercel.app',
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
      resize: KeyboardResize.Body,
      resizeOnFullScreen: true,
    },
  },

  android: {
    allowMixedContent: USE_LOCAL_DEV,
    backgroundColor: '#0F172A',
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },
};

export default config;
