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
exports.Clock = void 0;
const events_1 = __importDefault(require("events"));
class Clock extends events_1.default {
    constructor() {
        super();
        this._interval = 62.5;
        this._tick = 0;
        this._lastInterval = 0;
        this.lastTick = Date.now();
        this.doTick = this.doTick.bind(this);
        this.doTick();
    }
    get tick() {
        return this._tick;
    }
    set tick(tick) {
        this._tick = tick;
    }
    get lastTick() {
        return this._lastTick;
    }
    set lastTick(time) {
        this._lastTick = time;
    }
    get lastInterval() {
        return this._lastInterval;
    }
    set lastInterval(interval) {
        this._lastInterval = interval;
    }
    get interval() {
        return this._interval;
    }
    set interval(interval) {
        if (interval <= 0)
            interval = 62.5;
        this._interval = interval;
    }
    get frequency() {
        return 1000 / this._interval;
    }
    set frequency(frequency) {
        if (frequency <= 0)
            frequency = 16;
        this._interval = 1000 / frequency;
    }
    doTick() {
        let now = Date.now();
        this.lastInterval = now - this.lastTick;
        this.lastTick = now;
        this.tick++;
        setTimeout(this.doTick, Math.min(Math.max(2 * this.interval - this.lastInterval, this.interval * 0.95), this.interval * 1.05));
        this.emit("tick", this.tick);
    }
}
exports.Clock = Clock;
