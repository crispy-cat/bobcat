/*
	Bobcat bot for Revolt
	crispycat <the@crispy.cat>
	https://crispy.cat/software/bobcat
	https://github.com/crispy-cat/bobcat
	Licensed under the GNU GPL v3 license
*/

import {Role} from "revolt-api";
import {Server, Member, Channel} from "revolt.js";
import Logger from "../utilities/Logger";

export default class RevoltUtils {
	public static async findMember(server: Server, text: string): Promise<Member> {
		let ulid: string = global.bobcat.findULID(text);
		try {
			if (ulid) return await server.fetchMember(ulid);
			else return (await server.fetchMembers()).members
				.find((m: Member) => m.user.username == text.replace(/^@/, ""));
		} catch (err) {
			Logger.log(err, Logger.L_WARNING);
			return null;
		}
	}

	public static findRole(server: Server, text: string): {id: string, role: Role} {
		let ulid: string = global.bobcat.findULID(text);
		if (ulid) {
			return {
				id: ulid,
				role: server.roles[ulid]
			};
		} else {
			for (let i in server.roles) {
				if (server.roles[i].name == text) {
					return {
						id: i,
						role: server.roles[i]
					};
				}
			}
		}
		return null;
	}

	public static findChannel(server: Server, text: string): Channel {
		let ulid: string = global.bobcat.findULID(text);
		if (ulid) return server.channels.find((c: Channel) => c._id == ulid);
		else return server.channels
			.find((c: Channel) => c.name == text.replace(/^#/, ""));
	}
}
