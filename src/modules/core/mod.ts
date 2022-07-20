/*
	Bobcat bot for Revolt
	crispycat <the@crispy.cat>
	https://crispy.cat/software/bobcat
	https://github.com/crispy-cat/bobcat
	Licensed under the GNU GPL v3 license
*/

import {Message, User, Permission, Server, Member} from "revolt.js";
import Logger from "../../core/utilities/Logger";
import Table from "../../core/utilities/Table";
import Format from "../../core/utilities/Format";
import RevoltUtils from "../../core/utilities/RevoltUtils";
import Module from "../../core/modules/Module";
import Command from "../../core/modules/Command";
import Listener from "../../core/modules/Listener";
import ModuleFunction from "../../core/modules/ModuleFunction";
import AccessLevel from "../../core/permissions/AccessLevel";

interface ModerationRecord {
	moderator: string,
	action: string,
	timestamp: number,
	comment: string
}

interface TemporaryBan {
	user: string,
	expires: number
}

let functions: ModuleFunction[] = [];

functions.push(new ModuleFunction({
	name: "addModerationRecord",
	func: async (server: string, user: string, record: ModerationRecord): Promise<void> => {
		let records: ModerationRecord[] = global.bobcat.database.get(
			server, "bobcat.moderation.record." + user
		) ?? [];
		records.push(record);
		global.bobcat.database.set(
			server,
			"bobcat.moderation.record." + user,
			records
		);
	}
}));

let commands: Command[] = [];

commands.push(new Command({
	names:		["record", "infractions"],
	args:		["[target]"],
	accessLevel:AccessLevel.MOD,
	description: "View the target user's moderation record",
	categories:	["Moderation"],
	func:		async (args: string[], msg: Message): Promise<void> => {
		if (!msg?.channel.server) {
			if (msg) msg.reply("This command must be executed in a server");
			else Logger.log("This command must be executed in a server", Logger.L_WARNING);
			return;
		}

		let member: Member = msg.member;
		let target: Member = await RevoltUtils.findMember(msg.channel.server, args[1]);
		let tid: string;
		if (target) {
			if (member.inferiorTo(target) && msg.author._id != msg.channel.server.owner) {
				msg.reply(":x: You do not have permission to view that user's record");
				return;
			}
			tid = target.user._id;
		} else {
			tid = global.bobcat.findULID(args[1]);
		}

		let records: ModerationRecord[] = global.bobcat.database.get(
			msg.channel.server._id, "bobcat.moderation.record." + tid
		) ?? [];
		if (!records.length) {
			msg.reply("That user has no moderation record.");
			return;
		}

		let table: Table = new Table([["#", "Moderator", "Action", "Date/Time", "Comment"]]);
		for (let ind in records) {
			let entry: ModerationRecord = records[ind];
			table.setRow(table.numRows(), [
				+ind + 1,
				(await global.bobcat.client.users.fetch(entry.moderator)).username,
				entry.action,
				Format.datetime(new Date(entry.timestamp * 1000)),
				entry.comment
			])
		}

		msg.reply(
			`**${"@" + target?.user?.username ?? `<@${tid}>`}'s Moderation Record**\n` +
			table.toString()
		);
	}
}));

commands.push(new Command({
	names:		["warn"],
	args:		["<target>", "<comment>"],
	accessLevel:AccessLevel.MOD,
	description: "Warn the target user",
	categories:	["Moderation"],
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

		let member: Member = msg.member;
		let target: Member = await RevoltUtils.findMember(msg.channel.server, args[1]);
		if (!target) {
			msg.reply(":x: Invalid target");
			return;
		}
		if (!target.inferiorTo(member) && msg.author._id != msg.channel.server.owner) {
			msg.reply(":x: You do not have permission to warn that user");
			return;
		}

		let comment: string = args.splice(2).join(" ");

		global.bobcat.modfunc(
			"core.mod", "addModerationRecord",
			msg.channel.server._id,
			target._id.user,
			{
				moderator: member._id.user,
				action: "Warning",
				timestamp: Date.now() / 1000,
				comment: comment
			}
		);

		await (await target.user.openDM()).sendMessage(
			`You have been warned in **${msg.channel.server.name}**:\n${comment}`
		);

		await global.bobcat.modfunc(
			"core.logging", "log", msg.channel.server, "moderation",
			`@${member.user.username} warned @${target.user?.username}\nComment: ${comment}`,
			global.bobcat.config.get("bobcat.colors.warning")
		);

		msg.reply(":white_check_mark: User has been warned.");
	}
}));

commands.push(new Command({
	names:		["kick"],
	args:		["<target>", "[comment]"],
	accessLevel:AccessLevel.MOD,
	description: "Kick the target user",
	categories:	["Moderation"],
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

		let member: Member = msg.member;
		let target: Member = await RevoltUtils.findMember(msg.channel.server, args[1]);
		if (!target) {
			msg.reply(":x: Invalid target");
			return;
		}
		if (msg.author._id != msg.channel.server.owner) {
			if (
				!member.hasPermission(msg.channel.server, "KickMembers") ||
				!target.inferiorTo(member)
			) {
				msg.reply(":x: You do not have permission to kick that user");
				return;
			}
		}
		if (!target.kickable) {
			msg.reply(":x: Bobcat cannot kick that user");
			return;
		}

		let comment: string = (args.length > 2) ? args.splice(2).join(" ") : "No comment";

		global.bobcat.modfunc(
			"core.mod", "addModerationRecord",
			msg.channel.server._id,
			target._id.user,
			{
				moderator: member._id.user,
				action: "Kick",
				timestamp: Date.now() / 1000,
				comment: comment
			}
		);

		await (await target.user.openDM()).sendMessage(
			`You have been kicked from **${msg.channel.server.name}**:\n${comment}`
		);

		await target.kick();

		await global.bobcat.modfunc(
			"core.logging", "log", msg.channel.server, "moderation",
			`@${member.user.username} kicked @${target.user?.username}\nComment: ${comment}`,
			global.bobcat.config.get("bobcat.colors.danger")
		);

		msg.reply(":white_check_mark: User has been kicked.");
	}
}));

commands.push(new Command({
	names:		["ban", "eject", "yeet"],
	args:		["<target>", "[comment]"],
	accessLevel:AccessLevel.MOD,
	description: "Ban the target user",
	categories:	["Moderation"],
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

		let member: Member = msg.member;
		let target: Member = await RevoltUtils.findMember(msg.channel.server, args[1]);
		if (!target) {
			msg.reply(":x: Invalid target");
			return;
		}
		if (msg.author._id != msg.channel.server.owner) {
			if (
				!member.hasPermission(msg.channel.server, "BanMembers") ||
				!target.inferiorTo(member)
			) {
				msg.reply(":x: You do not have permission to ban that user");
				return;
			}
		}
		if (!target.bannable) {
			msg.reply(":x: Bobcat cannot ban that user");
			return;
		}

		let comment: string = (args.length > 2) ? args.splice(2).join(" ") : "No comment";

		global.bobcat.modfunc(
			"core.mod", "addModerationRecord",
			msg.channel.server._id,
			target._id.user,
			{
				moderator: member._id.user,
				action: "Ban",
				timestamp: Date.now() / 1000,
				comment: comment
			}
		);

		await (await target.user.openDM()).sendMessage(
			`You have been banned from **${msg.channel.server.name}**:\n${comment}`
		);

		await msg.channel.server.banUser(target._id.user, {
			reason: comment
		});

		await global.bobcat.modfunc(
			"core.logging", "log", msg.channel.server, "moderation",
			`@${member.user.username} banned @${target.user?.username}\nComment: ${comment}`,
			global.bobcat.config.get("bobcat.colors.danger")
		);

		msg.reply(":white_check_mark: User has been banned.");
	}
}));

commands.push(new Command({
	names:		["tempban", "tban"],
	args:		["<target>", "<time{d|h|m}>", "[comment]"],
	accessLevel:AccessLevel.MOD,
	description: "Temporarily ban the target user",
	categories:	["Moderation"],
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

		let member: Member = msg.member;
		let target: Member = await RevoltUtils.findMember(msg.channel.server, args[1]);
		if (!target) {
			msg.reply(":x: Invalid target");
			return;
		}
		if (msg.author._id != msg.channel.server.owner) {
			if (
				!member.hasPermission(msg.channel.server, "BanMembers") ||
				!target.inferiorTo(member)
			) {
				msg.reply(":x: You do not have permission to ban that user");
				return;
			}
		}
		if (!target.bannable) {
			msg.reply(":x: Bobcat cannot ban that user");
			return;
		}

		let time: number = Date.now();
		let match: string[] = args[2].match(/^(?:(\d+)d?)?(?:(\d+)h?)?(?:(\d+)m?)?$/i);
		let h: number = parseInt(match[1]);
		let m: number = parseInt(match[2]);
		let s: number = parseInt(match[3]);
		time += ((!isNaN(h)) ? h : 0) * 24*60*60*1000;
		time += ((!isNaN(m)) ? m : 0) * 60*60*1000;
		time += ((!isNaN(s)) ? s : 0) * 60*1000;
		let timef:  string = Format.datetime(new Date(time));

		let comment: string = (args.length > 3) ? args.splice(3).join(" ") : "No comment";
		comment = `**Banned until ${timef}**\n${comment}`;

		global.bobcat.modfunc(
			"core.mod", "addModerationRecord",
			msg.channel.server._id,
			target._id.user,
			{
				moderator: member._id.user,
				action: "Tempban",
				timestamp: Date.now() / 1000,
				comment: comment
			}
		);

		await (await target.user.openDM()).sendMessage(
			`You have been temporarily banned from **${msg.channel.server.name}**:\n${comment}`
		);

		let bans: TemporaryBan[] = global.bobcat.database.get(
			msg.channel.server._id,
			"bobcat.tempbans"
		) ?? [];
		bans = bans.filter((b: TemporaryBan): boolean => b.user != target._id.user);
		bans.push({user: target._id.user, expires: time});
		global.bobcat.database.set(msg.channel.server._id, "bobcat.tempbans", bans);

		await msg.channel.server.banUser(target._id.user, {
			reason: comment
		});

		await global.bobcat.modfunc(
			"core.logging", "log", msg.channel.server, "moderation",
			`@${member.user.username} tempbanned @${target.user?.username}\nComment: ${comment}`,
			global.bobcat.config.get("bobcat.colors.danger")
		);

		msg.reply(":white_check_mark: User has been tempbanned.");
	}
}));

commands.push(new Command({
	names:		["unban", "pardon"],
	args:		["<target>", "[comment]"],
	accessLevel:AccessLevel.MOD,
	description: "Unban the target user",
	categories:	["Moderation"],
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

		let tid: string = global.bobcat.findULID(args[1]);
		let member: Member = msg.member;
		if (
			!member.hasPermission(msg.channel.server, "BanMembers") &&
			msg.author._id != msg.channel.server.owner
		) {
			msg.reply(":x: You do not have permission to unban users");
			return;
		}

		let comment: string = (args.length > 2) ? args.splice(2).join(" ") : "No comment";

		global.bobcat.modfunc(
			"core.mod", "addModerationRecord",
			msg.channel.server._id,
			tid,
			{
				moderator: member._id.user,
				action: "Unban",
				timestamp: Date.now() / 1000,
				comment: comment
			}
		);

		try {
			await msg.channel.server.unbanUser(tid);
			await global.bobcat.modfunc(
				"core.logging", "log", msg.channel.server, "moderation",
				`@${member.user.username} unbanned <@${tid}>\nComment: ${comment}`,
				global.bobcat.config.get("bobcat.colors.info")
			);
			msg.reply(":white_check_mark: User has been unbanned.");
		} catch (err) {
			Logger.log(err.stack, Logger.L_WARNING);
			msg.reply(":x: Target could not be unbanned");
		}
	}
}));

commands.push(new Command({
	names:		["purge", "clean"],
	args:		["[user]", "[number]"],
	accessLevel:AccessLevel.MOD,
	description: "Remove messages",
	categories:	["Moderation"],
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

		let member: Member = msg.member;
		if (
			!member.hasPermission(msg.channel.server, "ManageMessages") &&
			msg.author._id != msg.channel.server.owner
		) {
			msg.reply(":x: You do not have permission to purge messages");
			return;
		}

		let user: string = null;
		let num: number = Infinity;
		if (args.length > 2) {
			user = global.bobcat.findULID(args[1]);
			num = +args[2];
		} else if (isNaN(+args[1])) {
			user = global.bobcat.findULID(args[1]);
		} else {
			num = +args[1];
		}

		let messages: Message[] = await msg.channel.fetchMessages({
			limit: num
		});

		let deleted: number = 0;

		for (let message of messages) {
			if (user && message.author?._id != user) continue;
			await message.delete();
			deleted++;
		}

		await global.bobcat.modfunc(
			"core.logging", "log", msg.channel.server, "moderation",
			`@${member.user.username} deleted ${deleted} messages`,
			global.bobcat.config.get("bobcat.colors.info")
		);

		msg.reply(`:white_check_mark: Deleted ${deleted} messages`);
	}
}));


let listeners: Listener[] = [];

listeners.push(new Listener({
	name:	"rmtempban",
	obj:	global.bobcat.clock,
	event:	"tick",
	func:	async (tick: number): Promise<void> => {
		if (tick % (10 * global.bobcat.clock.frequency)) return;
		let now = Date.now();
		for (let [sid, server] of global.bobcat.client.servers) {
			let bans: TemporaryBan[] = global.bobcat.database.get(
				sid, "bobcat.tempbans"
			) ?? [];
			let inds: number[] = [];
			for (let i in bans) {
				let ban: TemporaryBan = bans[i];
				if (ban.expires < now) {
					try {
						await server.unbanUser(ban.user);
						inds.push(parseInt(i));
						await global.bobcat.modfunc(
							"core.logging", "log", server, "moderation",
							`<@${ban.user}>'s temporary ban has expired`,
							global.bobcat.config.get("bobcat.colors.success")
						);
					} catch (err) {
						Logger.log(
							`Error while trying to remove tempban ${sid}:${ban.user}:\n`,
							err,
							Logger.L_ERROR
						);
					}
				}
			}
			bans = bans.filter((_, i: number) => !inds.includes(i));
			global.bobcat.database.set(sid, "bobcat.tempbans", bans);
		}
	}
}));


export = new Module({
	name:		"core.mod",
	author:		"@crispycat",
	version:	global.version,
	hidden:		false,
	commands:	commands,
	listeners:	listeners,
	functions:	functions
});
