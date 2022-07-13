/*
	Bobcat bot for Revolt
	crispycat <the@crispy.cat>
	https://crispy.cat/software/bobcat
	https://github.com/crispy-cat/bobcat
	Licensed under the GNU GPL v3 license
*/

import {EventEmitter} from "events";
import Logger from "../utilities/Logger";

interface ListenerFunc {
	(...args: any[]): void
}

interface ListenerI {
	name: string,
	obj: EventEmitter,
	event: string,
	func: ListenerFunc
}

export default class Listener {
	public readonly name: string;
	public readonly obj: EventEmitter;
	public readonly event: string;
	public readonly func: ListenerFunc;

	public constructor(listener: ListenerI) {
		this.name = listener.name;
		this.obj = listener.obj;
		this.event = listener.event;
		this.func = listener.func;
		this.exec = this.exec.bind(this);
	}

	public attach(): void {
		this.obj.on(this.event, this.exec);
	}

	public detach(): void {
		this.obj.off(this.event, this.exec);
	}

	public async exec(...args: any[]): Promise<void> {
		try {
			await this.func.call(this, ...args);
		} catch (err) {
			Logger.log("Listener failed:", this.name, err.stack, Logger.L_ERROR);
		}
	}
}
