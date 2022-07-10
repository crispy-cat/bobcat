"use strict";
/*
    Bobcat bot for Revolt
    crispycat <the@crispy.cat>
    https://crispy.cat/software/bobcat
    https://github.com/crispy-cat/bobcat
    Licensed under the GNU GPL v3 license
*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
class Config {
    constructor(cpath) {
        this.configData = {};
        this.cpath = cpath;
    }
    load() {
        try {
            let data = fs_1.default.readFileSync(this.cpath).toString();
            this.configData = JSON.parse(data);
        }
        catch (err) {
            console.error(`Bot config could not be loaded: ${err}`);
            process.exit(-2);
        }
    }
    get(key) {
        let parts = key.split(".");
        let value = this.configData;
        while (parts[0] && value)
            value = value === null || value === void 0 ? void 0 : value[parts.shift()];
        return value;
    }
}
exports.default = Config;
