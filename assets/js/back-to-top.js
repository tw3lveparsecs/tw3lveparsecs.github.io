(() => {
  const button = document.getElementById("back-to-top");
  if (!button) return;

  const threshold = 320;

  const prefersReducedMotion = () =>
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const updateVisibility = () => {
    const show =
      (window.scrollY || document.documentElement.scrollTop || 0) > threshold;
    button.hidden = !show;
  };

  updateVisibility();
  window.addEventListener("scroll", updateVisibility, { passive: true });

  button.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  });
})();
