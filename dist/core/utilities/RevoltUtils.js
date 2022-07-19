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
Object.defineProperty(exports, "__esModule", { value: true });
const Logger_1 = __importDefault(require("../utilities/Logger"));
class RevoltUtils {
    static findMember(server, text) {
        return __awaiter(this, void 0, void 0, function* () {
            let ulid = global.bobcat.findULID(text);
            try {
                if (ulid)
                    return yield server.fetchMember(ulid);
                else
                    return (yield server.fetchMembers()).members
                        .find((m) => m.user.username == text.replace(/^@/, ""));
            }
            catch (err) {
                Logger_1.default.log(err, Logger_1.default.L_WARNING);
                return null;
            }
        });
    }
    static findRole(server, text) {
        let ulid = global.bobcat.findULID(text);
        if (ulid) {
            return {
                id: ulid,
                role: server.roles[ulid]
            };
        }
        else {
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
    static findChannel(server, text) {
        let ulid = global.bobcat.findULID(text);
        if (ulid)
            return server.channels.find((c) => c._id == ulid);
        else
            return server.channels
                .find((c) => c.name == text.replace(/^#/, ""));
    }
}
exports.default = RevoltUtils;
