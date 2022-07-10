/*
	Bobcat bot for Revolt
	crispycat <the@crispy.cat>
	https://crispy.cat/software/bobcat
	https://github.com/crispy-cat/bobcat
	Licensed under the GNU GPL v3 license
*/

import Logger from "../utilities/Logger";

interface MFFunc {
	(...args: any[]): any
}

interface ModuleFunctionI {
	name: string,
	func: MFFunc
}

export default class ModuleFunction {
	public readonly name: string;
	public readonly func: MFFunc;

	public constructor(func: ModuleFunctionI) {
		this.name = func.name;
		this.func = func.func;
	}

	public async exec(...args: any[]): Promise<any> {
		try {
			return await this.func.call(this, ...args);
		} catch (err) {
			Logger.log("ModuleFunction failed:", this.name, err.stack, Logger.L_ERROR);
			return err;
		}
	}
}
