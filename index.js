const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo');


const Iot = require('./models/Iot');
const User = require('./models/User');
require('./auth/passportConfig')(passport);

const app = express();
const PORT = 3000;
const cors = require('cors');
app.use(cors(

    {
        "origin": "http://localhost:5175",
        "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
        "preflightContinue": false,
        "optionsSuccessStatus": 204,
        "credentials":true
    }

));


// Connexion à MongoDB
mongoose.connect('mongodb://localhost:27017/mon_iot_db', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB connecté'))
    .catch((err) => console.error('❌ Mongo erreur:', err));

// Middleware JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


app.use(session({
    secret: 'super_secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: 'mongodb://localhost:27017/mon_iot_db',
        collectionName: 'sessions', // facultatif : nom de la collection dans MongoDB
        ttl: 60 * 60 * 24 // durée de vie en secondes (ici : 1 jour)
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 // 1 jour côté client
    }
}));


app.use(passport.initialize());
app.use(passport.session());

// ✅ Auth middleware
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    return res.status(401).json({ message: 'Non autorisé. Connectez-vous.' });
}

// 🔐 Enregistrement d'utilisateur
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ message: 'Utilisateur déjà existant' });

    const user = new User({ username, password });
    await user.save();
    res.status(201).json({ message: 'Inscription réussie' });
});

// 🔐 Connexion utilisateur
app.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err); // erreur interne
        if (!user) {
            // mauvaise authentification : renvoie le message de la stratégie
            return res.status(401).json({ message: info.message });
        }

        // Connexion manuelle de l'utilisateur si tout est bon
        req.logIn(user, (err) => {
            if (err) return next(err);
            return res.json({ message: 'Connecté avec succès', user });
        });
    })(req, res, next); // <- appel immédiat de la fonction middleware retournée
});


// 🔐 Déconnexion
app.get('/logout', (req, res) => {
    req.logout(() => {
        res.json({ message: 'Déconnecté' });
    });
});

// 🔒 Route protégée : recevoir data depuis TCP
app.post('/tcp-data', ensureAuthenticated, async (req, res) => {
    const { message } = req.body;
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
        res.status(201).json({ message: 'IoT sauvegardé', data: saved });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 🔒 Route protégée : voir tous les iot
app.get('/iot', ensureAuthenticated, async (req, res) => {
    const all = await Iot.find();
    res.json(all);
});

// app.get('/iot-sans-cors',  async (req, res) => {
//     const all = await Iot.find();
//     res.json(all);
// });

app.post('/test-cors', (req, res) => {
    res.json({ message: 'CORS fonctionne !', data: req.body });
});


app.get('/me', (req, res) => {
    if (req.isAuthenticated()) {
        console.log('User =', req.user);
        console.log('isAuthenticated =', req.isAuthenticated());
        return res.json({ user: req.user });
    }
    res.status(401).json({ message: 'Non connecté' });
});


app.listen(PORT, () => {
    console.log(`🚀 Serveur Express : http://localhost:${PORT}`);
});
