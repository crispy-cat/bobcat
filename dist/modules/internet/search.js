"use strict";
/*
    Bobcat bot for Revolt
    crispycat <the@crispy.cat>
    https://crispy.cat/software/bobcat
    https://github.com/crispy-cat/bobcat
    Licensed under the GNU GPL v3 license
*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const Logger_1 = __importDefault(require("../../core/utilities/Logger"));
const Module_1 = __importDefault(require("../../core/modules/Module"));
const Command_1 = __importDefault(require("../../core/modules/Command"));
const URBAN_ENDPOINT = "https://api.urbandictionary.com/v0/define?term=";
const WIKI_ENDPOINT_SEARCH = "https://en.wikipedia.org/w/api.php?action=opensearch&limit=1&namespace=0&format=json&search=";
const WIKI_ENDPOINT_PAGE = "https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&format=json&exchars=500&titles=";
let functions = [];
let commands = [];
commands.push(new Command_1.default({
    names: ["urban"],
    args: ["<term>"],
    accessLevel: 0 /* AccessLevel.NORMAL */,
    description: "Define a term on Urban Dictionary",
    categories: ["Internet", "Search"],
    func: (args, msg) => __awaiter(void 0, void 0, void 0, function* () {
        if (args.length < 2) {
            if (msg)
                msg.reply(":x: No term given");
            else
                Logger_1.default.log("No term given", Logger_1.default.L_WARNING);
            return;
        }
        let term = args.splice(1).join(" ");
        let response;
        try {
            response = yield global.bobcat.axios.get(URBAN_ENDPOINT + term);
        }
        catch (err) {
            let errt = `:x: Server: ${err.response.status} ${err.response.statusText}`;
            if (msg)
                msg.reply(errt);
            else
                Logger_1.default.log(errt, Logger_1.default.L_WARNING);
            return;
        }
        if (response.data.list.length == 0) {
            if (msg)
                msg.reply(":x: Could not find a definition");
            else
                Logger_1.default.log("Could not find a definition");
            return;
        }
        let entry = response.data.list[0];
        let out = "**" +
            ((entry.definition.length <= 512) ? entry.definition :
                entry.definition.substring(0, 512) + "...") +
            `**\n*${entry.example}*\n` +
            `[Definition by ${entry.author}](${entry.permalink})`;
        if (msg)
            msg.reply({
                embeds: [{
                        title: `${term} on Urban Dictionary`,
                        description: out,
                        colour: "#efff00"
                    }]
            });
        else
            Logger_1.default.log(out);
    })
}));
commands.push(new Command_1.default({
    names: ["wikipedia", "wiki"],
    args: ["<term>"],
    accessLevel: 0 /* AccessLevel.NORMAL */,
    description: "Search a term on Wikipedia",
    categories: ["Internet, Search"],
    func: (args, msg) => __awaiter(void 0, void 0, void 0, function* () {
        if (args.length < 2) {
            if (msg)
                msg.reply(":x: No term given");
            else
                Logger_1.default.log("No term given", Logger_1.default.L_WARNING);
            return;
        }
        let term = args.splice(1).join(" ");
        let response;
        try {
            response = yield global.bobcat.axios.get(WIKI_ENDPOINT_SEARCH + term);
        }
        catch (err) {
            let errt = `:x: Server: ${err.response.status} ${err.response.statusText}`;
            if (msg)
                msg.reply(errt);
            else
                Logger_1.default.log(errt, Logger_1.default.L_WARNING);
            return;
        }
        let purl = response.data[3][0];
        try {
            response = yield global.bobcat.axios.get(WIKI_ENDPOINT_PAGE + term);
        }
        catch (err) {
            let errt = `:x: Server: ${err.response.status} ${err.response.statusText}`;
            if (msg)
                msg.reply(errt);
            else
                Logger_1.default.log(errt, Logger_1.default.L_WARNING);
            return;
        }
        let pid = Object.keys(response.data.query.pages)[0];
        let page = response.data.query.pages[pid];
        if (msg)
            msg.reply({
                embeds: [{
                        title: `${page.title} on Wikipedia`,
                        description: `${page.extract}\n[View article](${purl})`,
                        colour: "#006699"
                    }]
            });
        else
            Logger_1.default.log(`${purl} | ${page.extract}`);
    })
}));
let listeners = [];
module.exports = new Module_1.default({
    name: "internet.search",
    author: "@crispycat",
    version: global.version,
    hidden: false,
    commands: commands,
    listeners: listeners,
    functions: functions
});
