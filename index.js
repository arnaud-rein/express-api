// Importation du module express
const express = require('express');

// Création d'une application express
const app = express();

// Port d'écoute du serveur
const PORT = 3000;

// Route GET à la racine "/"
app.get('/', (req, res) => {
    res.send('Bienvenue sur mon serveur Express ! 🎉');
});

// Lancement du serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
