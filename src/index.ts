/*
	Bobcat bot for Revolt
	crispycat <the@crispy.cat>
	https://crispy.cat/software/bobcat
	https://github.com/crispy-cat/bobcat
	Licensed under the GNU GPL v3 license
*/

import Bobcat from "./core/app/Bobcat";
import path from "path";

require("dotenv").config();

global.version = require("../package.json").version;

process.on("uncaughtException", (err: Error): void => {
	console.error(`Uncaught error:\n${err.stack}`);
});

global.bobcat = new Bobcat(path.dirname(__dirname));
global.bobcat.start();
