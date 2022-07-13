"use strict";
/*
    Bobcat bot for Revolt
    crispycat <the@crispy.cat>
    https://crispy.cat/software/bobcat
    https://github.com/crispy-cat/bobcat
    Licensed under the GNU GPL v3 license
*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Logger_1 = __importDefault(require("../utilities/Logger"));
class Listener {
    constructor(listener) {
        this.name = listener.name;
        this.obj = listener.obj;
        this.event = listener.event;
        this.func = listener.func;
        this.exec = this.exec.bind(this);
    }
    attach() {
        this.obj.on(this.event, this.exec);
    }
    detach() {
        this.obj.off(this.event, this.exec);
    }
    exec(...args) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.func.call(this, ...args);
            }
            catch (err) {
                Logger_1.default.log("Listener failed:", this.name, err.stack, Logger_1.default.L_ERROR);
            }
        });
    }
}
exports.default = Listener;
