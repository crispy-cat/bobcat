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
const Listener_1 = __importDefault(require("../../core/modules/Listener"));
const AccessControl_1 = __importDefault(require("../../core/permissions/AccessControl"));
const MONEYGREEN = "#118c4f";
let functions = [];
let commands = [];
commands.push(new Command_1.default({
    names: ["cred:balance", "balance"],
    args: [],
    accessLevel: 0 /* AccessLevel.NORMAL */,
    description: "Check your balance",
    categories: ["Credits"],
    func: (args, msg) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        if (!msg) {
            Logger_1.default.log("This command cannot be executed from the console");
            return;
        }
        let gbal = (_a = global.bobcat.database.get("global", `bobcat.credits.balance.${msg.author._id}`)) !== null && _a !== void 0 ? _a : 0;
        let out = `Global: ${gbal.toFixed(5)} credits\nLocal: `;
        if (msg.channel.server) {
            let bal = (_b = global.bobcat.database.get(msg.channel.server._id, `bobcat.credits.balance.${msg.author._id}`)) !== null && _b !== void 0 ? _b : 0;
            out += `${bal.toFixed(5)} credits`;
        }
        else {
            out += "N/A";
        }
        msg.reply({
            embeds: [{
                    title: "Your balance",
                    description: out,
                    colour: MONEYGREEN
                }]
        });
    })
}));
commands.push(new Command_1.default({
    names: ["cred:exchange", "exchange"],
    args: ["<amount>"],
    accessLevel: 0 /* AccessLevel.NORMAL */,
    description: "Exchange global to local credits",
    categories: ["Credits"],
    func: (args, msg) => __awaiter(void 0, void 0, void 0, function* () {
        var _c, _d, _e;
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
        let amount = parseFloat(args[1]);
        if (isNaN(amount)) {
            msg.reply(":x: Invalid amount");
            return;
        }
        let gbal = (_c = global.bobcat.database.get("global", `bobcat.credits.balance.${msg.author._id}`)) !== null && _c !== void 0 ? _c : 0;
        if (gbal < amount) {
            msg.reply(":x: Insufficient funds");
            return;
        }
        let bal = (_d = global.bobcat.database.get(msg.channel.server._id, `bobcat.credits.balance.${msg.author._id}`)) !== null && _d !== void 0 ? _d : 0;
        let rate = (_e = global.bobcat.database.get(msg.channel.server._id, "bobcat.credits.config.exchange_rate")) !== null && _e !== void 0 ? _e : global.bobcat.config.get("bobcat.credits.exchange_rate");
        gbal -= amount;
        bal += amount * rate;
        global.bobcat.database.set("global", `bobcat.credits.balance.${msg.author._id}`, gbal);
        global.bobcat.database.set(msg.channel.server._id, `bobcat.credits.balance.${msg.author._id}`, bal);
        msg.reply({
            embeds: [{
                    title: "Receipt",
                    description: `Exchanged ${amount} credits\n` +
                        `New global balance: ${gbal.toFixed(5)}\n` +
                        `New local balance: ${bal.toFixed(5)}`,
                    colour: MONEYGREEN
                }]
        });
    })
}));
commands.push(new Command_1.default({
    names: ["cred:rate"],
    args: [],
    accessLevel: 0 /* AccessLevel.NORMAL */,
    description: "Check the credit exchange rate",
    categories: ["Credits"],
    func: (args, msg) => __awaiter(void 0, void 0, void 0, function* () {
        var _f;
        if (!(msg === null || msg === void 0 ? void 0 : msg.channel.server)) {
            if (msg)
                msg.reply("This command must be executed in a server");
            else
                Logger_1.default.log("This command must be executed in a server", Logger_1.default.L_WARNING);
            return;
        }
        let rate = (_f = global.bobcat.database.get(msg.channel.server._id, "bobcat.credits.config.exchange_rate")) !== null && _f !== void 0 ? _f : global.bobcat.config.get("bobcat.credits.exchange_rate");
        msg.reply(`Exchange rate: ${rate}:1 (local:global)`);
    })
}));
commands.push(new Command_1.default({
    names: ["cred:chbal"],
    args: ["<target>", "<amount|+amount|-amount>"],
    accessLevel: 0 /* AccessLevel.NORMAL */,
    description: "Modify the target users's balance",
    categories: ["Credits"],
    func: (args, msg) => __awaiter(void 0, void 0, void 0, function* () {
        var _g, _h, _j, _k;
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
        let acl = yield AccessControl_1.default.getAccessLevel(msg.channel.server, msg.author);
        let racl = (_g = global.bobcat.database.get(msg.channel.server._id, "bobcat.credits.config.manager_level")) !== null && _g !== void 0 ? _g : global.bobcat.config.get("bobcat.credits.manager_level");
        if (acl < racl) {
            msg.reply(":x: You do not have permission to use this command");
            return;
        }
        let member = msg.member;
        let target = yield RevoltUtils_1.default.findMember(msg.channel.server, args[1]);
        if (!target) {
            msg.reply(":x: Invalid target");
            return;
        }
        if (!target.inferiorTo(member) && msg.channel.server.owner != msg.author._id) {
            msg.reply(":x: You do not have permission to modify that user's balance");
            return;
        }
        let bal = (_h = global.bobcat.database.get(msg.channel.server._id, `bobcat.credits.balance.${target._id.user}`)) !== null && _h !== void 0 ? _h : 0;
        let oldbal = bal;
        let match = args[2].match(/([-+])?(\d+(?:\.\d+)?)/);
        if (!match) {
            msg.reply(":x: Invalid amount");
            return;
        }
        switch (match[1]) {
            case "+":
                bal += parseFloat(match[2]);
                break;
            case "-":
                bal -= parseFloat(match[2]);
                break;
            default:
                bal = parseFloat(match[2]);
        }
        global.bobcat.database.set(msg.channel.server._id, `bobcat.credits.balance.${target._id.user}`, bal);
        yield global.bobcat.modfunc("core.logging", "log", msg.channel.server, "credits", `@${member.user.username} changed @${(_j = target.user) === null || _j === void 0 ? void 0 : _j.username}'s balance from ${oldbal.toFixed(5)} to ${bal.toFixed(5)}`, MONEYGREEN);
        msg.reply(`@${(_k = target === null || target === void 0 ? void 0 : target.user) === null || _k === void 0 ? void 0 : _k.username}'s new balance: ${bal.toFixed(5)} credits`);
    })
}));
commands.push(new Command_1.default({
    names: ["cred:config"],
    args: ["<setting>", "<value>"],
    accessLevel: 3 /* AccessLevel.OWNER */,
    description: "Modify credits settings",
    categories: ["Credits"],
    func: (args, msg) => __awaiter(void 0, void 0, void 0, function* () {
        if (!(msg === null || msg === void 0 ? void 0 : msg.channel.server)) {
            if (msg)
                msg.reply("This command must be executed in a server");
            else
                Logger_1.default.log("This command must be executed in a server", Logger_1.default.L_WARNING);
            return;
        }
        let val;
        switch (args[1]) {
            case "msg_reward":
            case "exchange_rate": {
                val = parseFloat(args[2]);
                if (isNaN(val)) {
                    msg.reply(":x: Invalid value");
                    return;
                }
                break;
            }
            case "manager_level": {
                val = parseInt(args[2]);
                if (isNaN(val)) {
                    msg.reply(":x: Invalid value");
                    return;
                }
                break;
            }
            default:
                msg.reply("Valid settings: exchange_rate, manager_level, msg_reward");
                return;
        }
        global.bobcat.database.set(msg.channel.server._id, `bobcat.credits.config.${args[1]}`, val);
        msg.reply(":white_check_mark: Configuration updated");
    })
}));
let listeners = [];
listeners.push(new Listener_1.default({
    name: "msgreward",
    obj: global.bobcat.client,
    event: "message",
    func: (msg) => __awaiter(void 0, void 0, void 0, function* () {
        var _l, _m, _o, _p, _q;
        let prefix = global.bobcat.getPrefix(msg.channel.server);
        if ((_l = msg.content) === null || _l === void 0 ? void 0 : _l.startsWith(prefix))
            return;
        let gbal = (_m = global.bobcat.database.get("global", `bobcat.credits.balance.${msg.author._id}`)) !== null && _m !== void 0 ? _m : 0;
        gbal += (_o = global.bobcat.config.get("bobcat.credits.global_reward")) !== null && _o !== void 0 ? _o : 0;
        global.bobcat.database.set("global", `bobcat.credits.balance.${msg.author._id}`, gbal);
        if (msg.channel.server) {
            let bal = (_p = global.bobcat.database.get(msg.channel.server._id, `bobcat.credits.balance.${msg.author._id}`)) !== null && _p !== void 0 ? _p : 0;
            let reward = (_q = global.bobcat.database.get(msg.channel.server._id, "bobcat.credits.config.msg_reward")) !== null && _q !== void 0 ? _q : global.bobcat.config.get("bobcat.credits.server_reward");
            bal += reward;
            global.bobcat.database.set(msg.channel.server._id, `bobcat.credits.balance.${msg.author._id}`, bal);
        }
    })
}));
module.exports = new Module_1.default({
    name: "credits.credits",
    author: "@crispycat",
    version: global.version,
    hidden: false,
    commands: commands,
    listeners: listeners,
    functions: functions
});
