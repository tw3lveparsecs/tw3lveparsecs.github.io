(function () {
  function hasMermaidBlocks() {
    return (
      document.querySelector(
        "pre code.language-mermaid, pre code.mermaid, code.language-mermaid, code.mermaid",
      ) !== null
    );
  }

  function getCurrentTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark"
      ? "dark"
      : "default";
  }

  function upgradeCodeBlocksToMermaidDivs() {
    var codeBlocks = document.querySelectorAll(
      "pre code.language-mermaid, pre code.mermaid",
    );

    codeBlocks.forEach(function (code) {
      var pre = code.parentElement;
      if (!pre || pre.tagName !== "PRE") return;

      var source = code.textContent || "";
      var container = document.createElement("div");
      container.className = "mermaid";
      container.setAttribute("data-mermaid-src", source);

      pre.parentElement.replaceChild(container, pre);
    });
  }

  function renderMermaid() {
    if (!window.mermaid) return;

    var diagrams = document.querySelectorAll(".mermaid");
    if (!diagrams.length) return;

    var theme = getCurrentTheme();

    try {
      window.mermaid.initialize({
        startOnLoad: false,
        theme: theme,
        securityLevel: "strict",
      });

      diagrams.forEach(function (el) {
        var src = el.getAttribute("data-mermaid-src");
        if (src == null) {
          src = el.textContent || "";
          el.setAttribute("data-mermaid-src", src);
        }

        // Mermaid marks rendered diagrams with data-processed="true".
        // If we don't clear it, Mermaid will often skip re-rendering
        // and you'll see stale output or raw text after a theme switch.
        el.removeAttribute("data-processed");
        el.textContent = src;
      });

      if (typeof window.mermaid.run === "function") {
        window.mermaid.run({ querySelector: ".mermaid" });
      } else if (typeof window.mermaid.init === "function") {
        window.mermaid.init(undefined, diagrams);
      }
    } catch (e) {
      // If mermaid fails to render, keep the source text visible.
      // Avoid throwing to prevent breaking other scripts.
    }
  }

  function initMermaidOnceReady() {
    if (!hasMermaidBlocks()) return;
    upgradeCodeBlocksToMermaidDivs();
    renderMermaid();

    // Re-render when theme changes (dark/light toggle updates html[data-theme]).
    var lastTheme = getCurrentTheme();
    var scheduled = false;

    var observer = new MutationObserver(function () {
      if (scheduled) return;
      scheduled = true;
      window.setTimeout(function () {
        scheduled = false;
        var nextTheme = getCurrentTheme();
        if (nextTheme !== lastTheme) {
          lastTheme = nextTheme;

          // Give the browser a tick to apply theme-driven CSS before
          // re-rendering Mermaid (helps prevent partial/stale renders).
          window.requestAnimationFrame(function () {
            window.setTimeout(renderMermaid, 0);
          });
        }
      }, 50);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMermaidOnceReady);
  } else {
    initMermaidOnceReady();
  }
})();
