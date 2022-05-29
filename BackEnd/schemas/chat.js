const { Schema, model } = require("mongoose");

const chat = Schema({
    users: {
        type: Array,
        required: true
    },
    messages: {
        type: Array,
        required: false
    },
})

module.exports = model("chat", chat);