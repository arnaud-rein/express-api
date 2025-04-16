const { z } = require('zod');

// Format attendu : "Capteur salon;48.8566;2.3522"
const iotMessageSchema = z.string().refine((str) => {
    const parts = str.split(';');
    return parts.length === 3 && !isNaN(parts[1]) && !isNaN(parts[2]);
}, {
    message: "Le message doit être sous la forme 'nom;latitude;longitude'"
});

module.exports = { iotMessageSchema };
