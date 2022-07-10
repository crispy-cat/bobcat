/*
	Bobcat bot for Revolt
	crispycat <the@crispy.cat>
	https://crispy.cat/software/bobcat
	https://github.com/crispy-cat/bobcat
	Licensed under the GNU GPL v3 license
*/

import {User, Server, Member} from "revolt.js";
import AccessLevel from "./AccessLevel";

export default class AccessControl {
	public static async getAccessLevel(server: Server, user: User): Promise<AccessLevel> {
		let bot_owners: string[] = global.bobcat.config.get("bobcat.accesslevels.bot_owner") ?? [];
		if (bot_owners.includes(user._id)) return AccessLevel.BOT_OWNER;

		let bot_admins: string[] = global.bobcat.config.get("bobcat.accesslevels.bot_admin") ?? [];
		if (bot_admins.includes(user._id)) return AccessLevel.BOT_ADMIN;

		let banned: string[] = global.bobcat.config.get("bobcat.accesslevels.banned") ?? [];
		if (banned.includes(user._id)) return AccessLevel.BOTBAN;

		let member: Member = await server.fetchMember(user);

		let owners: string[] = global.bobcat.config.get("bobcat.accesslevels.owner") ?? [];
		owners.push(server.owner);
		if (owners.includes(user._id)) return AccessLevel.OWNER;

		let admins: string[] = global.bobcat.config.get("bobcat.accesslevels.admin") ?? [];
		if (admins.includes(user._id)) return AccessLevel.ADMIN;

		let mods: string[] = global.bobcat.config.get("bobcat.accesslevels.mod") ?? [];
		if (mods.includes(user._id)) return AccessLevel.MOD;

		let highest: AccessLevel = AccessLevel.NORMAL;
		for (let id of [user._id, ...(member.roles || [])]) {
			highest = Math.min(AccessLevel.OWNER, Math.max(highest,
				global.bobcat.database.get(server._id, `bobcat.config.access.${id}`) ?? AccessLevel.NORMAL));
		}

		return highest;
	}

	public static nameAccessLevel(level: AccessLevel): string {
		switch (level) {
			case AccessLevel.BOTBAN:
				return "Bot Ban";
			case AccessLevel.NORMAL:
				return "Normal";
			case AccessLevel.MOD:
				return "Mod";
			case AccessLevel.ADMIN:
				return "Admin";
			case AccessLevel.OWNER:
				return "Owner";
			case AccessLevel.BOT_ADMIN:
				return "Bot Admin";
			case AccessLevel.BOT_OWNER:
				return "Bot Owner";
			default:
				return "Access Level " + level;
		}
	}
}
