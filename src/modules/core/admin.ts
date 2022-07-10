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
		let target: Member;
		try {
			target = await msg.channel.server.fetchMember(global.bobcat.findULID(args[3]));
		} catch (err) {
			Logger.log(err.stack, Logger.L_WARNING);
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

		let rid: string = global.bobcat.findULID(args[2]);
		let role: Role;
		if (rid) {
			role = msg.channel.server.roles[rid];
		} else {
			for (let i in msg.channel.server.roles) {
				let r: Role = msg.channel.server.roles[i];
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

		let roles: string[] = target.roles;

		switch (args[1]) {
			case "assign":
				if (!roles.includes(rid))
					roles.push(rid);
				break;

			case "remove":
				if (roles.includes(rid))
					roles = roles.filter((r: string): boolean => r != rid);
				break;
		}

		await target.edit({
			roles: roles
		});

		await global.bobcat.modfunc(
			"core.logging", "log", msg.channel.server, "moderation",
			`@${member.user.username} changed @${target.user.username}'s roles\n` +
				`${args[1]} role '${role.name}'`,
			global.bobcat.config.get("bobcat.colors.info")
		);

		msg.reply(":white_check_mark: Roles updated");
	}
}));

commands.push(new Command({
	names:		["accesslevel", "al"],
	args:		["<user|role>", "<level>"],
	accessLevel:AccessLevel.OWNER,
	description: "Assign a role to the target user",
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
