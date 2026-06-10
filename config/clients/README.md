# Guida: aggiungere un nuovo cliente

Ogni cliente ha una sottocartella dedicata qui dentro. La struttura è sempre la stessa:

```
config/clients/
└── <clientId>/
    ├── config.json
    └── assets/
        ├── icon.png       (1024×1024 px — icona app, obbligatorio)
        ├── splash.png     (2732×2732 px — splash screen, obbligatorio)
        ├── logo.png       (dimensioni libere — logo nell'interfaccia)
        └── favicon.png    (512×512 px — favicon versione web)
```

---

## 1. Crea la cartella

```
config/clients/<clientId>/assets/
```

Il `clientId` deve essere una parola senza spazi, tutto minuscolo (es. `salonepaola`, `centrofit`).

---

## 2. Compila `config.json`

Copia questo template e adattalo:

```json
{
  "clientId": "<clientId>",
  "appName": "Nome Visibile App",
  "bundleId": "com.codesea.<clientId>",

  "api": {
    "devUrl": "http://localhost:3000",
    "prodUrl": "https://api.<clientId>.codesea.it"
  },

  "theme": {
    "primary":    "#3880ff",
    "secondary":  "#3dc2ff",
    "tertiary":   "#5260ff",
    "success":    "#2dd36f",
    "warning":    "#ffc409",
    "danger":     "#eb445a",
    "dark":       "#222428",
    "medium":     "#92949c",
    "light":      "#f4f5f8"
  },

  "vertical": "medical",

  "features": {
    "refertiMedici":   true,
    "ricetteMediche":  false,
    "pagamentiOnline": false,
    "notifichePush":   false,
    "multiOperatore":  true,
    "catalogoAdmin":   true
  },

  "db": {
    "name": "<clientId>_db"
  }
}
```

**Campi obbligatori da personalizzare:**
- `clientId` — identificativo univoco, tutto minuscolo, senza spazi
- `appName` — nome mostrato sull'app e sullo store
- `bundleId` — convenzione `com.codesea.<clientId>`, non cambiare mai dopo il primo deploy
- `api.prodUrl` — URL del backend di produzione del cliente
- `theme.primary` — colore principale del brand
- `db.name` — nome del database PostgreSQL dedicato

---

## A proposito di `vertical` e `features`

### `vertical`

È una **etichetta descrittiva** che indica il tipo di business del cliente. Al momento non è collegata ad alcuna logica nel codice. 
Valori possibili: `medical` | `beauty` | `fitness` | `generic`.

In futuro potrà essere usata dallo script di build per applicare automaticamente un set di feature flags predefinito per categoria (es. `beauty` imposta `refertiMedici: false` di default senza doverlo scrivere ogni volta).

### `features`

Sono dei **flag dichiarativi** che descrivono quali funzionalità dell'app devono essere attive per quel cliente. L'idea è evitare branch di codice separati per ogni cliente: con un solo codebase, le funzionalità si mostrano o nascondono in base al flag.

Il meccanismo finale, una volta implementato, funzionerà così. Nel componente Angular si legge il flag dall'environment:

```typescript
features = environment.features; // es. { refertiMedici: true, ... }
```

Nel template HTML si wrappa la sezione condizionale:

```html
<!-- Visibile solo se il cliente ha i referti abilitati -->
<ng-container *ngIf="features.refertiMedici">
  <ion-button (click)="caricaReferto()">Carica Referto</ion-button>
</ng-container>
```

**⚠ Stato attuale:** `vertical` e `features` sono al momento solo dichiarativi — il codice dell'app non li legge ancora. Tutte le funzionalità sono sempre visibili indipendentemente dai flag. La lettura dei flag dall'`environment` e i relativi `*ngIf` nel template sono una funzionalità futura da implementare quando si aggiungerà il primo cliente con un verticale diverso da `medical`.

---

## 3. Aggiungi gli asset grafici

Inserisci nella cartella `assets/` le immagini sorgente. Se non le hai ancora, la build procede comunque (gli asset vengono saltati con un avviso).

---

## 4. Crea il database

```bash
docker exec -it medicapp_postgres psql -U postgres -c "CREATE DATABASE <clientId>_db;"
```

---

## 5. Esegui la build

```bash
cd frontend
npm run build:client -- <clientId>
```

Poi apri Android Studio per generare l'APK:

```bash
npx cap open android
```

---

Vedi il README principale del progetto per tutti i dettagli.
