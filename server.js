import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Le port est fourni dynamiquement par Render, sinon on utilise 10000 par défaut
const port = process.env.PORT || 10000;

// Sert tous les fichiers statiques du dossier racine (index.html, index.tsx, etc.)
app.use(express.static(__dirname));

// Pour toutes les autres routes, on renvoie l'index.html (comportement SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// CRUCIAL : Écouter sur 0.0.0.0 pour que Render puisse détecter le port ouvert
app.listen(port, '0.0.0.0', () => {
  console.log(`✅ BETIQ est en ligne sur le port ${port}`);
});