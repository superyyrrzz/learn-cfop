/**
 * Parses Rubik's cube algorithm notation into move objects.
 * Supports: R, L, U, D, F, B faces with ', 2 modifiers.
 * Also supports lowercase (wide) moves: r, l, u, d, f, b
 */

const FACES = ['R', 'L', 'U', 'D', 'F', 'B'];

const AXIS_MAP = {
  R: { axis: 'x', layer: 1, dir: -1 },
  L: { axis: 'x', layer: -1, dir: 1 },
  U: { axis: 'y', layer: 1, dir: -1 },
  D: { axis: 'y', layer: -1, dir: 1 },
  F: { axis: 'z', layer: 1, dir: -1 },
  B: { axis: 'z', layer: -1, dir: 1 },
};

export class Move {
  constructor(face, prime = false, double = false, wide = false) {
    this.face = face.toUpperCase();
    this.prime = prime;
    this.double = double;
    this.wide = wide;
    const info = AXIS_MAP[this.face];
    this.axis = info.axis;
    this.layer = info.layer;
    this.direction = prime ? -info.dir : info.dir;
    this.angle = double ? Math.PI : Math.PI / 2;
  }

  toString() {
    const f = this.wide ? this.face.toLowerCase() : this.face;
    return f + (this.double ? '2' : '') + (this.prime ? "'" : '');
  }

  inverse() {
    if (this.double) {
      return new Move(this.face, false, true, this.wide);
    }
    return new Move(this.face, !this.prime, false, this.wide);
  }
}

export class MoveParser {
  static parse(algorithm) {
    if (!algorithm || !algorithm.trim()) return [];

    const moves = [];
    const tokens = algorithm.trim().split(/\s+/);

    for (const token of tokens) {
      let i = 0;
      while (i < token.length) {
        const raw = token[i];
        const ch = raw.toUpperCase();
        if (!FACES.includes(ch)) {
          i++;
          continue;
        }

        const wide = raw >= 'a' && raw <= 'z';
        let prime = false;
        let double = false;

        if (i + 1 < token.length) {
          if (token[i + 1] === "'") {
            prime = true;
            i++;
          } else if (token[i + 1] === '2') {
            double = true;
            i++;
          }
        }

        moves.push(new Move(ch, prime, double, wide));
        i++;
      }
    }

    return moves;
  }

  static inverse(algorithm) {
    const moves = typeof algorithm === 'string' ? this.parse(algorithm) : algorithm;
    return moves.map(m => m.inverse()).reverse();
  }

  static toString(moves) {
    return moves.map(m => m.toString()).join(' ');
  }
}
