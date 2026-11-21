let runtime;

async function loadPython() {
  const { loadPyodide } = await import("https://cdn.jsdelivr.net/pyodide/v314.0.8/full/pyodide.mjs");
  return loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v314.0.8/full/",
    stdin: () => null
  });
}

async function ensurePython() {
  runtime ??= loadPython();
  return runtime;
}

self.addEventListener("message", async ({ data }) => {
  if (data && typeof data === "object" && data.type === "warmup") {
    try {
      await ensurePython();
      self.postMessage({ type: "ready" });
    } catch {
      self.postMessage({ type: "unavailable", warmup: true });
    }
    return;
  }

  const id = data && typeof data === "object" ? data.id : null;
  const source = data && typeof data === "object" ? data.source : data;

  let python;
  try {
    python = await ensurePython();
    self.postMessage({ type: "ready" });
  } catch {
    self.postMessage({ type: "unavailable", id });
    return;
  }

  self.postMessage({ type: "running", id });
  let remaining = 64_000;
  function output(text) {
    if (remaining <= 0) return;
    const snippet = String(text).slice(0, remaining);
    remaining -= snippet.length;
    self.postMessage({ type: "output", text: snippet, id });
  }
  python.setStdout({ batched: text => output(text + "\n") });
  python.setStderr({ batched: text => output(text + "\n") });
  const globals = python.toPy({ __name__: "__main__" });
  let error = false;
  try {
    const result = await python.runPythonAsync(source, { globals });
    if (result !== undefined) {
      output(String(result) + "\n");
      result?.destroy?.();
    }
  } catch (failure) {
    error = true;
    output(failure.message + "\n");
  } finally {
    globals.destroy();
    self.postMessage({ type: "complete", error, id });
  }
});
