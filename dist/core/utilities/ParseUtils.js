"use strict";
/*
    Bobcat bot for Revolt
    crispycat <the@crispy.cat>
    https://crispy.cat/software/bobcat
    https://github.com/crispy-cat/bobcat
    Licensed under the GNU GPL v3 license
*/
Object.defineProperty(exports, "__esModule", { value: true });
const PROPS_REGEX = /([a-z0-9_]+)\s*[=:]\s*(?:(?:"([^"]+)")|(?:'([^']+)')|(?:`([^`]+)`)|([^\s,]+))\s*(?:,|$)/gi;
const TIME_REGEX = /^(?:(\d+)d?)?(?:(\d+)h?)?(?:(\d+)m?)?(?:(\d+)s?)?$/i;
const ULID_REGEX = /[0-9A-HJKMNP-TV-Z]{26}/i;
class ParseUtils {
    static parseULID(str) {
        var _a, _b;
        if (!str)
            return null;
        return (_b = (_a = str.match(ULID_REGEX)) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.toUpperCase();
    }
    static parseProperties(text) {
        var _a, _b, _c;
        let matches = text.matchAll(PROPS_REGEX);
        let props = {};
        for (let m of matches)
            props[m[1]] = (_c = (_b = (_a = m[2]) !== null && _a !== void 0 ? _a : m[3]) !== null && _b !== void 0 ? _b : m[4]) !== null && _c !== void 0 ? _c : m[5];
        return props;
    }
    static boolean(text) {
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
    static time(text) {
        let time = 0;
        let matches = text.match(TIME_REGEX);
        let d = parseInt(matches[1]);
        let h = parseInt(matches[2]);
        let m = parseInt(matches[3]);
        let s = parseInt(matches[4]);
        time += ((!isNaN(d)) ? d : 0) * 24 * 60 * 60 * 1000;
        time += ((!isNaN(h)) ? h : 0) * 60 * 60 * 1000;
        time += ((!isNaN(m)) ? m : 0) * 60 * 1000;
        time += ((!isNaN(s)) ? s : 0) * 1000;
        return time;
    }
}
exports.default = ParseUtils;
