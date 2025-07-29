# Notesourcing - Istruzioni di sviluppo

**Questa webapp è progettata per essere pubblicata come GitHub Page.**

## Deploy su GitHub Pages

1. Assicurati che il router usi HashRouter (già configurato).
2. Modifica la proprietà `base` in `vite.config.js` se cambi il nome della repo.
3. Esegui il build:
   ```bash
   npm run build
   ```
4. Pubblica la cartella `dist` su GitHub Pages (puoi usare [vite-plugin-gh-pages](https://www.npmjs.com/package/vite-plugin-gh-pages) o caricare manualmente).

La webapp funzionerà interamente lato client e userà Firebase per autenticazione e dati.

## Avvio locale

1. Installa le dipendenze:
   ```bash
   npm install
   ```
2. Avvia il server di sviluppo:
   ```bash
   npm run dev
   ```

## Configurazione Firebase

- Crea un progetto su [Firebase Console](https://console.firebase.google.com/).
- Inserisci le credenziali in `src/firebase.js`.

## Struttura cartelle
- `src/pages/` — Pagine principali (Home, Login, Dashboard, Note, Community)
- `src/firebase.js` — Configurazione Firebase
- `src/App.jsx` — Routing principale
- `src/index.css` — Stili globali

## Prossimi passi
- Implementare autenticazione Firebase (email/password, OAuth)
- CRUD note e campi
- Permessi e condivisione
- UI mobile-friendly
- Versionamento e commenti
- API pubblica e import/export CSV

Vedi `README.md` per le specifiche funzionali.
