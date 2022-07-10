/*
	Bobcat bot for Revolt
	crispycat <the@crispy.cat>
	https://crispy.cat/software/bobcat
	https://github.com/crispy-cat/bobcat
	Licensed under the GNU GPL v3 license
*/

export default class Table {
	private cells: any[][] = [];

	public constructor(cells: any[][] = []) {
		this.cells = cells;
	}

	public getRow(ind: number): any[] {
		return this.cells[ind] ?? [];
	}

	public getCol(ind: number): any[] {
		let col: any[] = [];
		for (let row in this.cells)
			col[row] = this.cells[row][ind] ?? [];
		return col;
	}

	public getCell(row: number, col: number): any {
		let rowdata: any[] = this.cells[row] ?? [];
		return rowdata[col] ?? [];
	}

	public setRow(ind: number, row: any[]): Table {
		this.cells[ind] = row;
		return this;
	}

	public setCol(ind: number, col: any[]): Table {
		for (let row in col) {
			if (!this.cells[row]) this.cells[row] = [];
			this.cells[row][ind] = col[row];
		}
		return this;
	}

	public setCell(row: number, col: number, val: any): Table {
		if (!this.cells[row]) this.cells[row] = [];
		this.cells[row][col] = val;
		return this;
	}

	public numRows(): number {
		return this.cells.length;
	}

	public numCols(): number {
		let cols: number = 0;
		for (let row of this.cells) cols = Math.max(cols, row.length);
		return cols;
	}

	public toString(): string {
		let str: string = "";
		for (let row in this.cells) {
			for (let cell of this.cells[row])
				str += "|" + (cell as string);
			str += "|\n";
			if (row == "0")
				str += "|---".repeat(this.cells[row].length) + "|\n";
		}
		return str;
	}
}
