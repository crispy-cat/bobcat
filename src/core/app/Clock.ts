/*
	Bobcat bot for Revolt
	crispycat <the@crispy.cat>
	https://crispy.cat/software/bobcat
	https://github.com/crispy-cat/bobcat
	Licensed under the GNU GPL v3 license
*/

import EventEmitter from "events";

export interface Clock {
	on(event: "tick", listener: (tick: number) => void): this;
}

export class Clock extends EventEmitter {
	public _interval: number = 62.5;
	public _tick: number = 0;
	public _lastTick: number;
	public _lastInterval: number = 0;

	public get tick(): number {
		return this._tick;
	}

	private set tick(tick: number) {
		this._tick = tick;
	}

	public get lastTick(): number {
		return this._lastTick;
	}

	private set lastTick(time: number) {
		this._lastTick = time;
	}

	public get lastInterval(): number {
		return this._lastInterval;
	}

	private set lastInterval(interval: number) {
		this._lastInterval = interval;
	}

	public get interval(): number {
		return this._interval;
	}

	public set interval(interval: number) {
		if (interval <= 0) interval = 62.5;
		this._interval = interval;
	}

	public get frequency(): number {
		return 1000 / this._interval;
	}

	public set frequency(frequency: number) {
		if (frequency <= 0) frequency = 16;
		this._interval = 1000 / frequency;
	}

	public constructor() {
		super();
		this.lastTick = Date.now();
		this.doTick = this.doTick.bind(this);
		this.doTick();
	}

	public doTick(): void {
		let now: number = Date.now();
		this.lastInterval = now - this.lastTick;
		this.lastTick = now;
		this.tick++;
		setTimeout(this.doTick, Math.min(
			Math.max(2 * this.interval - this.lastInterval, this.interval * 0.95),
			this.interval * 1.05
		));
		this.emit("tick", this.tick);
	}
}
