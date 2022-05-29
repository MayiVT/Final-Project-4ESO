const { green, yellow, red, magenta, cyan } = require('chalk');

class Logger {
    constructor() {
        this.success = (message) => console.log(`${green('✔ success:')} ${message}`);
        this.error = (message) => console.log(`${red('✖ error:')} ${message}`);
        this.debug = (message) => console.log(`${magenta('◉ debug:')} ${message}`);
        this.warn = (message) => console.log(`${yellow('⚠ warn:')} ${message}`);
        this.info = (message) => console.log(`${cyan('ℹ info:')} ${message}`);
    }
}
module.exports = Logger;