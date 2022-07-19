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
let functions = [];
let commands = [];
commands.push(new Command_1.default({
    names: ["nick", "nickname"],
    args: ["[target]", "<nickname>"],
    accessLevel: 0 /* AccessLevel.NORMAL */,
    description: "Change the target user's nickname",
    categories: ["Member Commands"],
    func: (args, msg) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
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
        if (args[1]) {
            let target = yield RevoltUtils_1.default.findMember(msg.channel.server, args[1]);
            if (!target) {
                msg.reply(":x: Invalid target");
                return;
            }
            if (msg.author._id != msg.channel.server.owner) {
                if (!member.hasPermission(msg.channel.server, "ManageNicknames") ||
                    !target.inferiorTo(member)) {
                    msg.reply(":x: You do not have permission to change that user's nickname");
                    return;
                }
            }
            let nick = args.splice(2).join(" ");
            yield target.edit({
                nickname: nick
            });
            yield global.bobcat.modfunc("core.logging", "log", msg.channel.server, "moderation", `@${member.user.username} changed @${(_a = target.user) === null || _a === void 0 ? void 0 : _a.username}'s nickname to '${nick}'`, global.bobcat.config.get("bobcat.colors.info"));
        }
        else {
            if (!member.hasPermission(msg.channel.server, "ChangeNickname")) {
                msg.reply(":x: You do not have permission to change your nickname");
                return;
            }
            let nick = args.splice(1).join(" ");
            yield member.edit({
                nickname: nick
            });
        }
        msg.reply(":white_check_mark: Nickname changed");
    })
}));
commands.push(new Command_1.default({
    names: ["invite"],
    args: [],
    accessLevel: 0 /* AccessLevel.NORMAL */,
    description: "Create a server invite",
    categories: ["Member Commands"],
    func: (args, msg) => __awaiter(void 0, void 0, void 0, function* () {
        if (!(msg === null || msg === void 0 ? void 0 : msg.channel.server)) {
            if (msg)
                msg.reply("This command must be executed in a server");
            else
                Logger_1.default.log("This command must be executed in a server", Logger_1.default.L_WARNING);
            return;
        }
        let member = msg.member;
        if (!member.hasPermission(msg.channel.server, "InviteOthers")) {
            msg.reply(":x: You do not have permission to invite others");
            return;
        }
        try {
            let invite = yield msg.channel.createInvite();
            msg.reply(`:white_check_mark: https://app.revolt.chat/invite/${invite._id}`);
        }
        catch (err) {
            Logger_1.default.log(err, Logger_1.default.L_WARNING);
            msg.reply(":x: Could not create invite");
        }
    })
}));
let listeners = [];
module.exports = new Module_1.default({
    name: "core.member",
    author: "@crispycat",
    version: global.version,
    hidden: false,
    commands: commands,
    listeners: listeners,
    functions: functions
});
