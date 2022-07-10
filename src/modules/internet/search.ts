/*
	Bobcat bot for Revolt
	crispycat <the@crispy.cat>
	https://crispy.cat/software/bobcat
	https://github.com/crispy-cat/bobcat
	Licensed under the GNU GPL v3 license
*/

import {AxiosResponse} from "axios";
import {Message} from "revolt.js";
import Logger from "../../core/utilities/Logger";
import Module from "../../core/modules/Module";
import Command from "../../core/modules/Command";
import Listener from "../../core/modules/Listener";
import ModuleFunction from "../../core/modules/ModuleFunction";
import AccessLevel from "../../core/permissions/AccessLevel";

const URBAN_ENDPOINT = "https://api.urbandictionary.com/v0/define?term=";
const WIKI_ENDPOINT_SEARCH = "https://en.wikipedia.org/w/api.php?action=opensearch&limit=1&namespace=0&format=json&search=";
const WIKI_ENDPOINT_PAGE = "https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&format=json&exchars=500&titles=";


let functions: ModuleFunction[] = [];


let commands: Command[] = [];

commands.push(new Command({
	names:		["urban"],
	args:		["<term>"],
	accessLevel:AccessLevel.NORMAL,
	description:"Define a term on Urban Dictionary",
	categories:	["Internet", "Search"],
	func:		async (args: string[], msg: Message): Promise<void> => {
		if (args.length < 2) {
			if (msg) msg.reply(":x: No term given");
			else Logger.log("No term given", Logger.L_WARNING);
			return;
		}

		let term: string = args.splice(1).join(" ");

		let response: AxiosResponse;
		try {
			response = await global.bobcat.axios.get(URBAN_ENDPOINT + term);
		} catch (err) {
			let errt: string = `:x: Server: ${err.response.status} ${err.response.statusText}`;
			if (msg) msg.reply(errt);
			else Logger.log(errt, Logger.L_WARNING);
			return;
		}

		if (response.data.list.length == 0) {
			if (msg) msg.reply(":x: Could not find a definition");
			else Logger.log("Could not find a definition");
			return;
		}

		let entry: {
			definition: string, example: string,
			author: string, permalink: string
		} = response.data.list[0];

		let out: string = "**" +
			((entry.definition.length <= 512) ? entry.definition :
				entry.definition.substring(0, 512) + "...") +
			`**\n*${entry.example}*\n` +
			`[Definition by ${entry.author}](${entry.permalink})`;

		if (msg) msg.reply({
			embeds: [{
				title: `${term} on Urban Dictionary`,
				description: out,
				colour: "#efff00"
			}]
		});
		else Logger.log(out);
	}
}));

commands.push(new Command({
	names:		["wikipedia", "wiki"],
	args:		["<term>"],
	accessLevel:AccessLevel.NORMAL,
	description:"Search a term on Wikipedia",
	categories:	["Internet, Search"],
	func:		async (args: string[], msg: Message): Promise<void> => {
		if (args.length < 2) {
			if (msg) msg.reply(":x: No term given");
			else Logger.log("No term given", Logger.L_WARNING);
			return;
		}

		let term: string = args.splice(1).join(" ");

		let response: AxiosResponse;
		try {
			response = await global.bobcat.axios.get(WIKI_ENDPOINT_SEARCH + term);
		} catch (err) {
			let errt: string = `:x: Server: ${err.response.status} ${err.response.statusText}`;
			if (msg) msg.reply(errt);
			else Logger.log(errt, Logger.L_WARNING);
			return;
		}

		let purl: string = response.data[3][0];

		try {
			response = await global.bobcat.axios.get(WIKI_ENDPOINT_PAGE + term);
		} catch (err) {
			let errt: string = `:x: Server: ${err.response.status} ${err.response.statusText}`;
			if (msg) msg.reply(errt);
			else Logger.log(errt, Logger.L_WARNING);
			return;
		}

		let pid: string = Object.keys(response.data.query.pages)[0];
		let page: {title: string, extract: string} = response.data.query.pages[pid];

		if (msg) msg.reply({
			embeds: [{
				title: `${page.title} on Wikipedia`,
				description: `${page.extract}\n[View article](${purl})`,
				colour: "#006699"
			}]
		});
		else Logger.log(`${purl} | ${page.extract}`);
	}
}));


let listeners: Listener[] = [];


export = new Module({
	name:		"internet.search",
	author:		"@crispycat",
	version:	global.version,
	hidden:		false,
	commands:	commands,
	listeners:	listeners,
	functions:	functions
});
