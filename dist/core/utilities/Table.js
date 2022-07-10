"use strict";
/*
    Bobcat bot for Revolt
    crispycat <the@crispy.cat>
    https://crispy.cat/software/bobcat
    https://github.com/crispy-cat/bobcat
    Licensed under the GNU GPL v3 license
*/
Object.defineProperty(exports, "__esModule", { value: true });
class Table {
    constructor(cells = []) {
        this.cells = [];
        this.cells = cells;
    }
    getRow(ind) {
        var _a;
        return (_a = this.cells[ind]) !== null && _a !== void 0 ? _a : [];
    }
    getCol(ind) {
        var _a;
        let col = [];
        for (let row in this.cells)
            col[row] = (_a = this.cells[row][ind]) !== null && _a !== void 0 ? _a : [];
        return col;
    }
    getCell(row, col) {
        var _a, _b;
        let rowdata = (_a = this.cells[row]) !== null && _a !== void 0 ? _a : [];
        return (_b = rowdata[col]) !== null && _b !== void 0 ? _b : [];
    }
    setRow(ind, row) {
        this.cells[ind] = row;
        return this;
    }
    setCol(ind, col) {
        for (let row in col) {
            if (!this.cells[row])
                this.cells[row] = [];
            this.cells[row][ind] = col[row];
        }
        return this;
    }
    setCell(row, col, val) {
        if (!this.cells[row])
            this.cells[row] = [];
        this.cells[row][col] = val;
        return this;
    }
    numRows() {
        return this.cells.length;
    }
    numCols() {
        let cols = 0;
        for (let row of this.cells)
            cols = Math.max(cols, row.length);
        return cols;
    }
    toString() {
        let str = "";
        for (let row in this.cells) {
            for (let cell of this.cells[row])
                str += "|" + cell;
            str += "|\n";
            if (row == "0")
                str += "|---".repeat(this.cells[row].length) + "|\n";
        }
        return str;
    }
}
exports.default = Table;
