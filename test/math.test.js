const test = require("node:test");
const assert = require("node:assert/strict");
const math = require("../math.js");

function sequenceRng(values) {
  let i = 0;
  return math.createRng(() => {
    const value = values[i % values.length];
    i += 1;
    return value;
  });
}

test("normalizeConfig fills defaults and drops unknown difficulty", () => {
  assert.deepEqual(math.normalizeConfig(null), {
    difficulty: "easy",
    commonFactors: false,
  });
  assert.deepEqual(math.normalizeConfig({ difficulty: "steep", commonFactors: 1 }), {
    difficulty: "easy",
    commonFactors: true,
  });
  assert.deepEqual(math.normalizeConfig({ difficulty: "hard", commonFactors: false }), {
    difficulty: "hard",
    commonFactors: false,
  });
});

test("formatQuadratic uses unicode minus and omits zero terms", () => {
  assert.equal(math.formatQuadratic(1, 5, 6), "x² + 5x + 6");
  assert.equal(math.formatQuadratic(1, -11, 24), "x² − 11x + 24");
  assert.equal(math.formatQuadratic(6, 5, -6), "6x² + 5x − 6");
  assert.equal(math.formatQuadratic(1, 0, -9), "x² − 9");
  assert.equal(math.formatQuadratic(2, -1, 0), "2x² − x");
  assert.equal(math.formatQuadratic(-1, 3, -4), "−x² + 3x − 4");
});

test("formatFactored writes a readable canonical form", () => {
  assert.equal(
    math.formatFactored(1, [
      { coeff: 1, constant: 2 },
      { coeff: 1, constant: 3 },
    ]),
    "(x+2)(x+3)"
  );
  assert.equal(
    math.formatFactored(2, [
      { coeff: 1, constant: 1 },
      { coeff: 1, constant: -1 },
    ]),
    "2(x-1)(x+1)"
  );
  assert.equal(
    math.formatFactored(1, [
      { coeff: 1, constant: 0 },
      { coeff: 1, constant: 5 },
    ]),
    "x(x+5)"
  );
});

test("parseFactoredForm accepts common student spellings", () => {
  const cases = [
    ["(x+2)(x-3)", 1, [1, 2], [1, -3]],
    ["(x + 2)(x - 3)", 1, [1, 2], [1, -3]],
    ["(2x+1)(x-5)", 1, [2, 1], [1, -5]],
    ["3(x+1)(x-2)", 3, [1, 1], [1, -2]],
    ["-(x+4)(x-1)", -1, [1, 4], [1, -1]],
    ["x(x+5)", 1, [1, 0], [1, 5]],
    ["2x(x-3)", 2, [1, 0], [1, -3]],
    ["(x+2)^2", 1, [1, 2], [1, 2]],
    ["(x+2)²", 1, [1, 2], [1, 2]],
    ["(2+x)(3-x)", 1, [1, 2], [-1, 3]],
    ["2*(x+1)*(x-1)", 2, [1, 1], [1, -1]],
    ["(5)(x+1)(x-1)", 5, [1, 1], [1, -1]],
    ["x^2", 1, [1, 0], [1, 0]],
  ];

  for (const [input, leading, first, second] of cases) {
    const parsed = math.parseFactoredForm(input);
    assert.equal(parsed.ok, true, "expected to parse " + input);
    assert.equal(parsed.leadingCoeff, leading, input + " leading");
    assert.deepEqual(
      parsed.factors.map((factor) => [factor.coeff, factor.constant]),
      [first, second],
      input
    );
  }
});

test("parseFactoredForm rejects unfactored or incomplete input", () => {
  assert.equal(math.parseFactoredForm("").ok, false);
  assert.equal(math.parseFactoredForm("x^2+5x+6").ok, false);
  assert.equal(math.parseFactoredForm("(x+2)").ok, false);
  assert.equal(math.parseFactoredForm("hello").ok, false);
  assert.equal(math.parseFactoredForm("(x+1)(x+2)(x+3)").ok, false);
});

test("checkAnswer accepts equivalent factorizations", () => {
  const problem = math.problemFromFactors(2, 1, 1, 1, -1);
  assert.equal(problem.text, "2x² − 2");
  assert.deepEqual(math.checkAnswer(problem, "2(x+1)(x-1)"), {
    valid: true,
    correct: true,
  });
  assert.deepEqual(math.checkAnswer(problem, "(x-1)(x+1)2"), {
    valid: true,
    correct: true,
  });
  assert.deepEqual(math.checkAnswer(problem, "(2x+2)(x-1)"), {
    valid: true,
    correct: true,
  });
  assert.deepEqual(math.checkAnswer(problem, "(x+2)(x-1)"), {
    valid: true,
    correct: false,
  });
  assert.deepEqual(math.checkAnswer(problem, "not a factor"), {
    valid: false,
    correct: false,
  });
});

test("easy problems stay monic and honor the common-factor toggle", () => {
  for (let i = 0; i < 40; i += 1) {
    const plain = math.generateProblem({ difficulty: "easy", commonFactors: false });
    assert.equal(plain.A, 1);
    assert.equal(math.gcd3(plain.A, plain.B, plain.C), 1);
    assert.notEqual(plain.B === 0 && plain.C === 0, true);

    const shared = math.generateProblem({ difficulty: "easy", commonFactors: true });
    assert.ok(shared.commonFactor >= 2);
    assert.equal(shared.A / shared.commonFactor, 1);
  }
});

test("medium problems stay monic with a wider constant range", () => {
  for (let i = 0; i < 30; i += 1) {
    const problem = math.generateProblem({ difficulty: "medium", commonFactors: false });
    assert.equal(problem.A, 1);
    assert.equal(math.gcd3(problem.A, problem.B, problem.C), 1);
    assert.ok(Math.abs(problem.c) <= 12);
    assert.ok(Math.abs(problem.e) <= 12);
  }
});

test("hard problems keep a non-monic leading coefficient after any GCF", () => {
  for (let i = 0; i < 40; i += 1) {
    const plain = math.generateProblem({ difficulty: "hard", commonFactors: false });
    assert.ok(plain.A > 1);
    assert.ok(plain.A <= 9);
    assert.equal(math.gcd3(plain.A, plain.B, plain.C), 1);

    const shared = math.generateProblem({ difficulty: "hard", commonFactors: true });
    assert.ok(shared.commonFactor >= 2);
    assert.ok(shared.A / shared.commonFactor > 1);
    assert.ok(shared.A <= 27);
  }
});

test("generateProblem skips an identical previous expression", () => {
  const rng = sequenceRng([0, 0, 0, 0, 0, 0, 0.999, 0.999, 0.999, 0.999]);
  const first = math.generateProblem({ difficulty: "easy", commonFactors: false }, rng);
  const second = math.generateProblem(
    { difficulty: "easy", commonFactors: false },
    rng,
    first
  );
  assert.ok(!(first.A === second.A && first.B === second.B && first.C === second.C));
});

test("hints never include the finished factorization", () => {
  const problem = math.problemFromFactors(3, 1, 2, 1, -1);
  const hints = math.hintsFor(problem);
  assert.ok(hints.length >= 2);
  for (const hint of hints) {
    assert.equal(hint.includes(problem.answer), false);
    assert.equal(/\(\s*x/.test(hint), false);
  }
});

test("formatElapsed and accuracyPercent", () => {
  assert.equal(math.formatElapsed(0), "00:00");
  assert.equal(math.formatElapsed(65000), "01:05");
  assert.equal(math.accuracyPercent(0, 0), 100);
  assert.equal(math.accuracyPercent(3, 4), 75);
});
