import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // Identificativo univoco dell'app su Play Store e App Store.
  // Convenzione del progetto: com.codesea.<clientId>
  // ⚠ Non modificare manualmente: viene sovrascritto da "npm run build:client -- <clientId>"
  appId: 'com.codesea.medicapp',

  // Nome dell'app mostrato sotto l'icona sul dispositivo.
  // ⚠ Non modificare manualmente: viene sovrascritto da "npm run build:client -- <clientId>"
  appName: 'MedicApp',

  // Cartella che Capacitor copia dentro il WebView Android/iOS.
  // "www" è la cartella di output di "ionic build".
  webDir: 'www',

  // Blocco "server": controlla come il WebView carica il contenuto dell'app.
  //
  // SVILUPPO CON HOT RELOAD (opzionale):
  // Se vuoi vedere le modifiche in tempo reale su un dispositivo fisico o emulatore
  // senza dover rifare la build ogni volta, decommenta "url" e "cleartext" e inserisci
  // l'IP del tuo PC sulla rete locale (visibile con "ipconfig" su Windows):
  //
  //   server: {
  //     url: 'http://192.168.1.x:4200',
  //     cleartext: true,
  //   }
  //
  // Poi avvia "ionic serve" sul PC e lancia l'app sul dispositivo — si connetterà
  // direttamente al tuo server di sviluppo locale.
  //
  // PRODUZIONE: lascia il blocco server vuoto (o rimuovilo del tutto).
  // In questo modo Capacitor carica i file statici dalla cartella "www" compilata,
  // senza dipendere da nessun server esterno.
  server: {},

  android: {
    // Cartella dove Capacitor genera il progetto Android nativo.
    // "npx cap sync android" aggiorna questa cartella dopo ogni build Angular.
    path: 'android',

    // Versione minima del WebView Android richiesta.
    // 55 corrisponde a Chrome 55 (Android 6+), sufficiente per le API usate dall'app.
    minWebViewVersion: 55,
  },

  plugins: {
    SplashScreen: {
      // Durata in millisecondi dello splash screen all'avvio dell'app.
      launchShowDuration: 2000,
      // Colore di sfondo dello splash (deve corrispondere al primary del tema cliente).
      // ⚠ Viene sovrascritto da "npm run build:client -- <clientId>"
      backgroundColor: '#3880ff',
      // Nasconde lo spinner di caricamento sovrapposto allo splash.
      showSpinner: false,
    },
  },
};

export default config;
