/*
	Bobcat bot for Revolt
	crispycat <the@crispy.cat>
	https://crispy.cat/software/bobcat
	https://github.com/crispy-cat/bobcat
	Licensed under the GNU GPL v3 license
*/

import Logger from "../utilities/Logger";

const PROPS_REGEX = /([a-z0-9_]+)\s*[=:]\s*(?:(?:"([^"]+)")|(?:'([^']+)')|(?:`([^`]+)`)|([^\s,]+))\s*(?:,|$)/gi;
const TIME_REGEX = /^(?:(\d+)d?)?(?:(\d+)h?)?(?:(\d+)m?)?(?:(\d+)s?)?$/i;
const ULID_REGEX = /[0-9A-HJKMNP-TV-Z]{26}/i;

export default class ParseUtils {
	public static parseULID(str: string): string {
		if (!str) return null;
		return str.match(ULID_REGEX)?.[0]?.toUpperCase();
	}

	public static parseProperties(text: string): {[k: string]: string} {
		let matches = text.matchAll(PROPS_REGEX);
		let props: {[k: string]: string} = {};
		for (let m of matches) props[m[1]] = m[2] ?? m[3] ?? m[4] ?? m[5];
		return props;
	}

	public static boolean(text: string): boolean {
		switch (text) {
			case "true":
			case "yes":
			case "on":
			case "1":
				return true;
			case "false":
			case "no":
			case "off":
			case "0":
			default:
				return false;
		}
	}

	public static time(text: string): number {
		let time: number = 0;
		let matches: string[] = text.match(TIME_REGEX);
		let d: number = parseInt(matches[1]);
		let h: number = parseInt(matches[2]);
		let m: number = parseInt(matches[3]);
		let s: number = parseInt(matches[4]);
		time += ((!isNaN(d)) ? d : 0) * 24*60*60*1000;
		time += ((!isNaN(h)) ? h : 0) * 60*60*1000;
		time += ((!isNaN(m)) ? m : 0) * 60*1000;
		time += ((!isNaN(s)) ? s : 0) * 1000;
		return time;
	}
}
