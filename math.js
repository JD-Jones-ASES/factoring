/**
 * Quadratic generation, parsing, and checking for The Factoring Garden.
 * Works in the browser (global FactoringMath) and in Node (module.exports).
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.FactoringMath = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const DIFFICULTIES = [
    {
      id: "easy",
      label: "Easy",
      blurb: "Leading coefficient 1, small integers",
      example: "x² + 5x + 6",
      monic: true,
      constMin: -6,
      constMax: 6,
    },
    {
      id: "medium",
      label: "Medium",
      blurb: "Leading coefficient 1, wider range",
      example: "x² − 11x + 24",
      monic: true,
      constMin: -12,
      constMax: 12,
    },
    {
      id: "hard",
      label: "Hard",
      blurb: "Leading coefficient is not 1",
      example: "6x² + 5x − 6",
      monic: false,
      innerLeadMin: 1,
      innerLeadMax: 4,
      constMin: -8,
      constMax: 8,
    },
  ];

  const DEFAULT_CONFIG = {
    difficulty: "easy",
    commonFactors: false,
  };

  function createRng(random = Math.random) {
    function unit() {
      const value = random();
      if (value >= 1) {
        return 0.999999999999;
      }
      if (value < 0) {
        return 0;
      }
      return value;
    }

    return {
      int(min, max) {
        if (max < min) {
          const swap = min;
          min = max;
          max = swap;
        }
        return Math.floor(unit() * (max - min + 1)) + min;
      },
      pick(list) {
        return list[Math.floor(unit() * list.length)];
      },
      unit,
    };
  }

  function normalizeConfig(input) {
    const raw = input && typeof input === "object" ? input : {};
    const difficulty = DIFFICULTIES.some((item) => item.id === raw.difficulty)
      ? raw.difficulty
      : DEFAULT_CONFIG.difficulty;
    return {
      difficulty,
      commonFactors: Boolean(raw.commonFactors),
    };
  }

  function difficultyById(id) {
    return DIFFICULTIES.find((item) => item.id === id) || DIFFICULTIES[0];
  }

  function gcd(a, b) {
    let x = Math.abs(a);
    let y = Math.abs(b);
    while (y) {
      const next = x % y;
      x = y;
      y = next;
    }
    return x || 1;
  }

  function gcd3(a, b, c) {
    return gcd(gcd(a, b), c);
  }

  function expandFactors(leading, factors) {
    if (!factors || factors.length !== 2) {
      return null;
    }
    const f1 = factors[0];
    const f2 = factors[1];
    return {
      A: leading * f1.coeff * f2.coeff,
      B: leading * (f1.coeff * f2.constant + f1.constant * f2.coeff),
      C: leading * f1.constant * f2.constant,
    };
  }

  function formatTerm(coef, variable, first) {
    const abs = Math.abs(coef);
    let body;
    if (!variable) {
      body = String(abs);
    } else if (abs === 1) {
      body = variable;
    } else {
      body = abs + variable;
    }
    if (first) {
      return coef < 0 ? "−" + body : body;
    }
    return (coef < 0 ? "− " : "+ ") + body;
  }

  function formatQuadratic(A, B, C) {
    const parts = [formatTerm(A, "x²", true)];
    if (B !== 0) {
      parts.push(formatTerm(B, "x", false));
    }
    if (C !== 0) {
      parts.push(formatTerm(C, "", false));
    }
    return parts.join(" ");
  }

  function formatLinearFactor(coeff, constant) {
    if (constant === 0) {
      if (coeff === 1) {
        return "x";
      }
      if (coeff === -1) {
        return "(-x)";
      }
      return coeff < 0 ? `(${coeff}x)` : `${coeff}x`;
    }

    let left;
    if (coeff === 1) {
      left = "x";
    } else if (coeff === -1) {
      left = "-x";
    } else {
      left = coeff + "x";
    }
    const right = constant > 0 ? "+" + constant : String(constant);
    return "(" + left + right + ")";
  }

  function formatFactored(leading, factors) {
    const ordered = factors.slice().sort((left, right) => {
      if (left.coeff !== right.coeff) {
        return left.coeff - right.coeff;
      }
      return left.constant - right.constant;
    });
    let prefix = "";
    if (leading === -1) {
      prefix = "-";
    } else if (leading !== 1) {
      prefix = String(leading);
    }
    return prefix + ordered.map((factor) => formatLinearFactor(factor.coeff, factor.constant)).join("");
  }

  function problemFromFactors(a, b, c, d, e) {
    const factors = [
      { coeff: b, constant: c },
      { coeff: d, constant: e },
    ];
    const expanded = expandFactors(a, factors);
    return {
      a,
      b,
      c,
      d,
      e,
      A: expanded.A,
      B: expanded.B,
      C: expanded.C,
      factors,
      text: formatQuadratic(expanded.A, expanded.B, expanded.C),
      answer: formatFactored(a, factors),
      commonFactor: gcd3(expanded.A, expanded.B, expanded.C),
    };
  }

  function matchesDifficulty(problem, config) {
    const { A, B, C } = problem;
    if (A <= 0) {
      return false;
    }
    if (B === 0 && C === 0) {
      return false;
    }
    const g = gcd3(A, B, C);
    if (config.commonFactors) {
      if (g < 2) {
        return false;
      }
    } else if (g !== 1) {
      return false;
    }
    const leadAfterGcf = A / g;
    const spec = difficultyById(config.difficulty);
    if (spec.monic) {
      return leadAfterGcf === 1;
    }
    return leadAfterGcf > 1;
  }

  function tryGenerate(config, rng) {
    const spec = difficultyById(config.difficulty);
    const a = config.commonFactors ? rng.int(2, 5) : 1;
    let b;
    let d;
    if (spec.monic) {
      b = 1;
      d = 1;
    } else {
      b = rng.int(spec.innerLeadMin, spec.innerLeadMax);
      d = rng.int(spec.innerLeadMin, spec.innerLeadMax);
      if (b * d < 2) {
        return null;
      }
    }
    const c = rng.int(spec.constMin, spec.constMax);
    const e = rng.int(spec.constMin, spec.constMax);
    if (c === 0 && e === 0) {
      return null;
    }
    return problemFromFactors(a, b, c, d, e);
  }

  function generateProblem(config, rng, previous) {
    const normalized = normalizeConfig(config);
    const generator = rng || createRng();
    for (let attempt = 0; attempt < 80; attempt += 1) {
      const problem = tryGenerate(normalized, generator);
      if (!problem || !matchesDifficulty(problem, normalized)) {
        continue;
      }
      if (
        previous &&
        previous.A === problem.A &&
        previous.B === problem.B &&
        previous.C === problem.C
      ) {
        continue;
      }
      problem.hints = hintsFor(problem);
      return problem;
    }
    const fallback = problemFromFactors(
      normalized.commonFactors ? 2 : 1,
      1,
      2,
      normalized.difficulty === "hard" ? 2 : 1,
      3
    );
    fallback.hints = hintsFor(fallback);
    return fallback;
  }

  function hintsFor(problem) {
    const g = gcd3(problem.A, problem.B, problem.C);
    const hints = [];
    if (g > 1) {
      hints.push("A common integer divides every term. Factor that out first.");
    }
    const reducedA = problem.A / g;
    const reducedB = problem.B / g;
    const reducedC = problem.C / g;
    if (Math.abs(reducedA) === 1) {
      hints.push(
        "Find two integers that multiply to " + reducedC + " and add to " + reducedB + "."
      );
    } else {
      hints.push(
        "Find a factor pair of " +
          reducedA * reducedC +
          " that adds to " +
          reducedB +
          "."
      );
    }
    return hints;
  }

  function parseFactoredForm(raw) {
    const source = String(raw || "")
      .replace(/\s+/g, "")
      .toLowerCase()
      .replace(/²/g, "^2")
      .replace(/[−–—]/g, "-");

    if (!source) {
      return { ok: false };
    }

    let pos = 0;
    let leading = 1;

    function peek() {
      return source[pos] || "";
    }

    function eat() {
      return source[pos++] || "";
    }

    function parseUnsignedInt() {
      if (!/\d/.test(peek())) {
        return null;
      }
      let value = 0;
      while (/\d/.test(peek())) {
        value = value * 10 + (eat().charCodeAt(0) - 48);
      }
      return value;
    }

    function parseSum(stop) {
      let coeff = 0;
      let constant = 0;
      let sawTerm = false;
      let sign = 1;

      if (peek() === "+") {
        pos += 1;
      } else if (peek() === "-") {
        sign = -1;
        pos += 1;
      }

      while (pos < source.length && peek() !== stop) {
        let number = null;
        if (/\d/.test(peek())) {
          number = parseUnsignedInt();
        }
        if (peek() === "x") {
          eat();
          coeff += sign * (number === null ? 1 : number);
          sawTerm = true;
        } else {
          if (number === null) {
            return null;
          }
          constant += sign * number;
          sawTerm = true;
        }
        if (peek() === "+") {
          sign = 1;
          pos += 1;
        } else if (peek() === "-") {
          sign = -1;
          pos += 1;
        } else {
          break;
        }
      }

      if (!sawTerm) {
        return null;
      }
      return { coeff, constant };
    }

    if (peek() === "+") {
      pos += 1;
    } else if (peek() === "-") {
      leading = -1;
      pos += 1;
    }

    if (/\d/.test(peek())) {
      leading *= parseUnsignedInt();
    }

    const linears = [];

    while (pos < source.length) {
      if (peek() === "*") {
        pos += 1;
        continue;
      }

      if (peek() === "(") {
        pos += 1;
        const linear = parseSum(")");
        if (!linear || peek() !== ")") {
          return { ok: false };
        }
        pos += 1;
        let copies = 1;
        if (peek() === "^") {
          pos += 1;
          if (peek() !== "2") {
            return { ok: false };
          }
          pos += 1;
          copies = 2;
        }
        if (linear.coeff === 0) {
          leading *= linear.constant;
        } else {
          for (let i = 0; i < copies; i += 1) {
            linears.push(linear);
          }
        }
        continue;
      }

      if (peek() === "x" || peek() === "+" || peek() === "-" || /\d/.test(peek())) {
        let sign = 1;
        if (peek() === "+") {
          pos += 1;
        } else if (peek() === "-") {
          sign = -1;
          pos += 1;
        }
        let number = null;
        if (/\d/.test(peek())) {
          number = parseUnsignedInt();
        }
        if (peek() === "x") {
          pos += 1;
          const coeff = sign * (number === null ? 1 : number);
          let copies = 1;
          if (peek() === "^") {
            pos += 1;
            if (peek() !== "2") {
              return { ok: false };
            }
            pos += 1;
            copies = 2;
          }
          for (let i = 0; i < copies; i += 1) {
            linears.push({ coeff, constant: 0 });
          }
          continue;
        }
        if (number !== null) {
          leading *= sign * number;
          continue;
        }
        return { ok: false };
      }

      return { ok: false };
    }

    if (linears.length !== 2) {
      return { ok: false };
    }

    return {
      ok: true,
      leadingCoeff: leading,
      factors: linears,
    };
  }

  function checkAnswer(problem, input) {
    const parsed = parseFactoredForm(input);
    if (!parsed.ok) {
      return { valid: false, correct: false };
    }
    const expanded = expandFactors(parsed.leadingCoeff, parsed.factors);
    if (!expanded) {
      return { valid: false, correct: false };
    }
    return {
      valid: true,
      correct:
        expanded.A === problem.A && expanded.B === problem.B && expanded.C === problem.C,
    };
  }

  function formatElapsed(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const minutes = String(Math.floor(total / 60)).padStart(2, "0");
    const seconds = String(total % 60).padStart(2, "0");
    return minutes + ":" + seconds;
  }

  function accuracyPercent(correct, total) {
    if (!total) {
      return 100;
    }
    return Math.round((correct / total) * 100);
  }

  return {
    DIFFICULTIES,
    DEFAULT_CONFIG,
    createRng,
    normalizeConfig,
    difficultyById,
    gcd,
    gcd3,
    expandFactors,
    formatQuadratic,
    formatFactored,
    formatLinearFactor,
    problemFromFactors,
    generateProblem,
    hintsFor,
    parseFactoredForm,
    checkAnswer,
    formatElapsed,
    accuracyPercent,
  };
});
