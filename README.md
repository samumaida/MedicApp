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
│   ├── capacitor.config.ts    ← ⚠ generato da build:client, non modificare
│   └── src/
│       ├── environments/
│       │   ├── environment.ts          ← URL dev (localhost)
│       │   └── environment.prod.ts     ← ⚠ generato da build:client
│       └── theme/
│           └── variables.scss          ← ⚠ generato da build:client
├── med-booking-backend/       ← API NestJS
│   ├── .env                   ← credenziali DB e JWT (NON committare)
│   └── .env.example           ← template da copiare per nuovi ambienti
└── scripts/
    └── build-client.js        ← script di build white-label
```

---

## Avvio in sviluppo

### Backend

```bash
cd med-booking-backend

# Prima volta: copia il file .env e compila i valori
cp .env.example .env

# Avvia il database PostgreSQL
docker-compose up -d

# Avvia il server NestJS
npm run start:dev
```

### Frontend

```bash
cd frontend
npm run start        # → http://localhost:4200
```

---

## Build produzione Android (cliente esistente)

Per generare l'APK del cliente `medicapp`:

```bash
cd frontend
npm run build:client -- medicapp
```

Lo script esegue in sequenza:
1. Legge `config/clients/medicapp/config.json`
2. Sovrascrive `environment.prod.ts` con `apiUrl` di produzione
3. Aggiorna `capacitor.config.ts` con `appId` e `appName`
4. Applica il tema CSS (`variables.scss`)
5. Copia i file da `config/clients/medicapp/assets/`
6. Genera icone/splash (se `@capacitor/assets` è installato)
7. Esegue `ionic build --prod`
8. Esegue `npx cap sync android`

Poi apri Android Studio:
```bash
npx cap open android
```

> **Nota sviluppo quotidiano**: durante lo sviluppo su MedicApp, continuare a usare `ionic serve` / `ionic cap build android --prod` come di consueto. Il comando `build:client` serve solo per build white-label destinate a clienti diversi.

---

## Aggiungere un nuovo cliente

Segui questi passi in ordine.

### 1. Crea la cartella di configurazione

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

### 2. Compila `config.json`

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

### 3. Crea il database dedicato

```bash
# Entra nel container PostgreSQL
docker exec -it medicapp_postgres psql -U postgres

# Crea il nuovo DB
CREATE DATABASE salonepaola_db;
\q
```

### 4. Crea il file `.env` per il nuovo cliente

Nel backend, copia `.env.example` e crea un file specifico:

```bash
cd med-booking-backend
cp .env.example .env.salonepaola
```

Modifica `.env.salonepaola`:
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password_segreta
DB_NAME=salonepaola_db
JWT_SECRET=<stringa-lunga-casuale>
PORT=3001
```

> Per sviluppo/test usa una porta diversa (es. 3001) se vuoi far girare due backend in parallelo.

### 5. Esegui la build

```bash
cd frontend
npm run build:client -- salonepaola
```

### 6. Apri Android Studio e genera l'APK

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
-- Prima registra un utente normale dall'app, poi:
UPDATE users SET ruolo = 'admin' WHERE email = 'admin@medicapp.it';
```

---

## Note architetturali

- **Multi-tenant**: ogni cliente ha il proprio database PostgreSQL dedicato.
- **White-label**: stesso codice sorgente, branding/config/DB separati per cliente.
- **Feature flags**: le funzionalità si abilitano/disabilitano in `config.json` senza toccare il codice.
- **Bundle ID**: convenzione `com.codesea.<clientId>` — impostato una volta, non cambia mai.
- **`.env` e `environment.prod.ts`**: mai committare su Git (già in `.gitignore`).
