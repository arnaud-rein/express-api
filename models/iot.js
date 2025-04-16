const mongoose = require('mongoose');

const IotSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    position: {
        latitude: {
            type: Number,
            required: true
        },
        longitude: {
            type: Number,
            required: true
        }
    }
});

module.exports = mongoose.model('Iot', IotSchema);
