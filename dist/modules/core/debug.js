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
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
const ulid_1 = require("ulid");
const Logger_1 = __importDefault(require("../../core/utilities/Logger"));
const Format_1 = __importDefault(require("../../core/utilities/Format"));
const Module_1 = __importDefault(require("../../core/modules/Module"));
const Command_1 = __importDefault(require("../../core/modules/Command"));
let functions = [];
let commands = [];
commands.push(new Command_1.default({
    names: ["stop", "kill", "shutdown", "end"],
    args: [],
    accessLevel: 5 /* AccessLevel.BOT_OWNER */,
    description: "Stops the bot",
    categories: ["Bot Control", "Bot Admin"],
    func: (args, msg) => __awaiter(void 0, void 0, void 0, function* () {
        if (msg)
            msg.reply("Bot will now shut down");
        global.bobcat.end();
    })
}));
commands.push(new Command_1.default({
    names: ["mksrvt"],
    args: ["[server]"],
    accessLevel: 4 /* AccessLevel.BOT_ADMIN */,
    description: "Creates server database table",
    categories: ["Debug", "Database"],
    func: (args, msg) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c;
        let server = (_a = args[1]) !== null && _a !== void 0 ? _a : (_c = (_b = msg === null || msg === void 0 ? void 0 : msg.channel) === null || _b === void 0 ? void 0 : _b.server) === null || _c === void 0 ? void 0 : _c._id;
        global.bobcat.database.create(server);
        if (msg)
            msg.reply("Table created");
    })
}));
commands.push(new Command_1.default({
    names: ["dsrvt"],
    args: ["[server]"],
    accessLevel: 5 /* AccessLevel.BOT_OWNER */,
    description: "Drops server database table",
    categories: ["Debug", "Database"],
    func: (args, msg) => __awaiter(void 0, void 0, void 0, function* () {
        var _d, _e, _f;
        let server = (_d = args[1]) !== null && _d !== void 0 ? _d : (_f = (_e = msg === null || msg === void 0 ? void 0 : msg.channel) === null || _e === void 0 ? void 0 : _e.server) === null || _f === void 0 ? void 0 : _f._id;
        global.bobcat.database.drop(server);
        if (msg)
            msg.reply("Table dropped");
    })
}));
commands.push(new Command_1.default({
    names: ["rsrvk"],
    args: ["[server]", "<key>"],
    accessLevel: 5 /* AccessLevel.BOT_OWNER */,
    description: "Reads server database key",
    categories: ["Debug", "Database"],
    func: (args, msg) => __awaiter(void 0, void 0, void 0, function* () {
        var _g, _h;
        let server;
        let key;
        if (args.length == 2) {
            server = (_h = (_g = msg === null || msg === void 0 ? void 0 : msg.channel) === null || _g === void 0 ? void 0 : _g.server) === null || _h === void 0 ? void 0 : _h._id;
            key = args[1];
        }
        else {
            server = args[1];
            key = args[2];
        }
        let val = JSON.stringify(global.bobcat.database.get(server, key));
        let out = `[${server}:${key}] == ${val}`;
        if (msg)
            msg.reply(out);
        else
            Logger_1.default.log(out);
    })
}));
commands.push(new Command_1.default({
    names: ["wsrvk"],
    args: ["[server]", "<key>", "[value]"],
    accessLevel: 5 /* AccessLevel.BOT_OWNER */,
    description: "Writes server database key",
    categories: ["Debug", "Database"],
    func: (args, msg) => __awaiter(void 0, void 0, void 0, function* () {
        var _j, _k;
        let server;
        let key;
        let val;
        if (args.length == 3) {
            server = (_k = (_j = msg === null || msg === void 0 ? void 0 : msg.channel) === null || _j === void 0 ? void 0 : _j.server) === null || _k === void 0 ? void 0 : _k._id;
            key = args[1];
            val = args[2];
        }
        else {
            server = args[1];
            key = args[2];
            val = args[3];
        }
        global.bobcat.database.set(server, key, JSON.parse(val));
        let out = `[${server}:${key}] == ${val}`;
        if (msg)
            msg.reply(out);
        else
            Logger_1.default.log(out);
    })
}));
commands.push(new Command_1.default({
    names: ["load", "lmod", "insmod"],
    args: ["<path>"],
    accessLevel: 5 /* AccessLevel.BOT_OWNER */,
    description: "Loads a module",
    categories: ["Bot Control", "Debug", "Modules"],
    func: (args, msg) => __awaiter(void 0, void 0, void 0, function* () {
        let mpath = `${global.bobcat.root}/dist/modules/${args[1]}`;
        if (!fs_1.default.existsSync(mpath))
            return;
        let mod = require(mpath);
        global.bobcat.loadModule(mod);
        if (msg)
            msg.reply(`Module ${mod.name} loaded`);
    })
}));
commands.push(new Command_1.default({
    names: ["unload", "ulmod", "rmmod"],
    args: ["<name>"],
    accessLevel: 5 /* AccessLevel.BOT_OWNER */,
    description: "Unloads a module",
    categories: ["Bot Control", "Debug", "Modules"],
    func: (args, msg) => __awaiter(void 0, void 0, void 0, function* () {
        global.bobcat.unloadModule(args[1]);
        if (msg)
            msg.reply(`Module ${args[1]} unloaded`);
    })
}));
commands.push(new Command_1.default({
    names: ["ekey"],
    args: ["<name>"],
    accessLevel: 5 /* AccessLevel.BOT_OWNER */,
    description: "Gets an eval command key",
    categories: ["Debug"],
    func: (args, msg) => __awaiter(void 0, void 0, void 0, function* () {
        let key = crypto_1.default.randomBytes(32).toString("hex");
        global.bobcat.database.set("bobcat", "bobcat.eval_key", key);
        Logger_1.default.log(key, Logger_1.default.L_INFO);
    })
}));
commands.push(new Command_1.default({
    names: ["eval"],
    args: ["<key>", "<code>"],
    accessLevel: 5 /* AccessLevel.BOT_OWNER */,
    description: "eval()s a command",
    categories: ["Debug"],
    func: (args, msg) => __awaiter(void 0, void 0, void 0, function* () {
        let key = global.bobcat.database.get("bobcat", "bobcat.eval_key");
        if (args[1] != key) {
            if (msg) {
                Logger_1.default.log(`\n${"=".repeat(80)}\n` +
                    "ATTENTION: INVALID EVAL KEY USED!\n" +
                    `User: ${msg.author._id}, Server: ${msg.channel.server._id}` +
                    `\n${"=".repeat(80)}\n`, Logger_1.default.L_ERROR);
            }
            else {
                Logger_1.default.log("Invalid key");
            }
            return;
        }
        global.bobcat.database.set("bobcat", "bobcat.eval_key", null);
        try {
            let res = eval(args.splice(2).join(" "));
            Logger_1.default.log(res);
            if (msg)
                msg.reply(JSON.stringify(res));
        }
        catch (err) {
            Logger_1.default.log(err.stack, Logger_1.default.L_ERROR);
            if (msg)
                msg.reply(err);
        }
    })
}));
commands.push(new Command_1.default({
    names: ["ulid"],
    args: ["ulid"],
    accessLevel: 0 /* AccessLevel.NORMAL */,
    description: "Shows ULID information",
    categories: ["Debug"],
    func: (args, msg) => __awaiter(void 0, void 0, void 0, function* () {
        var _l;
        let ulid = global.bobcat.findULID((_l = args[1]) !== null && _l !== void 0 ? _l : "");
        if (!ulid) {
            if (msg)
                msg.reply("Invalid ULID");
            else
                Logger_1.default.log("Invalid ULID", Logger_1.default.L_WARNING);
            return;
        }
        let datetime = Format_1.default.datetime(new Date((0, ulid_1.decodeTime)(ulid)));
        let out = `**ULID ${ulid}**\nCreated at ${datetime}`;
        if (msg)
            msg.reply(out);
        else
            Logger_1.default.log(out);
    })
}));
let listeners = [];
module.exports = new Module_1.default({
    name: "core.debug",
    author: "@crispycat",
    version: global.version,
    hidden: true,
    commands: commands,
    listeners: listeners,
    functions: functions
});
