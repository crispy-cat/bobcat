/*
	Bobcat bot for Revolt
	crispycat <the@crispy.cat>
	https://crispy.cat/software/bobcat
	https://github.com/crispy-cat/bobcat
	Licensed under the GNU GPL v3 license
*/

import FS from "fs";
import {Message} from "revolt.js";
import crypto from "crypto";
import {decodeTime} from "ulid";
import {Clock} from "../../core/app/Clock";
import Logger from "../../core/utilities/Logger";
import Format from "../../core/utilities/Format";
import Module from "../../core/modules/Module";
import Command from "../../core/modules/Command";
import Listener from "../../core/modules/Listener";
import ModuleFunction from "../../core/modules/ModuleFunction";
import AccessLevel from "../../core/permissions/AccessLevel";

let functions: ModuleFunction[] = [];


let commands: Command[] = [];

commands.push(new Command({
	names:		["stop", "kill", "shutdown", "end"],
	args:		[],
	accessLevel:AccessLevel.BOT_OWNER,
	description:"Stops the bot",
	categories:	["Bot Control", "Bot Admin"],
	func:		async (args: string[], msg: Message): Promise<void> => {
		if (msg) msg.reply("Bot will now shut down");
		global.bobcat.end();
	}
}));

commands.push(new Command({
	names:		["mksrvt"],
	args:		["[server]"],
	accessLevel:AccessLevel.BOT_ADMIN,
	description:"Creates server database table",
	categories:	["Debug", "Database"],
	func:		async (args: string[], msg: Message): Promise<void> => {
		let server: string = args[1] ?? msg?.channel?.server?._id;
		global.bobcat.database.create(server);
		if (msg) msg.reply("Table created");
	}
}));

commands.push(new Command({
	names:		["dsrvt"],
	args:		["[server]"],
	accessLevel:AccessLevel.BOT_OWNER,
	description:"Drops server database table",
	categories:	["Debug", "Database"],
	func:		async (args: string[], msg: Message): Promise<void> => {
		let server: string = args[1] ?? msg?.channel?.server?._id;
		global.bobcat.database.drop(server);
		if (msg) msg.reply("Table dropped");
	}
}));

commands.push(new Command({
	names:		["rsrvk"],
	args:		["[server]", "<key>"],
	accessLevel:AccessLevel.BOT_OWNER,
	description:"Reads server database key",
	categories:	["Debug", "Database"],
	func:		async (args: string[], msg: Message): Promise<void> => {
		let server: string;
		let key: string;
		if (args.length == 2) {
			server = msg?.channel?.server?._id;
			key = args[1];
		} else {
			server = args[1];
			key = args[2];
		}

		if (key == "bobcat.eval_key") return;

		let val: string = JSON.stringify(global.bobcat.database.get(server, key));
		let out: string = `[${server}:${key}] == ${val}`;
		if (msg) msg.reply(out);
		else Logger.log(out);
	}
}));

commands.push(new Command({
	names:		["wsrvk"],
	args:		["[server]", "<key>", "[value]"],
	accessLevel:AccessLevel.BOT_OWNER,
	description:"Writes server database key",
	categories:	["Debug", "Database"],
	func:		async (args: string[], msg: Message): Promise<void> => {
		let server: string;
		let key: string;
		let val: string;
		if (args.length == 3) {
			server = msg?.channel?.server?._id;
			key = args[1];
			val = args[2];
		} else {
			server = args[1];
			key = args[2];
			val = args[3];
		}

		if (key == "bobcat.eval_key") return;

		global.bobcat.database.set(server, key, JSON.parse(val));
		let out: string = `[${server}:${key}] == ${val}`;
		if (msg) msg.reply(out);
		else Logger.log(out);
	}
}));

commands.push(new Command({
	names:		["load", "lmod", "insmod"],
	args:		["<path>"],
	accessLevel:AccessLevel.BOT_OWNER,
	description:"Loads a module",
	categories:	["Bot Control", "Debug", "Modules"],
	func:		async (args: string[], msg: Message): Promise<void> => {
		let mpath: string = `${global.bobcat.root}/dist/modules/${args[1]}`;
		if (!FS.existsSync(mpath)) return;
		let mod: Module = require(mpath);
		global.bobcat.loadModule(mod);
		if (msg) msg.reply(`Module ${mod.name} loaded`);
	}
}));

commands.push(new Command({
	names:		["unload", "ulmod", "rmmod"],
	args:		["<name>"],
	accessLevel:AccessLevel.BOT_OWNER,
	description:"Unloads a module",
	categories:	["Bot Control", "Debug", "Modules"],
	func:		async (args: string[], msg: Message): Promise<void> => {
		global.bobcat.unloadModule(args[1]);
		if (msg) msg.reply(`Module ${args[1]} unloaded`);
	}
}));

commands.push(new Command({
	names:		["ekey"],
	args:		["<name>"],
	accessLevel:AccessLevel.BOT_OWNER,
	description:"Gets an eval command key",
	categories:	["Debug"],
	func:		async (args: string[], msg: Message): Promise<void> => {
		let key: string = crypto.randomBytes(32).toString("hex");
		global.bobcat.database.set("bobcat", "bobcat.eval_key", key);
		Logger.log(key, Logger.L_INFO);
	}
}));

commands.push(new Command({
	names:		["eval"],
	args:		["<key>", "<code>"],
	accessLevel:AccessLevel.BOT_OWNER,
	description:"eval()s a command",
	categories:	["Debug"],
	func:		async (args: string[], msg: Message): Promise<void> => {
		let key: string = global.bobcat.database.get("bobcat", "bobcat.eval_key");
		if (args[1] != key) {
			if (msg) {
				Logger.log(
					`\n${"=".repeat(80)}\n` +
					"ATTENTION: INVALID EVAL KEY USED!\n" +
					`User: ${msg.author._id}, Server: ${msg.channel.server._id}` +
					`\n${"=".repeat(80)}\n`,
					Logger.L_ERROR
				);
			} else {
				Logger.log("Invalid key");
			}
			return;
		}

		global.bobcat.database.set("bobcat", "bobcat.eval_key", null);

		try {
			let res: any = eval(args.splice(2).join(" "));
			Logger.log(res);
			if (msg) msg.reply(JSON.stringify(res));
		} catch (err) {
			Logger.log(err.stack, Logger.L_ERROR);
			if (msg) msg.reply(err);
		}
	}
}));

commands.push(new Command({
	names:		["ulid"],
	args:		["ulid"],
	accessLevel:AccessLevel.NORMAL,
	description:"Shows ULID information",
	categories:	["Debug"],
	func:		async (args: string[], msg: Message): Promise<void> => {
		let ulid: string = global.bobcat.findULID(args[1] ?? "");
		if (!ulid) {
			if (msg) msg.reply("Invalid ULID");
			else Logger.log("Invalid ULID", Logger.L_WARNING);
			return;
		}
		let datetime: string = Format.datetime(new Date(decodeTime(ulid)));
		let out: string = `**ULID ${ulid}**\nCreated at ${datetime}`;
		if (msg) msg.reply(out);
		else Logger.log(out);
	}
}));

commands.push(new Command({
	names:		["tick"],
	args:		[],
	accessLevel:AccessLevel.NORMAL,
	description:"Current tick",
	categories:	["Debug"],
	func:		async (args: string[], msg: Message): Promise<void> => {
		let clock: Clock = global.bobcat.clock;
		let out: string = `T: ${clock.tick}\nL: ${clock.lastTick}\n` +
			`I: ${clock.lastInterval}\nD: ${clock.interval}\n` +
			`F: ${clock.frequency}\nN: ${Date.now()}`;
		if (msg) msg.reply(out);
		else Logger.log(out);
	}
}));


let listeners: Listener[] = [];


export = new Module({
	name:		"core.debug",
	author:		"@crispycat",
	version:	global.version,
	hidden:		true,
	commands:	commands,
	listeners:	listeners,
	functions:	functions
});
