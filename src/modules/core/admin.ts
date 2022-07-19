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

let functions: ModuleFunction[] = [];


let commands: Command[] = [];

commands.push(new Command({
	names:		["role"],
	args:		["<assign|remove>", "<role>", "<target>"],
	accessLevel:AccessLevel.ADMIN,
	description: "Assign a role to the target user",
	categories:	["Roles", "Administration"],
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
		if (args[1] != "assign" && args[1] != "remove") {
			msg.reply(":x: Invalid action");
			return;
		}

		let member: Member = msg.member;
		let target: Member = await RevoltUtils.findMember(msg.channel.server, args[3]);
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

		let role: {id: string, role: Role} = RevoltUtils.findRole(msg.channel.server, args[2]);
		if (!role) {
			msg.reply(":x: Invalid role");
			return;
		}

		if (member.ranking >= role.role.rank) {
			msg.reply(":x: You do not have permission to assign that role");
			return;
		}

		let roles: string[] = target.roles || [];

		switch (args[1]) {
			case "assign":
				if (!roles.includes(role.id))
					roles.push(role.id);
				break;

			case "remove":
				if (roles.includes(role.id))
					roles = roles.filter((r: string): boolean => r != role.id);
				break;
		}

		await target.edit({
			roles: roles
		});

		await global.bobcat.modfunc(
			"core.logging", "log", msg.channel.server, "moderation",
			`@${member.user.username} changed @${target.user.username}'s roles\n` +
				`${args[1]} role '${role.role.name}'`,
			global.bobcat.config.get("bobcat.colors.info")
		);

		msg.reply(":white_check_mark: Roles updated");
	}
}));

commands.push(new Command({
	names:		["accesslevel", "al"],
	args:		["<user|role>", "<level>"],
	accessLevel:AccessLevel.OWNER,
	description: "Set the bot access level of a role",
	categories:	["Configuration"],
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

		let id: string = global.bobcat.findULID(args[1]);

		if (!id) {
			for (let i in msg.channel.server.roles) {
				let r: Role = msg.channel.server.roles[i];
				if (r.name == args[1]) id = i;
			}
		}

		if (!id) {
			msg.reply(":x: Invalid user or role");
			return;
		}

		let level: AccessLevel;
		switch (args[2].toLowerCase()) {
			case "normal":
			case "member":
			case "0":
				level = AccessLevel.NORMAL;
				break;

			case "mod":
			case "1":
				level = AccessLevel.MOD;
				break;

			case "admin":
			case "2":
				level = AccessLevel.ADMIN;
				break;

			case "owner":
			case "3":
				level = AccessLevel.OWNER;
				break;

			default:
				msg.reply(":x: Invalid access level");
				return;
		}

		global.bobcat.database.set(
			msg.channel.server._id,
			`bobcat.config.access.${id}`,
			level
		);

		msg.reply(":white_check_mark: Configuration updated");
	}
}));

commands.push(new Command({
	names:		["prefix"],
	args:		["<prefix>"],
	accessLevel:AccessLevel.OWNER,
	description: "Set the bot's prefix in this server",
	categories:	["Configuration"],
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

		let prefix: string = args.splice(1).join(" ");

		global.bobcat.database.set(
			msg.channel.server._id,
			`bobcat.prefix`,
			prefix
		);

		msg.reply(":white_check_mark: Configuration updated");
	}
}));


let listeners: Listener[] = [];


export = new Module({
	name:		"core.admin",
	author:		"@crispycat",
	version:	global.version,
	hidden:		false,
	commands:	commands,
	listeners:	listeners,
	functions:	functions
});
