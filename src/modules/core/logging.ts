/*
	Bobcat bot for Revolt
	crispycat <the@crispy.cat>
	https://crispy.cat/software/bobcat
	https://github.com/crispy-cat/bobcat
	Licensed under the GNU GPL v3 license
*/

import {Message, Member, Channel, Server} from "revolt.js";
import {Role} from "revolt-api";
import Logger from "../../core/utilities/Logger";
import Format from "../../core/utilities/Format";
import RevoltUtils from "../../core/utilities/RevoltUtils";
import Module from "../../core/modules/Module";
import Command from "../../core/modules/Command";
import Listener from "../../core/modules/Listener";
import ModuleFunction from "../../core/modules/ModuleFunction";
import AccessLevel from "../../core/permissions/AccessLevel";

let functions: ModuleFunction[] = [];

functions.push(new ModuleFunction({
	name: "log",
	func: async (server: Server, feed: string, content: string, color?: string): Promise<void> => {
		let chid: string = global.bobcat.database.get(
			server._id, `bobcat.config.log.${feed}`
		);
		if (!chid) return;

		let channel: Channel = server.channels.find((c: Channel): boolean => c._id == chid);
		if (!channel) return;

		await channel.sendMessage({
			embeds: [{
				title: `Log - ${feed} - ${Format.datetime()}`,
				description: content,
				colour: color ?? global.bobcat.config.get("bobcat.colors.primary")
			}]
		});
	}
}));


let commands: Command[] = [];

commands.push(new Command({
	names:		["logs"],
	args:		["<enable|disable>", "<feed>", "[channel]"],
	accessLevel:AccessLevel.OWNER,
	description:"Enable/disable a log feed",
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

		let feed: string = args[2].replace(/[^a-z0-9\-_]+/g, "");

		switch (args[1]) {
			case "enable":
				global.bobcat.database.set(
					msg.channel.server._id,
					`bobcat.config.log.${feed}`,
					RevoltUtils.findChannel(msg.channel.server, args[3])
				);
				break;
			case "disable":
				global.bobcat.database.set(
					msg.channel.server._id,
					`bobcat.config.log.${feed}`,
					null
				);
				break;
			default:
				msg.reply(":x: Invalid action")
				return;
		}

		msg.reply(":white_check_mark: Configuration updated");
	}
}));


let listeners: Listener[] = [];


export = new Module({
	name:		"core.logging",
	author:		"@crispycat",
	version:	global.version,
	hidden:		false,
	commands:	commands,
	listeners:	listeners,
	functions:	functions
});
