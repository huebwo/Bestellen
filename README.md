# Bestellen – mit geteilter Rangliste auf Netlify

## Variante A: Netlify CLI (am schnellsten)

Voraussetzung: Node.js installiert.

```bash
cd bestellen-netlify
npm install
npx netlify-cli login
npx netlify-cli deploy --prod
```

Beim ersten Deploy fragt die CLI nach einer neuen Site: „Create & configure a new project“ wählen und einen Namen vergeben.
Den Ordner zum Veröffentlichen mit Enter bestätigen (`public`, kommt aus netlify.toml).

## Variante B: über GitHub

1. Den Ordner als Repository auf GitHub hochladen.
2. Auf app.netlify.com: „Add new project“ → „Import an existing project“ → Repository wählen.
3. Die Einstellungen kommen aus `netlify.toml`, einfach „Deploy“ klicken.

**Achtung:** Einfaches Drag & Drop („Netlify Drop“) reicht nicht, weil dabei die Funktion für die Rangliste nicht mit hochgeladen wird.

## Was wo liegt

- `public/index.html` – die Seite
- `netlify/functions/scores.mjs` – API `/api/scores` (GET = Rangliste, POST = eigenen Wert speichern)
- Gespeichert wird in Netlify Blobs (Store `scores`), ein Eintrag pro Spieler.

Werte über 30 Klicks/s lehnt der Server als unrealistisch ab.

## Rangliste zurücksetzen

1. Einmalig in Netlify: Project configuration → Environment variables → „Add a variable“
   Key: `RESET_KEY`, Value: ein Passwort deiner Wahl. Danach einmal neu deployen (Deploys → Trigger deploy).
2. Zum Zurücksetzen im Browser öffnen:
   `https://DEINE-ADRESSE.netlify.app/api/reset?key=DEIN-PASSWORT`

Alle Einträge werden gelöscht, und die gespeicherten Werte auf den Geräten der Spieler starten wieder bei 0.
