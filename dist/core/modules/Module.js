"use strict";
/*
    Bobcat bot for Revolt
    crispycat <the@crispy.cat>
    https://crispy.cat/software/bobcat
    https://github.com/crispy-cat/bobcat
    Licensed under the GNU GPL v3 license
*/
Object.defineProperty(exports, "__esModule", { value: true });
class Module {
    constructor(data) {
        this.name = data.name;
        this.author = data.author;
        this.version = data.version;
        this.hidden = data.hidden;
        this.commands = data.commands;
        this.listeners = data.listeners;
        this.functions = data.functions;
    }
}
exports.default = Module;
