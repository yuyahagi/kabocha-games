'use strict'

const Ternary = {
    F: 0,
    T: 1,
    U: 2
};

const Operator = {
    IDENT: 0,
    NOT: 1,
    OR: 2,
    AND: 3,
    EQUIVALENT: 4,
};

class Proposition {
    constructor(op, lhs, rhs) {
        if (Object.keys(Operator).length > 5)
            throw 'Unknown operator enum definition.';
        
        this.operator = op;
        this.lhs = lhs;
        this.rhs = rhs;
    }

    get isBinary() {
        return !(this.operator === Operator.IDENT || this.operator === Operator.NOT);
    }

    eval(lhs, rhs) {
        switch (this.operator) {
            case Operator.IDENT:
                if (this.lhs)
                    return this.lhs.eval(lhs, rhs);
                else
                    return lhs;
            case Operator.NOT:
                if (this.lhs)
                    return (1 & ~this.lhs.eval(lhs, rhs));
                else
                    return 1 & ~lhs;
            case Operator.OR: {
                const leval = this.lhs ? this.lhs.eval(lhs, null) : lhs;
                const reval = this.rhs ? this.rhs.eval(rhs, null) : rhs;
                return leval | reval;
            }
            case Operator.AND: {
                const leval = this.lhs ? this.lhs.eval(lhs, null) : lhs;
                const reval = this.rhs ? this.rhs.eval(rhs, null) : rhs;
                return leval & reval;
            }
            case Operator.EQUIVALENT: {
                const leval = this.lhs ? this.lhs.eval(lhs, null) : lhs;
                const reval = this.rhs ? this.rhs.eval(rhs, null) : rhs;
                return 1 & ~(leval ^ reval);
            }
            default:
                throw `Unknown operator ${this.operator}.`;
        }
    }

    static createConformingProposition(ternaryTruthTable) {
        let noperators = Object.keys(Operator).length;
        const modifiers = [
            null,
            { outer: Operator.NOT, innerLhs: null, innerRhs: null },
            { outer: null, innerLhs: Operator.NOT, innerRhs: null },
            { outer: null, innerLhs: null, innerRhs: Operator.NOT },
            { outer: null, innerLhs: Operator.NOT, innerRhs: Operator.NOT },
            { outer: Operator.NOT, innerLhs: Operator.NOT, innerRhs: null },
            { outer: Operator.NOT, innerLhs: null, innerRhs: Operator.NOT },
            { outer: Operator.NOT, innerLhs: Operator.NOT, innerRhs: Operator.NOT },
        ];
        for (let m = 0; m < modifiers.length; m++) {
            const modifier = modifiers[m];
            let p = new Proposition(Operator.IDENT, null, null);
            for (let op = 0; op < noperators; op++) {
                p.operator = op;
                let pouter = p;
                if (modifier) {
                    p.lhs = modifier.innerLhs
                        ? new Proposition(modifier.innerLhs, null, null)
                        : null;
                    p.rhs = modifier.innerRhs
                        ? new Proposition(modifier.innerRhs, null, null)
                        : null;
                    pouter = p.isBinary && modifier.outer
                        ? new Proposition(modifier.outer, p)
                        : p;
                }
                if (pouter.isConforming(ternaryTruthTable))
                    return pouter;
            }
        }

        return null;
    }

    isConforming(ternaryTruthTable) {
        let good = true;
        for (let i = 0; i < 4; i++) {
            const ternary = ternaryTruthTable[i];
            if (ternary === Ternary.U) continue;

            const lhs = 0b01 & i;
            const rhs = (0b10 & i) >>> 1;
            good &= this.eval(lhs, rhs) === ternary;
        }
        return good;

    }

    toSymbolicRepresentationString(lhs, rhs) {
        switch (this.operator) {
            case Operator.IDENT:
                if (this.lhs)
                    return this.lhs.toSymbolicRepresentationString(lhs, rhs);
                else
                    return lhs;
            case Operator.NOT:
                if (this.lhs)
                    return `¬(${this.lhs.toSymbolicRepresentationString(lhs, rhs)})`;
                else
                    return `¬${lhs}`;
            case Operator.OR: {
                const leval = this.lhs ? this.lhs.toSymbolicRepresentationString(lhs, null) : lhs;
                const reval = this.rhs ? this.rhs.toSymbolicRepresentationString(rhs, null) : rhs;
                return `${leval} ∨ ${reval}`;
            }
            case Operator.AND: {
                const leval = this.lhs ? this.lhs.toSymbolicRepresentationString(lhs, null) : lhs;
                const reval = this.rhs ? this.rhs.toSymbolicRepresentationString(rhs, null) : rhs;
                return `${leval} ∧ ${reval}`;
            }
            case Operator.EQUIVALENT: {
                const leval = this.lhs ? this.lhs.toSymbolicRepresentationString(lhs, null) : lhs;
                const reval = this.rhs ? this.rhs.toSymbolicRepresentationString(rhs, null) : rhs;
                return `${leval} ⇔ ${reval}`;
            }
            default:
                throw `Unknown operator ${this.operator}.`;
        }
    }
}

class Statement {
    constructor(proposition, lhsSpeakerIndex, rhsSpeakerIndex) {
        this.proposition = proposition;
        this.lhsIndex = lhsSpeakerIndex;
        this.rhsIndex = rhsSpeakerIndex;
    }

    toSymbolicRepresentationString() {
        console.log(this.lhsIndex);
        return this.proposition.toSymbolicRepresentationString(
            `p${this.lhsIndex}`,
            `p${this.rhsIndex}`);
    }
}

class KnightsAndKnaves {
    // This class generates a "Knights and Knaves" quiz from the number of
    // speakers n and the specified answer (who tells a truth and who tells a
    // lie).
    // 
    // Conceptually, we maintain the following three truth tables to represent a
    // quiz and dynamically adjust two of them to generate a quiz iteratively.
    // Each has n columns and Math.pow(2, n) rows. Each column corresponds to
    // a speaker and each row represents one particular combination of who tells
    // a truth and who tells a lie.
    // 
    // 1. Truthness Table (pn, pn-1, ..., p0)
    // 2. Statement Table (qn, qn-1, ..., q0)
    // 3. Noncontradictory Table (rn, rn-1, ..., r0)
    // 
    // Each cell in the Truthness Table represents whether the particular speaker's
    // statement is a truth. We express this as proposition pi (i is a 0-based
    // index for the speakers). p0 = 1 means the first speaker tells a truth. We
    // assume the table to be arranged so that each the digit i of the binary
    // notation of its 0-based row index coincides with p0 so there is no need
    // to store this table in memory.
    // 
    // The Statement Table represents the true/false of each speaker's statement.
    // We denote the statement of speaker i as qi. For example, q0 = ¬p1 means
    // that speaker 0 claims that speaker 1 is a liar. This table is considered
    // only conceptually and is not directly implemented in this class.
    // 
    // The Noncontradictory Table combines the two tables mentioned ealier and
    // represents whether each speaker's statement causes a contradiction. We
    // denote this as ri. ri can be expressed as pi ⇔ qi. ri = 1 means that
    // the statement of the speaker i does NOT cause contradiction (hence the
    // name of NONcontradictory table).
    // 
    // An example with n = 3 is shown below. The left three columns (p2, ..., p1)
    // are the Truthness Table. The right three columns (r2, ..., r0) are the
    // Noncontradictory Table.
    // 
    //            r2              r1          r0 
    //            p2 ⇔ q2         p1 ⇔ r1     p0 ⇔ r0 
    //  p2 p1 p0  p2 ⇔ (p2 ⇔ p0)  p1 ⇔ (¬p2)  p0 ⇔ (¬p1)
    // ----------------------------------------------------
    //  0  0  0   0               0           0
    //  0  0  1   1               0           1
    //  0  1  0   0               1           1
    //  0  1  1   1               1           0
    //  1  0  0   0               1           0
    //  1  0  1   1               1           1
    //  1  1  0   0               0           1
    //  1  1  1   1               0           0
    // 
    // Here, only row 5 ([p2 p1 p0] == [1 0 1]) in the Noncontradictory Table has
    // 1s in all columns. All the other rows have at least one column where ri = 0.
    // This means, all but row 5 causes a contradiction. This is the solution.

    constructor(n, answer) {
        // Const members.
        this.n = n;
        this.answer = answer;
        const allBits = ~(0xffffffff << n);
        this.nrows = allBits + 1;

        // Members to be adjusted while generating the quiz.
        this.statements = new Array(this.n);
        for (let i = 0; i < this.n; i++) {
            this.statements[i] = new Statement(
                new Proposition(Operator.IDENT), 0, 0);
        }
        this.noncontradictoryTable = new Array(this.nrows);
        this.noncontradictoryTable.fill(allBits, 0, this.nrows);
    }

    toTruthTablesString() {
        let header = ' ';
        let columnWidths = new Array(2 * this.n);
        for (let i = this.n - 1; i >= 0; i--) {
            const columnOffset = header.length;
            header += `p${i} `;
            columnWidths[i] = header.length - columnOffset - 1;
        }
        header += ' ';
        for (let i = this.n - 1; i >= 0; i--) {
            const columnOffset = header.length;
            header += `p${i} ⇔ (${this.statements[i].toSymbolicRepresentationString()})  `;
            columnWidths[this.n + i] = header.length - columnOffset - 1;
        }
        const separator = '-'.repeat(header.length + 1);
        let text = header + '\n' + separator;
        for (let row = 0; row < this.nrows; row++) {
            let rowText = ' ';
            for (let col = this.n - 1; col >= 0; col--) {
                rowText += ((1 << col) & row) >>> col;
                rowText += ' '.repeat(columnWidths[col]);
            }
            rowText += ' ';
            for (let col = this.n - 1; col >= 0; col--) {
                rowText += ((1 << col) & this.noncontradictoryTable[row]) >>> col;
                rowText += ' '.repeat(columnWidths[this.n + col]);
            }
            text += '\n';
            text += rowText;
        }

        return text;
    }

    generate() {
        const maxIterations = 20;

        // Randomize the order of columns to consider.
        const columns = this.getRandomOrder(this.n);

        let iter;
        for (iter = 0; iter < maxIterations && !this.isSolvable; iter++) {

            // Go over each column (speaker) and modify rows to make contradictions.
            for (let c = 0; c < this.n && !this.isSolvable; c++) {
                const col = columns[c];
                const mask = 1 << col;

                // Select a non-answer row that has yet to show any contradiction.
                const row = this.obtainNoncontradictoryRow();

                // Select a pair of speakers that can set the selected cell
                // and the answer cell to desired values.
                const toInvertAns = ((mask & this.answer) === 0);
                const toInvertRow = ((mask & row) === 0);
                const ansVal = toInvertAns ? 0 : 1;
                const rowVal = toInvertRow ? 1 : 0;
                const rowRequirements = [
                    { row: this.answer, value: ansVal },
                    { row: row, value: rowVal },
                ];
                const speakerPair = this.obtainSpeakers(rowRequirements);

                const [i0, i1] = [
                    speakerPair[0],
                    speakerPair[1]
                ];
                const bitsAtAns = KnightsAndKnaves.squashBits(this.answer, i0, i1);
                const bitsAtRow = KnightsAndKnaves.squashBits(row, i0, i1);

                // Generate a proposition that evaluates to desired bits.
                const ternaryArray = new Array(4);
                for (let i = 0; i < 4; i++) {
                    if (i === bitsAtRow) {
                        ternaryArray[i] = toInvertRow ? Ternary.T : Ternary.F;
                    }
                    else if (i === bitsAtAns) {
                        ternaryArray[i] = toInvertAns ? Ternary.F : Ternary.T;
                    }
                    else {
                        ternaryArray[i] = Ternary.U;    // Don't care.
                    }
                }
                const proposition = Proposition.createConformingProposition(ternaryArray);
                this.statements[col] = new Statement(proposition, i0, i1);

                // Update the noncontradictory table with the generated proposition.
                for (let r = 0; r < this.nrows; r++) {
                    const bits = KnightsAndKnaves.squashBits(r, i0, i1);
                    const toInvert = ((mask & r) === 0);
                    let val = proposition.eval(0b1 & bits, bits >>> 1);
                    val = toInvert ? 0b1 & ~val : val;

                    this.noncontradictoryTable[r] &= ~mask;
                    this.noncontradictoryTable[r] |= val << col;
                }
            }
        }

        // if (iter > 0)
        //     console.log(`Iteration = ${iter}`);
    }

    get isSolvable() {
        const allBits = ~(0xffffffff << this.n);
        let cnt = 0;
        for (let i = 0; i < this.nrows; i++){
            cnt += this.noncontradictoryTable[i] === allBits;
            if (cnt > 1) return false;
        }

        return cnt === 1;
    }

    obtainNoncontradictoryRow() {
        const allBits = ~(0xffffffff << this.n);
        for (let row = 0; row < this.nrows; row++) {
            if (row !== this.answer && this.noncontradictoryTable[row] === allBits)
                return row;
        }
        return null;
    }

    obtainSpeakers(requirements) {
        const speakers = this.getRandomOrder(this.n);
        const req0 = requirements[0];
        const req1 = requirements[1];

        // If same values are required for the two rows, any combination
        // of speakers work. Just return the first pair.
        if (req0.value === req1.value) {
            const i0 = speakers[0];
            const i1 = speakers[1];
            return [i0, i1];
        }

        // If different values are requried for the two rows, find a pair
        // of speakers that have different bits at the specified rows.
        const row0 = req0.row;
        const row1 = req1.row;
        for (let i = 0; i < this.n - 1; i++) {
            const s1 = speakers[i];
            for (let j = i + 1; j < this.n; j++) {
                const s2 = speakers[j];
                const mask = (1 << s1) + (1 << s2);
                if ((mask & row0) !== (mask & row1))
                    return [s1, s2];
            }
        }

        throw 'Could not find appropriate pair of speakers.';
    }

    getRandomOrder(n) {
        let rows = new Array(n);
        for (let i = 0; i < n; i++) rows[i] = i;
        for (let i = rows.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [rows[i], rows[j]] = [rows[j], rows[i]];
        }
        return rows;
    }

    static squashBits(value, digit0, digit1) {
        const mask0 = 1 << digit0;
        const mask1 = 1 << digit1;
        const bit0 = (mask0 & value) >>> digit0;
        const bit1 = (mask1 & value) >>> digit1;
        const squashedBits = bit1 << 1 | bit0;
        return squashedBits
    }
}

module.exports = { Ternary, Operator, Proposition, KnightsAndKnaves };
