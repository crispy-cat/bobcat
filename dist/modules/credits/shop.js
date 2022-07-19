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
const Table_1 = __importDefault(require("../../core/utilities/Table"));
const RevoltUtils_1 = __importDefault(require("../../core/utilities/RevoltUtils"));
const Module_1 = __importDefault(require("../../core/modules/Module"));
const Command_1 = __importDefault(require("../../core/modules/Command"));
const MONEYGREEN = "#118c4f";
let functions = [];
let commands = [];
commands.push(new Command_1.default({
    names: ["shop:buy", "buy"],
    args: ["<id>"],
    accessLevel: 0 /* AccessLevel.NORMAL */,
    description: "Buy something from the shop",
    categories: ["Credits"],
    func: (args, msg) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        if (!(msg === null || msg === void 0 ? void 0 : msg.channel.server)) {
            if (msg)
                msg.reply("This command must be executed in a server");
            else
                Logger_1.default.log("This command must be executed in a server", Logger_1.default.L_WARNING);
            return;
        }
        if (args.length < 2) {
            msg.reply(":x: Not enough arguments");
            return;
        }
        let iid = parseInt(args[1]);
        if (isNaN(iid)) {
            msg.reply(":x: Invalid item");
            return;
        }
        let item = ((_a = global.bobcat.database.get(msg.channel.server._id, "bobcat.credits.shop.items")) !== null && _a !== void 0 ? _a : [])[iid];
        if (!item) {
            msg.reply(":x: No item with that ID");
            return;
        }
        let bal = (_b = global.bobcat.database.get(msg.channel.server._id, `bobcat.credits.balance.${msg.author._id}`)) !== null && _b !== void 0 ? _b : 0;
        if (bal < item.price) {
            msg.reply(":x: Insufficient funds");
            return;
        }
        bal -= item.price;
        let target = yield msg.channel.server.fetchMember(msg.author._id);
        switch (item.type) {
            case "role": {
                let r = RevoltUtils_1.default.findRole(msg.channel.server, item.data.role_id);
                if (!r) {
                    msg.reply(":x: We're sorry, your transaction cannot be processed at this time.");
                    return;
                }
                let roles = target.roles || [];
                if (!roles.includes(r.id))
                    roles.push(r.id);
                yield target.edit({
                    roles: roles
                });
                break;
            }
            default: {
                msg.reply(":x: We're sorry, your transaction cannot be processed at this time.");
                return;
            }
        }
        global.bobcat.database.set(msg.channel.server._id, `bobcat.credits.balance.${msg.author._id}`, bal);
        msg.reply(`:white_check_mark: New balance: ${bal.toFixed(5)} credits`);
    })
}));
commands.push(new Command_1.default({
    names: ["shop:list", "shop"],
    args: [],
    accessLevel: 0 /* AccessLevel.NORMAL */,
    description: "Get a list of items in the shop",
    categories: ["Credits"],
    func: (args, msg) => __awaiter(void 0, void 0, void 0, function* () {
        var _c;
        var _d;
        if (!(msg === null || msg === void 0 ? void 0 : msg.channel.server)) {
            if (msg)
                msg.reply("This command must be executed in a server");
            else
                Logger_1.default.log("This command must be executed in a server", Logger_1.default.L_WARNING);
            return;
        }
        let items = global.bobcat.database.get(msg.channel.server._id, "bobcat.credits.shop.items");
        if (!items || !items.length) {
            msg.reply(":warning: This server has no shop items at this time.");
            return;
        }
        let tables = {};
        for (let i in items) {
            let item = items[i];
            (_c = tables[_d = item.type]) !== null && _c !== void 0 ? _c : (tables[_d] = new Table_1.default([["ID", "Name", "Price", "Details"]]));
            let details;
            switch (item.type) {
                case "role":
                    details = `Role name: \`${item.data.role_name}\``;
                    break;
                case "unknown":
                default:
                    details = "*unknown*";
            }
            tables[item.type].setRow(tables[item.type].numRows(), [i, item.name, item.price.toFixed(5), details]);
        }
        let out = "";
        for (let type in tables)
            out += `**${type}:**\n${tables[type].toString()}`;
        msg.reply({
            embeds: [{
                    title: "Shop",
                    description: out,
                    colour: MONEYGREEN
                }]
        });
    })
}));
commands.push(new Command_1.default({
    names: ["shop:add"],
    args: ["[properties]"],
    accessLevel: 3 /* AccessLevel.OWNER */,
    description: "Add an item to the shop",
    categories: ["Credits"],
    func: (args, msg) => __awaiter(void 0, void 0, void 0, function* () {
        if (!(msg === null || msg === void 0 ? void 0 : msg.channel.server)) {
            if (msg)
                msg.reply("This command must be executed in a server");
            else
                Logger_1.default.log("This command must be executed in a server", Logger_1.default.L_WARNING);
            return;
        }
        if (args.length < 2) {
            let prefix = global.bobcat.getPrefix(msg.channel.server);
            msg.reply(`Syntax: \`${prefix}shop:add prop1=val, prop2="val", ...\`\n` +
                "Required properties: name, type, price\n" +
                "Parameters for type=role: role\n");
            return;
        }
        let matches = args.splice(1).join(" ").matchAll(/([a-z0-9_]+)="?([^"]+?)"?(?:,|$)/gi);
        let props = {};
        for (let m of matches)
            props[m[1]] = m[2];
        let price = parseFloat(props.price);
        if (isNaN(price)) {
            msg.reply(":x: Invalid price");
            return;
        }
        let item = {
            name: props.name,
            type: props.type,
            price: price,
            data: {}
        };
        switch (item.type) {
            case "role": {
                let role = RevoltUtils_1.default.findRole(msg.channel.server, props.role);
                if (!role) {
                    msg.reply(":x: Invalid role");
                    return;
                }
                item.data.role_id = role.id;
                item.data.role_name = role.role.name;
                break;
            }
        }
        let items = global.bobcat.database.get(msg.channel.server._id, "bobcat.credits.shop.items") || [];
        items.push(item);
        global.bobcat.database.set(msg.channel.server._id, "bobcat.credits.shop.items", items);
        msg.reply(":white_check_mark: Items updated");
    })
}));
commands.push(new Command_1.default({
    names: ["shop:remove"],
    args: ["<id>"],
    accessLevel: 3 /* AccessLevel.OWNER */,
    description: "Remove an item from the shop",
    categories: ["Credits"],
    func: (args, msg) => __awaiter(void 0, void 0, void 0, function* () {
        if (!(msg === null || msg === void 0 ? void 0 : msg.channel.server)) {
            if (msg)
                msg.reply("This command must be executed in a server");
            else
                Logger_1.default.log("This command must be executed in a server", Logger_1.default.L_WARNING);
            return;
        }
        if (args.length < 2) {
            msg.reply(":x: Not enough arguments");
            return;
        }
        let id = parseInt(args[1]);
        if (isNaN(id) || id < 0) {
            msg.reply(":x: Invalid ID");
            return;
        }
        let items = global.bobcat.database.get(msg.channel.server._id, "bobcat.credits.shop.items") || [];
        if (id > items.length) {
            msg.reply(":x: Invalid ID");
            return;
        }
        items.splice(id, 1);
        global.bobcat.database.set(msg.channel.server._id, "bobcat.credits.shop.items", items);
        msg.reply(":white_check_mark: Items updated");
    })
}));
commands.push(new Command_1.default({
    names: ["shop:chprice"],
    args: ["<id>", "<new price>"],
    accessLevel: 3 /* AccessLevel.OWNER */,
    description: "Change the price of an item in the shop",
    categories: ["Credits"],
    func: (args, msg) => __awaiter(void 0, void 0, void 0, function* () {
        if (!(msg === null || msg === void 0 ? void 0 : msg.channel.server)) {
            if (msg)
                msg.reply("This command must be executed in a server");
            else
                Logger_1.default.log("This command must be executed in a server", Logger_1.default.L_WARNING);
            return;
        }
        if (args.length < 3) {
            msg.reply(":x: Not enough arguments");
            return;
        }
        let id = parseInt(args[1]);
        if (isNaN(id) || id < 0) {
            msg.reply(":x: Invalid ID");
            return;
        }
        let price = parseFloat(args[2]);
        if (isNaN(price) || price < 0) {
            msg.reply(":x: Invalid price");
            return;
        }
        let items = global.bobcat.database.get(msg.channel.server._id, "bobcat.credits.shop.items") || [];
        if (id > items.length) {
            msg.reply(":x: Invalid ID");
            return;
        }
        items[id].price = price;
        global.bobcat.database.set(msg.channel.server._id, "bobcat.credits.shop.items", items);
        msg.reply(":white_check_mark: Item updated");
    })
}));
let listeners = [];
module.exports = new Module_1.default({
    name: "credits.shop",
    author: "@crispycat",
    version: global.version,
    hidden: false,
    commands: commands,
    listeners: listeners,
    functions: functions
});
