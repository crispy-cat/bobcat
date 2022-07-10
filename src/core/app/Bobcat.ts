/*
	Bobcat bot for Revolt
	crispycat <the@crispy.cat>
	https://crispy.cat/software/bobcat
	https://github.com/crispy-cat/bobcat
	Licensed under the GNU GPL v3 license
*/

import * as readline from "readline";
import glob from "glob";
import axios, {AxiosInstance} from "axios";
import {Client, Message} from "revolt.js";
import Config from "../app/Config";
import Logger from "../utilities/Logger";
import Database from "../app/Database";
import Module from "../modules/Module";
import ModuleFunction from "../modules/ModuleFunction";
import AccessControl from "../permissions/AccessControl";

export default class Bobcat {
	public readonly root: string;
	public readonly config: Config;
	public readonly client: Client;
	public readonly database: Database;
	public readonly rl: readline.Interface;
	public readonly axios: AxiosInstance;
	private _modules: Module[] = [];

	public constructor(root: string) {
		this.root = root;
		this.config = new Config(root + "/config.json");
		this.client = new Client();
		this.database = new Database(root + "/bobcat.db");
		this.rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});

		this.axios = axios.create();
		this.axios.defaults.headers.common["User-Agent"] = "BobcatBot/" + global.version;
	}

	public get modules() {
		return this._modules;
	}

	public loadModule(mod: Module): boolean {
		if (this.modules.find((m: Module): boolean => m.name == mod.name)) {
			Logger.log("Tried to load module that already exists: " + mod.name, Logger.L_WARNING);
			return false;
		}
		for (let listener of mod.listeners) listener.attach();
		this.modules.push(mod);
		return true;
	}

	public unloadModule(name: string): Module {
		let mod: Module = this.modules.splice(this.modules.findIndex(
			(m: Module): boolean => m.name == name
		), 1)[0];
		for (let listener of mod.listeners) listener.detach();
		return mod;
	}

	public getModule(name: string): Module {
		return this.modules.find((m: Module): boolean => m.name == name);
	}

	public async start(): Promise<void> {
		console.log(`\n\n${"=".repeat(80)}\n\nLoading Config...`);
		this.config.load();

		Logger.log("Opening database...");
		this.database.open();
		this.database.create("bobcat");

		Logger.log("Loading modules...");
		let gpaths: string[] = (
			this.config.get("bobcat.modules.import") ?? []
		);

		let paths: string[] = [];
		for (let gpath of gpaths) {
			try {
				paths.push(...glob.sync(`${this.root}/dist/modules/${gpath}`));
			} catch (err) {
				Logger.log("Invalid path pattern " + gpath)
			}
		}

		Logger.log("Found " + paths.length + " modules", Logger.L_INFO);

		for (let mpath of paths) {
			let mod: Module;
			try {
				mod = require(mpath);
				this.loadModule(mod);
				Logger.log("Loaded module:", mpath, mod.name, Logger.L_INFO);
			} catch (err) {
				Logger.log("Failed to load module:", mpath, mod?.name, err, Logger.L_ERROR);
			}
		}

		Logger.log("Listening for commands...");
		this.promptCommand();
		this.client.on("message", (msg: Message): void => {
			global.bobcat.database.create(msg.channel.server?._id ?? msg.channel._id);
			let prefix = global.bobcat.database.get(msg.channel.server?._id, "bobcat.prefix") ?? "$";
			if (msg.content?.startsWith(prefix)) {
				msg.channel.startTyping();
				global.bobcat.command(msg.content.slice(prefix.length), msg);
				msg.channel.stopTyping();
			}
		});

		Logger.log("Logging into Revolt...", Logger.L_INFO);
		this.client.on("ready", (): void => {
			Logger.log("Ready!", Logger.L_INFO);
		});
		await this.client.loginBot(process.env.TOKEN);
		Logger.log("Logged in", Logger.L_INFO);
	}

	public async end(): Promise<void> {
		Logger.log("Logging out of Revolt...", Logger.L_INFO);
		await this.client.logout();
		Logger.log("Closing database...", Logger.L_INFO);
		this.database.close();
		Logger.log("Exiting process...", Logger.L_WARNING);
		process.exit(0);
	}

	public async command(cmd: string, msg: Message, sudo: boolean = false): Promise<void> {
		let args: string[] = cmd.split(" ");
		if (!args.length) return;
		Logger.log(`Received command '${cmd}' in #${msg?.channel._id}` + (sudo ? " (sudo)" : ""));

		for (let mod of this.modules) {
			for (let command of mod.commands) {
				if (command.names.includes(args[0])) {
					if (!sudo && msg?.channel?.server) {
						if (await AccessControl.getAccessLevel(msg.channel.server, msg.author) < command.accessLevel) {
							msg.reply(":x: You do not have permission to use this command");
							return;
						}
					}
					Logger.log("--> Handing to " + mod.name);
					let succ: boolean = await command.exec(args, msg);
					if (msg && !succ)
						msg.reply(":x: Error executing command.");
					return;
				}
			}
		}

		if (msg) msg.reply(":x: Command not found.");
	}

	public promptCommand() {
		this.rl.question("Bobcat> ", (cmd: string): void => {
			global.bobcat.command(cmd, null, true);
			global.bobcat.promptCommand();
		});
	}

	public async modfunc(modname: string, funcname: string, ...args: any[]): Promise<any> {
		let mod: Module = this.modules.find((m: Module): boolean => m.name == modname);
		if (!mod) {
			let err: Error = new Error(`Tried to execute function ${funcname} on nonexistent module ${modname}`);
			Logger.log(err.stack, Logger.L_ERROR);
			return err;
		}

		let func: ModuleFunction = mod.functions.find((f: ModuleFunction): boolean => f.name == funcname);
		if (!func) {
			let err: Error = new Error(`Tried to execute nonexistent function ${funcname} on module ${modname}`);
			Logger.log(err.stack, Logger.L_ERROR);
			return err;
		}

		return await func.exec(...args);
	}

	public findULID(str: string): string {
		if (!str) return null;
		return str.match(/[0-9A-HJKMNP-TV-Z]{26}/)?.[0];
	}
}
