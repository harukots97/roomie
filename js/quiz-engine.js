// ---------------------------------------------------------------------------
// Generic multi-step quiz engine shared by quiz.js (seeker) and
// quiz-provider.js (provider). Everything quiz-specific (which screens,
// which copy, how to score, what the result CTA says) is passed in via
// `config` — this file only knows how to render and navigate screens.
//
// Expects the host page to provide these element ids: quiz-shell,
// quiz-stage, quiz-back, quiz-progress-track, quiz-progress-fill,
// quiz-progress-label.
// ---------------------------------------------------------------------------

export function createQuizApp(config) {
  const {
    screens,
    accents,
    sectionLabels,
    progressFieldIds,
    computeResult,
    onSubmit,
    intro,
    email,
    success,
    result: resultConfig,
  } = config;

  const totalQuestions = progressFieldIds.length;

  const fieldById = {};
  screens.forEach((screen) => (screen.fields || []).forEach((f) => (fieldById[f.id] = f)));

  const state = {
    screenIndex: 0,
    direction: 1,
    answers: {},
    result: null,
    submitStatus: null,
  };

  const shellEl = document.getElementById("quiz-shell");
  const stageEl = document.getElementById("quiz-stage");
  const backBtn = document.getElementById("quiz-back");
  const progressTrack = document.getElementById("quiz-progress-track");
  const progressFill = document.getElementById("quiz-progress-fill");
  const progressLabel = document.getElementById("quiz-progress-label");

  function currentScreen() {
    return screens[state.screenIndex];
  }

  function goTo(index, direction) {
    state.direction = direction;
    state.screenIndex = index;
    renderScreen();
  }

  function next() {
    const idx = state.screenIndex + 1;
    if (idx >= screens.length) return;
    goTo(idx, 1);
  }

  function back() {
    if (state.screenIndex <= 0) return;
    goTo(state.screenIndex - 1, -1);
  }

  function retake() {
    state.answers = {};
    state.result = null;
    state.submitStatus = null;
    goTo(0, -1);
  }

  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------
  function renderScreen() {
    const screen = currentScreen();
    const accent = accents[screen.section] || accents.default;
    shellEl.style.setProperty("--quiz-accent", accent);
    shellEl.style.setProperty("--quiz-shift", state.direction < 0 ? "-14px" : "14px");

    updateTopbar(screen);

    stageEl.innerHTML = "";
    const el = document.createElement("div");
    el.className = "quiz-screen";
    el.innerHTML = buildScreenHTML(screen);
    stageEl.appendChild(el);
    bindScreenEvents(el, screen);
    refreshContinueButton(el, screen);

    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("is-visible")));

    const firstInput = el.querySelector("input[type='email'], input[type='number']");
    if (firstInput && screen.type !== "question") firstInput.focus({ preventScroll: true });
  }

  function updateTopbar(screen) {
    backBtn.hidden = screen.id === "intro";

    if (screen.type === "question") {
      const firstFieldId = screen.fields[0].id;
      const qIndex = progressFieldIds.indexOf(firstFieldId);
      const qNumber = qIndex + 1;
      progressTrack.hidden = false;
      progressLabel.hidden = false;
      progressFill.style.width = `${Math.round((qNumber / totalQuestions) * 100)}%`;
      progressLabel.textContent = `Question ${qNumber} of ${totalQuestions} · ${sectionLabels[screen.section] || ""}`;
    } else if (screen.type === "photo") {
      progressTrack.hidden = false;
      progressLabel.hidden = false;
      progressFill.style.width = `${screen.progressPercent}%`;
      progressLabel.textContent = screen.progressLabel;
    } else if (screen.id === "email") {
      progressTrack.hidden = false;
      progressLabel.hidden = false;
      progressFill.style.width = "100%";
      progressLabel.textContent = "Last step";
    } else {
      progressTrack.hidden = true;
      progressLabel.hidden = true;
    }
  }

  function buildScreenHTML(screen) {
    if (screen.id === "intro") return buildIntroHTML();
    if (screen.id === "email") return buildEmailHTML();
    if (screen.id === "success") return buildSuccessHTML();
    if (screen.id === "result") return buildResultHTML();
    if (screen.type === "photo") return buildPhotoHTML(screen);
    return buildQuestionHTML(screen);
  }

  function buildIntroHTML() {
    return `
      <div class="quiz-intro">
        <span class="quiz-intro-badge">${intro.badge}</span>
        <h1 class="quiz-intro-heading">${intro.heading}</h1>
        <p class="quiz-intro-sub">${intro.sub}</p>
        <p class="quiz-intro-meta">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M12 7v5l3 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          ${intro.meta}
        </p>
        <div class="quiz-intro-actions">
          <button type="button" class="btn btn-primary btn-lg" data-action="start">${intro.ctaLabel}</button>
        </div>
      </div>
    `;
  }

  function buildPhotoHTML(screen) {
    return `
      <span class="quiz-section-label">${sectionLabels[screen.section] || ""}</span>
      <p class="quiz-question">${screen.heading}</p>
      <div class="quiz-photo-block">
        <p class="quiz-photo-text">${screen.body}</p>
      </div>
      <div class="quiz-footer">
        <button type="button" class="quiz-continue" data-action="continue">${screen.ctaLabel || "Continue"}</button>
      </div>
    `;
  }

  function buildQuestionHTML(screen) {
    const fieldsHTML = screen.fields.map(buildFieldHTML).join("");
    return `
      <span class="quiz-section-label">${sectionLabels[screen.section] || ""}</span>
      <div class="quiz-fields">${fieldsHTML}</div>
      ${screen.autoAdvance ? "" : buildFooterHTML("Continue")}
    `;
  }

  function fieldHeading(field) {
    return screenHasSingleField(field)
      ? `<p class="quiz-question">${field.question}</p>`
      : `<p class="quiz-field-label">${field.question}</p>`;
  }

  function fieldNoteHTML(field) {
    return field.note ? `<p class="quiz-hint">${field.note}</p>` : "";
  }

  function buildFieldHTML(field) {
    if (field.type === "numberToggle") return buildNumberToggleHTML(field);
    if (field.type === "numberOrNone") return buildNumberOrNoneHTML(field);
    if (field.type === "toggle") return buildToggleHTML(field);
    if (field.type === "text") return buildTextHTML(field);
    if (field.type === "textarea") return buildTextareaHTML(field);
    if (field.type === "number") return buildNumberHTML(field);

    const isMulti = field.type === "chips-multi";
    const optionsHTML = field.options.map((opt, i) => buildOptionHTML(field, opt, i)).join("");
    const otherHTML = field.other ? buildOtherInputHTML(field, isMulti) : "";
    const stackClass = isMulti ? "" : "quiz-options--stack";

    return `
      <div class="quiz-field" data-field="${field.id}">
        ${fieldHeading(field)}
        ${fieldNoteHTML(field)}
        <div class="quiz-options ${stackClass}" role="group">${optionsHTML}</div>
        ${otherHTML}
      </div>
    `;
  }

  function screenHasSingleField(field) {
    const screen = currentScreen();
    return !!screen.fields && screen.fields.length === 1 && screen.fields[0].id === field.id;
  }

  function buildOptionHTML(field, opt, index) {
    const isMulti = field.type === "chips-multi";
    const selected = isMulti
      ? (state.answers[field.id] || []).includes(opt.label)
      : state.answers[field.id] === opt.label;
    const revealHTML = opt.reveal && selected ? buildRevealInputHTML(field, opt) : "";
    return `
      <button type="button" class="quiz-option ${isMulti ? "quiz-option--multi" : ""} ${selected ? "is-selected" : ""}"
        data-action="${isMulti ? "toggle-multi" : "select-single"}" data-field="${field.id}" data-value="${escapeAttr(opt.label)}" data-index="${index}">
        <span class="quiz-option-check" aria-hidden="true"></span>
        <span>${opt.label}</span>
      </button>
      ${revealHTML}
    `;
  }

  function buildRevealInputHTML(field, opt) {
    const value = state.answers[field.id + "Detail"] || "";
    const inputType = (opt.reveal && opt.reveal.type) || "text";
    return `<input type="${inputType}" class="quiz-text-input quiz-option-other-input" data-detail-for="${field.id}" placeholder="${opt.reveal.placeholder || ""}" value="${escapeAttr(value)}" />`;
  }

  function buildOtherInputHTML(field, isMulti) {
    const isOtherSelected = isMulti
      ? (state.answers[field.id] || []).includes("Other")
      : state.answers[field.id] === "Other";
    const selectedClass = isOtherSelected ? "is-selected" : "";
    const inputHTML = isOtherSelected
      ? `<input type="text" class="quiz-text-input quiz-option-other-input" data-detail-for="${field.id}" placeholder="${field.other.placeholder}" value="${escapeAttr(state.answers[field.id + "Detail"] || "")}" />`
      : "";
    return `
      <button type="button" class="quiz-option ${isMulti ? "quiz-option--multi" : ""} ${selectedClass}"
        data-action="${isMulti ? "toggle-multi" : "select-single"}" data-field="${field.id}" data-value="Other">
        <span class="quiz-option-check" aria-hidden="true"></span>
        <span>Other</span>
      </button>
      ${inputHTML}
    `;
  }

  function buildNumberToggleHTML(field) {
    const value = state.answers[field.id];
    const toggleValue = state.answers[field.toggleId];
    const conditional = field.conditional;
    const showConditional = conditional && toggleValue === conditional.showWhenToggleIs;
    return `
      <div class="quiz-field" data-field="${field.id}">
        <p class="quiz-field-label">${field.question}</p>
        <div class="quiz-number-wrap">
          <span class="quiz-number-prefix">${field.prefix || ""}</span>
          <input type="number" inputmode="numeric" min="0" class="quiz-number-input" data-number-for="${field.id}"
            placeholder="${field.placeholder || ""}" value="${value != null ? value : ""}" />
        </div>
        <p class="quiz-field-label">${field.toggleLabel}</p>
        <div class="quiz-options">
          ${["Yes", "No"].map((label) => `
            <button type="button" class="quiz-option ${toggleValue === label ? "is-selected" : ""}" data-action="select-single" data-field="${field.toggleId}" data-value="${label}"
              aria-pressed="${toggleValue === label}">
              <span class="quiz-option-check" aria-hidden="true"></span>
              <span>${label}</span>
            </button>
          `).join("")}
        </div>
        ${showConditional ? `
          <p class="quiz-field-label">${conditional.label}</p>
          <div class="quiz-number-wrap">
            <span class="quiz-number-prefix">${conditional.prefix || ""}</span>
            <input type="number" inputmode="numeric" min="0" class="quiz-number-input" data-number-for="${conditional.id}"
              placeholder="${conditional.placeholder || ""}" value="${state.answers[conditional.id] != null ? state.answers[conditional.id] : ""}" />
          </div>
        ` : ""}
      </div>
    `;
  }

  function buildNumberOrNoneHTML(field) {
    const isNone = !!state.answers[field.noneFlagId];
    const value = state.answers[field.id];
    return `
      <div class="quiz-field" data-field="${field.id}">
        ${fieldHeading(field)}
        ${isNone ? "" : `
          <div class="quiz-number-wrap">
            <span class="quiz-number-prefix">${field.prefix || ""}</span>
            <input type="number" inputmode="numeric" min="0" class="quiz-number-input" data-number-for="${field.id}"
              placeholder="${field.placeholder || ""}" value="${value != null ? value : ""}" />
          </div>
        `}
        <div class="quiz-options">
          <button type="button" class="quiz-option ${isNone ? "is-selected" : ""}" data-action="toggle-none" data-field="${field.noneFlagId}" data-pair-field="${field.id}">
            <span class="quiz-option-check" aria-hidden="true"></span>
            <span>${field.noneLabel}</span>
          </button>
        </div>
      </div>
    `;
  }

  function buildToggleHTML(field) {
    const value = state.answers[field.id];
    return `
      <div class="quiz-field" data-field="${field.id}">
        ${fieldHeading(field)}
        <div class="quiz-options">
          ${["Yes", "No"].map((label) => `
            <button type="button" class="quiz-option ${value === label ? "is-selected" : ""}" data-action="select-single" data-field="${field.id}" data-value="${label}">
              <span class="quiz-option-check" aria-hidden="true"></span>
              <span>${label}</span>
            </button>
          `).join("")}
        </div>
      </div>
    `;
  }

  function buildTextHTML(field) {
    const value = state.answers[field.id] || "";
    return `
      <div class="quiz-field" data-field="${field.id}">
        ${fieldHeading(field)}
        ${fieldNoteHTML(field)}
        <input type="text" class="quiz-text-input" data-text-for="${field.id}" placeholder="${field.placeholder || ""}" value="${escapeAttr(value)}" />
      </div>
    `;
  }

  function buildTextareaHTML(field) {
    const value = state.answers[field.id] || "";
    return `
      <div class="quiz-field" data-field="${field.id}">
        ${fieldHeading(field)}
        ${fieldNoteHTML(field)}
        <textarea class="quiz-text-input quiz-textarea" rows="3" data-textarea-for="${field.id}" placeholder="${field.placeholder || ""}">${escapeHtml(value)}</textarea>
      </div>
    `;
  }

  function buildNumberHTML(field) {
    const value = state.answers[field.id];
    return `
      <div class="quiz-field" data-field="${field.id}">
        ${fieldHeading(field)}
        <div class="quiz-number-wrap">
          ${field.prefix ? `<span class="quiz-number-prefix">${field.prefix}</span>` : ""}
          <input type="number" inputmode="numeric" min="0" class="quiz-number-input" data-number-for="${field.id}"
            placeholder="${field.placeholder || ""}" value="${value != null ? value : ""}" />
          ${field.suffix ? `<span class="quiz-number-prefix">${field.suffix}</span>` : ""}
        </div>
      </div>
    `;
  }

  function buildFooterHTML(label) {
    return `
      <div class="quiz-footer">
        <button type="button" class="quiz-continue" data-action="continue" disabled>${label}</button>
      </div>
    `;
  }

  function buildEmailHTML() {
    const value = state.answers.email || "";
    return `
      <span class="quiz-section-label">${email.sectionLabel}</span>
      <p class="quiz-question">${email.question}</p>
      <div class="quiz-fields">
        <div class="quiz-field">
          <input type="email" class="quiz-text-input" id="quiz-email-input" placeholder="you@email.com" value="${escapeAttr(value)}" autocomplete="email" />
          <p class="quiz-email-note">${email.note}</p>
        </div>
      </div>
      <div class="quiz-footer">
        <button type="button" class="quiz-continue" data-action="submit-email" ${isValidEmail(value) ? "" : "disabled"}>${email.buttonLabel}</button>
      </div>
    `;
  }

  function buildSuccessHTML() {
    return `
      <div class="quiz-intro">
        <div class="quiz-success-icon" aria-hidden="true">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <h1 class="quiz-intro-heading">${success.heading}</h1>
        <p class="quiz-intro-sub">${success.sub}</p>
        <div class="quiz-intro-actions">
          <button type="button" class="btn btn-primary btn-lg" data-action="advance">${success.ctaLabel}</button>
        </div>
      </div>
    `;
  }

  function buildResultHTML() {
    const result = state.result;
    const content = resultConfig.resultsContent[result.type];
    return `
      <div class="quiz-result">
        <div class="quiz-result-icon" style="background:${content.accent}">${content.icon()}</div>
        <span class="quiz-result-kicker">${resultConfig.kicker}</span>
        <h1 class="quiz-result-title">${content.title}</h1>
        <p class="quiz-result-blurb">${content.blurb}</p>

        <div class="quiz-result-card">
          <div class="quiz-result-row">
            <span class="quiz-result-row-label">Great with</span>
            <p class="quiz-result-row-text">${content.greatWith}</p>
          </div>
          <div class="quiz-result-row">
            <span class="quiz-result-row-label">Worth knowing</span>
            <p class="quiz-result-row-text">${content.worthKnowing}</p>
          </div>
          <p class="quiz-result-flavor">${result.flavorSentence}</p>
        </div>

        <p class="quiz-result-status" id="quiz-result-status">${state.submitStatus || "Saving your answers…"}</p>

        ${resultConfig.extraHTML ? resultConfig.extraHTML(result) : ""}

        <div class="quiz-result-actions">
          <button type="button" class="btn btn-outline btn-lg" data-action="share">${resultConfig.shareLabel || "Share your result"}</button>
        </div>
        <button type="button" class="quiz-result-retake" data-action="retake">${resultConfig.retakeLabel || "Retake the quiz"}</button>
      </div>
    `;
  }

  function escapeAttr(str) {
    return String(str).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // -------------------------------------------------------------------------
  // Interaction handling
  // -------------------------------------------------------------------------
  function bindScreenEvents(container, screen) {
    container.addEventListener("click", (e) => handleClick(e, container, screen));
    container.addEventListener("input", (e) => handleInput(e, container, screen));
  }

  function handleClick(e, container, screen) {
    const target = e.target.closest("[data-action]");
    if (!target) return;
    const action = target.getAttribute("data-action");

    if (action === "start") return next();
    if (action === "advance") return next();
    if (action === "continue") return next();
    if (action === "retake") return retake();
    if (action === "share") return handleShare();
    if (action === "submit-email") return handleEmailSubmit(container);

    if (action === "select-single") {
      const fieldId = target.getAttribute("data-field");
      const value = target.getAttribute("data-value");
      state.answers[fieldId] = value;
      const field = fieldById[fieldId];
      const hasReveal = field && field.options && field.options.some((o) => o.reveal);
      const parentNumberToggle = screen.fields && screen.fields.find((f) => f.toggleId === fieldId);
      const needsFullRerender = hasReveal || (field && field.other) || (parentNumberToggle && parentNumberToggle.conditional);
      rerenderField(container, screen, fieldId, needsFullRerender, parentNumberToggle);
      refreshContinueButton(container, screen);
      if (screen.autoAdvance) {
        window.setTimeout(() => next(), 320);
      }
      return;
    }

    if (action === "toggle-multi") {
      const fieldId = target.getAttribute("data-field");
      const value = target.getAttribute("data-value");
      const current = state.answers[fieldId] || [];
      const idx = current.indexOf(value);
      if (idx === -1) current.push(value);
      else current.splice(idx, 1);
      state.answers[fieldId] = current;
      rerenderField(container, screen, fieldId, true);
      refreshContinueButton(container, screen);
      return;
    }

    if (action === "toggle-none") {
      const noneFlagId = target.getAttribute("data-field");
      const pairFieldId = target.getAttribute("data-pair-field");
      state.answers[noneFlagId] = !state.answers[noneFlagId];
      if (state.answers[noneFlagId]) state.answers[pairFieldId] = undefined;
      rerenderField(container, screen, pairFieldId, true);
      refreshContinueButton(container, screen);
      return;
    }
  }

  function rerenderField(container, screen, fieldId, needsFullRerender, parentNumberToggleField) {
    if (!needsFullRerender) {
      container.querySelectorAll(`[data-action="select-single"][data-field="${fieldId}"]`).forEach((btn) => {
        const isSelected = btn.getAttribute("data-value") === state.answers[fieldId];
        btn.classList.toggle("is-selected", isSelected);
      });
      return;
    }
    // fieldId might be a toggle/none-flag id that lives inside a composite
    // field's wrapper rather than having its own .quiz-field — resolve to
    // the wrapper field to re-render.
    const field = fieldById[fieldId] || parentNumberToggleField;
    const wrapperId = field ? field.id : fieldId;
    const fieldEl = container.querySelector(`.quiz-field[data-field="${wrapperId}"]`);
    if (fieldEl && field) fieldEl.outerHTML = buildFieldHTML(field);
  }

  function handleInput(e, container, screen) {
    const numberFor = e.target.getAttribute("data-number-for");
    if (numberFor) {
      const num = e.target.value === "" ? undefined : Number(e.target.value);
      state.answers[numberFor] = num;
      refreshContinueButton(container, screen);
      return;
    }
    const textFor = e.target.getAttribute("data-text-for");
    if (textFor) {
      state.answers[textFor] = e.target.value;
      refreshContinueButton(container, screen);
      return;
    }
    const textareaFor = e.target.getAttribute("data-textarea-for");
    if (textareaFor) {
      state.answers[textareaFor] = e.target.value;
      refreshContinueButton(container, screen);
      return;
    }
    const detailFor = e.target.getAttribute("data-detail-for");
    if (detailFor) {
      state.answers[detailFor + "Detail"] = e.target.value;
      return;
    }
  }

  function refreshContinueButton(container, screen) {
    const btn = container.querySelector("[data-action='continue']");
    if (btn) btn.disabled = !validateScreen(screen);
  }

  function validateScreen(screen) {
    if (!screen.fields) return true;
    return screen.fields.every((field) => isFieldAnswered(field));
  }

  function isFieldAnswered(field) {
    if (field.optional) return true;

    if (field.type === "numberToggle") {
      const val = state.answers[field.id];
      return typeof val === "number" && !isNaN(val) && val > 0 && state.answers[field.toggleId] !== undefined;
    }
    if (field.type === "numberOrNone") {
      if (state.answers[field.noneFlagId]) return true;
      const val = state.answers[field.id];
      return typeof val === "number" && !isNaN(val) && val > 0;
    }
    if (field.type === "text" || field.type === "textarea") {
      const val = state.answers[field.id];
      return typeof val === "string" && val.trim().length > 0;
    }
    if (field.type === "number") {
      const val = state.answers[field.id];
      return typeof val === "number" && !isNaN(val) && val >= 0;
    }
    if (field.type === "chips-multi") {
      return Array.isArray(state.answers[field.id]) && state.answers[field.id].length > 0;
    }
    return state.answers[field.id] !== undefined;
  }

  function handleEmailSubmit(container) {
    const input = document.getElementById("quiz-email-input");
    state.answers.email = input.value.trim();
    state.result = computeResult(state.answers);
    next();
    onSubmit(state.answers, state.result).then((outcome) => {
      state.submitStatus = outcome.message;
      const statusEl = document.getElementById("quiz-result-status");
      if (statusEl) statusEl.textContent = outcome.message;
    });
  }

  function handleShare() {
    const content = resultConfig.resultsContent[state.result.type];
    const text = resultConfig.shareText(content);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        const status = document.getElementById("quiz-result-status");
        if (status) status.textContent = "Copied! Paste it anywhere.";
      }).catch(() => {});
    }
  }

  function attachEmailValidation() {
    document.addEventListener("input", (e) => {
      if (e.target.id !== "quiz-email-input") return;
      const btn = document.querySelector("[data-action='submit-email']");
      if (btn) btn.disabled = !isValidEmail(e.target.value);
    });
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  backBtn.addEventListener("click", back);
  attachEmailValidation();
  renderScreen();

  return { state };
}
