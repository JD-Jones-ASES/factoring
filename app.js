(function () {
  const STORAGE_KEY = "factoring-garden-settings";
  const math = window.FactoringMath;

  const els = {
    views: {
      setup: document.getElementById("view-setup"),
      play: document.getElementById("view-play"),
      summary: document.getElementById("view-summary"),
    },
    difficultyGroup: document.getElementById("difficulty-group"),
    commonGroup: document.getElementById("common-group"),
    startBtn: document.getElementById("start-btn"),
    endBtn: document.getElementById("end-btn"),
    againBtn: document.getElementById("again-btn"),
    settingsBtn: document.getElementById("settings-btn"),
    submitBtn: document.getElementById("submit-btn"),
    continueBtn: document.getElementById("continue-btn"),
    hintBtn: document.getElementById("hint-btn"),
    revealBtn: document.getElementById("reveal-btn"),
    skipBtn: document.getElementById("skip-btn"),
    answerForm: document.getElementById("answer-form"),
    answerInput: document.getElementById("answer-input"),
    playActions: document.getElementById("play-actions"),
    feedback: document.getElementById("feedback"),
    hint: document.getElementById("hint"),
    expression: document.getElementById("expression"),
    timer: document.getElementById("stat-time"),
    streak: document.getElementById("stat-streak"),
    accuracy: document.getElementById("stat-accuracy"),
    answered: document.getElementById("stat-answered"),
    summaryTime: document.getElementById("summary-time"),
    summaryScore: document.getElementById("summary-score"),
    summaryAccuracy: document.getElementById("summary-accuracy"),
    summaryStreak: document.getElementById("summary-streak"),
    live: document.getElementById("live"),
  };

  const state = {
    view: "setup",
    config: math.normalizeConfig(loadSettings()),
    problem: null,
    hintIndex: 0,
    awaitingContinue: false,
    stats: emptyStats(),
    timerId: null,
    pausedAt: null,
  };

  function emptyStats() {
    return {
      startedAt: 0,
      correct: 0,
      total: 0,
      streak: 0,
      bestStreak: 0,
    };
  }

  function loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.config));
    } catch {
      // Ignore quota / private-mode failures.
    }
  }

  function showView(name) {
    state.view = name;
    Object.entries(els.views).forEach(([key, node]) => {
      const active = key === name;
      node.hidden = !active;
      node.classList.toggle("is-active", active);
    });
  }

  function renderChoices() {
    els.difficultyGroup.innerHTML = "";
    math.DIFFICULTIES.forEach((item) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice";
      btn.dataset.difficulty = item.id;
      btn.setAttribute("aria-pressed", String(state.config.difficulty === item.id));
      btn.innerHTML =
        '<span class="choice-label">' +
        item.label +
        '</span><span class="choice-blurb">' +
        item.blurb +
        '</span><span class="choice-example">' +
        item.example +
        "</span>";
      btn.addEventListener("click", () => setDifficulty(item.id));
      els.difficultyGroup.appendChild(btn);
    });

    els.commonGroup.innerHTML = "";
    [
      {
        value: false,
        label: "No common factor",
        blurb: "The integer GCF is 1",
        example: "x² + 5x + 6",
      },
      {
        value: true,
        label: "Include a GCF",
        blurb: "Factor an integer out first",
        example: "2x² + 10x + 12",
      },
    ].forEach((item) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice";
      btn.setAttribute("aria-pressed", String(state.config.commonFactors === item.value));
      btn.innerHTML =
        '<span class="choice-label">' +
        item.label +
        '</span><span class="choice-blurb">' +
        item.blurb +
        '</span><span class="choice-example">' +
        item.example +
        "</span>";
      btn.addEventListener("click", () => setCommonFactors(item.value));
      els.commonGroup.appendChild(btn);
    });
  }

  function setDifficulty(id) {
    state.config.difficulty = id;
    saveSettings();
    renderChoices();
  }

  function setCommonFactors(value) {
    state.config.commonFactors = value;
    saveSettings();
    renderChoices();
  }

  function announce(text) {
    els.live.textContent = text;
  }

  function startSession() {
    state.config = math.normalizeConfig(state.config);
    saveSettings();
    state.stats = emptyStats();
    state.stats.startedAt = Date.now();
    state.awaitingContinue = false;
    state.problem = math.generateProblem(state.config);
    showView("play");
    renderProblem();
    updatePlayStats();
    startTimer();
    els.answerInput.focus();
  }

  function endSession() {
    stopTimer();
    if (state.stats.total === 0 && state.view === "play") {
      showView("setup");
      return;
    }
    renderSummary();
    showView("summary");
  }

  function startTimer() {
    stopTimer();
    state.pausedAt = null;
    state.timerId = setInterval(updatePlayStats, 250);
  }

  function stopTimer() {
    if (state.timerId) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
  }

  function elapsedMs() {
    if (!state.stats.startedAt) {
      return 0;
    }
    if (state.pausedAt) {
      return state.pausedAt - state.stats.startedAt;
    }
    return Date.now() - state.stats.startedAt;
  }

  function updatePlayStats() {
    const stats = state.stats;
    els.timer.textContent = math.formatElapsed(elapsedMs());
    els.streak.textContent = String(stats.streak);
    els.answered.textContent = String(stats.total);
    els.accuracy.textContent = math.accuracyPercent(stats.correct, stats.total) + "%";
  }

  function renderProblem() {
    els.expression.textContent = state.problem.text;
    els.expression.classList.remove("is-correct", "is-wrong");
    els.answerInput.value = "";
    els.answerInput.disabled = false;
    els.submitBtn.disabled = false;
    els.continueBtn.hidden = true;
    els.answerForm.hidden = false;
    els.playActions.hidden = false;
    state.hintIndex = 0;
    state.awaitingContinue = false;
    hideFeedback();
    hideHint();
  }

  function hideFeedback() {
    els.feedback.hidden = true;
    els.feedback.textContent = "";
    els.feedback.className = "feedback";
  }

  function hideHint() {
    els.hint.hidden = true;
    els.hint.textContent = "";
  }

  function showFeedback(type, text) {
    els.feedback.hidden = false;
    els.feedback.className = "feedback is-" + type;
    els.feedback.textContent = text;
    announce(text);
  }

  function showHintText(text) {
    els.hint.hidden = false;
    els.hint.textContent = text;
    announce(text);
  }

  function submitAnswer(event) {
    event.preventDefault();
    if (state.view !== "play" || state.awaitingContinue) {
      return;
    }

    const result = math.checkAnswer(state.problem, els.answerInput.value);
    if (!result.valid) {
      showFeedback("error", "Enter a factored form, such as (x+2)(x−3).");
      els.answerInput.focus();
      return;
    }

    state.stats.total += 1;
    if (result.correct) {
      state.stats.correct += 1;
      state.stats.streak += 1;
      state.stats.bestStreak = Math.max(state.stats.bestStreak, state.stats.streak);
      els.expression.classList.remove("is-wrong");
      els.expression.classList.add("is-correct");
      const streakNote = state.stats.streak > 1 ? "  ·  streak " + state.stats.streak : "";
      showFeedback("success", "Correct" + streakNote);
      lockForContinue(true);
    } else {
      state.stats.streak = 0;
      els.expression.classList.add("is-wrong");
      showFeedback("error", "Not quite. Try another grouping, or take a hint.");
      els.answerInput.focus();
      els.answerInput.select();
    }
    updatePlayStats();
  }

  function showNextHint() {
    if (state.view !== "play" || state.awaitingContinue) {
      return;
    }
    const hints = state.problem.hints || [];
    if (!hints.length) {
      return;
    }
    const index = Math.min(state.hintIndex, hints.length - 1);
    showHintText(hints[index]);
    state.hintIndex = Math.min(index + 1, hints.length - 1);
  }

  function revealAnswer() {
    if (state.view !== "play" || state.awaitingContinue) {
      return;
    }
    els.expression.classList.remove("is-correct");
    els.expression.classList.add("is-wrong");
    showFeedback("error", "One factorization: " + state.problem.answer);
    hideHint();
    lockForContinue(false);
  }

  function lockForContinue(autoAdvance) {
    state.awaitingContinue = true;
    els.answerInput.disabled = true;
    els.submitBtn.disabled = true;
    els.answerForm.hidden = true;
    els.playActions.hidden = true;
    els.continueBtn.hidden = false;
    els.continueBtn.focus();
    if (autoAdvance) {
      window.setTimeout(() => {
        if (state.view === "play" && state.awaitingContinue) {
          nextProblem();
        }
      }, 800);
    }
  }

  function nextProblem() {
    if (state.view !== "play") {
      return;
    }
    state.problem = math.generateProblem(state.config, math.createRng(), state.problem);
    renderProblem();
    els.answerInput.focus();
  }

  function skipProblem() {
    if (state.view !== "play" || state.awaitingContinue) {
      return;
    }
    nextProblem();
  }

  function renderSummary() {
    const stats = state.stats;
    els.summaryTime.textContent = math.formatElapsed(elapsedMs());
    els.summaryScore.textContent = stats.correct + " / " + stats.total;
    els.summaryAccuracy.textContent = math.accuracyPercent(stats.correct, stats.total) + "%";
    els.summaryStreak.textContent = String(stats.bestStreak);
  }

  function onVisibility() {
    if (state.view !== "play") {
      return;
    }
    if (document.hidden) {
      if (!state.pausedAt) {
        state.pausedAt = Date.now();
        stopTimer();
      }
    } else if (state.pausedAt) {
      const pausedFor = Date.now() - state.pausedAt;
      state.stats.startedAt += pausedFor;
      state.pausedAt = null;
      startTimer();
    }
  }

  function onDocumentKey(event) {
    if (event.key === "Escape" && state.view === "play") {
      event.preventDefault();
      endSession();
    }
  }

  function init() {
    renderChoices();
    els.startBtn.addEventListener("click", startSession);
    els.endBtn.addEventListener("click", endSession);
    els.againBtn.addEventListener("click", startSession);
    els.settingsBtn.addEventListener("click", () => showView("setup"));
    els.answerForm.addEventListener("submit", submitAnswer);
    els.continueBtn.addEventListener("click", nextProblem);
    els.hintBtn.addEventListener("click", showNextHint);
    els.revealBtn.addEventListener("click", revealAnswer);
    els.skipBtn.addEventListener("click", skipProblem);
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("keydown", onDocumentKey);
    showView("setup");
  }

  init();
})();
