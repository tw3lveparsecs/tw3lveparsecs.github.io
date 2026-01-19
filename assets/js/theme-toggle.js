(function () {
  var STORAGE_KEY = "theme";
  var root = document.documentElement;

  function getSystemTheme() {
    try {
      return window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    } catch (e) {
      return "light";
    }
  }

  function getStoredTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function setStoredTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      // ignore
    }
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);

    var button = document.getElementById("theme-toggle");
    if (!button) return;

    var isDark = theme === "dark";
    button.setAttribute("aria-pressed", String(isDark));

    var icon = button.querySelector(".theme-toggle__icon");
    if (icon) icon.textContent = isDark ? "☀" : "☾";

    var label = isDark ? "Switch to light mode" : "Switch to dark mode";
    button.setAttribute("aria-label", label);
    button.setAttribute("title", label);
  }

  function init() {
    var stored = getStoredTheme();
    var theme = stored || root.getAttribute("data-theme") || getSystemTheme();

    applyTheme(theme);

    var button = document.getElementById("theme-toggle");
    if (button) {
      button.addEventListener("click", function () {
        var current = root.getAttribute("data-theme") || getSystemTheme();
        var next = current === "dark" ? "light" : "dark";
        applyTheme(next);
        setStoredTheme(next);
      });
    }

    if (!stored && window.matchMedia) {
      var media = window.matchMedia("(prefers-color-scheme: dark)");
      var handler = function () {
        applyTheme(getSystemTheme());
      };

      if (typeof media.addEventListener === "function") {
        media.addEventListener("change", handler);
      } else if (typeof media.addListener === "function") {
        media.addListener(handler);
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
