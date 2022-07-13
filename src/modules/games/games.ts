/*
	Bobcat bot for Revolt
	crispycat <the@crispy.cat>
	https://crispy.cat/software/bobcat
	https://github.com/crispy-cat/bobcat
	Licensed under the GNU GPL v3 license
*/

import {AxiosResponse} from "axios";
import {Message} from "revolt.js";
import Logger from "../../core/utilities/Logger";
import Module from "../../core/modules/Module";
import Command from "../../core/modules/Command";
import Listener from "../../core/modules/Listener";
import ModuleFunction from "../../core/modules/ModuleFunction";
import AccessLevel from "../../core/permissions/AccessLevel";

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
]


let functions: ModuleFunction[] = [];


let commands: Command[] = [];

commands.push(new Command({
	names:		["ship"],
	args:		["<person 1>", "<person 2>"],
	accessLevel:AccessLevel.NORMAL,
	description:"Ship two people.",
	categories:	["Games"],
	func:		async (args: string[], msg: Message): Promise<void> => {
		if (args.length < 3) {
			if (msg) msg.reply(":x: Not enough arguments");
			else Logger.log("Not enough arguments", Logger.L_WARNING);
			return;
		}

		let p1: number = [...(args[1].split("").keys())]
			.map((i: number): number => args[1].charCodeAt(i))
			.reduce((a: number, b: number): number => a + b, 0);
		let p2: number = [...(args[2].split("").keys())]
			.map((i: number): number => args[2].charCodeAt(i))
			.reduce((a: number, b: number): number => a + b, 0);

		let s: number = Math.round(((p1 + p2) + (args[2].length - args[1].length)) % 100);

		let m: string;
		if (s == 100) m = "Let's go!";
		else if (s >= 80) m = "Looking good...";
		else if (s >= 60) m = "Not bad...";
		else if (s >= 40) m = "Perhaps...";
		else if (s >= 20) m = "I don't know about this...";
		else m = "Not a chance."

		let b: string = "\u2588".repeat(s / 5) + "\u2591".repeat(20 - (s / 5));

		let c: string;
		if (s > 66) c = global.bobcat.config.get("bobcat.colors.success");
		else if (s > 33) c = global.bobcat.config.get("bobcat.colors.warning");
		else c = global.bobcat.config.get("bobcat.colors.danger");

		let out: string = `**Compatibility between ${args[1]} and ${args[2]}:**\n` +
			`${b} ${s}%\n*${m}*`;

		if (msg) msg.reply({
			embeds: [{
				title: `${args[1]} x ${args[2]}`,
				description: out,
				colour: c
			}]
		})
		else Logger.log(out);
	}
}));

commands.push(new Command({
	names:		["8ball"],
	args:		["<question>"],
	accessLevel:AccessLevel.NORMAL,
	description:"Ask the Magic 8-Ball.",
	categories:	["Games"],
	func:		async (args: string[], msg: Message): Promise<void> => {
		let m: string = BALL_ANSWERS[Math.round(Math.random() * BALL_ANSWERS.length)];
		m = "# \u{1f3b1} " + m;
		if (msg) msg.reply(m);
		else Logger.log(m);
	}
}));

commands.push(new Command({
	names:		["dice"],
	args:		["<dice>"],
	accessLevel:AccessLevel.NORMAL,
	description:"Roll some dice.",
	categories:	["Games"],
	func:		async (args: string[], msg: Message): Promise<void> => {
		let dice: number = parseInt(args[1]);
		if (isNaN(dice)) dice = 2;
		if (dice > 20) {
			if (msg) msg.reply(":x: Too many dice");
			else Logger.log("Too many dice", Logger.L_WARNING);
			return;
		}

		let n: number = 0;
		let d: string = "";
		for (let i = 0; i < dice; i++) {
			let x = Math.round(Math.random() * 5) + 1;
			n += x;
			d += DIE_FACES[x];
		}

		if (msg) msg.reply(`# ${d} **(${n})**`);
		else Logger.log(`${d} (${n})`);
	}
}));


let listeners: Listener[] = [];


export = new Module({
	name:		"games.games",
	author:		"@crispycat",
	version:	global.version,
	hidden:		false,
	commands:	commands,
	listeners:	listeners,
	functions:	functions
});
