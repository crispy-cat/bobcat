/*
	Bobcat bot for Revolt
	crispycat <the@crispy.cat>
	https://crispy.cat/software/bobcat
	https://github.com/crispy-cat/bobcat
	Licensed under the GNU GPL v3 license
*/

import {Message, Member} from "revolt.js";
import {Role} from "revolt-api";
import Logger from "../../core/utilities/Logger";
import Table from "../../core/utilities/Table";
import RevoltUtils from "../../core/utilities/RevoltUtils";
import Module from "../../core/modules/Module";
import Command from "../../core/modules/Command";
import Listener from "../../core/modules/Listener";
import ModuleFunction from "../../core/modules/ModuleFunction";
import AccessLevel from "../../core/permissions/AccessLevel";
import AccessControl from "../../core/permissions/AccessControl";

interface ShopItem {
	name: string,
	type: string,
	price: number,
	data: Partial<{
		role_id: string,
		role_name: string
	}>
}

const MONEYGREEN = "#118c4f";

let functions: ModuleFunction[] = [];

let commands: Command[] = [];

commands.push(new Command({
	names:		["shop:buy", "buy"],
	args:		["<id>"],
	accessLevel:AccessLevel.NORMAL,
	description: "Buy something from the shop",
	categories:	["Credits"],
	func:		async (args: string[], msg: Message): Promise<void> => {
		if (!msg?.channel.server) {
			if (msg) msg.reply("This command must be executed in a server");
			else Logger.log("This command must be executed in a server", Logger.L_WARNING);
			return;
		}
		if (args.length < 2) {
			msg.reply(":x: Not enough arguments");
			return;
		}

		let iid: number = parseInt(args[1]);
		if (isNaN(iid)) {
			msg.reply(":x: Invalid item");
			return;
		}

		let item: ShopItem = (global.bobcat.database.get(
			msg.channel.server._id,
			"bobcat.credits.shop.items"
		) ?? [])[iid];
		if (!item) {
			msg.reply(":x: No item with that ID");
			return;
		}

		let bal: number = global.bobcat.database.get(
			msg.channel.server._id,
			`bobcat.credits.balance.${msg.author._id}`
		) ?? 0;
		if (bal < item.price) {
			msg.reply(":x: Insufficient funds");
			return;
		}
		bal -= item.price;

		let target: Member = await msg.channel.server.fetchMember(msg.author._id);

		switch (item.type) {
			case "role": {
				let r: {id: string, role: Role} = RevoltUtils.findRole(msg.channel.server, item.data.role_id);
				if (!r) {
					msg.reply(":x: We're sorry, your transaction cannot be processed at this time.");
					return;
				}
				let roles: string[] = target.roles || [];
				if (!roles.includes(r.id))
					roles.push(r.id);
				await target.edit({
					roles: roles
				});
				break;
			}
			default: {
				msg.reply(":x: We're sorry, your transaction cannot be processed at this time.");
				return;
			}
		}

		global.bobcat.database.set(
			msg.channel.server._id,
			`bobcat.credits.balance.${msg.author._id}`,
			bal
		);

		msg.reply(`:white_check_mark: New balance: ${bal.toFixed(5)} credits`);
	}
}));

commands.push(new Command({
	names:		["shop:list", "shop"],
	args:		[],
	accessLevel:AccessLevel.NORMAL,
	description: "Get a list of items in the shop",
	categories:	["Credits"],
	func:		async (args: string[], msg: Message): Promise<void> => {
		if (!msg?.channel.server) {
			if (msg) msg.reply("This command must be executed in a server");
			else Logger.log("This command must be executed in a server", Logger.L_WARNING);
			return;
		}

		let items: ShopItem[] = global.bobcat.database.get(
			msg.channel.server._id,
			"bobcat.credits.shop.items"
		);
		if (!items || !items.length) {
			msg.reply(":warning: This server has no shop items at this time.");
			return;
		}

		let tables: {[k: string]: Table} = {};
		for (let i in items) {
			let item: ShopItem = items[i];
			tables[item.type] ??= new Table([["ID", "Name", "Price", "Details"]]);

			let details: string;
			switch (item.type) {
				case "role":
					details = `Role name: \`${item.data.role_name}\``;
					break;
				case "unknown":
				default:
					details = "*unknown*";
			}

			tables[item.type].setRow(
				tables[item.type].numRows(),
				[i, item.name, item.price.toFixed(5), details]
			);
		}

		let out: string = "";
		for (let type in tables)
		out += `**${type}:**\n${tables[type].toString()}`;

		msg.reply({
			embeds: [{
				title: "Shop",
				description: out,
				colour: MONEYGREEN
			}]
		})
	}
}));

commands.push(new Command({
	names:		["shop:add"],
	args:		["[properties]"],
	accessLevel:AccessLevel.OWNER,
	description: "Add an item to the shop",
	categories:	["Credits"],
	func:		async (args: string[], msg: Message): Promise<void> => {
		if (!msg?.channel.server) {
			if (msg) msg.reply("This command must be executed in a server");
			else Logger.log("This command must be executed in a server", Logger.L_WARNING);
			return;
		}
		if (args.length < 2) {
			let prefix: string = global.bobcat.getPrefix(msg.channel.server);
			msg.reply(
				`Syntax: \`${prefix}shop:add prop1=val, prop2="val", ...\`\n` +
				"Required properties: name, type, price\n" +
				"Parameters for type=role: role\n"
			);
			return;
		}

		let matches = args.splice(1).join(" ").matchAll(/([a-z0-9_]+)="?([^"]+?)"?(?:,|$)/gi);
		let props: {[k: string]: string} = {};
		for (let m of matches) props[m[1]] = m[2];

		let price: number = parseFloat(props.price);
		if (isNaN(price)) {
			msg.reply(":x: Invalid price");
			return;
		}

		let item: ShopItem = {
			name: props.name,
			type: props.type,
			price: price,
			data: {}
		};

		switch (item.type) {
			case "role": {
				let role = RevoltUtils.findRole(msg.channel.server, props.role);
				if (!role) {
					msg.reply(":x: Invalid role");
					return;
				}
				item.data.role_id = role.id;
				item.data.role_name = role.role.name;
				break;
			}
		}

		let items: ShopItem[] = global.bobcat.database.get(
			msg.channel.server._id,
			"bobcat.credits.shop.items"
		) || [];

		items.push(item);

		global.bobcat.database.set(
			msg.channel.server._id,
			"bobcat.credits.shop.items",
			items
		);

		msg.reply(":white_check_mark: Items updated");
	}
}));

commands.push(new Command({
	names:		["shop:remove"],
	args:		["<id>"],
	accessLevel:AccessLevel.OWNER,
	description: "Remove an item from the shop",
	categories:	["Credits"],
	func:		async (args: string[], msg: Message): Promise<void> => {
		if (!msg?.channel.server) {
			if (msg) msg.reply("This command must be executed in a server");
			else Logger.log("This command must be executed in a server", Logger.L_WARNING);
			return;
		}
		if (args.length < 2) {
			msg.reply(":x: Not enough arguments");
			return;
		}

		let id: number = parseInt(args[1]);
		if (isNaN(id) || id < 0) {
			msg.reply(":x: Invalid ID");
			return;
		}

		let items: ShopItem[] = global.bobcat.database.get(
			msg.channel.server._id,
			"bobcat.credits.shop.items"
		) || [];
		if (id > items.length) {
			msg.reply(":x: Invalid ID");
			return;
		}

		items.splice(id, 1);

		global.bobcat.database.set(
			msg.channel.server._id,
			"bobcat.credits.shop.items",
			items
		);

		msg.reply(":white_check_mark: Items updated");
	}
}));

commands.push(new Command({
	names:		["shop:chprice"],
	args:		["<id>", "<new price>"],
	accessLevel:AccessLevel.OWNER,
	description: "Change the price of an item in the shop",
	categories:	["Credits"],
	func:		async (args: string[], msg: Message): Promise<void> => {
		if (!msg?.channel.server) {
			if (msg) msg.reply("This command must be executed in a server");
			else Logger.log("This command must be executed in a server", Logger.L_WARNING);
			return;
		}
		if (args.length < 3) {
			msg.reply(":x: Not enough arguments");
			return;
		}

		let id: number = parseInt(args[1]);
		if (isNaN(id) || id < 0) {
			msg.reply(":x: Invalid ID");
			return;
		}

		let price: number = parseFloat(args[2]);
		if (isNaN(price) || price < 0) {
			msg.reply(":x: Invalid price");
			return;
		}

		let items: ShopItem[] = global.bobcat.database.get(
			msg.channel.server._id,
			"bobcat.credits.shop.items"
		) || [];
		if (id > items.length) {
			msg.reply(":x: Invalid ID");
			return;
		}

		items[id].price = price;

		global.bobcat.database.set(
			msg.channel.server._id,
			"bobcat.credits.shop.items",
			items
		);

		msg.reply(":white_check_mark: Item updated");
	}
}));


let listeners: Listener[] = [];


export = new Module({
	name:		"credits.shop",
	author:		"@crispycat",
	version:	global.version,
	hidden:		false,
	commands:	commands,
	listeners:	listeners,
	functions:	functions
});
