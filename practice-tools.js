"use strict";

class TypingSounds {
  constructor(choice, preview) {
    this.choice = choice;
    this.preview = preview;
    try {
      const saved = localStorage.getItem("home-row-click-sound");
      if (["soft", "mechanical", "off"].includes(saved)) this.choice.value = saved;
    } catch {}
    this.preview.disabled = this.choice.value === "off";
    this.choice.addEventListener("change", () => {
      try { localStorage.setItem("home-row-click-sound", this.choice.value); } catch {}
      this.preview.disabled = this.choice.value === "off";
      this.play();
    });
    this.preview.addEventListener("click", () => this.play());
  }

  play(typo = false) {
    const style = this.choice.value;
    if (style === "off" || !window.AudioContext) return;
    if (!this.context) {
      this.context = new AudioContext();
      const frames = Math.floor(this.context.sampleRate * .055);
      this.noise = this.context.createBuffer(1, frames, this.context.sampleRate);
      const samples = this.noise.getChannelData(0);
      for (let i = 0; i < frames; i++) samples[i] = Math.random() * 2 - 1;
    }
    if (this.context.state === "suspended") {
      this.context.resume().then(() => this.click(style, typo)).catch(() => {});
    } else {
      this.click(style, typo);
    }
  }

  click(style, typo) {
    if (this.choice.value !== style) return;
    const context = this.context;
    const now = context.currentTime;
    const soft = style === "soft";
    const tone = context.createOscillator();
    const toneGain = context.createGain();
    tone.type = soft ? "sine" : "triangle";
    tone.frequency.setValueAtTime(typo ? 125 : soft ? 310 : 500, now);
    tone.frequency.exponentialRampToValueAtTime(typo ? 77 : soft ? 186 : 150, now + .032);
    toneGain.gain.setValueAtTime(.0001, now);
    toneGain.gain.linearRampToValueAtTime(soft ? .032 : .043, now + .003);
    toneGain.gain.exponentialRampToValueAtTime(.0001, now + .045);
    tone.connect(toneGain).connect(context.destination);
    tone.start(now);
    tone.stop(now + .047);

    const strike = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const strikeGain = context.createGain();
    strike.buffer = this.noise;
    filter.type = soft ? "lowpass" : "bandpass";
    filter.frequency.value = typo ? 520 : soft ? 1250 : 2500;
    filter.Q.value = soft ? .35 : .8;
    strikeGain.gain.setValueAtTime(soft ? .034 : .105, now);
    strikeGain.gain.exponentialRampToValueAtTime(.0001, now + (soft ? .019 : .036));
    strike.connect(filter).connect(strikeGain).connect(context.destination);
    strike.start(now);
    strike.stop(now + .04);
  }
}

class PythonTerminal {
  constructor(panel, example, typed, options = {}) {
    this.panel = panel;
    this.split = options.split || document.getElementById("editor-split");
    this.output = panel.querySelector("#terminal-output");
    this.status = panel.querySelector("#terminal-status");
    this.verifyBadge = options.verifyBadge || panel.querySelector("#terminal-verify");
    this.runtimeStatus = options.runtimeStatus || document.getElementById("python-runtime-status");
    this.example = example;
    this.typed = typed;
    this.hideButton = panel.querySelector("#hide-python");
    this.stopButton = panel.querySelector("#stop-python");
    this.copyButton = panel.querySelector("#copy-python");
    this.clearButton = panel.querySelector("#clear-python");
    this.size = 0;
    this.busy = false;
    this.canRunTyped = false;
    this.runtimeReady = false;
    this.warmedUp = false;
    this.nextRunId = 1;
    this.activeRun = null;
    this.passageKey = "";
    this.lastExampleOutput = null;

    this.stopButton.addEventListener("click", () => this.stop("Execution stopped."));
    this.hideButton.addEventListener("click", () => {
      this.setVisible(false);
      this.setAvailability(this.canRunTyped);
      this.trigger?.focus?.();
    });
    this.copyButton?.addEventListener("click", () => this.copyOutput());
    this.clearButton?.addEventListener("click", () => this.clearOutput());
  }

  setVisible(visible) {
    this.panel.hidden = !visible;
    this.split?.classList.toggle("has-terminal", visible);
  }

  setPassage(key) {
    if (this.passageKey !== key) {
      this.passageKey = key;
      this.lastExampleOutput = null;
      this.hideVerifyBadge();
    }
  }

  setRuntimePill(text, state = "") {
    if (!this.runtimeStatus) return;
    this.runtimeStatus.textContent = text;
    if (state) this.runtimeStatus.dataset.state = state;
    else delete this.runtimeStatus.dataset.state;
  }

  warmup() {
    if (this.warmedUp || this.runtimeReady) return;
    this.warmedUp = true;
    try {
      if (!this.worker) this.connect();
      this.setRuntimePill("Python: warming up…", "loading");
      this.worker.postMessage({ type: "warmup" });
    } catch {
      this.setRuntimePill("");
    }
  }

  setAvailability(canRunTyped) {
    this.canRunTyped = canRunTyped;
    this.example.disabled = this.busy;
    this.typed.disabled = this.busy || !canRunTyped;
    this.stopButton.hidden = !this.busy;
    this.hideButton.hidden = this.busy;
    const open = String(!this.panel.hidden);
    this.example.setAttribute("aria-expanded", open);
    this.typed.setAttribute("aria-expanded", open);
  }

  hideVerifyBadge() {
    if (!this.verifyBadge) return;
    this.verifyBadge.hidden = true;
    this.verifyBadge.textContent = "";
    this.verifyBadge.className = "verify-badge";
  }

  showVerifyBadge(pass, text) {
    if (!this.verifyBadge) return;
    this.verifyBadge.hidden = false;
    this.verifyBadge.textContent = text;
    this.verifyBadge.className = "verify-badge " + (pass ? "verify-pass" : "verify-diff");
  }

  reset() {
    if (this.busy) this.stop();
    this.setVisible(false);
    this.trigger = null;
    this.lastExampleOutput = null;
    this.output.textContent = "Run the example or type code to run your own version.";
    this.status.textContent = "";
    this.hideVerifyBadge();
    this.setAvailability(false);
  }

  clearOutput() {
    if (this.busy) return;
    this.output.textContent = "";
    this.status.textContent = "Cleared.";
    this.hideVerifyBadge();
  }

  copyOutput() {
    const text = this.output.textContent || "";
    if (!text) return;
    navigator.clipboard?.writeText(text).then(() => {
      if (!this.copyButton) return;
      const original = this.copyButton.textContent;
      this.copyButton.textContent = "Copied ✓";
      setTimeout(() => {
        if (this.copyButton) this.copyButton.textContent = original;
      }, 1200);
    }).catch(() => {});
  }

  run(source, trigger, options = {}) {
    if (this.busy || !source.trim()) return;
    const { isTyped = false, expectedSource = null } = options;
    this.trigger = trigger;
    this.setVisible(true);
    this.busy = true;
    this.size = 0;
    this.output.textContent = "";
    this.hideVerifyBadge();
    this.status.textContent = this.runtimeReady ? "Running Python…" : "Loading Python…";
    this.setAvailability(this.canRunTyped);

    try {
      if (!this.worker) this.connect();
      if (isTyped && this.lastExampleOutput === null && expectedSource && expectedSource.trim()) {
        // Silently capture expected output first, then execute user's typed code.
        this.startWorkerJob(expectedSource, {
          silent: true,
          onDone: (expectedOut, expectedErr) => {
            if (!expectedErr) this.lastExampleOutput = expectedOut.trim();
            this.startWorkerJob(source, { isTyped: true });
          }
        });
      } else {
        this.startWorkerJob(source, { isTyped });
      }
    } catch {
      this.stop("Python could not start in this browser.");
    }
  }

  startWorkerJob(source, meta = {}) {
    const id = this.nextRunId++;
    this.activeRun = {
      id,
      buffer: "",
      isTyped: Boolean(meta.isTyped),
      silent: Boolean(meta.silent),
      onDone: meta.onDone || null
    };
    this.worker.postMessage({ type: "run", source, id });
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => this.stop("Stopped after 30 seconds. Try running it again."), 30_000);
  }

  connect() {
    const worker = new Worker(window.homeRowPythonWorker || "python-worker.js", { type: "module" });
    this.worker = worker;
    worker.addEventListener("message", ({ data }) => {
      if (this.worker !== worker) return;
      if (data.type === "ready") {
        this.runtimeReady = true;
        this.setRuntimePill("Python ready ✓", "ready");
        return;
      }
      if (data.type === "unavailable" && data.warmup) {
        this.setRuntimePill("Python offline", "error");
        return;
      }
      if (!this.busy || !this.activeRun) return;
      if (data.id !== undefined && data.id !== null && data.id !== this.activeRun.id) return;

      if (data.type === "output") {
        this.activeRun.buffer += data.text;
        if (!this.activeRun.silent) this.append(data.text);
      } else if (data.type === "running") {
        if (!this.activeRun.silent) this.status.textContent = "Running Python…";
        clearTimeout(this.timeout);
        this.timeout = setTimeout(() => this.stop("Stopped after 10 seconds of execution."), 10_000);
      } else if (data.type === "complete") {
        const finishedRun = this.activeRun;
        this.activeRun = null;
        if (finishedRun.onDone) {
          finishedRun.onDone(finishedRun.buffer, data.error);
          return;
        }
        const trimmedActual = finishedRun.buffer.trim();
        if (!this.size) this.output.textContent = "Finished with no output.";

        if (!finishedRun.isTyped) {
          if (!data.error) this.lastExampleOutput = trimmedActual;
          this.showVerifyBadge(!data.error, data.error ? "⚠ Error" : "Example output");
        } else if (this.lastExampleOutput !== null) {
          if (!data.error && trimmedActual === this.lastExampleOutput) {
            this.showVerifyBadge(true, "✓ Matches example");
          } else {
            this.showVerifyBadge(false, "⚠ Differs from example");
            if (this.lastExampleOutput) {
              this.append("\n--- Expected output ---\n" + this.lastExampleOutput + "\n");
            }
          }
        }

        this.finish(data.error ? "Python reported an error." : "Finished.");
      } else if (data.type === "unavailable") {
        this.setRuntimePill("Python offline", "error");
        this.stop("Python could not load. Check your connection and try again.");
      }
    });
    worker.addEventListener("error", () => {
      if (this.worker === worker) {
        this.setRuntimePill("");
        if (this.busy) this.stop("Python could not load. Check your connection and try again.");
      }
    });
  }

  append(text) {
    const limit = 64_000;
    if (this.size >= limit) return;
    const line = text.slice(0, limit - this.size);
    this.output.append(line);
    this.size += line.length;
    if (this.size === limit) this.output.append("\n[Output limit reached]");
    this.output.scrollTop = this.output.scrollHeight;
  }

  finish(message) {
    clearTimeout(this.timeout);
    this.busy = false;
    this.activeRun = null;
    this.status.textContent = message;
    this.setAvailability(this.canRunTyped);
  }

  stop(message = "") {
    this.worker?.terminate();
    this.worker = null;
    this.runtimeReady = false;
    this.warmedUp = false;
    this.activeRun = null;
    if (message && !this.size) this.output.textContent = message;
    this.finish(message);
  }
}
