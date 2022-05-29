const { Schema, model } = require("mongoose");

const form = Schema({
    name: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    mail: {
        type: String,
        required: true
    },
    verified: {
        type: Boolean,
        default: false
    },
    code: {
        type: String,
        required: true
    },
    language: {
        type: String,
        required: true,
        default: "en"
    },
    count: {
        type: Number,
        required: true
    },
    profileIMG: {
        type: String,
        required: true,
        default: "https://cdn.icon-icons.com/icons2/1378/PNG/512/avatardefault_92824.png"
    }
});

module.exports = model("form", form);