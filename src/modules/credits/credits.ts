/*
	Bobcat bot for Revolt
	crispycat <the@crispy.cat>
	https://crispy.cat/software/bobcat
	https://github.com/crispy-cat/bobcat
	Licensed under the GNU GPL v3 license
*/

import {Message, Member} from "revolt.js";
import {Role} from "revolt-api";
import Logger from "../../core/utilities/Logger";
import RevoltUtils from "../../core/utilities/RevoltUtils";
import Module from "../../core/modules/Module";
import Command from "../../core/modules/Command";
import Listener from "../../core/modules/Listener";
import ModuleFunction from "../../core/modules/ModuleFunction";
import AccessLevel from "../../core/permissions/AccessLevel";
import AccessControl from "../../core/permissions/AccessControl";

const MONEYGREEN = "#118c4f";

let functions: ModuleFunction[] = [];


let commands: Command[] = [];

commands.push(new Command({
	names:		["cred:balance", "balance"],
	args:		[],
	accessLevel:AccessLevel.NORMAL,
	description: "Check your balance",
	categories:	["Credits"],
	func:		async (args: string[], msg: Message): Promise<void> => {
		if (!msg) {
			Logger.log("This command cannot be executed from the console");
			return;
		}

		let gbal: number = global.bobcat.database.get(
			"global", `bobcat.credits.balance.${msg.author._id}`
		) ?? 0;

		let out: string = `Global: ${gbal.toFixed(5)} credits\nLocal: `;

		if (msg.channel.server) {
			let bal: number = global.bobcat.database.get(
				msg.channel.server._id,
				`bobcat.credits.balance.${msg.author._id}`
			) ?? 0;
			out += `${bal.toFixed(5)} credits`;
		} else {
			out += "N/A";
		}

		msg.reply({
			embeds: [{
				title: "Your balance",
				description: out,
				colour: MONEYGREEN
			}]
		});
	}
}));

commands.push(new Command({
	names:		["cred:exchange", "exchange"],
	args:		["<amount>"],
	accessLevel:AccessLevel.NORMAL,
	description: "Exchange global to local credits",
	categories:	["Credits"],
	func:		async (args: string[], msg: Message): Promise<void> => {
		if (!msg?.channel.server) {
			if (msg) msg.reply("This command must be executed in a server");
			else Logger.log("This command must be executed in a server", Logger.L_WARNING);
			return;
		}
		if (args.length < 2) {
			msg.reply(":x: Not enough arguments");
			return;
		}

		let amount: number = parseFloat(args[1]);
		if (isNaN(amount)) {
			msg.reply(":x: Invalid amount")
			return;
		}

		let gbal: number = global.bobcat.database.get(
			"global", `bobcat.credits.balance.${msg.author._id}`
		) ?? 0;
		if (gbal < amount) {
			msg.reply(":x: Insufficient funds");
			return;
		}

		let bal: number = global.bobcat.database.get(
			msg.channel.server._id,
			`bobcat.credits.balance.${msg.author._id}`
		) ?? 0;

		let rate: number = global.bobcat.database.get(
			msg.channel.server._id, "bobcat.credits.config.exchange_rate"
		) ?? global.bobcat.config.get("bobcat.credits.exchange_rate");

		gbal -= amount;
		bal += amount * rate;

		global.bobcat.database.set(
			"global",
			`bobcat.credits.balance.${msg.author._id}`,
			gbal
		);
		global.bobcat.database.set(
			msg.channel.server._id,
			`bobcat.credits.balance.${msg.author._id}`,
			bal
		);

		msg.reply({
			embeds: [{
				title: "Receipt",
				description: `Exchanged ${amount} credits\n` +
					`New global balance: ${gbal.toFixed(5)}\n` +
					`New local balance: ${bal.toFixed(5)}`,
				colour: MONEYGREEN
			}]
		});
	}
}));

commands.push(new Command({
	names:		["cred:rate"],
	args:		[],
	accessLevel:AccessLevel.NORMAL,
	description: "Check the credit exchange rate",
	categories:	["Credits"],
	func:		async (args: string[], msg: Message): Promise<void> => {
		if (!msg?.channel.server) {
			if (msg) msg.reply("This command must be executed in a server");
			else Logger.log("This command must be executed in a server", Logger.L_WARNING);
			return;
		}

		let rate: number = global.bobcat.database.get(
			msg.channel.server._id, "bobcat.credits.config.exchange_rate"
		) ?? global.bobcat.config.get("bobcat.credits.exchange_rate");

		msg.reply(`Exchange rate: ${rate}:1 (local:global)`);
	}
}));

commands.push(new Command({
	names:		["cred:chbal"],
	args:		["<target>", "<amount|+amount|-amount>"],
	accessLevel:AccessLevel.NORMAL,
	description: "Modify the target users's balance",
	categories:	["Credits"],
	func:		async (args: string[], msg: Message): Promise<void> => {
		if (!msg?.channel.server) {
			if (msg) msg.reply("This command must be executed in a server");
			else Logger.log("This command must be executed in a server", Logger.L_WARNING);
			return;
		}
		if (args.length < 3) {
			msg.reply(":x: Not enough arguments");
			return;
		}

		let acl: AccessLevel = await AccessControl.getAccessLevel(msg.channel.server, msg.author);
		let racl: AccessLevel = global.bobcat.database.get(
			msg.channel.server._id, "bobcat.credits.config.manager_level"
		) ?? global.bobcat.config.get("bobcat.credits.manager_level");
		if (acl < racl) {
			msg.reply(":x: You do not have permission to use this command");
			return;
		}

		let member: Member = msg.member;
		let target: Member = await RevoltUtils.findMember(msg.channel.server, args[1]);
		if (!target) {
			msg.reply(":x: Invalid target");
			return;
		}
		if (!target.inferiorTo(member) && msg.channel.server.owner != msg.author._id) {
			msg.reply(":x: You do not have permission to modify that user's balance");
			return;
		}

		let bal: number = global.bobcat.database.get(
			msg.channel.server._id,
			`bobcat.credits.balance.${target._id.user}`
		) ?? 0;
		let oldbal: number = bal;

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

		global.bobcat.database.set(
			msg.channel.server._id,
			`bobcat.credits.balance.${target._id.user}`,
			bal
		);

		await global.bobcat.modfunc(
			"core.logging", "log", msg.channel.server, "credits",
			`@${member.user.username} changed @${target.user.username}'s balance from ${oldbal.toFixed(5)} to ${bal.toFixed(5)}`,
			MONEYGREEN
		);

		msg.reply(`@${target?.user?.username}'s new balance: ${bal.toFixed(5)} credits`);
	}
}));

commands.push(new Command({
	names:		["cred:config"],
	args:		["<setting>", "<value>"],
	accessLevel:AccessLevel.OWNER,
	description: "Modify credits settings",
	categories:	["Credits"],
	func:		async (args: string[], msg: Message): Promise<void> => {
		if (!msg?.channel.server) {
			if (msg) msg.reply("This command must be executed in a server");
			else Logger.log("This command must be executed in a server", Logger.L_WARNING);
			return;
		}

		let val;
		switch (args[1]) {
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
			case "msg_reward": {
				val = parseFloat(args[2]);
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

		global.bobcat.database.set(
			msg.channel.server._id,
			`bobcat.credits.config.${args[1]}`,
			val
		)

		msg.reply(":white_check_mark: Configuration updated");
	}
}));


let listeners: Listener[] = [];

listeners.push(new Listener({
	name:	"msgreward",
	obj:	global.bobcat.client,
	event:	"message",
	func:	async (msg: Message): Promise<void> => {
		let prefix = global.bobcat.getPrefix(msg.channel.server);
		if (msg.content?.startsWith(prefix)) return;

		let gbal: number = global.bobcat.database.get(
			"global", `bobcat.credits.balance.${msg.author._id}`
		) ?? 0;
		gbal += global.bobcat.config.get("bobcat.credits.global_reward") ?? 0;
		global.bobcat.database.set(
			"global", `bobcat.credits.balance.${msg.author._id}`, gbal
		);

		if (msg.channel.server) {
			let bal: number = global.bobcat.database.get(
				msg.channel.server._id,
				`bobcat.credits.balance.${msg.author._id}`
			) ?? 0;
			let reward: number = global.bobcat.database.get(
				msg.channel.server._id,
				"bobcat.credits.config.msg_reward"
			) ?? global.bobcat.config.get("bobcat.credits.server_reward");
			bal += reward;
			global.bobcat.database.set(
				msg.channel.server._id,
				`bobcat.credits.balance.${msg.author._id}`,
				bal
			);
		}
	}
}));


export = new Module({
	name:		"credits.credits",
	author:		"@crispycat",
	version:	global.version,
	hidden:		false,
	commands:	commands,
	listeners:	listeners,
	functions:	functions
});
