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
let functions = [];
let commands = [];
commands.push(new Command_1.default({
    names: ["role"],
    args: ["<assign|remove>", "<role>", "<target>"],
    accessLevel: 2 /* AccessLevel.ADMIN */,
    description: "Assign a role to the target user",
    categories: ["Roles", "Administration"],
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
        if (args[1] != "assign" && args[1] != "remove") {
            msg.reply(":x: Invalid action");
            return;
        }
        let member = msg.member;
        let target;
        try {
            target = yield msg.channel.server.fetchMember(global.bobcat.findULID(args[3]));
        }
        catch (err) {
            Logger_1.default.log(err.stack, Logger_1.default.L_WARNING);
            msg.reply(":x: Invalid target");
            return;
        }
        if (!member.hasPermission(msg.channel.server, "AssignRoles")) {
            msg.reply(":x: You do not have permission to assign roles");
            return;
        }
        if (!target.inferiorTo(member)) {
            msg.reply(":x: You do not have permission to modify that users's roles");
            return;
        }
        let rid = global.bobcat.findULID(args[2]);
        let role;
        if (rid) {
            role = msg.channel.server.roles[rid];
        }
        else {
            for (let i in msg.channel.server.roles) {
                let r = msg.channel.server.roles[i];
                if (r.name == args[2]) {
                    rid = i;
                    role = r;
                }
            }
        }
        if (!role) {
            msg.reply(":x: Invalid role");
            return;
        }
        if (member.ranking >= role.rank) {
            msg.reply(":x: You do not have permission to assign that role");
            return;
        }
        let roles = target.roles;
        switch (args[1]) {
            case "assign":
                if (!roles.includes(rid))
                    roles.push(rid);
                break;
            case "remove":
                if (roles.includes(rid))
                    roles = roles.filter((r) => r != rid);
                break;
        }
        yield target.edit({
            roles: roles
        });
        yield global.bobcat.modfunc("core.logging", "log", msg.channel.server, "moderation", `@${member.user.username} changed @${target.user.username}'s roles\n` +
            `${args[1]} role '${role.name}'`, global.bobcat.config.get("bobcat.colors.info"));
        msg.reply(":white_check_mark: Roles updated");
    })
}));
commands.push(new Command_1.default({
    names: ["accesslevel", "al"],
    args: ["<user|role>", "<level>"],
    accessLevel: 3 /* AccessLevel.OWNER */,
    description: "Assign a role to the target user",
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
        let id = global.bobcat.findULID(args[1]);
        if (!id) {
            for (let i in msg.channel.server.roles) {
                let r = msg.channel.server.roles[i];
                if (r.name == args[1])
                    id = i;
            }
        }
        if (!id) {
            msg.reply(":x: Invalid user or role");
            return;
        }
        let level;
        switch (args[2].toLowerCase()) {
            case "normal":
            case "member":
            case "0":
                level = 0 /* AccessLevel.NORMAL */;
                break;
            case "mod":
            case "1":
                level = 1 /* AccessLevel.MOD */;
                break;
            case "admin":
            case "2":
                level = 2 /* AccessLevel.ADMIN */;
                break;
            case "owner":
            case "3":
                level = 3 /* AccessLevel.OWNER */;
                break;
            default:
                msg.reply(":x: Invalid access level");
                return;
        }
        global.bobcat.database.set(msg.channel.server._id, `bobcat.config.access.${id}`, level);
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
