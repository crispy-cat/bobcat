/*
	Bobcat bot for Revolt
	crispycat <the@crispy.cat>
	https://crispy.cat/software/bobcat
	https://github.com/crispy-cat/bobcat
	Licensed under the GNU GPL v3 license
*/

import DatabaseConstructor, {Database as SQLite} from "better-sqlite3";
import * as path from "path";
import FS from "fs";
import Logger from "../utilities/Logger";

export default class Database {
	public readonly dbpath: string;
	private _sqlite: SQLite;

	public get sqlite(): SQLite {
		return this._sqlite;
	}

	private set sqlite(db: SQLite) {
		this._sqlite = db;
	}

	public constructor(dbpath: string) {
		this.dbpath = dbpath;
	}

	public open() {
		this.sqlite = new DatabaseConstructor(this.dbpath);
	}

	public close() {
		this.sqlite.close();
	}

	public create(table: string): void {
		this.sqlite.prepare(
			"CREATE TABLE IF NOT EXISTS `" + table + "` " +
			"(`key` TEXT PRIMARY KEY, `value` TEXT);"
		).run();
	}

	public drop(table: string): void {
		this.sqlite.prepare(
			"DROP TABLE `" + table + "`;"
		).run();
	}

	public get(table: string, key: string): any {
		let row: {value: string} = this.sqlite.prepare(
			"SELECT `value` FROM `" + table + "` WHERE `key` = '" + key + "';"
		).get();
		if (!row) return null;
		try {
			return JSON.parse(row.value);
		} catch (err) {
			Logger.log(`Potential database corruption at [${table}:${key}]`, err.stack, Logger.L_ERROR);
		}
	}

	public set(table: string, key: string, value: any): void {
		this.sqlite.prepare(
			"INSERT OR REPLACE INTO `" + table + "` " +
			"(`key`, `value`) VALUES " +
			"('" + key + "', '" + JSON.stringify(value).replace(/'/g, "''") + "');"
		).run();
	}
}
