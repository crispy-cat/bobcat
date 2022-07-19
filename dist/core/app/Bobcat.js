"use strict";
/*
    Bobcat bot for Revolt
    crispycat <the@crispy.cat>
    https://crispy.cat/software/bobcat
    https://github.com/crispy-cat/bobcat
    Licensed under the GNU GPL v3 license
*/
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const readline = __importStar(require("readline"));
const glob_1 = __importDefault(require("glob"));
const axios_1 = __importDefault(require("axios"));
const revolt_js_1 = require("revolt.js");
const Config_1 = __importDefault(require("../app/Config"));
const Logger_1 = __importDefault(require("../utilities/Logger"));
const Database_1 = __importDefault(require("../app/Database"));
const Clock_1 = require("../app/Clock");
const AccessControl_1 = __importDefault(require("../permissions/AccessControl"));
class Bobcat {
    constructor(root) {
        this._modules = [];
        this.root = root;
        this.config = new Config_1.default(root + "/config.json");
        this.client = new revolt_js_1.Client();
        this.database = new Database_1.default(root + "/bobcat.db");
        this.clock = new Clock_1.Clock();
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        this.axios = axios_1.default.create();
        this.axios.defaults.headers.common["User-Agent"] = "BobcatBot/" + global.version;
    }
    get modules() {
        return this._modules;
    }
    loadModule(mod) {
        if (this.modules.find((m) => m.name == mod.name)) {
            Logger_1.default.log("Tried to load module that already exists: " + mod.name, Logger_1.default.L_WARNING);
            return false;
        }
        for (let listener of mod.listeners)
            listener.attach();
        this.modules.push(mod);
        return true;
    }
    unloadModule(name) {
        let mod = this.modules.splice(this.modules.findIndex((m) => m.name == name), 1)[0];
        for (let listener of mod.listeners)
            listener.detach();
        return mod;
    }
    getModule(name) {
        return this.modules.find((m) => m.name == name);
    }
    start() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`\n\n${"=".repeat(80)}\n\nLoading Config...`);
            this.config.load();
            Logger_1.default.log("Opening database...");
            this.database.open();
            this.database.create("bobcat");
            this.database.create("global");
            Logger_1.default.log("Loading modules...");
            let gpaths = ((_a = this.config.get("bobcat.modules.import")) !== null && _a !== void 0 ? _a : []);
            let paths = [];
            for (let gpath of gpaths) {
                try {
                    paths.push(...glob_1.default.sync(`${this.root}/dist/modules/${gpath}`));
                }
                catch (err) {
                    Logger_1.default.log("Invalid path pattern " + gpath);
                }
            }
            Logger_1.default.log("Found " + paths.length + " modules", Logger_1.default.L_INFO);
            for (let mpath of paths) {
                let mod;
                try {
                    mod = require(mpath);
                    this.loadModule(mod);
                    Logger_1.default.log("Loaded module:", mpath, mod.name, Logger_1.default.L_INFO);
                }
                catch (err) {
                    Logger_1.default.log("Failed to load module:", mpath, mod === null || mod === void 0 ? void 0 : mod.name, err, Logger_1.default.L_ERROR);
                }
            }
            Logger_1.default.log("Listening for commands...");
            this.promptCommand();
            this.client.on("message", (msg) => {
                var _a;
                if (msg.channel.server)
                    global.bobcat.database.create(msg.channel.server._id);
                let prefix = this.getPrefix(msg.channel.server);
                if ((_a = msg.content) === null || _a === void 0 ? void 0 : _a.startsWith(prefix)) {
                    msg.channel.startTyping();
                    global.bobcat.command(msg.content.slice(prefix.length), msg);
                    msg.channel.stopTyping();
                }
            });
            Logger_1.default.log("Logging into Revolt...", Logger_1.default.L_INFO);
            this.client.on("ready", () => {
                Logger_1.default.log("Ready!", Logger_1.default.L_INFO);
            });
            yield this.client.loginBot(process.env.TOKEN);
            Logger_1.default.log("Logged in", Logger_1.default.L_INFO);
        });
    }
    end() {
        return __awaiter(this, void 0, void 0, function* () {
            Logger_1.default.log("Closing database...", Logger_1.default.L_INFO);
            this.database.close();
            Logger_1.default.log("Exiting process...", Logger_1.default.L_WARNING);
            process.exit(0);
        });
    }
    command(cmd, msg, sudo = false) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let args = cmd.split(" ");
            if (!args.length)
                return;
            Logger_1.default.log(`Received command '${cmd}' in #${msg === null || msg === void 0 ? void 0 : msg.channel._id}` + (sudo ? " (sudo)" : ""));
            for (let mod of this.modules) {
                for (let command of mod.commands) {
                    if (command.names.includes(args[0])) {
                        if (!sudo && ((_a = msg === null || msg === void 0 ? void 0 : msg.channel) === null || _a === void 0 ? void 0 : _a.server)) {
                            if ((yield AccessControl_1.default.getAccessLevel(msg.channel.server, msg.author)) < command.accessLevel) {
                                msg.reply(":x: You do not have permission to use this command");
                                return;
                            }
                        }
                        Logger_1.default.log("--> Handing to " + mod.name);
                        let succ = yield command.exec(args, msg);
                        if (msg && !succ)
                            msg.reply(":x: Error executing command.");
                        return;
                    }
                }
            }
            if (msg)
                msg.reply(":x: Command not found.");
        });
    }
    promptCommand() {
        this.rl.question("Bobcat> ", (cmd) => {
            global.bobcat.command(cmd, null, true);
            global.bobcat.promptCommand();
        });
    }
    modfunc(modname, funcname, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            let mod = this.modules.find((m) => m.name == modname);
            if (!mod) {
                let err = new Error(`Tried to execute function ${funcname} on nonexistent module ${modname}`);
                Logger_1.default.log(err.stack, Logger_1.default.L_ERROR);
                return err;
            }
            let func = mod.functions.find((f) => f.name == funcname);
            if (!func) {
                let err = new Error(`Tried to execute nonexistent function ${funcname} on module ${modname}`);
                Logger_1.default.log(err.stack, Logger_1.default.L_ERROR);
                return err;
            }
            return yield func.exec(...args);
        });
    }
    findULID(str) {
        var _a;
        if (!str)
            return null;
        return (_a = str.match(/[0-9A-HJKMNP-TV-Z]{26}/)) === null || _a === void 0 ? void 0 : _a[0];
    }
    getPrefix(server) {
        var _a, _b, _c;
        if (server)
            return (_b = (_a = global.bobcat.database.get(server._id, "bobcat.prefix")) !== null && _a !== void 0 ? _a : global.bobcat.config.get("bobcat.prefix")) !== null && _b !== void 0 ? _b : "$";
        else
            return (_c = global.bobcat.config.get("bobcat.prefix")) !== null && _c !== void 0 ? _c : "$";
    }
}
exports.default = Bobcat;
