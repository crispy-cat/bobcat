/*
	Bobcat bot for Revolt
	crispycat <the@crispy.cat>
	https://crispy.cat/software/bobcat
	https://github.com/crispy-cat/bobcat
	Licensed under the GNU GPL v3 license
*/

import {Message} from "revolt.js";
import Logger from "../../core/utilities/Logger";
import Config from "../../core/app/Config";
import Module from "../../core/modules/Module";
import Command from "../../core/modules/Command";
import Listener from "../../core/modules/Listener";
import ModuleFunction from "../../core/modules/ModuleFunction";
import AccessLevel from "../../core/permissions/AccessLevel";
import AccessControl from "../../core/permissions/AccessControl";
import Table from "../../core/utilities/Table";

let functions: ModuleFunction[] = [];


let commands: Command[] = [];

commands.push(new Command({
	names:		["info", "botinfo"],
	args:		[],
	accessLevel:AccessLevel.NORMAL,
	description: "Shows bot information",
	categories:	["Bot Info"],
	func:		async (args: string[], msg: Message): Promise<void> => {
		let prefix: string = global.bobcat.config.get("bobcat.prefix");
		if (msg?.channel.server) prefix = global.bobcat.database.get(
			msg.channel.server._id,
			"bobcat.prefix"
		);

		let table: Table = new Table();

		table.setCol(0, [
			"Ping",
			global.bobcat.client.websocket.ping + " ms"
		]);

		table.setCol(1, [
			"Version",
			global.version
		]);

		table.setCol(2, [
			"Prefix",
			prefix
		]);

		table.setCol(3, [
			"Owner",
			`<@${global.bobcat.config.get("bobcat.accesslevels.bot_owner")[0]}>`
		]);

		if (msg) {
			msg.reply({
				embeds: [{
					title: `${global.bobcat.config.get("bobcat.name")} Information\n`,
					description: table.toString(),
					colour: global.bobcat.config.get("bobcat.colors.primary")
				}]
			});
		} else {
			Logger.log(table.toString());
		}
	}
}));

commands.push(new Command({
	names:		["help", "commands", "modules"],
	args:		["[module]"],
	accessLevel:AccessLevel.NORMAL,
	description: "Shows a list of commands",
	categories:	["Bot Info"],
	func:		async (args: string[], msg: Message): Promise<void> => {
		let prefix: string = global.bobcat.config.get("bobcat.prefix");
		if (msg?.channel.server) prefix = global.bobcat.database.get(
			msg.channel.server._id,
			"bobcat.prefix"
		);

		if (args[1]) {
			let mod: Module = global.bobcat.getModule(args[1]);
			if (!mod) {
				if (msg) msg.reply(":x: Invalid module name");
				else Logger.log("Invalid module name", Logger.L_WARNING);
				return;
			}

			let table: Table = new Table([["Command", "Syntax", "AL", "Description", "Categories"]]);
			for (let cmd of mod.commands) {
				if (cmd.accessLevel > await AccessControl.getAccessLevel(msg.channel.server, msg.author))
					continue;
				table.setRow(table.numRows(), [
					cmd.names[0],
					prefix + cmd.names[0] + " " + cmd.args.join(" ").replace(/\</g, "&lt;").replace(/\>/g, "&gt;"),
					AccessControl.nameAccessLevel(cmd.accessLevel),
					cmd.description,
					cmd.categories.join(", ")
				]);
			}

			let output: string = `**Commands in module ${mod.name}**\n${table.toString()}`;
			if (msg) msg.reply({
				embeds: [{
					title: `${global.bobcat.config.get("bobcat.name")} Commands\n`,
					description: output,
					colour: global.bobcat.config.get("bobcat.colors.primary")
				}]
			});
			else Logger.log(output);
		} else {
			let table: Table = new Table([["Module", "Author", "Commands"]]);

			for (let mod of global.bobcat.modules) {
				if (mod.hidden) continue;
				table.setRow(table.numRows(), [
					mod.name,
					mod.author,
					mod.commands.map((cmd: Command): string => cmd.names[0]).join(", ")
				]);
			}

			let output: string = `**Loaded Modules**\n${table.toString()}\n` +
				`Use *${prefix}help [module]*`;
				if (msg) msg.reply({
					embeds: [{
						title: `${global.bobcat.config.get("bobcat.name")} Commands\n`,
						description: output,
						colour: global.bobcat.config.get("bobcat.colors.primary")
					}]
				});
			else Logger.log(output);
		}
	}
}));


let listeners: Listener[] = [];

listeners.push(new Listener({
	name:	"prefixlistener",
	obj:	global.bobcat.client,
	event:	"message",
	func:	async (msg: Message): Promise<void> => {
		if (msg.content?.match(
			new RegExp(`(?:\<@)?${global.bobcat.client.user._id}\>? *prefix`)
		)) {
			let prefix = global.bobcat.database.get(
				msg.channel.server?._id,
				"bobcat.prefix"
			) ?? global.bobcat.config.get("bobcat.prefix") ?? "$";
			msg.reply("**My prefix is** `" + prefix + "`");
		}
	}
}));


export = new Module({
	name:		"core.info",
	author:		"@crispycat",
	version:	global.version,
	hidden:		false,
	commands:	commands,
	listeners:	listeners,
	functions:	functions
});
