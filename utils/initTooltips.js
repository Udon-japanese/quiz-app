/**
 * @description BootstrapのTooltipを初期化する
 * @returns {void} なし
 */
export function initTooltips() {
  document
    .querySelectorAll('[data-bs-toggle="tooltip"]')
    .forEach((tooltipTriggerEl) => {
      bootstrap.Tooltip.getOrCreateInstance(tooltipTriggerEl);
    });
}