"use strict";
/*
    Bobcat bot for Revolt
    crispycat <the@crispy.cat>
    https://crispy.cat/software/bobcat
    https://github.com/crispy-cat/bobcat
    Licensed under the GNU GPL v3 license
*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const Logger_1 = __importDefault(require("../utilities/Logger"));
class Database {
    constructor(dbpath) {
        this.dbpath = dbpath;
    }
    get sqlite() {
        return this._sqlite;
    }
    set sqlite(db) {
        this._sqlite = db;
    }
    open() {
        this.sqlite = new better_sqlite3_1.default(this.dbpath);
    }
    close() {
        this.sqlite.close();
    }
    create(table) {
        this.sqlite.prepare("CREATE TABLE IF NOT EXISTS `" + table + "` " +
            "(`key` TEXT PRIMARY KEY, `value` TEXT);").run();
    }
    drop(table) {
        this.sqlite.prepare("DROP TABLE `" + table + "`;").run();
    }
    get(table, key) {
        let row = this.sqlite.prepare("SELECT `value` FROM `" + table + "` WHERE `key` = '" + key + "';").get();
        if (!row)
            return null;
        try {
            return JSON.parse(row.value);
        }
        catch (err) {
            Logger_1.default.log(`Potential database corruption at [${table}:${key}]`, err.stack, Logger_1.default.L_ERROR);
        }
    }
    set(table, key, value) {
        this.sqlite.prepare("INSERT OR REPLACE INTO `" + table + "` " +
            "(`key`, `value`) VALUES " +
            "('" + key + "', '" + JSON.stringify(value).replace(/'/g, "''") + "');").run();
    }
}
exports.default = Database;
