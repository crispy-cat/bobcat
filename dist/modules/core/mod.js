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
const Table_1 = __importDefault(require("../../core/utilities/Table"));
const Format_1 = __importDefault(require("../../core/utilities/Format"));
const Module_1 = __importDefault(require("../../core/modules/Module"));
const Command_1 = __importDefault(require("../../core/modules/Command"));
const ModuleFunction_1 = __importDefault(require("../../core/modules/ModuleFunction"));
let functions = [];
functions.push(new ModuleFunction_1.default({
    name: "addModerationRecord",
    func: (server, user, record) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        let records = (_a = global.bobcat.database.get(server, "bobcat.moderation.record." + user)) !== null && _a !== void 0 ? _a : [];
        records.push(record);
        global.bobcat.database.set(server, "bobcat.moderation.record." + user, records);
    })
}));
let commands = [];
commands.push(new Command_1.default({
    names: ["record", "infractions"],
    args: ["[target]"],
    accessLevel: 1 /* AccessLevel.MOD */,
    description: "View the target user's moderation record",
    categories: ["Moderation"],
    func: (args, msg) => __awaiter(void 0, void 0, void 0, function* () {
        var _b, _c, _d, _e;
        if (!(msg === null || msg === void 0 ? void 0 : msg.channel.server)) {
            if (msg)
                msg.reply("This command must be executed in a server");
            else
                Logger_1.default.log("This command must be executed in a server", Logger_1.default.L_WARNING);
            return;
        }
        let tid = (_b = global.bobcat.findULID(args[1])) !== null && _b !== void 0 ? _b : msg.author._id;
        let member = msg.member;
        let target;
        try {
            target = yield msg.channel.server.fetchMember(tid);
            if (member.inferiorTo(target)) {
                msg.reply(":x: You do not have permission to view that user's record");
                return;
            }
        }
        catch (err) {
            Logger_1.default.log(err.stack, Logger_1.default.L_WARNING);
        }
        let records = (_c = global.bobcat.database.get(msg.channel.server._id, "bobcat.moderation.record." + tid)) !== null && _c !== void 0 ? _c : [];
        if (!records.length) {
            msg.reply("That user has no moderation record.");
            return;
        }
        let table = new Table_1.default([["#", "Moderator", "Action", "Date/Time", "Comment"]]);
        for (let ind in records) {
            let entry = records[ind];
            table.setRow(table.numRows(), [
                +ind + 1,
                (yield global.bobcat.client.users.fetch(entry.moderator)).username,
                entry.action,
                Format_1.default.datetime(new Date(entry.timestamp * 1000)),
                entry.comment
            ]);
        }
        msg.reply(`**${(_e = "@" + ((_d = target === null || target === void 0 ? void 0 : target.user) === null || _d === void 0 ? void 0 : _d.username)) !== null && _e !== void 0 ? _e : `<@${tid}>`}'s Moderation Record**\n` +
            table.toString());
    })
}));
commands.push(new Command_1.default({
    names: ["warn"],
    args: ["<target>", "<comment>"],
    accessLevel: 1 /* AccessLevel.MOD */,
    description: "Warn the target user",
    categories: ["Moderation"],
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
        let member = msg.member;
        let target;
        try {
            target = yield msg.channel.server.fetchMember(global.bobcat.findULID(args[1]));
        }
        catch (err) {
            Logger_1.default.log(err.stack, Logger_1.default.L_WARNING);
            msg.reply(":x: Invalid target");
            return;
        }
        if (!target.inferiorTo(member)) {
            msg.reply(":x: You do not have permission to warn that user");
            return;
        }
        let comment = args.splice(2).join(" ");
        global.bobcat.modfunc("core.mod", "addModerationRecord", msg.channel.server._id, target._id.user, {
            moderator: member._id.user,
            action: "Warning",
            timestamp: Date.now() / 1000,
            comment: comment
        });
        yield (yield target.user.openDM()).sendMessage(`You have been warned in **${msg.channel.server.name}**:\n${comment}`);
        yield global.bobcat.modfunc("core.logging", "log", msg.channel.server, "moderation", `@${member.user.username} warned @${target.user.username}\nComment: ${comment}`, global.bobcat.config.get("bobcat.colors.warning"));
        msg.reply(":white_check_mark: User has been warned.");
    })
}));
commands.push(new Command_1.default({
    names: ["kick"],
    args: ["<target>", "[comment]"],
    accessLevel: 1 /* AccessLevel.MOD */,
    description: "Kick the target user",
    categories: ["Moderation"],
    func: (args, msg) => __awaiter(void 0, void 0, void 0, function* () {
        if (!(msg === null || msg === void 0 ? void 0 : msg.channel.server)) {
            if (msg)
                msg.reply("This command must be executed in a server");
            else
                Logger_1.default.log("This command must be executed in a server", Logger_1.default.L_WARNING);
            return;
        }
        if (args.length < 2) {
            msg.reply(":x: Not enough arguments");
            return;
        }
        let member = msg.member;
        let target;
        try {
            target = yield msg.channel.server.fetchMember(global.bobcat.findULID(args[1]));
        }
        catch (err) {
            Logger_1.default.log(err.stack, Logger_1.default.L_WARNING);
            msg.reply(":x: Invalid target");
            return;
        }
        if (!member.hasPermission(msg.channel.server, "KickMembers") ||
            !target.inferiorTo(member)) {
            msg.reply(":x: You do not have permission to kick that user");
            return;
        }
        if (!target.kickable) {
            msg.reply(":x: Bobcat cannot kick that user");
            return;
        }
        let comment = (args.length > 2) ? args.splice(2).join(" ") : "No comment";
        global.bobcat.modfunc("core.mod", "addModerationRecord", msg.channel.server._id, target._id.user, {
            moderator: member._id.user,
            action: "Kick",
            timestamp: Date.now() / 1000,
            comment: comment
        });
        yield (yield target.user.openDM()).sendMessage(`You have been kicked from **${msg.channel.server.name}**:\n${comment}`);
        yield target.kick();
        yield global.bobcat.modfunc("core.logging", "log", msg.channel.server, "moderation", `@${member.user.username} kicked @${target.user.username}\nComment: ${comment}`, global.bobcat.config.get("bobcat.colors.danger"));
        msg.reply(":white_check_mark: User has been kicked.");
    })
}));
commands.push(new Command_1.default({
    names: ["ban", "eject", "yeet"],
    args: ["<target>", "[comment]"],
    accessLevel: 1 /* AccessLevel.MOD */,
    description: "Ban the target user",
    categories: ["Moderation"],
    func: (args, msg) => __awaiter(void 0, void 0, void 0, function* () {
        if (!(msg === null || msg === void 0 ? void 0 : msg.channel.server)) {
            if (msg)
                msg.reply("This command must be executed in a server");
            else
                Logger_1.default.log("This command must be executed in a server", Logger_1.default.L_WARNING);
            return;
        }
        if (args.length < 2) {
            msg.reply(":x: Not enough arguments");
            return;
        }
        let member = msg.member;
        let target;
        try {
            target = yield msg.channel.server.fetchMember(global.bobcat.findULID(args[1]));
        }
        catch (err) {
            Logger_1.default.log(err.stack, Logger_1.default.L_WARNING);
            msg.reply(":x: Invalid target");
            return;
        }
        if (!member.hasPermission(msg.channel.server, "BanMembers") ||
            !target.inferiorTo(member)) {
            msg.reply(":x: You do not have permission to ban that user");
            return;
        }
        if (!target.bannable) {
            msg.reply(":x: Bobcat cannot ban that user");
            return;
        }
        let comment = (args.length > 2) ? args.splice(2).join(" ") : "No comment";
        global.bobcat.modfunc("core.mod", "addModerationRecord", msg.channel.server._id, target._id.user, {
            moderator: member._id.user,
            action: "Ban",
            timestamp: Date.now() / 1000,
            comment: comment
        });
        yield (yield target.user.openDM()).sendMessage(`You have been banned from **${msg.channel.server.name}**:\n${comment}`);
        yield msg.channel.server.banUser(target._id.user, {
            reason: comment
        });
        yield global.bobcat.modfunc("core.logging", "log", msg.channel.server, "moderation", `@${member.user.username} banned @${target.user.username}\nComment: ${comment}`, global.bobcat.config.get("bobcat.colors.danger"));
        msg.reply(":white_check_mark: User has been banned.");
    })
}));
commands.push(new Command_1.default({
    names: ["unban", "pardon"],
    args: ["<target>", "[comment]"],
    accessLevel: 1 /* AccessLevel.MOD */,
    description: "Unban the target user",
    categories: ["Moderation"],
    func: (args, msg) => __awaiter(void 0, void 0, void 0, function* () {
        if (!(msg === null || msg === void 0 ? void 0 : msg.channel.server)) {
            if (msg)
                msg.reply("This command must be executed in a server");
            else
                Logger_1.default.log("This command must be executed in a server", Logger_1.default.L_WARNING);
            return;
        }
        if (args.length < 2) {
            msg.reply(":x: Not enough arguments");
            return;
        }
        let tid = global.bobcat.findULID(args[1]);
        let member = msg.member;
        if (!member.hasPermission(msg.channel.server, "BanMembers")) {
            msg.reply(":x: You do not have permission to unban users");
            return;
        }
        let comment = (args.length > 2) ? args.splice(2).join(" ") : "No comment";
        global.bobcat.modfunc("core.mod", "addModerationRecord", msg.channel.server._id, tid, {
            moderator: member._id.user,
            action: "Unban",
            timestamp: Date.now() / 1000,
            comment: comment
        });
        try {
            yield msg.channel.server.unbanUser(tid);
            yield global.bobcat.modfunc("core.logging", "log", msg.channel.server, "moderation", `@${member.user.username} unbanned <@${tid}>\nComment: ${comment}`, global.bobcat.config.get("bobcat.colors.info"));
            msg.reply(":white_check_mark: User has been unbanned.");
        }
        catch (err) {
            Logger_1.default.log(err.stack, Logger_1.default.L_WARNING);
            msg.reply(":x: Target could not be unbanned");
        }
    })
}));
commands.push(new Command_1.default({
    names: ["purge", "clean"],
    args: ["[user]", "[number]"],
    accessLevel: 1 /* AccessLevel.MOD */,
    description: "Remove messages",
    categories: ["Moderation"],
    func: (args, msg) => __awaiter(void 0, void 0, void 0, function* () {
        var _f;
        if (!(msg === null || msg === void 0 ? void 0 : msg.channel.server)) {
            if (msg)
                msg.reply("This command must be executed in a server");
            else
                Logger_1.default.log("This command must be executed in a server", Logger_1.default.L_WARNING);
            return;
        }
        if (args.length < 2) {
            msg.reply(":x: Not enough arguments");
            return;
        }
        let member = msg.member;
        if (!member.hasPermission(msg.channel.server, "ManageMessages")) {
            msg.reply(":x: You do not have permission to purge messages");
            return;
        }
        let user = null;
        let num = Infinity;
        if (args.length > 2) {
            user = global.bobcat.findULID(args[1]);
            num = +args[2];
        }
        else if (isNaN(+args[1])) {
            user = global.bobcat.findULID(args[1]);
        }
        else {
            num = +args[1];
        }
        let messages = yield msg.channel.fetchMessages({
            limit: num
        });
        let deleted = 0;
        for (let message of messages) {
            if (user && ((_f = message.author) === null || _f === void 0 ? void 0 : _f._id) != user)
                continue;
            yield message.delete();
            deleted++;
        }
        yield global.bobcat.modfunc("core.logging", "log", msg.channel.server, "moderation", `@${member.user.username} deleted ${deleted} messages`, global.bobcat.config.get("bobcat.colors.info"));
        msg.reply(`:white_check_mark: Deleted ${deleted} messages`);
    })
}));
let listeners = [];
module.exports = new Module_1.default({
    name: "core.mod",
    author: "@crispycat",
    version: global.version,
    hidden: false,
    commands: commands,
    listeners: listeners,
    functions: functions
});
