'use strict'

let Proposition = require('../src/liar').Proposition;
let KnightsAndKnaves = require('../src/liar').KnightsAndKnaves;

describe('Proposition', () => {
    it('represents a single proposition', () => {
        let p = new Proposition(null);
    });
});

describe('KnightsAndKnaves', () => {
    it('generates specified number of inhabitants', () => {
        let game = new KnightsAndKnaves(3);
        expect(game.count).toBe(3);
    });
});
