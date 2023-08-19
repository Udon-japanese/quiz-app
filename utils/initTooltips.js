export function initTooltips() {
  // Bootstrap の Tooltip の設定
  document
    .querySelectorAll('[data-bs-toggle="tooltip"]')
    .forEach((tooltipTriggerEl) => {
      bootstrap.Tooltip.getOrCreateInstance(tooltipTriggerEl);
    });
}