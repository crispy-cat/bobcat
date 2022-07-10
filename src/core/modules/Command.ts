/*
	Bobcat bot for Revolt
	crispycat <the@crispy.cat>
	https://crispy.cat/software/bobcat
	https://github.com/crispy-cat/bobcat
	Licensed under the GNU GPL v3 license
*/

import Logger from "../utilities/Logger";
import AccessLevel from "../permissions/AccessLevel";
import {Message} from "revolt.js";

interface CommandFunc {
	(args: string[], msg: Message): void
}

interface CommandI {
	names: string[],
	args: string[],
	accessLevel: AccessLevel,
	description: string,
	categories: string[],
	func: CommandFunc
}

export default class Command {
	public readonly names: string[];
	public readonly args: string[];
	public readonly accessLevel: AccessLevel;
	public readonly description: string;
	public readonly categories: string[];
	public readonly func: CommandFunc;

	public constructor (command: CommandI) {
		this.names = command.names;
		this.args = command.args;
		this.accessLevel = command.accessLevel;
		this.description = command.description;
		this.categories = command.categories;
		this.func = command.func;
	}

	public async exec(args: string[], msg: Message): Promise<boolean> {
		try {
			await this.func.call(this, args, msg);
			return true;
		} catch (err) {
			Logger.log("Command failed:", this.names[0], err.stack, Logger.L_ERROR);
			return false;
		}
	}
}
