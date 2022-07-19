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
const Format_1 = __importDefault(require("../../core/utilities/Format"));
const RevoltUtils_1 = __importDefault(require("../../core/utilities/RevoltUtils"));
const Module_1 = __importDefault(require("../../core/modules/Module"));
const Command_1 = __importDefault(require("../../core/modules/Command"));
const ModuleFunction_1 = __importDefault(require("../../core/modules/ModuleFunction"));
let functions = [];
functions.push(new ModuleFunction_1.default({
    name: "log",
    func: (server, feed, content, color) => __awaiter(void 0, void 0, void 0, function* () {
        let chid = global.bobcat.database.get(server._id, `bobcat.config.log.${feed}`);
        if (!chid)
            return;
        let channel = server.channels.find((c) => c._id == chid);
        if (!channel)
            return;
        yield channel.sendMessage({
            embeds: [{
                    title: `Log - ${feed} - ${Format_1.default.datetime()}`,
                    description: content,
                    colour: color !== null && color !== void 0 ? color : global.bobcat.config.get("bobcat.colors.primary")
                }]
        });
    })
}));
let commands = [];
commands.push(new Command_1.default({
    names: ["logs"],
    args: ["<enable|disable>", "<feed>", "[channel]"],
    accessLevel: 3 /* AccessLevel.OWNER */,
    description: "Enable/disable a log feed",
    categories: ["Configuration"],
    func: (args, msg) => __awaiter(void 0, void 0, void 0, function* () {
        if (!(msg === null || msg === void 0 ? void 0 : msg.channel.server)) {
            if (msg)
                msg.reply("This command must be executed in a server");
            else
                Logger_1.default.log("This command must be executed in a server", Logger_1.default.L_WARNING);
            return;
        }
        if (args.length < 3) {
            msg.reply(":x: Not enough arguments");
            return;
        }
        let feed = args[2].replace(/[^a-z0-9\-_]+/g, "");
        switch (args[1]) {
            case "enable":
                global.bobcat.database.set(msg.channel.server._id, `bobcat.config.log.${feed}`, RevoltUtils_1.default.findChannel(msg.channel.server, args[3]));
                break;
            case "disable":
                global.bobcat.database.set(msg.channel.server._id, `bobcat.config.log.${feed}`, null);
                break;
            default:
                msg.reply(":x: Invalid action");
                return;
        }
        msg.reply(":white_check_mark: Configuration updated");
    })
}));
let listeners = [];
module.exports = new Module_1.default({
    name: "core.logging",
    author: "@crispycat",
    version: global.version,
    hidden: false,
    commands: commands,
    listeners: listeners,
    functions: functions
});
