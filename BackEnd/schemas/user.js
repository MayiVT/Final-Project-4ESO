const { Schema, model } = require("mongoose");

const count = Schema({
    count: {
        type: Number,
        default: 0
    }
});
module.exports = model("count", count);