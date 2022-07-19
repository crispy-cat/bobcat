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
const moment_1 = __importDefault(require("moment"));
class Format {
    static datetime(date, format) {
        /*if (typeof date === null || typeof date === undefined)
            date = new Date();*/
        var _a;
        format !== null && format !== void 0 ? format : (format = (_a = global.bobcat.config.get("bobcat.formats.datetime")) !== null && _a !== void 0 ? _a : "YYYY-MM-DD HH:mm:ss");
        return (0, moment_1.default)(date).format(format);
    }
}
exports.default = Format;
