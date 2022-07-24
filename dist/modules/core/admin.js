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
const RevoltUtils_1 = __importDefault(require("../../core/utilities/RevoltUtils"));
const Module_1 = __importDefault(require("../../core/modules/Module"));
const Command_1 = __importDefault(require("../../core/modules/Command"));
const AccessControl_1 = __importDefault(require("../../core/permissions/AccessControl"));
let functions = [];
let commands = [];
commands.push(new Command_1.default({
    names: ["role"],
    args: ["<assign|remove>", "<role>", "<target>"],
    accessLevel: 2 /* AccessLevel.ADMIN */,
    description: "Assign a role to the target user",
    categories: ["Roles", "Administration"],
    func: (args, msg) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        if (!(msg === null || msg === void 0 ? void 0 : msg.channel.server)) {
            if (msg)
                msg.reply("This command must be executed in a server");
            else
                Logger_1.default.log("This command must be executed in a server", Logger_1.default.L_WARNING);
            return;
        }
        if (args.length < 4) {
            msg.reply(":x: Not enough arguments");
            return;
        }
        if (args[1] != "assign" && args[1] != "remove") {
            msg.reply(":x: Invalid action");
            return;
        }
        let member = msg.member;
        let target = yield RevoltUtils_1.default.findMember(msg.channel.server, args[3]);
        if (!target) {
            msg.reply(":x: Invalid target");
            return;
        }
        if (msg.author._id != msg.channel.server.owner) {
            if (!member.hasPermission(msg.channel.server, "AssignRoles")) {
                msg.reply(":x: You do not have permission to assign roles");
                return;
            }
            if (!target.inferiorTo(member)) {
                msg.reply(":x: You do not have permission to modify that users's roles");
                return;
            }
        }
        let role = RevoltUtils_1.default.findRole(msg.channel.server, args[2]);
        if (!role) {
            msg.reply(":x: Invalid role");
            return;
        }
        if (member.ranking >= role.role.rank) {
            msg.reply(":x: You do not have permission to assign that role");
            return;
        }
        let roles = target.roles || [];
        switch (args[1]) {
            case "assign":
                if (!roles.includes(role.id))
                    roles.push(role.id);
                break;
            case "remove":
                if (roles.includes(role.id))
                    roles = roles.filter((r) => r != role.id);
                break;
        }
        yield target.edit({
            roles: roles
        });
        yield global.bobcat.modfunc("core.logging", "log", msg.channel.server, "moderation", `@${member.user.username} changed @${(_a = target.user) === null || _a === void 0 ? void 0 : _a.username}'s roles\n` +
            `${args[1]} role '${role.role.name}'`, global.bobcat.config.get("bobcat.colors.info"));
        msg.reply(":white_check_mark: Roles updated");
    })
}));
commands.push(new Command_1.default({
    names: ["accesslevel", "al"],
    args: ["<user|role>", "<level>"],
    accessLevel: 3 /* AccessLevel.OWNER */,
    description: "Set the bot access level of a role",
    categories: ["Configuration"],
    func: (args, msg) => __awaiter(void 0, void 0, void 0, function* () {
        var _b;
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
        let id = RevoltUtils_1.default.findRole(msg.channel.server, args[1]).id;
        if (!id)
            id = (_b = (yield RevoltUtils_1.default.findMember(msg.channel.server, args[1]))) === null || _b === void 0 ? void 0 : _b._id.user;
        if (!id) {
            msg.reply(":x: Invalid user or role");
            return;
        }
        let level = AccessControl_1.default.alFromText(args[2], 0 /* AccessLevel.NORMAL */, 3 /* AccessLevel.OWNER */);
        global.bobcat.database.set(msg.channel.server._id, `bobcat.config.access.${id}`, level);
        msg.reply(":white_check_mark: Configuration updated");
    })
}));
commands.push(new Command_1.default({
    names: ["prefix"],
    args: ["<prefix>"],
    accessLevel: 3 /* AccessLevel.OWNER */,
    description: "Set the bot's prefix in this server",
    categories: ["Configuration"],
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
        let prefix = args.splice(1).join(" ");
        global.bobcat.database.set(msg.channel.server._id, `bobcat.prefix`, prefix);
        msg.reply(":white_check_mark: Configuration updated");
    })
}));
let listeners = [];
module.exports = new Module_1.default({
    name: "core.admin",
    author: "@crispycat",
    version: global.version,
    hidden: false,
    commands: commands,
    listeners: listeners,
    functions: functions
});
