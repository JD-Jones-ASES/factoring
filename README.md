# The Factoring Garden

A small, dependency-free quadratic factoring trainer in the browser. Choose a difficulty, decide whether problems include a common integer factor, and work one expression at a time.

This is a rebuild of an older single-page prototype. The concept is the same; the implementation has shared math logic, keyboard-friendly controls, and no third-party services.

## Practice

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

1. Choose a difficulty:
   - **Easy** — monic quadratics with small integers, such as `x² + 5x + 6`
   - **Medium** — monic quadratics with a wider integer range
   - **Hard** — leading coefficient is not 1, such as `6x² + 5x − 6`
2. Choose whether a common integer factor should appear.
3. Begin the session and enter a factored form, then press Enter.
4. Use **Hint** for a nudge that does not give the factorization away. **Reveal** shows one correct form.
5. Escape or **End session** opens a short summary.

Accepted spellings include `(x+2)(x-3)`, `(2x+1)(x-5)`, `3(x+1)(x-2)`, `x(x+5)`, and `(x+2)^2`. Any integer factorization that expands to the shown expression is counted as correct.

Last-used settings stay in `localStorage` on that browser. Nothing is sent anywhere.

## Files

```
index.html      Setup, practice, and summary views
app.js          UI and session flow
math.js         Problem generation, parsing, and scoring
styles.css      Layout and garden theme
favicon.svg     App icon
test/           Node tests for math.js
```

When common factors are off, generated expressions have integer GCF 1. When they are on, a shared integer of at least 2 is present. Hard problems stay non-monic after that GCF is removed.

## Tests

Node 18+ is enough. No install step.

```bash
npm test
```

## License

MIT License. Copyright (c) 2025-2026 JD Jones. See [LICENSE](LICENSE).
