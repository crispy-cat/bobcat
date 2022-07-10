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
const Format_1 = __importDefault(require("../utilities/Format"));
class Logger {
    static log(...msg) {
        if (msg.length == 0)
            return "";
        let level = this.L_NORMAL;
        if (msg.length > 1)
            level = msg.pop();
        let time = Format_1.default.datetime();
        let li;
        switch (level) {
            case this.L_INFO:
                li = "I";
                break;
            case this.L_WARNING:
                li = "W";
                break;
            case this.L_ERROR:
                li = "E";
                break;
            case this.L_FATAL:
                li = "F";
                break;
            case this.L_NORMAL:
            default:
                li = "-";
        }
        let lmsg = `[Bobcat][${time}][${li}]: ${msg.join("\n--> ")}`;
        if (level >= this.L_WARNING)
            console.error(lmsg);
        else
            console.log(lmsg);
        if (level == this.L_FATAL)
            process.exit(-1);
        else
            return lmsg;
    }
}
exports.default = Logger;
Logger.L_NORMAL = 0;
Logger.L_INFO = 1;
Logger.L_WARNING = 2;
Logger.L_ERROR = 3;
Logger.L_FATAL = 4;
