// Light/dark toggle shared by all pages. The saved theme is applied in each page's <head>.
(() => {
  const btn = document.getElementById("theme-toggle");
  const root = document.documentElement;
  const isDark = () =>
    root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  const label = () => { btn.textContent = isDark() ? "☀" : "☾"; };
  btn.addEventListener("click", () => {
    const next = isDark() ? "light" : "dark";
    root.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch (e) {}
    label();
  });
  label();
})();
