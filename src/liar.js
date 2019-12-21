'use strict'

class Proposition {
    constructor(op, lhs, rhs) {
        this.op = op;
        this.lhs = lhs;
        this.rhs = rhs;
    }

    get or() {
        
    }
}


class KnightsAndKnaves {
    constructor(count) {
        this.count = count;
    }
}

module.exports = { Proposition, KnightsAndKnaves };
