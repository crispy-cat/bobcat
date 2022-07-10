/*
	Bobcat bot for Revolt
	crispycat <the@crispy.cat>
	https://crispy.cat/software/bobcat
	https://github.com/crispy-cat/bobcat
	Licensed under the GNU GPL v3 license
*/

import Command from "./Command";
import Listener from "./Listener";
import ModuleFunction from "./ModuleFunction";

interface ModuleI {
	name: string,
	author: string,
	version: string,
	hidden: boolean,
	commands: Command[],
	listeners: Listener[],
	functions: ModuleFunction[]
}

export default class Module {
	public readonly name: string;
	public readonly author: string;
	public readonly version: string;
	public readonly hidden: boolean;
	public readonly commands: Command[];
	public readonly listeners: Listener[];
	public readonly functions: ModuleFunction[];

	public constructor(data: ModuleI) {
		this.name = data.name;
		this.author = data.author;
		this.version = data.version;
		this.hidden = data.hidden;
		this.commands = data.commands;
		this.listeners = data.listeners;
		this.functions = data.functions;
	}
}
