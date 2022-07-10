/*
	Bobcat bot for Revolt
	crispycat <the@crispy.cat>
	https://crispy.cat/software/bobcat
	https://github.com/crispy-cat/bobcat
	Licensed under the GNU GPL v3 license
*/

import Format from "../utilities/Format";

export default class Logger {
	public static readonly L_NORMAL	= 0;
	public static readonly L_INFO	= 1;
	public static readonly L_WARNING= 2;
	public static readonly L_ERROR	= 3;
	public static readonly L_FATAL	= 4;

	public static log(...msg: any[]): string {
		if (msg.length == 0) return "";
		let level: number = this.L_NORMAL;
		if (msg.length > 1) level = msg.pop() as number;
		let time: string = Format.datetime();

		let li: string;
		switch (level) {
			case this.L_INFO:
				li = "I";
				break;
			case this.L_WARNING:
				li = "W";
				break;
			case this.L_ERROR:
				li = "E";
				break;
			case this.L_FATAL:
				li = "F";
				break;
			case this.L_NORMAL:
			default:
				li = "-";
		}

		let lmsg: string = `[Bobcat][${time}][${li}]: ${msg.join("\n--> ")}`;

		if (level >= this.L_WARNING) console.error(lmsg);
		else console.log(lmsg);

		if (level == this.L_FATAL) process.exit(-1);
		else return lmsg;
	}
}
