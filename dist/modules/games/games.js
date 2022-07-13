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
const BALL_ANSWERS = [
    "It is certain.",
    "It is decidedly so.",
    "Without a doubt.",
    "Yes definitely.",
    "You may rely on it.",
    "As I see it, yes.",
    "Most likely.",
    "Outlook good.",
    "Yes.",
    "Signs point to yes.",
    "Reply hazy, try again.",
    "Ask again later.",
    "Better not tell you now.",
    "Cannot predict now.",
    "Concentrate and ask again.",
    "Don't count on it.",
    "My reply is no.",
    "My sources say no.",
    "Outlook not so good.",
    "Very doubtful."
];
const DIE_FACES = [
    "",
    "\u2680",
    "\u2681",
    "\u2682",
    "\u2683",
    "\u2684",
    "\u2685"
];
let functions = [];
let commands = [];
commands.push(new Command_1.default({
    names: ["ship"],
    args: ["<person 1>", "<person 2>"],
    accessLevel: 0 /* AccessLevel.NORMAL */,
    description: "Ship two people.",
    categories: ["Games"],
    func: (args, msg) => __awaiter(void 0, void 0, void 0, function* () {
        if (args.length < 3) {
            if (msg)
                msg.reply(":x: Not enough arguments");
            else
                Logger_1.default.log("Not enough arguments", Logger_1.default.L_WARNING);
            return;
        }
        let p1 = [...(args[1].split("").keys())]
            .map((i) => args[1].charCodeAt(i))
            .reduce((a, b) => a + b, 0);
        let p2 = [...(args[2].split("").keys())]
            .map((i) => args[2].charCodeAt(i))
            .reduce((a, b) => a + b, 0);
        let s = Math.round(((p1 + p2) + (args[2].length - args[1].length)) % 100);
        let m;
        if (s == 100)
            m = "Let's go!";
        else if (s >= 80)
            m = "Looking good...";
        else if (s >= 60)
            m = "Not bad...";
        else if (s >= 40)
            m = "Perhaps...";
        else if (s >= 20)
            m = "I don't know about this...";
        else
            m = "Not a chance.";
        let b = "\u2588".repeat(s / 5) + "\u2591".repeat(20 - (s / 5));
        let c;
        if (s > 66)
            c = global.bobcat.config.get("bobcat.colors.success");
        else if (s > 33)
            c = global.bobcat.config.get("bobcat.colors.warning");
        else
            c = global.bobcat.config.get("bobcat.colors.danger");
        let out = `**Compatibility between ${args[1]} and ${args[2]}:**\n` +
            `${b} ${s}%\n*${m}*`;
        if (msg)
            msg.reply({
                embeds: [{
                        title: `${args[1]} x ${args[2]}`,
                        description: out,
                        colour: c
                    }]
            });
        else
            Logger_1.default.log(out);
    })
}));
commands.push(new Command_1.default({
    names: ["8ball"],
    args: ["<question>"],
    accessLevel: 0 /* AccessLevel.NORMAL */,
    description: "Ask the Magic 8-Ball.",
    categories: ["Games"],
    func: (args, msg) => __awaiter(void 0, void 0, void 0, function* () {
        let m = BALL_ANSWERS[Math.round(Math.random() * BALL_ANSWERS.length)];
        m = "# \u{1f3b1} " + m;
        if (msg)
            msg.reply(m);
        else
            Logger_1.default.log(m);
    })
}));
commands.push(new Command_1.default({
    names: ["dice"],
    args: ["<dice>"],
    accessLevel: 0 /* AccessLevel.NORMAL */,
    description: "Roll some dice.",
    categories: ["Games"],
    func: (args, msg) => __awaiter(void 0, void 0, void 0, function* () {
        let dice = parseInt(args[1]);
        if (isNaN(dice))
            dice = 2;
        if (dice > 20) {
            if (msg)
                msg.reply(":x: Too many dice");
            else
                Logger_1.default.log("Too many dice", Logger_1.default.L_WARNING);
            return;
        }
        let n = 0;
        let d = "";
        for (let i = 0; i < dice; i++) {
            let x = Math.round(Math.random() * 5) + 1;
            n += x;
            d += DIE_FACES[x];
        }
        if (msg)
            msg.reply(`# ${d} **(${n})**`);
        else
            Logger_1.default.log(`${d} (${n})`);
    })
}));
let listeners = [];
module.exports = new Module_1.default({
    name: "games.games",
    author: "@crispycat",
    version: global.version,
    hidden: false,
    commands: commands,
    listeners: listeners,
    functions: functions
});
