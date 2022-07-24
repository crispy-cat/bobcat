/*
	Bobcat bot for Revolt
	crispycat <the@crispy.cat>
	https://crispy.cat/software/bobcat
	https://github.com/crispy-cat/bobcat
	Licensed under the GNU GPL v3 license
*/

import {Role} from "revolt-api";
import {Message, Member, Channel, User} from "revolt.js";
import Logger from "../../core/utilities/Logger";
import ParseUtils from "../../core/utilities/ParseUtils";
import RevoltUtils from "../../core/utilities/RevoltUtils";
import Config from "../../core/app/Config";
import Module from "../../core/modules/Module";
import Command from "../../core/modules/Command";
import Listener from "../../core/modules/Listener";
import ModuleFunction from "../../core/modules/ModuleFunction";
import AccessLevel from "../../core/permissions/AccessLevel";
import AccessControl from "../../core/permissions/AccessControl";
import Table from "../../core/utilities/Table";

interface TemporaryBan {
	user: string,
	expires: number
}

interface AntispamConfig {
	enabled: boolean,
	whitelist: string[],
	wl_level: AccessLevel,
	max_mentions: number,
	max_links: number,
	max_freq: number,
	del_msgs: boolean,
	max_noaction: number,
	max_warns: number,
	max_kicks: number,
	max_tempbans: number,
	tempban_len: number
}

interface AntispamRecord {
	none: number,
	warn: number,
	kick: number,
	tempban: number
}

const AS_REGEX_MENTION	= /<@[0-9A-HJKMNP-TV-Z]+>/gi;
const AS_REGEX_LINK		= /(?:https?|ftps?|mailto):\/*\S+/gi;

const AS_CONFIG_DEFAULTS = {
	enabled: false,
	whitelist: [],
	wl_level: AccessLevel.MOD,
	max_mentions: 5,
	max_links: 3,
	max_freq: 2,
	del_msgs: true,
	max_noaction: 3,
	max_warns: 3,
	max_kicks: 1,
	max_tempbans: 2,
	tempban_len: 30*60*1000
};

let lastSent: {[k: string]: number} = {};


let functions: ModuleFunction[] = [];

functions.push(new ModuleFunction({
	name:	"checkspam",
	func:	async (
		msg: Message, now: number, last: number, config: AntispamConfig
	): Promise<void> => {
		// is spam? not sure yet
		let spam: boolean = false;

		// if time between now and the last message sent is less than
		// 1000 / frequency, it is spam
		if (now - last < 1000 / config.max_freq) spam = true;

		// check for more than x mentions
		let mentions: string[] = msg.content?.match(AS_REGEX_MENTION);
		if (mentions && mentions.length > config.max_mentions) spam = true;

		// check for more than x links
		let links: string[] = msg.content?.match(AS_REGEX_LINK);
		if (links && links.length > config.max_links) spam = true;

		// if it's not spam, return
		if (!spam) return;
		// delete the message
		if (config.del_msgs) msg.delete();

		// initialize the action to none (should change to an enum maybe)
		let action: "warn"|"kick"|"tempban"|"ban"|"none" = "none";
		// get the user's antispam record for the server
		let record: AntispamRecord = global.bobcat.database.get(
			msg.channel.server._id,
			`bobcat.antispam.record.${msg.author._id}`
		) ?? {none: 0, warn: 0, kick: 0, tempban: 0};
		// if more than x tempbans, ban, if more than x kicks, tempban, ...
		if (record.tempban >= config.max_tempbans) action = "ban";
		else if (record.kick >= config.max_kicks) action = "tempban";
		else if (record.warn >= config.max_warns) action = "kick";
		else if (record.none >= config.max_noaction) action = "warn";

		// execute the action
		switch (action) {
			case "warn": {
				record.warn++;
				break;
			}
			case "kick": {
				await msg.member.kick();
				record.kick++;
				break;
			}
			case "tempban": {
				// get the tempban list for the server
				let bans: TemporaryBan[] = global.bobcat.database.get(
					msg.channel.server._id,
					"bobcat.tempbans"
				) ?? [];
				// delete the user's old tempban and push the new one
				bans = bans.filter((b: TemporaryBan): boolean => b.user != msg.author._id);
				bans.push({user: msg.author._id, expires: now + config.tempban_len});
				// set the tempban list
				global.bobcat.database.set(msg.channel.server._id, "bobcat.tempbans", bans);
				// actually ban the user
				await msg.channel.server.banUser(msg.author._id, {
					reason: `Antispam Tempban ID: ${msg.channel._id}/${msg._id}`
				});
				// increment the tempbans on record
				record.tempban++;
				break;
			}
			case "ban": {
				await msg.channel.server.banUser(msg.author._id, {
					reason: `Antispam ID: ${msg.channel._id}/${msg._id}`
				});
				break;
			}
			case "none":
			default: {
				record.none++;
			}
		}

		// set the user's antispam record
		global.bobcat.database.set(
			msg.channel.server._id,
			`bobcat.antispam.record.${msg.author._id}`,
			record
		);

		// if no action taken, return
		if (action == "none") return;

		// add to the user's moderation record
		await global.bobcat.modfunc(
			"core.mod", "addModerationRecord",
			msg.channel.server._id,
			msg.author._id,
			{
				moderator: global.bobcat.client.user._id,
				action: action,
				timestamp: Date.now(),
				comment: `AntiSpam ID: ${msg.channel._id}/${msg._id}`
			}
		);

		// send to the logger
		await global.bobcat.modfunc(
			"core.logging", "log", msg.channel.server, "antispam",
			`@${msg.author.username} triggered the spam filter\n` +
				`Action taken: ${action}\nID:\`${msg.channel._id}/${msg._id}\``,
			global.bobcat.config.get("bobcat.colors.warning")
		);

		// dm the user
		await (await msg.author.openDM()).sendMessage(
			"You have triggered the spam filter\n" +
			`Action taken: ${action}\nID:\`${msg.channel._id}/${msg._id}\`\n` +
			"Please contact a server administrator for assistance."
		);
	}
}));

// start commands


let commands: Command[] = [];

commands.push(new Command({
	names:		["as:toggle", "as:enable", "as:disable"],
	args:		[],
	accessLevel:AccessLevel.OWNER,
	description: "Toggle antispam",
	categories:	["Antispam"],
	func:		async (args: string[], msg: Message): Promise<void> => {
		if (!msg?.channel.server) {
			if (msg) msg.reply("This command must be executed in a server");
			else Logger.log("This command must be executed in a server", Logger.L_WARNING);
			return;
		}

		let val: boolean;

		switch (args[0]) {
			case "as:toggle": {
				let enabled: boolean = global.bobcat.database.get(
					msg.channel.server._id,
					"bobcat.antispam.config.enabled"
				);
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

		global.bobcat.database.set(
			msg.channel.server._id,
			"bobcat.antispam.config.enabled",
			val
		);

		msg.reply(":white_check_mark: Configuration updated");
	}
}));

commands.push(new Command({
	names:		["as:config"],
	args:		["<setting>", "<value>"],
	accessLevel:AccessLevel.OWNER,
	description: "Modify antispam settings",
	categories:	["Antispam"],
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

		let val: any;
		switch (args[1]) {
			case "wl_level": {
				val = AccessControl.alFromText(
					args[2], AccessLevel.NORMAL, AccessLevel.OWNER
				);
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
				val = ParseUtils.boolean(args[2]);
				break;
			}
			case "tempban_len": {
				val = ParseUtils.time(args[2]);
				break;
			}
			default:
				msg.reply(
					"Valid settings: wl_level, max_links, max_mentions, " +
					"max_noaction, max_warns, max_kicks, max_tempbans, " +
					"max_freq, del_msgs, tempban_len"
				);
				return;
		}

		global.bobcat.database.set(
			msg.channel.server._id,
			`bobcat.antispam.config.${args[1]}`,
			val
		);

		msg.reply(":white_check_mark: Configuration updated");
	}
}));

commands.push(new Command({
	names:		["as:whitelist"],
	args:		["<add|remove>", "<user|role|channel>"],
	accessLevel:AccessLevel.OWNER,
	description: "Add or remove a whitelisted role, channel or user",
	categories:	["Antispam"],
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
		if (args[1] != "add" && args[1] != "remove") {
			msg.reply(":x: Invalid action");
			return;
		}

		let id = ParseUtils.parseULID(args[2]);
		if (!id) {
			let channel: Channel = RevoltUtils.findChannel(msg.channel.server, args[2]);
			if (channel) {
				id = channel._id;
			} else {
				let role: {id: string, role: Role} = RevoltUtils.findRole(msg.channel.server, args[2]);
				if (role) {
					id = role.id;
				} else {
					let member: Member = await RevoltUtils.findMember(msg.channel.server, args[2]);
					if (member) id = member._id.user;
				}
			}
		}

		if (!id) {
			msg.reply(":x: Invalid user or role");
			return;
		}

		let config: AntispamConfig = global.bobcat.database.get(
			msg.channel.server._id,
			"bobcat.antispam.config"
		) ?? AS_CONFIG_DEFAULTS;

		switch (args[1]) {
			case "add":
				if (!config.whitelist.includes(id))
					config.whitelist.push(id);
				break;

			case "remove":
				if (config.whitelist.includes(id))
					config.whitelist = config.whitelist.filter((x: string): boolean => x != id);
				break;
		}

		msg.reply(":white_check_mark: Configuration updated");
	}
}));

commands.push(new Command({
	names:		["as:clear"],
	args:		["<target>"],
	accessLevel:AccessLevel.MOD,
	description: "Clear the target user's antispam record",
	categories:	["Moderation"],
	func:		async (args: string[], msg: Message): Promise<void> => {
		if (!msg?.channel.server) {
			if (msg) msg.reply("This command must be executed in a server");
			else Logger.log("This command must be executed in a server", Logger.L_WARNING);
			return;
		}

		let member: Member = msg.member;
		let target: User = await RevoltUtils.findUser(args[1]);
		let mtarget: Member = await RevoltUtils.findMember(msg.channel.server, args[1]);
		if (mtarget) {
			if (member.inferiorTo(mtarget) && msg.author._id != msg.channel.server.owner) {
				msg.reply(":x: You do not have permission to clear that user's record");
				return;
			}
		}

		global.bobcat.database.set(
			msg.channel.server._id,
			`bobcat.antispam.record.${target._id}`,
			{none: 0, warn: 0, kick: 0, tempban: 0}
		);

		msg.reply(":white_check_mark: Record cleared");
	}
}));


// end commands

let listeners: Listener[] = [];

listeners.push(new Listener({
	name:	"spamlistener",
	obj:	global.bobcat.client,
	event:	"message",
	func:	async (msg: Message): Promise<void> => {
		// if not in a server, return
		if (!msg.channel.server) return;

		// if not enabled, return
		let enabled: boolean = global.bobcat.database.get(
			msg.channel.server._id,
			"bobcat.antispam.config.enabled"
		);
		if (!enabled) return;

		// get the current time, time of last message sent by the user and
		// set the last message time to now
		let now: number = Date.now();
		let last: number = lastSent[msg.author._id] ?? 0;
		lastSent[msg.author._id] = now;

		// get the antispam configuration
		let config: AntispamConfig = AS_CONFIG_DEFAULTS;
		for (let key of Object.keys(AS_CONFIG_DEFAULTS)) {
			let val: any = global.bobcat.database.get(
				msg.channel.server._id,
				`bobcat.antispam.config.${key}`
			);
			if (val !== undefined && val !== null) config[key] = val;
		}

		// check that the message channel, author and author's roles are not
		// in the whitelist
		if (config.whitelist.includes(msg.channel._id)) return;
		if (config.whitelist.includes(msg.author._id)) return;
		for (let id of (msg.member?.roles ?? []))
			if (config.whitelist.includes(id)) return;

		// check that the user's access level is not whitelisted
		let al: AccessLevel = await AccessControl.getAccessLevel(msg.channel.server, msg.author);
		if (al >= config.wl_level) return;

		// execute the spam check function
		await global.bobcat.modfunc(
			"antispam.antispam", "checkspam",
			msg, now, last, config
		);
	}
}));


export = new Module({
	name:		"antispam.antispam",
	author:		"@crispycat",
	version:	global.version,
	hidden:		false,
	commands:	commands,
	listeners:	listeners,
	functions:	functions
});
