# MedicApp — Piattaforma di prenotazione appuntamenti

MedicApp è un'applicazione del settore sanitario che permette una gestione a 360° della salute del paziente: prenotazione visite, gestione agenda operatori, caricamento referti PDF e molto altro.

## Stack tecnologico

- **Frontend**: Angular 20 + Ionic 8 + Capacitor (iOS / Android)
- **Backend**: NestJS + TypeORM
- **Database**: PostgreSQL (via Docker Compose)
- **Build Android**: Capacitor + Android Studio

---

## Struttura del progetto

```
MedicApp/
├── config/
│   └── clients/
│       └── medicapp/          ← configurazione branding cliente
│           ├── config.json
│           └── assets/        ← icon.png, splash.png, logo.png, favicon.png
├── frontend/                  ← app Angular/Ionic/Capacitor
│   ├── capacitor.config.ts    ← generato da build:client, non modificare
│   └── src/
│       ├── environments/
│       │   ├── environment.ts          ← URL sviluppo (localhost)
│       │   └── environment.prod.ts     ← generato da build:client
│       └── theme/
│           └── variables.scss          ← generato da build:client
├── med-booking-backend/       ← API NestJS
│   ├── .env                   ← credenziali DB e JWT (NON committare)
│   └── .env.example           ← template da copiare per nuovi ambienti
└── scripts/
    └── build-client.js        ← script di build white-label
```

---

## Avvio in sviluppo

### 1. Avvia il database PostgreSQL

```bash
docker-compose up -d
```

<!-- > Se il backend si ferma con `ECONNREFUSED 127.0.0.1:5432`, PostgreSQL si è spento. Riavvialo con questo comando prima di tutto il resto. -->

### 2. Avvia il backend NestJS

```bash
# Controllare di essere nella folder del backend in alternativa entraci con il seguente comando
cd med-booking-backend

# # Solo la prima volta: copiare il template .env
# cp .env.example .env   # poi compilare DB_PASSWORD e JWT_SECRET

npm run start:dev
```

Il backend resta in ascolto su `http://localhost:3000`. Lascia questo terminale aperto.

### 3. Avvia il frontend nel browser

```bash
# Controllare di essere nella folder del frontend in alternativa entraci con il seguente comando
cd frontend

# Avviare l'applicativo frontend tramite
npm run start        # → http://localhost:4200
# oppure
ionic serve          # → http://localhost:8100
```

---

## Test su dispositivo Android fisico

Per testare l'app su un telefono reale collegato via USB, servono **tre passi ogni volta che riapri la sessione**.

### Passo 1 — Verifica che Docker e il backend siano attivi

```bash
# controllare se sì è già nella folder del backend altrimenti eseguire
cd med-booking-backend 

# avviare il container docker
docker-compose up -d

# verificare che il db sia attivo, eseguendo questo comando deve comparire il container PostgreSQL
docker ps

# avviare il backend NestJS
npm run start:dev
```

### Passo 2 — ADB reverse (porta del backend sul telefono)

Il telefono non può raggiungere `localhost:3000` del PC direttamente. Questo comando lo mappa.
Per sicurezza assicurarsi di aver avviato il backend prima
> ⚠ Va rieseguito ogni volta che: scollega/ricollega il cavo USB, riavvii il telefono, riavvii Android Studio.

```bash
adb reverse tcp:3000 tcp:3000
```

Verificare che il telefono sia riconosciuto:
```bash
adb devices   # deve comparire il tuo device, non "unauthorized"
```

### Passo 3 — Build di sviluppo e sync

```bash
cd frontend
ionic build --configuration=development   # usa environment.ts → http://localhost:3000
npx cap sync android                      # copia i file nella cartella android/
```

Poi in **Android Studio** cliccare il pulsante **Run ▶** per installare e avviare l'app sul device.

> **`--configuration=development`**  
> Da Angular 17 in poi, `ionic build` senza flag usa di default la configurazione `production` (che punta a `https://api.medicapp.codesea.it`). Per i test locali serve specificare `development` esplicitamente.

---

## Build APK / AAB per gli store (produzione)

Per pubblicare l'app sugli store, usa il flusso di build white-label.

### Build completa per cliente `medicapp`

```bash
cd frontend
npm run build:client -- medicapp
```

Lo script esegue in sequenza:
1. Legge `config/clients/medicapp/config.json`
2. Sovrascrive `environment.prod.ts` con l'`apiUrl` di produzione (`https://api.medicapp.codesea.it`)
3. Aggiorna `capacitor.config.ts` con `appId` e `appName`
4. Applica il tema CSS (`variables.scss`)
5. Copia i file da `config/clients/medicapp/assets/`
6. Genera icone/splash (se `@capacitor/assets` è installato)
7. Esegue `ionic build --prod` (build ottimizzata con AOT e tree-shaking)
8. Esegue `npx cap sync android`

### Genera APK / AAB firmato

Dopo la build, aprire Android Studio con:

```bash
npx cap open android
```

Poi scegliere:
- **Build → Generate Signed Bundle / APK → Android App Bundle (.aab)** → per pubblicazione Play Store
- **Build → Generate Signed Bundle / APK → APK** → per installazione diretta sul device

Segui la procedura guidata per selezionare o creare il keystore di firma.

> **Importanza del keystore**: Il keystore è la chiave con il quale viene firmata la build. Senza di essa non sarà più possibile aggiornare l'app sugli store con lo stesso bundle ID.

---

## Cheatsheet comandi rapidi

| Situazione | Comandi |
|---|---|
| Aprire il progetto da zero per sviluppare | `docker-compose up -d` → `npm run start:dev` (backend) → `npm run start` (frontend) |
| Testare su device dopo aver modificato codice | `ionic build --configuration=development` → `npx cap sync android` → Run in Android Studio |
| ADB reverse perso (cavo ricollegato) | `adb reverse tcp:3000 tcp:3000` |
| Build per pubblicare sugli store | `npm run build:client -- medicapp` → Android Studio → Generate Signed Bundle |

---

## Aggiungere un nuovo cliente

Seguire questi passi in ordine.

### 1. Creare la cartella di configurazione

```
config/
└── clients/
    └── <nuovo-cliente>/       ← es. "salonepaola", "centrofit", ecc.
        ├── config.json
        └── assets/
            ├── icon.png       (1024×1024 px — obbligatorio)
            ├── splash.png     (2732×2732 px — obbligatorio)
            ├── logo.png       (libero — mostrato nell'UI)
            └── favicon.png    (512×512 px — versione web)
```

### 2. Compilare `config.json`

```json
{
  "clientId": "salonepaola",
  "appName": "Salone Paola",
  "bundleId": "com.codesea.salonepaola",

  "api": {
    "devUrl": "http://localhost:3000",
    "prodUrl": "https://api.salonepaola.codesea.it"
  },

  "theme": {
    "primary":    "#e91e8c",
    "secondary":  "#f06292",
    "tertiary":   "#880e4f",
    "success":    "#2dd36f",
    "warning":    "#ffc409",
    "danger":     "#eb445a",
    "dark":       "#222428",
    "medium":     "#92949c",
    "light":      "#f4f5f8"
  },

  "vertical": "beauty",

  "features": {
    "refertiMedici":   false,
    "ricetteMediche":  false,
    "pagamentiOnline": false,
    "notifichePush":   false,
    "multiOperatore":  true,
    "catalogoAdmin":   true
  },

  "db": {
    "name": "salonepaola_db"
  }
}
```

Convenzione `bundleId`: sempre **`com.codesea.<clientId>`** — non cambiare mai dopo il primo deploy su Play Store / App Store.

Verticali disponibili: `medical` | `beauty` | `fitness` | `generic`

Feature flags: imposta `false` le funzionalità non applicabili al verticale del cliente.

### 3. Creare il database dedicato

```bash
# Entrare nel container PostgreSQL
docker exec -it medicapp_postgres psql -U postgres

# Creare il nuovo DB
CREATE DATABASE salonepaola_db;
\q
```

### 4. Creare il file `.env` per il nuovo cliente

Nel backend, copiare `.env.example` e creare un file specifico:

```bash
cd med-booking-backend
cp .env.example .env.salonepaola
```

Modificare `.env.salonepaola`:
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password_segreta
DB_NAME=salonepaola_db
JWT_SECRET=<stringa-lunga-casuale>
PORT=3001
```

> Per sviluppo/test usa una porta diversa (es. 3001) se si vuole far girare due backend in parallelo.

### 5. Eseguire la build

```bash
cd frontend
npm run build:client -- salonepaola
```

### 6. Aprire Android Studio e generare l'APK

```bash
npx cap open android
# In Android Studio: Build → Generate Signed Bundle / APK
```

---

## Variabili d'ambiente backend (`.env`)

| Variabile | Default | Descrizione |
|-----------|---------|-------------|
| `DB_HOST` | `localhost` | Host PostgreSQL |
| `DB_PORT` | `5432` | Porta PostgreSQL |
| `DB_USER` | `postgres` | Utente DB |
| `DB_PASSWORD` | — | Password DB |
| `DB_NAME` | `medicapp_db` | Nome del database |
| `JWT_SECRET` | — | Chiave per la firma dei token JWT |
| `PORT` | `3000` | Porta del server NestJS |

---

## Utente admin

L'admin non è registrabile dall'app. Va creato direttamente sul DB:

```sql
-- Prima registrare un utente normale dall'app, poi:
UPDATE users SET ruolo = 'admin' WHERE email = 'admin@medicapp.it';
```

---

## Note architetturali

- **Multi-tenant**: ogni cliente ha il proprio database PostgreSQL dedicato.
- **White-label**: stesso codice sorgente, branding/config/DB separati per cliente.
- **Feature flags**: le funzionalità si abilitano/disabilitano in `config.json` senza toccare il codice.
- **Bundle ID**: convenzione `com.codesea.<clientId>` — impostato una volta, non cambia mai.
- **`.env` e `environment.prod.ts`**: mai committare su Git (già in `.gitignore`).
