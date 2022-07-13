/*
	Bobcat bot for Revolt
	crispycat <the@crispy.cat>
	https://crispy.cat/software/bobcat
	https://github.com/crispy-cat/bobcat
	Licensed under the GNU GPL v3 license
*/

import {Message, Member} from "revolt.js";
import Logger from "../../core/utilities/Logger";
import Module from "../../core/modules/Module";
import Command from "../../core/modules/Command";
import Listener from "../../core/modules/Listener";
import ModuleFunction from "../../core/modules/ModuleFunction";
import AccessLevel from "../../core/permissions/AccessLevel";

let functions: ModuleFunction[] = [];


let commands: Command[] = [];

commands.push(new Command({
	names:		["nick", "nickname"],
	args:		["[target]", "<nickname>"],
	accessLevel:AccessLevel.NORMAL,
	description: "Change the target user's nickname",
	categories:	["Member Commands"],
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

		let tid: string = global.bobcat.findULID(args[1]);
		if (tid) {
			let target: Member;
			try {
				target = await msg.channel.server.fetchMember(tid);
			} catch (err) {
				Logger.log(err.stack, Logger.L_WARNING);
				msg.reply(":x: Invalid target");
				return;
			}

			if (
				!member.hasPermission(msg.channel.server, "ManageNicknames") ||
				!target.inferiorTo(member)
			) {
				msg.reply(":x: You do not have permission to change that user's nickname");
				return;
			}

			let nick: string = args.splice(2).join(" ");

			await target.edit({
				nickname: nick
			});

			await global.bobcat.modfunc(
				"core.logging", "log", msg.channel.server, "moderation",
				`@${member.user.username} changed @${target.user?.username}'s nickname to '${nick}'`,
				global.bobcat.config.get("bobcat.colors.info")
			);
		} else {
			if (!member.hasPermission(msg.channel.server, "ChangeNickname")) {
				msg.reply(":x: You do not have permission to change your nickname");
				return;
			}

			let nick: string = args.splice(1).join(" ");

			await member.edit({
				nickname: nick
			});
		}

		msg.reply(":white_check_mark: Nickname changed");
	}
}));

commands.push(new Command({
	names:		["invite"],
	args:		[],
	accessLevel:AccessLevel.NORMAL,
	description: "Create a server invite",
	categories:	["Member Commands"],
	func:		async (args: string[], msg: Message): Promise<void> => {
		if (!msg?.channel.server) {
			if (msg) msg.reply("This command must be executed in a server");
			else Logger.log("This command must be executed in a server", Logger.L_WARNING);
			return;
		}

		let member: Member = msg.member;
		if (!member.hasPermission(msg.channel.server, "InviteOthers")) {
			msg.reply(":x: You do not have permission to invite others");
			return;
		}

		try {
			let invite = await msg.channel.createInvite();
			msg.reply(`:white_check_mark: https://app.revolt.chat/invite/${invite._id}`);
		} catch (err) {
			Logger.log(err, Logger.L_WARNING);
			msg.reply(":x: Could not create invite");
		}
	}
}));


let listeners: Listener[] = [];


export = new Module({
	name:		"core.member",
	author:		"@crispycat",
	version:	global.version,
	hidden:		false,
	commands:	commands,
	listeners:	listeners,
	functions:	functions
});
