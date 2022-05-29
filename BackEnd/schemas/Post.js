const mongoose = require('mongoose');

const post = mongoose.Schema({
    user: {
        type: Array,
        required: true
    },
    post: {
        type: Array,
        required: true
    },
    text: {
        type: Array,
        required: true
    },
    id: {
        type: String,
        required: true,
        default: '1'
    },
    date: {
        type: Date,
        required: true,
        default: Date.now()
    }
});

module.exports = mongoose.model('post', post);