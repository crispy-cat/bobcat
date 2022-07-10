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
const Bobcat_1 = __importDefault(require("./core/app/Bobcat"));
const path_1 = __importDefault(require("path"));
require("dotenv").config();
global.version = require("../package.json").version;
process.on("uncaughtException", (err) => {
    console.error(`Uncaught error:\n${err.stack}`);
});
global.bobcat = new Bobcat_1.default(path_1.default.dirname(__dirname));
global.bobcat.start();
