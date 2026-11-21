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
  constructor(panel) {
    this.panel = panel;
    this.output = panel.querySelector("#terminal-output");
    this.status = panel.querySelector("#terminal-status");
    this.example = panel.querySelector("#run-example");
    this.typed = panel.querySelector("#run-typed");
    this.stopButton = panel.querySelector("#stop-python");
    this.size = 0;
    this.busy = false;
    this.canRunTyped = false;
    this.stopButton.addEventListener("click", () => this.stop("Execution stopped."));
  }

  setAvailability(canRunTyped) {
    this.canRunTyped = canRunTyped;
    this.example.disabled = this.busy;
    this.typed.disabled = this.busy || !canRunTyped;
    this.stopButton.hidden = !this.busy;
  }

  reset() {
    if (this.busy) this.stop();
    this.output.textContent = "Run the example or type code to run your own version.";
    this.status.textContent = "";
    this.setAvailability(false);
  }

  run(source) {
    if (this.busy || !source.trim()) return;
    this.busy = true;
    this.size = 0;
    this.output.textContent = "";
    this.status.textContent = "Loading Python…";
    this.setAvailability(this.canRunTyped);
    try {
      if (!this.worker) this.connect();
      this.worker.postMessage(source);
      this.timeout = setTimeout(() => this.stop("Stopped after 30 seconds. Try running it again."), 30_000);
    } catch {
      this.stop("Python could not start in this browser.");
    }
  }

  connect() {
    const worker = new Worker(window.homeRowPythonWorker || "python-worker.js", { type: "module" });
    this.worker = worker;
    worker.addEventListener("message", ({ data }) => {
      if (this.worker !== worker || !this.busy) return;
      if (data.type === "output") {
        this.append(data.text);
      } else if (data.type === "running") {
        this.status.textContent = "Running Python…";
        clearTimeout(this.timeout);
        this.timeout = setTimeout(() => this.stop("Stopped after 10 seconds of execution."), 10_000);
      } else if (data.type === "complete") {
        if (!this.size) this.output.textContent = "Finished with no output.";
        this.finish(data.error ? "Python reported an error." : "Finished.");
      } else if (data.type === "unavailable") {
        this.stop("Python could not load. Check your connection and try again.");
      }
    });
    worker.addEventListener("error", () => {
      if (this.worker === worker) this.stop("Python could not load. Check your connection and try again.");
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
    this.status.textContent = message;
    this.setAvailability(this.canRunTyped);
  }

  stop(message = "") {
    this.worker?.terminate();
    this.worker = null;
    if (message && !this.size) this.output.textContent = message;
    this.finish(message);
  }
}
