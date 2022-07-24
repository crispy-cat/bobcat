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
const ParseUtils_1 = __importDefault(require("../../core/utilities/ParseUtils"));
const RevoltUtils_1 = __importDefault(require("../../core/utilities/RevoltUtils"));
const Module_1 = __importDefault(require("../../core/modules/Module"));
const Command_1 = __importDefault(require("../../core/modules/Command"));
const Listener_1 = __importDefault(require("../../core/modules/Listener"));
const ModuleFunction_1 = __importDefault(require("../../core/modules/ModuleFunction"));
const AccessControl_1 = __importDefault(require("../../core/permissions/AccessControl"));
const AS_REGEX_MENTION = /<@[0-9A-HJKMNP-TV-Z]+>/gi;
const AS_REGEX_LINK = /(?:https?|ftps?|mailto):\/*\S+/gi;
const AS_CONFIG_DEFAULTS = {
    enabled: false,
    whitelist: [],
    wl_level: 1 /* AccessLevel.MOD */,
    max_mentions: 5,
    max_links: 3,
    max_freq: 2,
    del_msgs: true,
    max_noaction: 3,
    max_warns: 3,
    max_kicks: 1,
    max_tempbans: 2,
    tempban_len: 30 * 60 * 1000
};
let lastSent = {};
let functions = [];
functions.push(new ModuleFunction_1.default({
    name: "checkspam",
    func: (msg, now, last, config) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        let spam = false;
        if (now - last < 1000 / config.max_freq)
            spam = true;
        let mentions = (_a = msg.content) === null || _a === void 0 ? void 0 : _a.match(AS_REGEX_MENTION);
        if (mentions && mentions.length > config.max_mentions)
            spam = true;
        let links = (_b = msg.content) === null || _b === void 0 ? void 0 : _b.match(AS_REGEX_LINK);
        if (links && links.length > config.max_links)
            spam = true;
        if (!spam)
            return;
        if (config.del_msgs)
            msg.delete();
        let action = "none";
        let record = (_c = global.bobcat.database.get(msg.channel.server._id, `bobcat.antispam.record.${msg.author._id}`)) !== null && _c !== void 0 ? _c : { none: 0, warn: 0, kick: 0, tempban: 0 };
        if (record.tempban >= config.max_tempbans)
            action = "ban";
        else if (record.kick >= config.max_kicks)
            action = "tempban";
        else if (record.warn >= config.max_warns)
            action = "kick";
        else if (record.none >= config.max_noaction)
            action = "warn";
        switch (action) {
            case "warn": {
                record.warn++;
                break;
            }
            case "kick": {
                yield msg.member.kick();
                record.kick++;
                break;
            }
            case "tempban": {
                let bans = (_d = global.bobcat.database.get(msg.channel.server._id, "bobcat.tempbans")) !== null && _d !== void 0 ? _d : [];
                bans = bans.filter((b) => b.user != msg.author._id);
                bans.push({ user: msg.author._id, expires: now + config.tempban_len });
                global.bobcat.database.set(msg.channel.server._id, "bobcat.tempbans", bans);
                yield msg.channel.server.banUser(msg.author._id, {
                    reason: `Antispam Tempban ID: ${msg.channel._id}/${msg._id}`
                });
                record.tempban++;
                break;
            }
            case "ban": {
                yield msg.channel.server.banUser(msg.author._id, {
                    reason: `Antispam ID: ${msg.channel._id}/${msg._id}`
                });
                break;
            }
            case "none":
            default: {
                record.none++;
            }
        }
        global.bobcat.database.set(msg.channel.server._id, `bobcat.antispam.record.${msg.author._id}`, record);
        if (action == "none")
            return;
        yield global.bobcat.modfunc("core.mod", "addModerationRecord", msg.channel.server._id, msg.author._id, {
            moderator: global.bobcat.client.user._id,
            action: action,
            timestamp: Date.now(),
            comment: `AntiSpam ID: ${msg.channel._id}/${msg._id}`
        });
        yield global.bobcat.modfunc("core.logging", "log", msg.channel.server, "antispam", `@${msg.author.username} triggered the spam filter\n` +
            `Action taken: ${action}\nID:\`${msg.channel._id}/${msg._id}\``, global.bobcat.config.get("bobcat.colors.warning"));
        yield (yield msg.author.openDM()).sendMessage("You have triggered the spam filter\n" +
            `Action taken: ${action}\nID:\`${msg.channel._id}/${msg._id}\`\n` +
            "Please contact a server administrator for assistance.");
    })
}));
let commands = [];
commands.push(new Command_1.default({
    names: ["as:toggle", "as:enable", "as:disable"],
    args: [],
    accessLevel: 3 /* AccessLevel.OWNER */,
    description: "Toggle antispam",
    categories: ["Antispam"],
    func: (args, msg) => __awaiter(void 0, void 0, void 0, function* () {
        if (!(msg === null || msg === void 0 ? void 0 : msg.channel.server)) {
            if (msg)
                msg.reply("This command must be executed in a server");
            else
                Logger_1.default.log("This command must be executed in a server", Logger_1.default.L_WARNING);
            return;
        }
        let val;
        switch (args[0]) {
            case "as:toggle": {
                let enabled = global.bobcat.database.get(msg.channel.server._id, "bobcat.antispam.config.enabled");
                val = !enabled;
                break;
            }
            case "as:enable": {
                val = true;
                break;
            }
            case "as:disable": {
                val = false;
                break;
            }
        }
        global.bobcat.database.set(msg.channel.server._id, "bobcat.antispam.config.enabled", val);
        msg.reply(":white_check_mark: Configuration updated");
    })
}));
commands.push(new Command_1.default({
    names: ["as:config"],
    args: ["<setting>", "<value>"],
    accessLevel: 3 /* AccessLevel.OWNER */,
    description: "Modify antispam settings",
    categories: ["Antispam"],
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
        let val;
        switch (args[1]) {
            case "wl_level": {
                val = AccessControl_1.default.alFromText(args[2], 0 /* AccessLevel.NORMAL */, 3 /* AccessLevel.OWNER */);
                break;
            }
            case "max_links":
            case "max_mentions":
            case "max_noaction":
            case "max_warns":
            case "max_kicks":
            case "max_tempbans": {
                val = parseInt(args[2]);
                if (isNaN(val) || val < 1) {
                    msg.reply(":x: Invalid value");
                    return;
                }
                break;
            }
            case "max_freq": {
                val = parseFloat(args[2]);
                if (isNaN(val) || val <= 0) {
                    msg.reply(":x: Invalid value");
                    return;
                }
                break;
            }
            case "del_msgs": {
                val = ParseUtils_1.default.boolean(args[2]);
                break;
            }
            case "tempban_len": {
                val = ParseUtils_1.default.time(args[2]);
                break;
            }
            default:
                msg.reply("Valid settings: wl_level, max_links, max_mentions, " +
                    "max_noaction, max_warns, max_kicks, max_tempbans, " +
                    "max_freq, del_msgs, tempban_len");
                return;
        }
        global.bobcat.database.set(msg.channel.server._id, `bobcat.antispam.config.${args[1]}`, val);
        msg.reply(":white_check_mark: Configuration updated");
    })
}));
commands.push(new Command_1.default({
    names: ["as:whitelist"],
    args: ["<add|remove>", "<user|role|channel>"],
    accessLevel: 3 /* AccessLevel.OWNER */,
    description: "Add or remove a whitelisted role, channel or user",
    categories: ["Antispam"],
    func: (args, msg) => __awaiter(void 0, void 0, void 0, function* () {
        var _e;
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
        if (args[1] != "add" && args[1] != "remove") {
            msg.reply(":x: Invalid action");
            return;
        }
        let id = ParseUtils_1.default.parseULID(args[2]);
        if (!id) {
            let channel = RevoltUtils_1.default.findChannel(msg.channel.server, args[2]);
            if (channel) {
                id = channel._id;
            }
            else {
                let role = RevoltUtils_1.default.findRole(msg.channel.server, args[2]);
                if (role) {
                    id = role.id;
                }
                else {
                    let member = yield RevoltUtils_1.default.findMember(msg.channel.server, args[2]);
                    if (member)
                        id = member._id.user;
                }
            }
        }
        if (!id) {
            msg.reply(":x: Invalid user or role");
            return;
        }
        let config = (_e = global.bobcat.database.get(msg.channel.server._id, "bobcat.antispam.config")) !== null && _e !== void 0 ? _e : AS_CONFIG_DEFAULTS;
        switch (args[1]) {
            case "add":
                if (!config.whitelist.includes(id))
                    config.whitelist.push(id);
                break;
            case "remove":
                if (config.whitelist.includes(id))
                    config.whitelist = config.whitelist.filter((x) => x != id);
                break;
        }
        msg.reply(":white_check_mark: Configuration updated");
    })
}));
commands.push(new Command_1.default({
    names: ["as:clear"],
    args: ["<target>"],
    accessLevel: 1 /* AccessLevel.MOD */,
    description: "Clear the target user's antispam record",
    categories: ["Moderation"],
    func: (args, msg) => __awaiter(void 0, void 0, void 0, function* () {
        if (!(msg === null || msg === void 0 ? void 0 : msg.channel.server)) {
            if (msg)
                msg.reply("This command must be executed in a server");
            else
                Logger_1.default.log("This command must be executed in a server", Logger_1.default.L_WARNING);
            return;
        }
        let member = msg.member;
        let target = yield RevoltUtils_1.default.findUser(args[1]);
        let mtarget = yield RevoltUtils_1.default.findMember(msg.channel.server, args[1]);
        if (mtarget) {
            if (member.inferiorTo(mtarget) && msg.author._id != msg.channel.server.owner) {
                msg.reply(":x: You do not have permission to clear that user's record");
                return;
            }
        }
        global.bobcat.database.set(msg.channel.server._id, `bobcat.antispam.record.${target._id}`, { none: 0, warn: 0, kick: 0, tempban: 0 });
        msg.reply(":white_check_mark: Record cleared");
    })
}));
let listeners = [];
listeners.push(new Listener_1.default({
    name: "spamlistener",
    obj: global.bobcat.client,
    event: "message",
    func: (msg) => __awaiter(void 0, void 0, void 0, function* () {
        var _f, _g, _h;
        if (!msg.channel.server)
            return;
        let enabled = global.bobcat.database.get(msg.channel.server._id, "bobcat.antispam.config.enabled");
        if (!enabled)
            return;
        let now = Date.now();
        let last = (_f = lastSent[msg.author._id]) !== null && _f !== void 0 ? _f : 0;
        lastSent[msg.author._id] = now;
        let config = AS_CONFIG_DEFAULTS;
        for (let key of Object.keys(AS_CONFIG_DEFAULTS)) {
            let val = global.bobcat.database.get(msg.channel.server._id, `bobcat.antispam.config.${key}`);
            if (val !== undefined && val !== null)
                config[key] = val;
        }
        if (config.whitelist.includes(msg.channel._id))
            return;
        if (config.whitelist.includes(msg.author._id))
            return;
        for (let id of ((_h = (_g = msg.member) === null || _g === void 0 ? void 0 : _g.roles) !== null && _h !== void 0 ? _h : []))
            if (config.whitelist.includes(id))
                return;
        let al = yield AccessControl_1.default.getAccessLevel(msg.channel.server, msg.author);
        if (al >= config.wl_level)
            return;
        yield global.bobcat.modfunc("antispam.antispam", "checkspam", msg, now, last, config);
    })
}));
module.exports = new Module_1.default({
    name: "antispam.antispam",
    author: "@crispycat",
    version: global.version,
    hidden: false,
    commands: commands,
    listeners: listeners,
    functions: functions
});
