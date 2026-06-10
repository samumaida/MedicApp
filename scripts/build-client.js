/**
 * build-client.js
 * Script di build parametrizzato per cliente (white-label / multi-tenant).
 *
 * Uso:
 *   node scripts/build-client.js medicapp
 *   npm run build:client -- medicapp
 *
 * Lo script:
 *  1. Legge config/clients/<clientId>/config.json
 *  2. Sovrascrive src/environments/environment.prod.ts con i valori del cliente
 *  3. Aggiorna frontend/capacitor.config.ts (appId + appName)
 *  4. Applica il tema CSS (sovrascrive src/theme/variables.scss)
 *  5. (Opzionale, se @capacitor/assets è installato) Genera icone e splash
 *  6. Esegue ionic build --prod
 *  7. Esegue npx cap sync android
 *
 * Compatibile Windows (path.join, cross-spawn).
 */

const path  = require('path');
const fs    = require('fs');
const { execSync } = require('child_process');

// ─────────────────────────────────────────────
// 1. Leggo il clientId passato come argomento
// ─────────────────────────────────────────────
const clientId = process.argv[2];

if (!clientId) {
  console.error('\n❌  Uso: node scripts/build-client.js <clientId>');
  console.error('   Esempio: node scripts/build-client.js medicapp\n');
  process.exit(1);
}

const ROOT        = path.resolve(__dirname, '..');
const CONFIG_DIR  = path.join(ROOT, 'config', 'clients', clientId);
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const FRONTEND    = path.join(ROOT, 'frontend');

if (!fs.existsSync(CONFIG_FILE)) {
  console.error(`\n❌  Config non trovata: ${CONFIG_FILE}`);
  console.error(`   Crea la cartella config/clients/${clientId}/ con config.json\n`);
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
console.log(`\n🏗  Build per cliente: ${config.appName} (${config.bundleId})\n`);

// ─────────────────────────────────────────────
// 2. Aggiorno environment.prod.ts
// ─────────────────────────────────────────────
const envProdPath = path.join(FRONTEND, 'src', 'environments', 'environment.prod.ts');
const envProdContent = `// ⚠ File generato automaticamente da build-client.js — NON modificare manualmente
export const environment = {
  production: true,
  apiUrl: '${config.api.prodUrl}',
  appName: '${config.appName}'
};
`;
fs.writeFileSync(envProdPath, envProdContent, 'utf-8');
console.log(`✅  environment.prod.ts → apiUrl: ${config.api.prodUrl}`);

// ─────────────────────────────────────────────
// 3. Aggiorno capacitor.config.ts
// ─────────────────────────────────────────────
const capConfigPath = path.join(FRONTEND, 'capacitor.config.ts');
const capConfigContent = `import type { CapacitorConfig } from '@capacitor/cli';

// ⚠ File generato automaticamente da build-client.js — NON modificare manualmente
const config: CapacitorConfig = {
  appId: '${config.bundleId}',
  appName: '${config.appName}',
  webDir: 'www',
  android: {
    path: 'android',
    minWebViewVersion: 55
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '${config.theme.primary}',
      showSpinner: false
    }
  }
};

export default config;
`;
fs.writeFileSync(capConfigPath, capConfigContent, 'utf-8');
console.log(`✅  capacitor.config.ts → appId: ${config.bundleId}`);

// ─────────────────────────────────────────────
// 4. Applico il tema CSS
// ─────────────────────────────────────────────
const themeDir  = path.join(FRONTEND, 'src', 'theme');
const themePath = path.join(themeDir, 'variables.scss');

if (fs.existsSync(themeDir)) {
  const t = config.theme;
  const themeContent = `// ⚠ File generato automaticamente da build-client.js — NON modificare manualmente
// Cliente: ${config.clientId} — ${config.appName}

:root {
  --ion-color-primary:         ${t.primary};
  --ion-color-primary-shade:   ${darken(t.primary)};
  --ion-color-primary-tint:    ${lighten(t.primary)};

  --ion-color-secondary:       ${t.secondary};
  --ion-color-secondary-shade: ${darken(t.secondary)};
  --ion-color-secondary-tint:  ${lighten(t.secondary)};

  --ion-color-tertiary:        ${t.tertiary};
  --ion-color-success:         ${t.success};
  --ion-color-warning:         ${t.warning};
  --ion-color-danger:          ${t.danger};
  --ion-color-dark:            ${t.dark};
  --ion-color-medium:          ${t.medium};
  --ion-color-light:           ${t.light};
}
`;
  fs.writeFileSync(themePath, themeContent, 'utf-8');
  console.log(`✅  theme/variables.scss → primary: ${t.primary}`);
} else {
  console.warn(`⚠   Cartella theme non trovata, skip theming.`);
}

// ─────────────────────────────────────────────
// 5. Copia assets del cliente (logo, favicon)
// ─────────────────────────────────────────────
const assetsClientDir = path.join(CONFIG_DIR, 'assets');
const assetsDstDir    = path.join(FRONTEND, 'src', 'assets');

if (fs.existsSync(assetsClientDir)) {
  ['logo.png', 'favicon.png'].forEach(file => {
    const src = path.join(assetsClientDir, file);
    const dst = path.join(assetsDstDir, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dst);
      console.log(`✅  Asset copiato: ${file}`);
    }
  });

  // Copia icon.png e splash.png nella cartella standard di @capacitor/assets
  ['icon.png', 'splash.png'].forEach(file => {
    const src  = path.join(assetsClientDir, file);
    const dst  = path.join(FRONTEND, file); // @capacitor/assets li cerca nella root del progetto
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dst);
      console.log(`✅  Asset Capacitor copiato: ${file} → frontend/${file}`);
    }
  });
}

// ─────────────────────────────────────────────
// 6. (Opzionale) Genera icone con @capacitor/assets
// ─────────────────────────────────────────────
const hasCapAssets = fs.existsSync(
  path.join(FRONTEND, 'node_modules', '@capacitor', 'assets')
);
if (hasCapAssets) {
  console.log('\n🎨  Generazione icone e splash con @capacitor/assets...');
  runInFrontend(`npx @capacitor/assets generate --iconBackgroundColor "${config.theme.primary}" --iconBackgroundColorDark "${config.theme.primary}"`);
} else {
  console.log('\n⚠   @capacitor/assets non installato — skip generazione icone.');
  console.log('   Per installarlo: cd frontend && npm install @capacitor/assets --save-dev');
}

// ─────────────────────────────────────────────
// 7. Build Angular (production)
// ─────────────────────────────────────────────
console.log('\n🔨  ionic build --prod ...');
runInFrontend('ionic build --prod');

// ─────────────────────────────────────────────
// 8. Sincronizza con Capacitor Android
// ─────────────────────────────────────────────
console.log('\n📱  npx cap sync android ...');
runInFrontend('npx cap sync android');

console.log(`\n✅  Build completata per ${config.appName} (${config.bundleId})`);
console.log('   Apri Android Studio: npx cap open android\n');

// ──────────────────────────────────────────────
// Utility
// ──────────────────────────────────────────────

function runInFrontend(cmd) {
  try {
    execSync(cmd, { cwd: FRONTEND, stdio: 'inherit', shell: true });
  } catch (err) {
    console.error(`\n❌  Comando fallito: ${cmd}`);
    process.exit(1);
  }
}

/** Scurisce un colore hex di ~15% (approssimazione semplice) */
function darken(hex) {
  return shiftHex(hex, -0.15);
}

/** Schiarisce un colore hex di ~10% */
function lighten(hex) {
  return shiftHex(hex, 0.10);
}

function shiftHex(hex, factor) {
  const h = hex.replace('#', '');
  if (h.length !== 6) return hex;
  const r = Math.min(255, Math.max(0, Math.round(parseInt(h.slice(0,2),16) * (1 + factor))));
  const g = Math.min(255, Math.max(0, Math.round(parseInt(h.slice(2,4),16) * (1 + factor))));
  const b = Math.min(255, Math.max(0, Math.round(parseInt(h.slice(4,6),16) * (1 + factor))));
  return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
}
