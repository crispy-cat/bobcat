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
Object.defineProperty(exports, "__esModule", { value: true });
class AccessControl {
    static getAccessLevel(server, user) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        return __awaiter(this, void 0, void 0, function* () {
            let bot_owners = (_a = global.bobcat.config.get("bobcat.accesslevels.bot_owner")) !== null && _a !== void 0 ? _a : [];
            if (bot_owners.includes(user._id))
                return 5 /* AccessLevel.BOT_OWNER */;
            let bot_admins = (_b = global.bobcat.config.get("bobcat.accesslevels.bot_admin")) !== null && _b !== void 0 ? _b : [];
            if (bot_admins.includes(user._id))
                return 4 /* AccessLevel.BOT_ADMIN */;
            let banned = (_c = global.bobcat.config.get("bobcat.accesslevels.banned")) !== null && _c !== void 0 ? _c : [];
            if (banned.includes(user._id))
                return -1 /* AccessLevel.BOTBAN */;
            let member = yield server.fetchMember(user);
            let owners = (_d = global.bobcat.config.get("bobcat.accesslevels.owner")) !== null && _d !== void 0 ? _d : [];
            owners.push(server.owner);
            if (owners.includes(user._id))
                return 3 /* AccessLevel.OWNER */;
            let admins = (_e = global.bobcat.config.get("bobcat.accesslevels.admin")) !== null && _e !== void 0 ? _e : [];
            if (admins.includes(user._id))
                return 2 /* AccessLevel.ADMIN */;
            let mods = (_f = global.bobcat.config.get("bobcat.accesslevels.mod")) !== null && _f !== void 0 ? _f : [];
            if (mods.includes(user._id))
                return 1 /* AccessLevel.MOD */;
            let highest = 0 /* AccessLevel.NORMAL */;
            for (let id of [user._id, ...((_g = member.roles) !== null && _g !== void 0 ? _g : [])]) {
                highest = Math.min(3 /* AccessLevel.OWNER */, Math.max(highest, (_h = global.bobcat.database.get(server._id, `bobcat.config.access.${id}`)) !== null && _h !== void 0 ? _h : 0 /* AccessLevel.NORMAL */));
            }
            return highest;
        });
    }
    static nameAccessLevel(level) {
        switch (level) {
            case -1 /* AccessLevel.BOTBAN */:
                return "Bot Ban";
            case 0 /* AccessLevel.NORMAL */:
                return "Normal";
            case 1 /* AccessLevel.MOD */:
                return "Mod";
            case 2 /* AccessLevel.ADMIN */:
                return "Admin";
            case 3 /* AccessLevel.OWNER */:
                return "Owner";
            case 4 /* AccessLevel.BOT_ADMIN */:
                return "Bot Admin";
            case 5 /* AccessLevel.BOT_OWNER */:
                return "Bot Owner";
            default:
                return "Invalid Access Level " + level;
        }
    }
    static alFromText(text, min, max) {
        let level;
        switch (text.toLowerCase()) {
            case "mod":
            case "1":
                level = 1 /* AccessLevel.MOD */;
                break;
            case "admin":
            case "2":
                level = 2 /* AccessLevel.ADMIN */;
                break;
            case "owner":
            case "3":
                level = 3 /* AccessLevel.OWNER */;
                break;
            case "botadmin":
            case "bot_admin":
            case "4":
                level = 4 /* AccessLevel.BOT_ADMIN */;
                break;
            case "botowner":
            case "bot_owner":
            case "5":
                level = 5 /* AccessLevel.BOT_OWNER */;
                break;
            case "botban":
            case "bot_ban":
            case "-1":
                level = -1 /* AccessLevel.BOTBAN */;
                break;
            case "normal":
            case "member":
            case "0":
                level = 0 /* AccessLevel.NORMAL */;
                break;
            default:
                return -128 /* AccessLevel.INVALID */;
        }
        return Math.min(Math.max(level, min !== null && min !== void 0 ? min : -1 /* AccessLevel.BOTBAN */), max !== null && max !== void 0 ? max : 5 /* AccessLevel.BOT_OWNER */);
    }
}
exports.default = AccessControl;
