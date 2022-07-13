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
const Logger_1 = __importDefault(require("../../core/utilities/Logger"));
const Module_1 = __importDefault(require("../../core/modules/Module"));
const Command_1 = __importDefault(require("../../core/modules/Command"));
const Listener_1 = __importDefault(require("../../core/modules/Listener"));
const AccessControl_1 = __importDefault(require("../../core/permissions/AccessControl"));
const Table_1 = __importDefault(require("../../core/utilities/Table"));
let functions = [];
let commands = [];
commands.push(new Command_1.default({
    names: ["info", "botinfo"],
    args: [],
    accessLevel: 0 /* AccessLevel.NORMAL */,
    description: "Shows bot information",
    categories: ["Bot Info"],
    func: (args, msg) => __awaiter(void 0, void 0, void 0, function* () {
        let prefix = global.bobcat.config.get("bobcat.prefix");
        if (msg === null || msg === void 0 ? void 0 : msg.channel.server)
            prefix = global.bobcat.database.get(msg.channel.server._id, "bobcat.prefix");
        let table = new Table_1.default();
        table.setCol(0, [
            "Ping",
            global.bobcat.client.websocket.ping + " ms"
        ]);
        table.setCol(1, [
            "Version",
            global.version
        ]);
        table.setCol(2, [
            "Prefix",
            prefix
        ]);
        table.setCol(3, [
            "Owner",
            `<@${global.bobcat.config.get("bobcat.accesslevels.bot_owner")[0]}>`
        ]);
        if (msg) {
            msg.reply({
                embeds: [{
                        title: `${global.bobcat.config.get("bobcat.name")} Information\n`,
                        description: table.toString(),
                        colour: global.bobcat.config.get("bobcat.colors.primary")
                    }]
            });
        }
        else {
            Logger_1.default.log(table.toString());
        }
    })
}));
commands.push(new Command_1.default({
    names: ["help", "commands", "modules"],
    args: ["[module]"],
    accessLevel: 0 /* AccessLevel.NORMAL */,
    description: "Shows a list of commands",
    categories: ["Bot Info"],
    func: (args, msg) => __awaiter(void 0, void 0, void 0, function* () {
        let prefix = global.bobcat.config.get("bobcat.prefix");
        if (msg === null || msg === void 0 ? void 0 : msg.channel.server)
            prefix = global.bobcat.database.get(msg.channel.server._id, "bobcat.prefix");
        if (args[1]) {
            let mod = global.bobcat.getModule(args[1]);
            if (!mod) {
                if (msg)
                    msg.reply(":x: Invalid module name");
                else
                    Logger_1.default.log("Invalid module name", Logger_1.default.L_WARNING);
                return;
            }
            let table = new Table_1.default([["Command", "Syntax", "AL", "Description", "Categories"]]);
            for (let cmd of mod.commands) {
                if (cmd.accessLevel > (yield AccessControl_1.default.getAccessLevel(msg.channel.server, msg.author)))
                    continue;
                table.setRow(table.numRows(), [
                    cmd.names[0],
                    prefix + cmd.names[0] + " " + cmd.args.join(" ").replace(/\</g, "&lt;").replace(/\>/g, "&gt;"),
                    AccessControl_1.default.nameAccessLevel(cmd.accessLevel),
                    cmd.description,
                    cmd.categories.join(", ")
                ]);
            }
            let output = `**Commands in module ${mod.name}**\n${table.toString()}`;
            if (msg)
                msg.reply({
                    embeds: [{
                            title: `${global.bobcat.config.get("bobcat.name")} Commands\n`,
                            description: output,
                            colour: global.bobcat.config.get("bobcat.colors.primary")
                        }]
                });
            else
                Logger_1.default.log(output);
        }
        else {
            let table = new Table_1.default([["Module", "Author", "Commands"]]);
            for (let mod of global.bobcat.modules) {
                if (mod.hidden)
                    continue;
                table.setRow(table.numRows(), [
                    mod.name,
                    mod.author,
                    mod.commands.map((cmd) => cmd.names[0]).join(", ")
                ]);
            }
            let output = `**Loaded Modules**\n${table.toString()}\n` +
                `Use *${prefix}help [module]*`;
            if (msg)
                msg.reply({
                    embeds: [{
                            title: `${global.bobcat.config.get("bobcat.name")} Commands\n`,
                            description: output,
                            colour: global.bobcat.config.get("bobcat.colors.primary")
                        }]
                });
            else
                Logger_1.default.log(output);
        }
    })
}));
let listeners = [];
listeners.push(new Listener_1.default({
    name: "prefixlistener",
    obj: global.bobcat.client,
    event: "message",
    func: (msg) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        if ((_a = msg.content) === null || _a === void 0 ? void 0 : _a.match(new RegExp(`(?:\<@)?${global.bobcat.client.user._id}\>? *prefix`))) {
            let prefix = (_d = (_c = global.bobcat.database.get((_b = msg.channel.server) === null || _b === void 0 ? void 0 : _b._id, "bobcat.prefix")) !== null && _c !== void 0 ? _c : global.bobcat.config.get("bobcat.prefix")) !== null && _d !== void 0 ? _d : "$";
            msg.reply("**My prefix is** `" + prefix + "`");
        }
    })
}));
module.exports = new Module_1.default({
    name: "core.info",
    author: "@crispycat",
    version: global.version,
    hidden: false,
    commands: commands,
    listeners: listeners,
    functions: functions
});
