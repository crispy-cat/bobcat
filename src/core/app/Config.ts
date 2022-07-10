/*
	Bobcat bot for Revolt
	crispycat <the@crispy.cat>
	https://crispy.cat/software/bobcat
	https://github.com/crispy-cat/bobcat
	Licensed under the GNU GPL v3 license
*/

import FS from "fs";

export default class Config {
	private cpath: string;
	private configData: object = {};

	public constructor(cpath: string) {
		this.cpath = cpath;
	}

	public load(): void {
		try {
			let data: string = FS.readFileSync(this.cpath).toString();
			this.configData = JSON.parse(data);
		} catch (err) {
			console.error(`Bot config could not be loaded: ${err}`);
			process.exit(-2);
		}
	}

	public get(key: string): any {
		let parts: string[] = key.split(".");
		let value: object = this.configData;
		while (parts[0] && value)
			value = value?.[parts.shift()];
		return value;
	}
}
