'use strict'

const Ternary = require('../src/liargen').Ternary;
const Operator = require('../src/liargen').Operator;
const Proposition = require('../src/liargen').Proposition;
const Statement = require('../src/liargen').Statement;
const KnightsAndKnaves = require('../src/liargen').KnightsAndKnaves;

describe('Proposition', () => {
    it('has an operator', () => {
        const pAND = new Proposition(Operator.AND, null, null);
        expect(pAND.operator).toEqual(Operator.AND);
        expect(pAND.isBinary).toBeTrue();

        const pNOT = new Proposition(Operator.NOT);
        expect(pNOT.operator).toEqual(Operator.NOT);
        expect(pNOT.isBinary).toBeFalse();
    });

    [
        { operator: 'IDENT', lhs: 0, rhs: null, expected: 0 },
        { operator: 'IDENT', lhs: 1, rhs: null, expected: 1 },
        { operator: 'NOT', lhs: 0, rhs: null, expected: 1 },
        { operator: 'NOT', lhs: 1, rhs: null, expected: 0 },
        { operator: 'OR', lhs: 0, rhs: 0, expected: 0 },
        { operator: 'OR', lhs: 0, rhs: 1, expected: 1 },
        { operator: 'OR', lhs: 1, rhs: 0, expected: 1 },
        { operator: 'OR', lhs: 1, rhs: 1, expected: 1 },
        { operator: 'AND', lhs: 0, rhs: 0, expected: 0 },
        { operator: 'AND', lhs: 0, rhs: 1, expected: 0 },
        { operator: 'AND', lhs: 1, rhs: 0, expected: 0 },
        { operator: 'AND', lhs: 1, rhs: 1, expected: 1 },
    ].forEach(params => {
        it(`evaluates operator ${params.operator}`, () => {
            let p = new Proposition(Operator[params.operator], null, null);
            expect(p.eval(params.lhs, params.rhs))
                .toBe(params.expected, params);
        });
    });

    it('can negate.', () => {
        const pAND = new Proposition(Operator.AND);
        const pOR = new Proposition(Operator.OR);
        const pNAND = new Proposition(Operator.NOT, pAND);
        const pNOR = new Proposition(Operator.NOT, pOR);

        expect(pNAND.eval(0, 0)).toBe(1);
        expect(pNAND.eval(0, 1)).toBe(1);
        expect(pNAND.eval(1, 0)).toBe(1);
        expect(pNAND.eval(1, 1)).toBe(0);

        expect(pNOR.eval(0, 0)).toBe(1);
        expect(pNOR.eval(0, 1)).toBe(0);
        expect(pNOR.eval(1, 0)).toBe(0);
        expect(pNOR.eval(1, 1)).toBe(0);
    });

    it('can combine after negating', () => {
        const pNOT = new Proposition(Operator.NOT);
        const pAND_L_NOTR = new Proposition(Operator.AND, null, pNOT);
        const pOR_NOTL_R = new Proposition(Operator.OR, pNOT, null);

        expect(pAND_L_NOTR.eval(0, 0)).toBe(0);
        expect(pAND_L_NOTR.eval(0, 1)).toBe(0);
        expect(pAND_L_NOTR.eval(1, 0)).toBe(1);
        expect(pAND_L_NOTR.eval(1, 1)).toBe(0);

        expect(pOR_NOTL_R.eval(0, 0)).toBe(1);
        expect(pOR_NOTL_R.eval(0, 1)).toBe(1);
        expect(pOR_NOTL_R.eval(1, 0)).toBe(0);
        expect(pOR_NOTL_R.eval(1, 1)).toBe(1);
    });

    [
        [Ternary.F, Ternary.T, Ternary.U, Ternary.U],
        [Ternary.T, Ternary.F, Ternary.U, Ternary.U],
        [Ternary.T, Ternary.U, Ternary.U, Ternary.T],
        [Ternary.F, Ternary.T, Ternary.T, Ternary.T],
        [Ternary.F, Ternary.F, Ternary.F, Ternary.T],
        [Ternary.T, Ternary.F, Ternary.T, Ternary.T],
        [Ternary.T, Ternary.T, Ternary.F, Ternary.T],
        [Ternary.T, Ternary.T, Ternary.T, Ternary.F],
        [Ternary.T, Ternary.F, Ternary.F, Ternary.T],
        [Ternary.T, Ternary.F, Ternary.F, Ternary.F],
    ].forEach(ternaryTruthTable => {
        it('finds a proposition that satisfies given truth table', () => {
            const p = Proposition.createConformingProposition(ternaryTruthTable);
            for (let i = 0; i < 4; i++) {
                const ternary = ternaryTruthTable[i];
                if (ternary === Ternary.U) continue;
                const actual = p.eval(1 & i, (0b10 & i) >>> 1);
                expect(actual).toBe(
                    ternary === Ternary.T ? 1 : 0,
                    `input = ${ternaryTruthTable}, i = ${i}, expected = ${ternary}, actual = ${actual}`);
            }
        });
    });

    [
        { operator: Operator.IDENT, expected: 'p0' },
        { operator: Operator.NOT, expected: '¬p0' },
        { operator: Operator.OR, expected: 'p0 ∨ p1' },
        { operator: Operator.AND, expected: 'p0 ∧ p1' },
        { operator: Operator.EQUIVALENT, expected: 'p0 ⇔ p1' },
    ].forEach(params => {
        it('can provide symbolic representation', () => {
            const p = new Proposition(params.operator);
            expect(p.toSymbolicRepresentationString('p0', 'p1')).toBe(params.expected);
        });
    });

    [
        {
            p: new Proposition(
                Operator.NOT,
                new Proposition(Operator.AND)),
            expected: '¬(p0 ∧ p1)'
        },
        {
            p: new Proposition(
                Operator.OR,
                null,
                new Proposition(Operator.NOT)),
            expected: 'p0 ∨ ¬p1'
        },
        {
            p: new Proposition(
                Operator.NOT,
                new Proposition(
                    Operator.EQUIVALENT,
                    new Proposition(Operator.NOT),
                    null)),
            expected: '¬(¬p0 ⇔ p1)'
        },
    ].forEach(params => {
        it('can provide symbolic representation with NOT modifier', () => {
            expect(params.p.toSymbolicRepresentationString('p0', 'p1')).toBe(params.expected);
        });
    });
});

describe('Statement', () => {
    [
        { op: Operator.IDENT, lhs: 0, rhs: 1, expected: 'A は ほんとうの ことを いうよ' },
        { op: Operator.NOT, lhs: 2, rhs: 3, expected: 'C は うそつきだよ' },
        { op: Operator.OR, lhs: 4, rhs: 5, expected: 'E か F の どちらかは ほんとうの ことを いうよ\n(りょうほうかも)' },
        { op: Operator.AND, lhs: 6, rhs: 7, expected: 'G も H も ほんとうの ことを いうよ' },
        { op: Operator.EQUIVALENT, lhs: 8, rhs: 9, expected: 'I が ほんとうの ことを いうなら J も そうだよ\nI が うそつきなら J も そうだよ' },
    ].forEach(params => {
        it('can be converted non-nested proposition to natural language', () => {
            const stmt = new Statement(new Proposition(params.op), params.lhs, params.rhs);
            expect(stmt.toNaturalLanguage())
                .toEqual(params.expected);
        });
    });

    [
        {
            proposition: new Proposition(Operator.IDENT,
                new Proposition(Operator.NOT),
                null),
            lhs: 0, rhs: 1,
            expected: 'A は うそつきだよ'
        },
        {
            proposition: new Proposition(Operator.NOT,
                new Proposition(Operator.NOT),
                null),
            lhs: 0, rhs: 1,
            expected: 'A は ほんとうの ことを いうよ'
        },
        // OR.
        {
            proposition: new Proposition(Operator.OR,
                new Proposition(Operator.NOT),
                new Proposition(Operator.IDENT)),
            lhs: 0, rhs: 1,
            expected: 'A が うそつきか B が ほんとうの ことを いうよ\n(りょうほうかも)'
        },
        {
            proposition: new Proposition(Operator.OR,
                null,
                new Proposition(Operator.NOT)),
            lhs: 0, rhs: 1,
            expected: 'A が ほんとうの ことを いうか B が うそつきだよ\n(りょうほうかも)'
        },
        {
            proposition: new Proposition(Operator.OR,
                new Proposition(Operator.NOT),
                new Proposition(Operator.NOT)),
            lhs: 0, rhs: 1,
            expected: 'A か B の どちらかは うそつきだよ\n(りょうほうかも)'
        },
        // AND.
        {
            proposition: new Proposition(Operator.AND,
                new Proposition(Operator.NOT),
                null),
            lhs: 0, rhs: 1,
            expected: 'A は うそつきだよ\nB は ほんとうの ことを いうよ'
        },
        {
            proposition: new Proposition(Operator.AND,
                new Proposition(Operator.IDENT),
                new Proposition(Operator.NOT)),
            lhs: 0, rhs: 1,
            expected: 'A は ほんとうの ことを いうよ\nB が うそつきだよ'
        },
        {
            proposition: new Proposition(Operator.AND,
                new Proposition(Operator.NOT),
                new Proposition(Operator.NOT)),
            lhs: 0, rhs: 1,
            expected: 'A と B が うそつきだよ'
        },
        // EQUIVALENT.
        {
            proposition: new Proposition(Operator.EQUIVALENT,
                new Proposition(Operator.NOT),
                null),
            lhs: 0, rhs: 1,
            expected: 'A が ほんとうの ことを いうなら B は ちがうよ\nA が うそつきなら B は ちがうよ'
        },
        {
            proposition: new Proposition(Operator.EQUIVALENT,
                new Proposition(Operator.IDENT),
                new Proposition(Operator.NOT)),
            lhs: 0, rhs: 1,
            expected: 'A が ほんとうの ことを いうなら B は ちがうよ\nA が うそつきなら B は ちがうよ'
        },
        {
            proposition: new Proposition(Operator.EQUIVALENT,
                new Proposition(Operator.NOT),
                new Proposition(Operator.NOT)),
            lhs: 0, rhs: 1,
            expected: 'A が ほんとうの ことを いうなら B も そうだよ\nA が うそつきなら B も そうだよ'
        },
    ].forEach(params => {
        it('can be converted modified proposition to natural language', () => {
            const stmt = new Statement(params.proposition, params.lhs, params.rhs);
            expect(stmt.toNaturalLanguage())
                .toEqual(params.expected);
        });
    });

    [
        {
            proposition: new Proposition(Operator.NOT,
                new Proposition(Operator.OR,
                    new Proposition(Operator.NOT),
                    new Proposition(Operator.NOT))),
            lhs: 0, rhs: 1,
            expected: 'A も B も ほんとうの ことを いうよ'
        },
        {
            proposition: new Proposition(Operator.NOT,
                new Proposition(Operator.AND,
                    new Proposition(Operator.IDENT),
                    new Proposition(Operator.NOT))),
            lhs: 0, rhs: 1,
            expected: 'A が うそつきか B が ほんとうの ことを いうよ\n(りょうほうかも)'
        },
        {
            proposition: new Proposition(Operator.NOT,
                new Proposition(Operator.OR,
                    new Proposition(Operator.NOT),
                    null)),
            lhs: 0, rhs: 1,
            expected: 'A は ほんとうの ことを いうよ\nB が うそつきだよ'
        },
        {
            proposition: new Proposition(Operator.NOT,
                new Proposition(Operator.EQUIVALENT,
                    new Proposition(Operator.NOT),
                    new Proposition(Operator.NOT))),
            lhs: 0, rhs: 1,
            expected: 'A が ほんとうの ことを いうなら B は ちがうよ\nA が うそつきなら B は ちがうよ'
        },
        {
            proposition: new Proposition(Operator.NOT,
                new Proposition(Operator.EQUIVALENT,
                    new Proposition(Operator.NOT),
                    null)),
            lhs: 0, rhs: 1,
            expected: 'A が ほんとうの ことを いうなら B も そうだよ\nA が うそつきなら B も そうだよ'
        },
    ].forEach(params => {
        it('transform negated proposition with De Morgan\'s laws', () => {
            const stmt = new Statement(params.proposition, params.lhs, params.rhs);
            expect(stmt.toNaturalLanguage())
                .toEqual(params.expected);
        });
    });
});

describe('KnightsAndKnaves', () => {
    it('initializes noncontradictory table to true', () => {
        let quiz = new KnightsAndKnaves(2, 0b011);
        expect(quiz.n).toBe(2);
        expect(quiz.answer).toBe(0b11);
        expect(quiz.nrows).toBe(4);
        expect(quiz.noncontradictoryTable).toEqual([3, 3, 3, 3]);

        quiz = new KnightsAndKnaves(3, 0b011);
        expect(quiz.n).toBe(3);
        expect(quiz.answer).toBe(0b011);
        expect(quiz.nrows).toBe(8);
        expect(quiz.noncontradictoryTable).toEqual([7, 7, 7, 7, 7, 7, 7, 7]);

        quiz = new KnightsAndKnaves(4, 0b011);
        expect(quiz.n).toBe(4);
        expect(quiz.answer).toBe(0b0011);
        expect(quiz.nrows).toBe(16);
        expect(quiz.noncontradictoryTable.every(el => el === 15)).toBeTrue();
    })

    it('is solvable when it has one and only one noncontradictory row', () => {
        let quiz = new KnightsAndKnaves(3, 0b010);

        quiz.noncontradictoryTable = [0b111, 0b111, 0b111];
        expect(quiz.isSolvable).toBeFalse();

        quiz.noncontradictoryTable = [0b111, 0b101, 0b111];
        expect(quiz.isSolvable).toBeFalse();

        quiz.noncontradictoryTable = [0b111, 0b011, 0b001];
        expect(quiz.isSolvable).toBeTrue();

        quiz.noncontradictoryTable = [0b101, 0b011, 0b001];
        expect(quiz.isSolvable).toBeFalse();
    })

    it('knows noncontradictory rows other than the answer', () => {
        let quiz = new KnightsAndKnaves(3, 0b010);
        quiz.answer = 0b001;
        quiz.noncontradictoryTable = [7, 7, 7, 7, 7, 7, 7, 7];
        expect(quiz.obtainNoncontradictoryRow()).toBe(0);

        quiz.answer = 0b000;
        quiz.noncontradictoryTable = [7, 7, 7, 7, 7, 7, 7, 7];
        expect(quiz.obtainNoncontradictoryRow()).toBe(1);

        quiz.answer = 0b000;
        quiz.noncontradictoryTable = [7, 6, 7, 7, 7, 7, 7, 7];
        expect(quiz.obtainNoncontradictoryRow()).toBe(2);

        quiz.answer = 0b101;
        quiz.noncontradictoryTable = [0, 1, 4, 3, 5, 7, 6, 7];
        expect(quiz.obtainNoncontradictoryRow()).toBe(7);
    });

    it('can select speaker pair', () => {
        let quiz = new KnightsAndKnaves(3, 0b000);
        quiz.getRandomOrder = n => [0, 1, 2];
        expect(quiz.obtainSpeakers([
            { row: 0b000, value: 1 },
            { row: 0b001, value: 0 },
        ])).toEqual([0, 1]);

        quiz.getRandomOrder = n => [1, 2, 0];
        expect(quiz.obtainSpeakers([
            { row: 0b000, value: 1 },
            { row: 0b001, value: 0 },
        ])).toEqual([1, 0]);

        quiz.getRandomOrder = n => [2, 1, 0];
        expect(quiz.obtainSpeakers([
            { row: 0b000, value: 1 },
            { row: 0b001, value: 0 },
        ])).toEqual([2, 0]);

        quiz = new KnightsAndKnaves(5, 0);
        quiz.getRandomOrder = n => [3, 4, 2, 0, 1];
        expect(quiz.obtainSpeakers([
            { row: 0b10101, value: 0 },
            { row: 0b10111, value: 1 },
        ])).toEqual([3, 1]);

        quiz = new KnightsAndKnaves(8, 253);
        quiz.getRandomOrder = n => [0, 1, 2, 3, 4, 5, 6, 7];
        expect(quiz.obtainSpeakers([
            { row: 253, value: 1 },
            { row: 127, value: 0 },
        ])).toEqual([0, 1]);

        quiz = new KnightsAndKnaves(8, 253);
        quiz.getRandomOrder = n => [2, 0, 1, 3, 4, 5, 6, 7];
        expect(quiz.obtainSpeakers([
            { row: 253, value: 1 },
            { row: 247, value: 0 },
        ])).toEqual([2, 1]);
    });

    it('selects any statement pairs for same results', () => {
        let quiz = new KnightsAndKnaves(3, 0b000);
        quiz.getRandomOrder = n => [2, 0, 1];
        expect(quiz.obtainSpeakers([
            { row: 0b010, value: 0 },
            { row: 0b000, value: 0 },
        ])).toEqual([2, 0]);

        quiz.getRandomOrder = n => [2, 0, 1];
        expect(quiz.obtainSpeakers([
            { row: 0b010, value: 1 },
            { row: 0b000, value: 1 },
        ])).toEqual([2, 0]);
    });
    
    [
        { value: 0b1001, digit0: 0, digit1: 2, expected: 0b01 },
        { value: 0b1001, digit0: 2, digit1: 0, expected: 0b10 },
        { value: 0b1001, digit0: 0, digit1: 3, expected: 0b11 },
    ].forEach(params => {
        it('squashes bits', () => {
            const squashedBits = KnightsAndKnaves.squashBits(
                params.value,
                params.digit0,
                params.digit1);
            expect(squashedBits).toBe(
                params.expected,
                `value = ${params.value}, digits = ${params.digit0}, ${params.digit1}, expected = ${params.expected}.`);
        });
    });

    it('generates quizes', () => {
        for (let i = 0; i < 1000; i++) {
            const n = 3 + Math.floor(i % 8);
            const ans = Math.floor(Math.pow(2, n) * Math.random());
            // console.log(`i = ${i}, answer = ${ans}`);
            let quiz = new KnightsAndKnaves(n, ans);
            quiz.generate();
            expect(quiz.isSolvable).toBeTrue();

            for (let col = 0; col < this.n; col++) {
                const stmt = quiz.statements[col];
                const lhsIndex = stmt.lhsIndex;
                const rhsIndex = stmt.rhsIndex;
                for (let row = 0; row < quiz.nrows; row++) {
                    const lhs = ((1 << lhsIndex) & row) >>> lhsIndex;
                    const rhs = ((1 << rhsIndex) & row) >>> rhsIndex;
                    const p = 1 & row;
                    const q = stmt.proposition.eval(lhs, rhs);
                    const r = p ? q : 1 & !q;

                    expect(r).toEqual(quiz.noncontradictoryTable[row] & 1);
                }
            }
        }
    });
});
