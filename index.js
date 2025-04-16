const express = require('express');
const mongoose = require('mongoose');
const Iot = require('./models/Iot');
const { iotMessageSchema } = require('./validator/validatorIot');

const app = express();
const PORT = 3000;

// Middleware pour parser le JSON
app.use(express.json());

// Connexion MongoDB
mongoose.connect('mongodb://localhost:27017/mon_iot_db', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('✅ Connecté à MongoDB');
}).catch((err) => {
    console.error('❌ Erreur de connexion MongoDB:', err);
});

// 🔥 Route pour recevoir les messages du serveur TCP
app.post('/tcp-data', async (req, res) => {
    const { message } = req.body;

    const parseResult = iotMessageSchema.safeParse(message);

    if (!parseResult.success) {
        return res.status(400).json({
            error: "Message invalide",
            detail: parseResult.error.issues
        });
    }

    // Si le message est valide, on le traite
    const [name, latStr, lonStr] = message.split(';');
    const latitude = parseFloat(latStr);
    const longitude = parseFloat(lonStr);

    try {
        const iot = new Iot({
            name,
            position: { latitude, longitude },
            rawMessage: message
        });

        const saved = await iot.save();

        res.status(201).json({
            message: 'Objet IoT sauvegardé',
            data: saved
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Test de base
app.get('/', (req, res) => {
    res.send('API Express pour messages TCP');
});

app.listen(PORT, () => {
    console.log(`🚀 Serveur Express sur http://localhost:${PORT}`);
});
