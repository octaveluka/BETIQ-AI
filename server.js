import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Le port est fourni dynamiquement par Render
const port = process.env.PORT || 10000;

// On cible le dossier 'dist' qui sera créé lors du build
const distPath = path.join(__dirname, 'dist');

// Sert les fichiers compilés
app.use(express.static(distPath));

// Pour toutes les routes, on renvoie l'index.html du dossier dist (gestion du routage React)
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`✅ BETIQ est opérationnel sur le port ${port}`);
});